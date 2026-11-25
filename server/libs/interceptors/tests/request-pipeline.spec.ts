import { EventEmitter } from 'node:events';

import {
  BadRequestException,
  ExecutionContext,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { Response as ExpressResponse } from 'express';
import { NEVER } from 'rxjs';

import { PERMISSION } from '@common/constants/enum/role.enum';
import { Authorization } from '@common/decorators/authorization.decorator';
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
  let request: RequestContext;
  const guard = new UserGuard(new Reflector());

  beforeEach(() => {
    request = {
      headers: { authorization: 'Bearer old-token' },
      processId: 'request-1',
    } as RequestContext;
  });

  afterEach(() => jest.restoreAllMocks());

  it('honors public method override of secured controller metadata', () => {
    expect(guard.canActivate(context(request, 'public'))).toBe(true);
  });

  it.each(['secured', 'create'] as const)(
    'requires authentication for %s without secured metadata or with permissions on a public method',
    (method) => {
      const currentContext = {
        getHandler: () => DefaultController.prototype[method],
        getClass: () => DefaultController,
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(currentContext)).toThrow(
        UnauthorizedException,
      );
    },
  );

  it('returns 401 for permissions without a user instead of crashing', () => {
    const permissions = new PermissionGuard(new Reflector());
    expect(() => permissions.canActivate(context(request, 'create'))).toThrow(
      'Authentication is required',
    );
  });
  it('denies missing permissions and accepts a matching permission', () => {
    const permissions = new PermissionGuard(new Reflector());
    request.userData = new AuthorizeResponse({ valid: true });
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
    const rpc = jest.fn(() => NEVER);
    await expect(requestGrpcData(rpc, {}, {}, 5)).rejects.toBeInstanceOf(
      HttpException,
    );
    await expect(requestGrpcData(rpc, {}, {}, 5)).rejects.toMatchObject({
      status: 504,
    });
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
