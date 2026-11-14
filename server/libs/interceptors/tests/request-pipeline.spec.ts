import { EventEmitter } from 'node:events';

import { status as GrpcStatus } from '@grpc/grpc-js';
import {
  BadRequestException,
  ExecutionContext,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { Response as ExpressResponse } from 'express';
import { NEVER, of, throwError } from 'rxjs';

import { PERMISSION } from '@common/constants/enum/role.enum';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { Permissions } from '@common/decorators/permission.decorator';
import { PermissionGuard } from '@common/guards/permissions.guard';
import { UserGuard } from '@common/guards/user.guard';
import { AuthorizeResponse } from '@common/interfaces/common/authorization.interface';
import { RequestContext } from '@common/interfaces/gateway/request-context.interface';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import { normalizeError } from '@common/utils/error.util';
import { requestGrpcData } from '@common/utils/rpc.util';

@Authorization({ secured: true })
class ProtectedController {
  secured() {
    return undefined;
  }
  @Authorization({ secured: false })
  public() {
    return undefined;
  }
  @Permissions([PERMISSION.USER_CREATE])
  create() {
    return undefined;
  }
}

class DefaultController {
  secured() {
    return undefined;
  }

  @Authorization({ secured: false })
  @Permissions([PERMISSION.USER_CREATE])
  create() {
    return undefined;
  }
}

function context(
  request: RequestContext,
  method: keyof ProtectedController = 'secured',
): ExecutionContext {
  return {
    getHandler: () => ProtectedController.prototype[method],
    getClass: () => ProtectedController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('Auth and request pipeline', () => {
  const now = 1700000000000;
  let request: RequestContext;
  let verifyUserToken: jest.Mock;
  let getUserById: jest.Mock;
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let guard: UserGuard;
  const authorized = (exp?: number) =>
    new AuthorizeResponse({
      valid: true,
      MetadataKeys: {
        jwt:
          exp === undefined
            ? { sub: 'keycloak-1' }
            : { exp, sub: 'keycloak-1' },
        user: undefined,
        userId: 'user-1',
        permissions: [],
      },
    });

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    request = {
      headers: { authorization: 'Bearer test-token' },
      processId: 'request-1',
    } as RequestContext;
    verifyUserToken = jest.fn(() =>
      of({
        valid: true,
        metadata: {
          userId: 'user-1',
          user: undefined,
          permissions: [],
          jwtJson: JSON.stringify({ exp: now / 1000 + 60 }),
        },
      }),
    );
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };
    getUserById = jest.fn(() =>
      of({
        user: {
          id: 'user-1',
          roles: [{ permissions: [PERMISSION.USER_CREATE] }],
        },
      }),
    );
    guard = new UserGuard(
      new Reflector(),
      { getService: () => ({ verifyUserToken }) } as unknown as ClientGrpc,
      { getService: () => ({ getUserById }) } as unknown as ClientGrpc,
      cache as unknown as Cache,
    );
    guard.onModuleInit();
  });
  afterEach(() => jest.restoreAllMocks());

  it('honors public method override of secured controller metadata', () => {
    expect(guard.canActivate(context(request, 'public'))).toBe(true);
    expect(verifyUserToken).not.toHaveBeenCalled();
  });
  it('limits token cache lifetime to JWT expiry', async () => {
    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(cache.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ valid: true }),
      60000,
    );
  });
  it('uses a valid unexpired cache without an RPC call', async () => {
    cache.get.mockResolvedValue(authorized(now / 1000 + 10));
    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(verifyUserToken).not.toHaveBeenCalled();
    expect(getUserById).toHaveBeenCalledTimes(1);
    expect(request.userData?.MetadataKeys.permissions).toEqual([
      PERMISSION.USER_CREATE,
    ]);
  });
  it('revokes permissions even when an old authorization response is cached', async () => {
    const cached = authorized(now / 1000 + 10);
    cached.MetadataKeys.permissions = [PERMISSION.USER_CREATE];
    cache.get.mockResolvedValue(cached);
    getUserById.mockReturnValue(of({ user: { id: 'user-1', roles: [] } }));

    await expect(guard.canActivate(context(request, 'create'))).resolves.toBe(
      true,
    );
    const permissions = new PermissionGuard(new Reflector());

    expect(() => permissions.canActivate(context(request, 'create'))).toThrow(
      'Permission denied',
    );
  });

  it('rejects a deleted application user despite a valid cached token', async () => {
    cache.get.mockResolvedValue(authorized(now / 1000 + 10));
    getUserById.mockReturnValue(of({}));

    await expect(guard.canActivate(context(request))).rejects.toMatchObject({
      status: 401,
    });
  });

  it.each(['secured', 'create'] as const)(
    'requires authentication for %s without secured metadata or with permissions on a public method',
    async (method) => {
      request.headers.authorization = '';
      const currentContext = {
        getHandler: () => DefaultController.prototype[method],
        getClass: () => DefaultController,
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(currentContext)).rejects.toMatchObject({
        status: 401,
      });
    },
  );
  it('rejects an expired cached token if authorizer rejects it', async () => {
    cache.get.mockResolvedValue(authorized(now / 1000 - 1));
    verifyUserToken.mockReturnValue(
      throwError(() => ({
        code: GrpcStatus.UNAUTHENTICATED,
        details: 'Expired token',
      })),
    );
    await expect(guard.canActivate(context(request))).rejects.toMatchObject({
      status: 401,
    });
    expect(cache.del).toHaveBeenCalled();
    expect(request.userData).toBeUndefined();
  });
  it('does not cache tokens without an expiration', async () => {
    verifyUserToken.mockReturnValue(
      of({
        valid: true,
        metadata: { userId: 'user-1', permissions: [], jwtJson: '{}' },
      }),
    );
    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(cache.set).not.toHaveBeenCalled();
  });
  it('still verifies identity when the cache fails', async () => {
    cache.get.mockRejectedValue(new Error('Redis unavailable'));
    cache.set.mockRejectedValue(new Error('Redis unavailable'));
    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(verifyUserToken).toHaveBeenCalledTimes(1);
  });
  it('returns 401 for permissions without a user instead of crashing', () => {
    const permissions = new PermissionGuard(new Reflector());
    expect(() => permissions.canActivate(context(request, 'create'))).toThrow(
      'Authentication is required',
    );
  });
  it('denies missing permissions and accepts a matching permission', () => {
    const permissions = new PermissionGuard(new Reflector());
    request.userData = authorized(now / 1000 + 60);
    expect(() => permissions.canActivate(context(request, 'create'))).toThrow(
      'Permission denied',
    );
    request.userData.MetadataKeys.permissions = [PERMISSION.USER_CREATE];
    expect(permissions.canActivate(context(request, 'create'))).toBe(true);
  });
  it('maps network error codes to numeric HTTP status', () => {
    expect(normalizeError({ code: 'ECONNREFUSED' }).statusCode).toBe(503);
    expect(normalizeError({ code: 'unknown' }).statusCode).toBe(500);
    expect(
      normalizeError(new RpcException({ code: 403, message: 'Denied' })),
    ).toEqual({ statusCode: 403, message: 'Denied' });
    expect(normalizeError(new BadRequestException(['Invalid email']))).toEqual({
      statusCode: 400,
      message: ['Invalid email'],
    });
  });
  it('times out RPC requests that never return', async () => {
    verifyUserToken.mockReturnValue(NEVER);
    await expect(
      requestGrpcData(verifyUserToken, {}, {}, 5),
    ).rejects.toBeInstanceOf(HttpException);
    await expect(
      requestGrpcData(verifyUserToken, {}, {}, 5),
    ).rejects.toMatchObject({ status: 504 });
  });
  it('logs HTTP completion once without exposing body or query credentials', () => {
    const log = jest.spyOn(Logger, 'log').mockImplementation(() => undefined);
    const res = new EventEmitter() as unknown as ExpressResponse;
    res.statusCode = 200;
    const originalSend = jest.fn();
    res.send = originalSend;
    Object.assign(request, {
      method: 'POST',
      originalUrl: '/login?token=query-secret',
      body: { password: 'secret-value' },
    });
    const next = jest.fn();
    new LoggerMiddleware().use(request, res, next);
    res.emit('finish');
    res.emit('finish');
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.send).toBe(originalSend);
    expect(log).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(log.mock.calls)).not.toMatch(
      /query-secret|secret-value/,
    );
  });
});
