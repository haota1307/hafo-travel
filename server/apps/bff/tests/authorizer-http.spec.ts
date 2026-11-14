import { generateKeyPairSync } from 'node:crypto';
import { createServer, type AddressInfo } from 'node:net';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Controller,
  Get,
  type INestApplication,
  type INestMicroservice,
  Logger,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClientGrpcProxy, type GrpcOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { sign } from 'jsonwebtoken';
import type { SigningKey } from 'jwks-rsa';
import { Types } from 'mongoose';

import { GRPC_SERVICES, grpcOptions } from '@common/configuration/grpc.config';
import { ROLE, PERMISSION } from '@common/constants/enum/role.enum';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { PermissionGuard } from '@common/guards/permissions.guard';
import { UserGuard } from '@common/guards/user.guard';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { GrpcLoggingInterceptor } from '@common/interceptors/grpc-logging.interceptor';
import { HttpResponseInterceptor } from '@common/interceptors/http-response.interceptor';
import type { RequestContext } from '@common/interfaces/gateway/request-context.interface';
import {
  USER_ACCESS_SERVICE_NAME,
  type UserAccessServiceClient,
} from '@common/interfaces/grpc/user-access/v1/user-access';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import type { UserWithRoles } from '@common/schemas/user.schema';
import { requestGrpcData } from '@common/utils/rpc.util';

import { AuthorizerController as RpcAuthorizerController } from '../../authorizer/src/app/modules/authorizer/controllers/authorizer.controller';
import { AuthorizerService } from '../../authorizer/src/app/modules/authorizer/services/authorizer.service';
import { KeycloakController } from '../../authorizer/src/app/modules/keycloak/controllers/keycloak.controller';
import { KeycloakHttpService } from '../../authorizer/src/app/modules/keycloak/services/keycloak-http.service';
import { RoleController as RpcRoleController } from '../../user-access/src/app/modules/role/controllers/role.controller';
import { RoleRepository } from '../../user-access/src/app/modules/role/repositories/role.repository';
import { RoleService } from '../../user-access/src/app/modules/role/services/role.service';
import { UserController as RpcUserController } from '../../user-access/src/app/modules/user/controllers/user.controller';
import { UserRepository } from '../../user-access/src/app/modules/user/repositories/user.repository';
import { UserService } from '../../user-access/src/app/modules/user/services/user.service';
import { AuthorizerController } from '../src/app/modules/authorizer/controllers/authorizer.controller';
import { RoleController as BffRoleController } from '../src/app/modules/role/controllers/role.controller';
import { UserController as BffUserController } from '../src/app/modules/user/controllers/user.controller';

@Controller('secured-fixture')
class SecuredController {
  @Get()
  @Authorization({ secured: true })
  getUser(@Req() request: RequestContext) {
    return request.userData?.MetadataKeys.userId;
  }
}

async function freePort(): Promise<number> {
  const server = createServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address() as AddressInfo;
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );

  return port;
}

describe('BFF HTTP over real gRPC services', () => {
  let app: INestApplication;
  let authorizerApp: INestMicroservice;
  let userApp: INestMicroservice;
  let authorizerClient: ClientGrpcProxy;
  let userClient: ClientGrpcProxy;
  let baseUrl: string;
  let token: string;
  let createSpy: jest.SpiedFunction<UserService['create']>;
  let log: jest.SpyInstance;
  const fixture: UserWithRoles = {
    _id: new Types.ObjectId(),
    id: 'user-1',
    userId: 'keycloak-1',
    email: 'user@example.com',
    firstName: 'First',
    lastName: 'Last',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    roles: [
      {
        _id: new Types.ObjectId(),
        id: 'role-1',
        name: ROLE.ADMINISTRATOR,
        description: 'Administrator',
        permissions: Object.values(PERMISSION),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
      },
    ],
  };
  const keycloak = {
    exchangeUserToken: jest.fn(),
    createUser: jest.fn().mockResolvedValue('keycloak-new'),
  };
  const repository = {
    exists: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockResolvedValue(fixture),
    getByUserId: jest.fn(async (id: string) =>
      id === fixture.userId
        ? {
            ...fixture,
            roles: fixture.roles.filter((role) => storedRoles.has(role.id)),
          }
        : null,
    ),
    setRoles: jest.fn(async (id: string, roles: Types.ObjectId[]) => {
      if (id !== fixture.userId) {
        return null;
      }

      fixture.roles = [...storedRoles.values()].filter((role) =>
        roles.some((roleId) => roleId.equals(role._id)),
      );

      return fixture;
    }),
  };
  const administrator = fixture.roles[0];
  administrator.id = administrator._id.toString();
  const storedRoles = new Map([[administrator.id, administrator]]);
  const roleRepository = {
    isAssigned: jest.fn(async (id: string) =>
      fixture.roles.some((role) => role.id === id),
    ),
    getAll: jest.fn(async () => [...storedRoles.values()]),
    getById: jest.fn(async (id: string) => storedRoles.get(id)),
    getByIds: jest.fn(async (ids: string[]) =>
      [...storedRoles.values()].filter((role) =>
        ids.includes(role._id.toString()),
      ),
    ),
    create: jest.fn(
      async (data: {
        name: string;
        description: string;
        permissions: PERMISSION[];
      }) => {
        if ([...storedRoles.values()].some((role) => role.name === data.name)) {
          throw { code: 11000 };
        }

        const _id = new Types.ObjectId();
        const role = {
          ...data,
          _id,
          id: _id.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        storedRoles.set(role.id, role);

        return role;
      },
    ),
    update: jest.fn(
      async (
        id: string,
        data: { name: string; description: string; permissions: PERMISSION[] },
      ) => {
        const role = storedRoles.get(id);

        if (!role) {
          return null;
        }

        Object.assign(role, data);

        return role;
      },
    ),
    delete: jest.fn(async (id: string) => {
      const role = storedRoles.get(id);
      storedRoles.delete(id);

      return role;
    }),
  };
  const cache = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    log = jest.spyOn(Logger, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
    const authorizerOptions = grpcOptions(GRPC_SERVICES.AUTHORIZER_SERVICE, {
      host: '127.0.0.1',
      port: await freePort(),
    });
    const userOptions = grpcOptions(GRPC_SERVICES.USER_ACCESS_SERVICE, {
      host: '127.0.0.1',
      port: await freePort(),
    });
    authorizerClient = new ClientGrpcProxy(authorizerOptions.options);
    userClient = new ClientGrpcProxy(userOptions.options);
    const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicKey = keys.publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();
    token = sign({ sub: fixture.userId }, keys.privateKey, {
      algorithm: 'RS256',
      keyid: 'test-key',
      expiresIn: 60,
    });
    keycloak.exchangeUserToken.mockResolvedValue({
      access_token: token,
      refresh_token: 'refresh',
    });

    const authorizerModule = await Test.createTestingModule({
      controllers: [RpcAuthorizerController, KeycloakController],
      providers: [
        AuthorizerService,
        { provide: KeycloakHttpService, useValue: keycloak },
        {
          provide: ConfigService,
          useValue: new ConfigService({
            KEYCLOAK_CONFIG: { HOST: 'https://keycloak.test', REALM: 'test' },
          }),
        },
        { provide: GRPC_SERVICES.USER_ACCESS_SERVICE, useValue: userClient },
      ],
    }).compile();
    const jwksClient = authorizerModule.get(AuthorizerService)['jwksClient'];
    jest
      .spyOn(jwksClient, 'getSigningKey')
      .mockImplementation(
        async () =>
          ({ kid: 'test-key', getPublicKey: () => publicKey }) as SigningKey,
      );
    authorizerApp = authorizerModule.createNestMicroservice<GrpcOptions>({
      ...authorizerOptions,
      logger: false,
    });
    authorizerApp.useGlobalInterceptors(new GrpcLoggingInterceptor());

    const userModule = await Test.createTestingModule({
      controllers: [RpcUserController, RpcRoleController],
      providers: [
        UserService,
        RoleService,
        { provide: RoleRepository, useValue: roleRepository },
        { provide: UserRepository, useValue: repository },
        {
          provide: GRPC_SERVICES.AUTHORIZER_SERVICE,
          useValue: authorizerClient,
        },
      ],
    }).compile();
    createSpy = jest.spyOn(userModule.get(UserService), 'create');
    userApp = userModule.createNestMicroservice<GrpcOptions>({
      ...userOptions,
      logger: false,
    });
    userApp.useGlobalInterceptors(new GrpcLoggingInterceptor());
    await authorizerApp.listen();
    await userApp.listen();

    const bffModule = await Test.createTestingModule({
      controllers: [
        AuthorizerController,
        BffUserController,
        BffRoleController,
        SecuredController,
      ],
      providers: [
        {
          provide: GRPC_SERVICES.AUTHORIZER_SERVICE,
          useValue: authorizerClient,
        },
        { provide: GRPC_SERVICES.USER_ACCESS_SERVICE, useValue: userClient },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: APP_GUARD, useClass: UserGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
      ],
    }).compile();
    app = bffModule.createNestApplication({ logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    const middleware = new LoggerMiddleware();
    app.use(middleware.use.bind(middleware));
    app.useGlobalInterceptors(
      new ExceptionInterceptor(),
      new HttpResponseInterceptor(),
    );
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('BFF').setVersion('1.0').build(),
    );
    SwaggerModule.setup('api/docs', app, document);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  }, 30000);

  afterAll(async () => {
    await app?.close();
    authorizerClient?.close();
    userClient?.close();
    await Promise.all([authorizerApp?.close(), userApp?.close()]);
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    administrator.permissions = Object.values(PERMISSION);
    fixture.roles = [administrator];
  });

  async function post(path: string, body: unknown) {
    return fetch(`${baseUrl}/api/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Connection: 'close',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  }

  async function request(
    path: string,
    method = 'GET',
    body?: unknown,
    accessToken = token,
  ) {
    return fetch(`${baseUrl}/api/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Connection: 'close',
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  it('protects user creation and role management with 401 and 403', async () => {
    const unauthenticated = await request('user', 'POST', {}, '');
    expect(unauthenticated.status).toBe(401);
    const unauthenticatedRoles = await request('role', 'GET', undefined, '');
    expect(unauthenticatedRoles.status).toBe(401);
    administrator.permissions = [];
    const forbidden = await request('user', 'POST', {});
    expect(forbidden.status).toBe(403);
    const forbiddenRoles = await request('role');
    expect(forbiddenRoles.status).toBe(403);
    expect(keycloak.createUser).not.toHaveBeenCalled();
  });

  it.each([
    ['POST', 'user', PERMISSION.USER_CREATE],
    ['POST', 'user', PERMISSION.USER_ASSIGN_ROLES],
    ['PATCH', 'user/keycloak-1/roles', PERMISSION.USER_ASSIGN_ROLES],
    ['GET', 'role/permissions', PERMISSION.ROLE_GET_ALL],
    ['GET', 'role', PERMISSION.ROLE_GET_ALL],
    ['GET', 'role/role-id', PERMISSION.ROLE_GET_BY_ID],
    ['POST', 'role', PERMISSION.ROLE_CREATE],
    ['PUT', 'role/role-id', PERMISSION.ROLE_UPDATE],
    ['DELETE', 'role/role-id', PERMISSION.ROLE_DELETE],
  ])(
    'requires the specific permission for %s %s',
    async (method, path, required) => {
      administrator.permissions = Object.values(PERMISSION).filter(
        (permission) => permission !== required,
      );
      const response = await request(path, method);

      expect(response.status).toBe(403);
    },
  );

  it('manages dynamic roles, rejects duplicates and validates permissions', async () => {
    const input = {
      name: 'operator',
      description: 'Operations',
      permissions: [PERMISSION.USER_CREATE],
    };
    const created = await request('role', 'POST', input);
    expect(created.status).toBe(201);
    const body = (await created.json()) as { data: { id: string } };
    const id = body.data.id;
    const duplicate = await request('role', 'POST', input);
    expect(duplicate.status).toBe(409);
    const invalid = await request('role', 'POST', {
      ...input,
      name: 'invalid',
      permissions: ['unknown.permission'],
    });
    expect(invalid.status).toBe(400);
    const list = await request('role');
    expect(await list.json()).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({ id, name: 'operator' }),
      ]),
    });
    const updated = await request(`role/${id}`, 'PUT', {
      ...input,
      permissions: [],
    });
    expect(await updated.json()).toMatchObject({
      data: { id, permissions: [] },
    });
    const detail = await request(`role/${id}`);
    expect(detail.status).toBe(200);
    const deleted = await request(`role/${id}`, 'DELETE');
    expect(deleted.status).toBe(200);
    const missing = await request(`role/${id}`);
    expect(missing.status).toBe(404);
    const invalidId = await request('role/invalid-id');
    expect(invalidId.status).toBe(400);
  });

  it('requires a separate permission to assign roles and rejects missing roles before Keycloak creation', async () => {
    const input = {
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      password: 'password',
      roles: [administrator._id.toString()],
    };
    administrator.permissions = [PERMISSION.USER_CREATE];
    const forbidden = await post('user', input);
    expect(forbidden.status).toBe(403);
    expect(keycloak.createUser).not.toHaveBeenCalled();
    administrator.permissions.push(PERMISSION.USER_ASSIGN_ROLES);
    const invalid = await post('user', {
      ...input,
      roles: [new Types.ObjectId().toString()],
    });
    expect(invalid.status).toBe(400);
    expect(keycloak.createUser).not.toHaveBeenCalled();
    const valid = await post('user', input);
    expect(valid.status).toBe(201);
  });

  it.each([
    { roles: [] },
    {
      roles: [new Types.ObjectId().toString(), new Types.ObjectId().toString()],
    },
  ])(
    'requires exactly one role at HTTP and gRPC boundaries for $roles',
    async ({ roles }) => {
      const input = {
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'password',
        roles,
      };
      const created = await post('user', input);
      expect(created.status).toBe(400);
      const changed = await request(`user/${fixture.userId}/roles`, 'PATCH', {
        roles,
      });
      expect(changed.status).toBe(400);
      const users = userClient.getService<UserAccessServiceClient>(
        USER_ACCESS_SERVICE_NAME,
      );

      await expect(
        requestGrpcData(users.createUser, input),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        requestGrpcData(users.setUserRoles, { userId: fixture.userId, roles }),
      ).rejects.toMatchObject({ status: 400 });
      expect(keycloak.createUser).not.toHaveBeenCalled();
      expect(repository.setRoles).not.toHaveBeenCalled();
    },
  );

  it('replaces the single role and revokes old permissions even with a cached token', async () => {
    const created = await request('role', 'POST', {
      name: 'read-only',
      description: 'No management permissions',
      permissions: [],
    });
    expect(created.status).toBe(201);
    const replacement = (await created.json()) as { data: { id: string } };
    const me = await request('user/me');
    expect(me.status).toBe(200);
    const cached = cache.set.mock.calls[0][1];
    const changed = await request(`user/${fixture.userId}/roles`, 'PATCH', {
      roles: [replacement.data.id],
    });
    expect(changed.status).toBe(200);
    cache.get.mockResolvedValueOnce(cached);
    const denied = await request('role');
    expect(denied.status).toBe(403);
    const current = await request('user/me');
    expect(await current.json()).toMatchObject({
      data: {
        user: { roles: [expect.objectContaining({ id: replacement.data.id })] },
        permissions: [],
      },
    });
  });

  it('updates role permissions without trusting a cached permission list', async () => {
    const id = administrator.id;
    const me = await request('user/me');
    expect(me.status).toBe(200);
    const cached = cache.set.mock.calls[0][1];
    const updated = await request(`role/${id}`, 'PUT', {
      name: administrator.name,
      description: administrator.description,
      permissions: [],
    });
    expect(updated.status).toBe(200);
    cache.get.mockResolvedValueOnce(cached);
    const denied = await request('role');
    expect(denied.status).toBe(403);
  });

  it('rejects deletion of a role assigned to a user', async () => {
    const created = await request('role', 'POST', {
      name: 'revoked-role',
      description: 'Temporary role',
      permissions: Object.values(PERMISSION),
    });
    expect(created.status).toBe(201);
    const body = (await created.json()) as { data: { id: string } };
    const role = storedRoles.get(body.data.id);

    if (!role) {
      throw new Error('Role fixture was not created');
    }

    fixture.roles = [role];
    const me = await request('user/me');
    expect(me.status).toBe(200);
    const cached = cache.set.mock.calls.at(-1)?.[1];
    const deleted = await request(`role/${role.id}`, 'DELETE');
    expect(deleted.status).toBe(409);
    cache.get.mockResolvedValueOnce(cached);
    const allowed = await request('role');

    expect(allowed.status).toBe(200);
    expect(fixture.roles).toHaveLength(1);
    expect(storedRoles.has(role.id)).toBe(true);
  });

  it('keeps login status and response fields through protobuf', async () => {
    const response = await post('authorizer/login', {
      username: 'user',
      password: 'password',
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      statusCode: 200,
      code: 'Success',
      message: 'Success',
      data: { accessToken: token, refreshToken: 'refresh' },
      processId: expect.any(String),
      duration: expect.any(String),
    });
    expect(keycloak.exchangeUserToken).toHaveBeenCalledWith({
      username: 'user',
      password: 'password',
    });
  });

  it('validates HTTP input before dispatching gRPC', async () => {
    const response = await post('authorizer/login', {});

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      statusCode: 400,
      message: expect.arrayContaining([expect.any(String)]),
    });
    expect(keycloak.exchangeUserToken).not.toHaveBeenCalled();
  });

  it('creates an application user through the nested Keycloak RPC with one process ID', async () => {
    const input = {
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      password: 'password',
      roles: [administrator._id.toString()],
    };
    const response = await post('user', input);
    const body = (await response.json()) as { data: string; processId: string };

    expect(response.status).toBe(201);
    expect(body.data).toBe('Created Successfully');
    expect(keycloak.createUser).toHaveBeenCalledWith({
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      password: 'password',
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'keycloak-new',
        roles: [administrator._id],
      }),
    );
    const starts = log.mock.calls
      .map(([entry]: [Record<string, unknown>]) => entry)
      .filter(
        (entry: Record<string, unknown>) =>
          entry?.phase === 'start' && entry?.transport === 'gRPC',
      );

    expect(starts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: 'createUser',
          processId: body.processId,
        }),
        expect.objectContaining({
          method: 'createKeycloakUser',
          processId: body.processId,
        }),
      ]),
    );
  });

  it('verifies a signed token, looks up the user over gRPC and preserves expiry caching', async () => {
    const response = await fetch(`${baseUrl}/api/secured-fixture`, {
      headers: { Authorization: `Bearer ${token}`, Connection: 'close' },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: fixture.id });
    expect(repository.getByUserId).toHaveBeenCalledWith(fixture.userId);
    expect(cache.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        valid: true,
        MetadataKeys: expect.objectContaining({
          userId: fixture.id,
          jwt: expect.objectContaining({ sub: fixture.userId }),
        }),
      }),
      expect.any(Number),
    );
    const ttl = cache.set.mock.calls[0][2];

    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60000);
  });

  it('keeps a missing lookup optional instead of fabricating an empty user', async () => {
    const users = userClient.getService<UserAccessServiceClient>(
      USER_ACCESS_SERVICE_NAME,
    );
    const result = await requestGrpcData(users.getUserById, {
      userId: 'missing',
    });

    expect(result.user).toBeFalsy();
  });

  it('propagates the remaining deadline to the receiving service', async () => {
    const users = userClient.getService<UserAccessServiceClient>(
      USER_ACCESS_SERVICE_NAME,
    );
    const deadline = Date.now() + 1500;

    await requestGrpcData(
      users.createUser,
      {
        firstName: 'New',
        lastName: 'User',
        email: 'deadline@example.com',
        password: 'password',
        roles: [administrator._id.toString()],
      },
      { processId: 'deadline-request', deadline },
      5000,
    );
    const context = createSpy.mock.calls[0][1];

    expect(context.processId).toBe('deadline-request');
    expect(Number(context.deadline)).toBeGreaterThan(Date.now());
    expect(Number(context.deadline)).toBeLessThanOrEqual(deadline + 10);
  });

  it.each([
    [
      new UnauthorizedException('Invalid credentials'),
      401,
      'Invalid credentials',
    ],
    [
      new BadRequestException(['Email không hợp lệ']),
      400,
      ['Email không hợp lệ'],
    ],
    [
      new ServiceUnavailableException('Identity unavailable'),
      503,
      'Identity unavailable',
    ],
  ])(
    'preserves the HTTP error contract for %s',
    async (error, statusCode, message) => {
      keycloak.exchangeUserToken.mockRejectedValueOnce(error);
      const response = await post('authorizer/login', {
        username: 'user',
        password: 'password',
      });

      expect(response.status).toBe(statusCode);
      expect(await response.json()).toMatchObject({
        statusCode,
        message,
        data: null,
      });
    },
  );

  it('keeps Swagger HTTP routes and DTO metadata', async () => {
    const response = await fetch(`${baseUrl}/api/docs-json`, {
      headers: { Connection: 'close' },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      paths: {
        '/api/authorizer/login': { post: expect.any(Object) },
        '/api/user': { post: expect.any(Object) },
      },
      components: {
        schemas: {
          LoginRequestDto: {
            required: expect.arrayContaining(['username', 'password']),
          },
        },
      },
    });
  });
});
