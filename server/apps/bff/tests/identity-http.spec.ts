import { randomBytes } from 'node:crypto';
import { createServer, type AddressInfo } from 'node:net';

import {
  ForbiddenException,
  type INestApplication,
  type INestMicroservice,
  Logger,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { ClientGrpcProxy, type GrpcOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';

import { AccessTokenModule } from '@common/configuration/access-token.config';
import { GRPC_SERVICES, grpcOptions } from '@common/configuration/grpc.config';
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_AUDIENCE,
  REFRESH_TOKEN_USE,
} from '@common/constants/access-token.constants';
import { CODE_ERROR } from '@common/constants/enum/code-error.enum';
import { ROLE, PERMISSION } from '@common/constants/enum/role.enum';
import { PermissionGuard } from '@common/guards/permissions.guard';
import { UserGuard } from '@common/guards/user.guard';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { GrpcLoggingInterceptor } from '@common/interceptors/grpc-logging.interceptor';
import { HttpResponseInterceptor } from '@common/interceptors/http-response.interceptor';
import {
  IDENTITY_SERVICE_NAME,
  type IdentityServiceClient,
  type LoginRequest,
} from '@common/interfaces/grpc/identity/v1/identity';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import type { UserWithRoles } from '@common/schemas/user.schema';
import { requestGrpcData } from '@common/utils/rpc.util';

import { AuthController as RpcAuthController } from '../../identity/src/app/modules/auth/controllers/auth.controller';
import { AuthService } from '../../identity/src/app/modules/auth/services/auth.service';
import { RoleController as RpcRoleController } from '../../identity/src/app/modules/role/controllers/role.controller';
import { RoleRepository } from '../../identity/src/app/modules/role/repositories/role.repository';
import { RoleService } from '../../identity/src/app/modules/role/services/role.service';
import { UserController as RpcUserController } from '../../identity/src/app/modules/user/controllers/user.controller';
import { UserRepository } from '../../identity/src/app/modules/user/repositories/user.repository';
import { UserService } from '../../identity/src/app/modules/user/services/user.service';
import { AuthController as BffAuthController } from '../src/app/modules/auth/controllers/auth.controller';
import { RoleController as BffRoleController } from '../src/app/modules/role/controllers/role.controller';
import { UserController as BffUserController } from '../src/app/modules/user/controllers/user.controller';

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
  let userApp: INestMicroservice;
  let userClient: ClientGrpcProxy;
  let baseUrl: string;
  const profileId = new Types.ObjectId();
  const fixture: UserWithRoles = {
    _id: profileId,
    id: profileId.toHexString(),
    userId: 'fixture-user',
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
  const loginInput = {
    email: fixture.email,
    password: 'a long password used by the test fixture',
  };
  const accessKey = randomBytes(32).toString('base64url');
  const refreshKey = randomBytes(32).toString('base64url');
  const accessSigner = new JwtService({
    secret: accessKey,
    signOptions: { algorithm: 'HS256' },
  });
  const refreshSigner = new JwtService({
    secret: refreshKey,
    signOptions: { algorithm: 'HS256' },
  });
  const previousAccessKey = process.env['AC_TOKEN_KEY'];

  function issueAccessToken(
    claims: Record<string, unknown> = {},
    options?: JwtSignOptions,
  ) {
    const now = Math.floor(Date.now() / 1000);

    return accessSigner.sign(
      {
        iss: ACCESS_TOKEN_ISSUER,
        aud: ACCESS_TOKEN_AUDIENCE,
        sub: fixture.userId,
        profileId: fixture.id,
        permissions: Object.values(PERMISSION),
        iat: now,
        exp: now + ACCESS_TOKEN_MAX_AGE_SECONDS,
        ...claims,
      },
      options,
    );
  }

  function issueRefreshToken(jti: string) {
    return refreshSigner.sign(
      {
        iss: ACCESS_TOKEN_ISSUER,
        aud: REFRESH_TOKEN_AUDIENCE,
        tokenUse: REFRESH_TOKEN_USE,
        jti,
      },
      { expiresIn: 86400 },
    );
  }

  const tokenPair = {
    accessToken: issueAccessToken(),
    refreshToken: issueRefreshToken('initial-refresh-credential'),
    accessExpiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS,
    refreshExpiresIn: 86400,
  };
  const refreshedPair = {
    ...tokenPair,
    accessToken: issueAccessToken({
      jti: 'refreshed-credential',
      tokenUse: 'access',
    }),
    refreshToken: issueRefreshToken('rotated-refresh-credential'),
  };
  const authService = {
    login: jest.fn(async ({ email, password }: LoginRequest) => {
      if (email !== loginInput.email || password !== loginInput.password) {
        throw new UnauthorizedException(CODE_ERROR.INVALID_CREDENTIALS);
      }

      return tokenPair;
    }),
    refreshSession: jest.fn(async (refreshToken: string) => {
      if (refreshToken !== tokenPair.refreshToken) {
        throw new UnauthorizedException('Authentication is required');
      }

      return refreshedPair;
    }),
    logout: jest.fn().mockResolvedValue({}),
  };
  let users: IdentityServiceClient;

  function postAuth(path: string, input: object) {
    return fetch(`${baseUrl}/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify(input),
    });
  }

  function getProtected(path: string, accessToken = tokenPair.accessToken) {
    return fetch(`${baseUrl}/api/${path}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Connection: 'close' },
    });
  }

  beforeAll(async () => {
    jest.spyOn(Logger, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
    const userOptions = grpcOptions(GRPC_SERVICES.IDENTITY_SERVICE, {
      host: '127.0.0.1',
      port: await freePort(),
    });
    userClient = new ClientGrpcProxy(userOptions.options);
    users = userClient.getService<IdentityServiceClient>(IDENTITY_SERVICE_NAME);

    const userModule = await Test.createTestingModule({
      controllers: [RpcUserController, RpcRoleController, RpcAuthController],
      providers: [
        UserService,
        RoleService,
        { provide: RoleRepository, useValue: roleRepository },
        { provide: UserRepository, useValue: repository },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();
    userApp = userModule.createNestMicroservice<GrpcOptions>({
      ...userOptions,
      logger: false,
    });
    userApp.useGlobalInterceptors(new GrpcLoggingInterceptor());
    await userApp.listen();

    process.env['AC_TOKEN_KEY'] = accessKey;
    const bffModule = await Test.createTestingModule({
      imports: [AccessTokenModule],
      controllers: [BffUserController, BffRoleController, BffAuthController],
      providers: [
        { provide: GRPC_SERVICES.IDENTITY_SERVICE, useValue: userClient },
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
    userClient?.close();
    await userApp?.close();
    jest.restoreAllMocks();

    if (previousAccessKey === undefined) {
      delete process.env['AC_TOKEN_KEY'];
    } else {
      process.env['AC_TOKEN_KEY'] = previousAccessKey;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    administrator.permissions = Object.values(PERMISSION);
    fixture.roles = [administrator];
  });

  it.each([
    ['GET', 'user/me'],
    ['POST', 'user'],
    ['PATCH', 'user/fixture-user/roles'],
    ['GET', 'role'],
    ['PUT', 'role/fixture-role'],
  ])('returns 401 for %s %s with an old bearer token', async (method, path) => {
    const response = await fetch(baseUrl + '/api/' + path, {
      method,
      headers: { Authorization: 'Bearer old-token', Connection: 'close' },
    });

    expect(response.status).toBe(401);
    expect(repository.getByUserId).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('keeps the retired authorizer login route unavailable', async () => {
    const response = await fetch(baseUrl + '/api/authorizer/login', {
      method: 'POST',
    });

    expect(response.status).toBe(404);
  });

  it('passes login, refresh and logout over gRPC and preserves the HTTP envelope', async () => {
    const response = await postAuth('login', loginInput);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({
      statusCode: 200,
      code: 'Success',
      data: tokenPair,
    });
    expect(authService.login).toHaveBeenCalledWith(loginInput);

    const refreshed = await postAuth('refresh', {
      refreshToken: tokenPair.refreshToken,
    });

    expect(refreshed.status).toBe(200);
    expect(refreshed.headers.get('cache-control')).toBe('no-store');
    expect(await refreshed.json()).toMatchObject({ data: refreshedPair });
    expect(authService.refreshSession).toHaveBeenCalledWith(
      tokenPair.refreshToken,
    );

    const loggedOut = await postAuth('logout', {
      refreshToken: refreshedPair.refreshToken,
    });

    expect(loggedOut.status).toBe(200);
    expect(loggedOut.headers.get('cache-control')).toBe('no-store');
    expect(await loggedOut.json()).toMatchObject({ data: { loggedOut: true } });
    expect(authService.logout).toHaveBeenCalledWith(refreshedPair.refreshToken);

    expect((await getProtected('role', refreshedPair.accessToken)).status).toBe(
      200,
    );
    expect(repository.getByUserId).not.toHaveBeenCalled();
  });

  it('rejects unsigned refresh credentials before forwarding refresh or logout', async () => {
    const body = { refreshToken: 'a'.repeat(43) };
    expect((await postAuth('refresh', body)).status).toBe(400);
    expect((await postAuth('logout', body)).status).toBe(400);
    expect(authService.refreshSession).not.toHaveBeenCalled();
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('keeps access and refresh JWTs scoped to their own uses', async () => {
    const protectedResponse = await getProtected(
      'user/me',
      tokenPair.refreshToken,
    );
    const refreshResponse = await postAuth('refresh', {
      refreshToken: tokenPair.accessToken,
    });

    expect(protectedResponse.status).toBe(401);
    expect(repository.getByUserId).not.toHaveBeenCalled();
    expect(refreshResponse.status).toBe(401);
    expect(authService.refreshSession).toHaveBeenCalledWith(
      tokenPair.accessToken,
    );
  });

  it('keeps failed credentials indistinguishable and rejects invalid login input before gRPC', async () => {
    const invalidInput = await postAuth('login', { ...loginInput, email: '' });

    expect(invalidInput.status).toBe(400);
    expect(authService.login).not.toHaveBeenCalled();

    const unknownEmail = await postAuth('login', {
      ...loginInput,
      email: 'unknown@example.com',
    });
    const wrongPassword = await postAuth('login', {
      ...loginInput,
      password: 'a different password used by the test fixture',
    });
    const first = await unknownEmail.json();
    const second = await wrongPassword.json();

    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    const expected = { message: CODE_ERROR.INVALID_CREDENTIALS };
    expect(first).toMatchObject(expected);
    expect(second).toMatchObject(expected);
  });

  it.each([
    [
      new Error('Internal driver details'),
      500,
      CODE_ERROR.INTERNAL_SERVER_ERROR,
    ],
    [new ForbiddenException(CODE_ERROR.FORBIDDEN), 403, CODE_ERROR.FORBIDDEN],
  ] as const)(
    'maps Identity login errors through gRPC and HTTP (%p)',
    async (error, status, message) => {
      authService.login.mockRejectedValueOnce(error);

      const response = await postAuth('login', loginInput);

      expect(response.status).toBe(status);
      expect(await response.json()).toMatchObject({
        statusCode: status,
        message,
      });
    },
  );

  it('uses signed permissions until expiry and only queries Identity for endpoint data', async () => {
    await requestGrpcData(users.updateRole, {
      id: administrator.id,
      name: administrator.name,
      description: administrator.description,
      permissions: [],
    });

    expect((await getProtected('role')).status).toBe(200);
    const freshAccessToken = issueAccessToken({ permissions: [] });
    expect((await getProtected('role', freshAccessToken)).status).toBe(403);
    expect(repository.getByUserId).not.toHaveBeenCalled();
    expect(roleRepository.getAll).toHaveBeenCalledTimes(1);

    const me = await getProtected('user/me');

    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({
      data: {
        user: {
          id: fixture.id,
          userId: fixture.userId,
          roles: [{ id: administrator.id, permissions: [] }],
        },
        permissions: expect.arrayContaining([PERMISSION.ROLE_GET_ALL]),
      },
    });
    expect(repository.getByUserId).toHaveBeenCalledTimes(1);
    expect(repository.getByUserId).toHaveBeenCalledWith(fixture.userId);
    expect((await getProtected('user/me', freshAccessToken)).status).toBe(200);
  });

  it('rejects a profile lookup whose ID does not match the signed profile ID', async () => {
    const token = issueAccessToken({
      profileId: new Types.ObjectId().toHexString(),
    });

    expect((await getProtected('user/me', token)).status).toBe(401);
    expect(repository.getByUserId).toHaveBeenCalledWith(fixture.userId);
  });

  it('rejects access claims with the expected audience signed using the refresh key', async () => {
    const token = issueAccessToken(
      { tokenUse: 'access' },
      { secret: refreshKey },
    );

    expect((await getProtected('user/me', token)).status).toBe(401);
    expect(repository.getByUserId).not.toHaveBeenCalled();
  });

  it('rejects expired, tampered or incorrectly scoped JWTs before calling Identity', async () => {
    const now = Math.floor(Date.now() / 1000);
    const [header, payload, signature] = tokenPair.accessToken.split('.');
    const altered = signature[0] === 'A' ? 'B' : 'A';
    const tampered = `${header}.${payload}.${altered}${signature.slice(1)}`;

    for (const token of [
      tampered,
      issueAccessToken({}, { algorithm: 'HS384' }),
      issueAccessToken({ iat: now - 60, exp: now - 1 }),
      issueAccessToken({ iat: now + 10 }),
      issueAccessToken({
        iat: now,
        exp: now + ACCESS_TOKEN_MAX_AGE_SECONDS + 1,
      }),
      issueAccessToken({ aud: REFRESH_TOKEN_AUDIENCE }),
      issueAccessToken({
        aud: [ACCESS_TOKEN_AUDIENCE, REFRESH_TOKEN_AUDIENCE],
      }),
      issueAccessToken({ iss: 'another-issuer' }),
      issueAccessToken({ tokenUse: REFRESH_TOKEN_USE }),
      issueAccessToken({ permissions: [PERMISSION.ROLE_GET_ALL, 0] }),
    ]) {
      expect((await getProtected('user/me', token)).status).toBe(401);
    }

    expect(repository.getByUserId).not.toHaveBeenCalled();
  });

  it('creates profiles with a local user ID and exactly one existing role', async () => {
    const input = {
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      roles: [administrator.id],
    };

    for (const roles of [
      [],
      [new Types.ObjectId().toString()],
      [administrator.id, administrator.id],
    ]) {
      await expect(
        requestGrpcData(users.createUser, { ...input, roles }),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        requestGrpcData(users.setUserRoles, { userId: fixture.userId, roles }),
      ).rejects.toMatchObject({ status: 400 });
    }

    expect(repository.create).not.toHaveBeenCalled();
    await expect(requestGrpcData(users.createUser, input)).resolves.toEqual({
      message: 'Created Successfully',
    });
    expect(repository.create).toHaveBeenCalledWith({
      ...input,
      roles: [administrator._id],
      userId: expect.stringMatching(/^[a-f0-9-]{36}$/),
    });
  });

  it('creates, reads, updates and deletes roles while protecting assigned roles', async () => {
    const input = {
      name: 'operator',
      description: 'Operations',
      permissions: [PERMISSION.USER_CREATE],
    };
    const created = await requestGrpcData(users.createRole, input);

    if (!created.role) {
      throw new Error('Missing created role');
    }

    const { id } = created.role;

    await expect(
      requestGrpcData(users.createRole, input),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      requestGrpcData(users.createRole, { ...input, permissions: ['invalid'] }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(requestGrpcData(users.listRoles, {})).resolves.toMatchObject({
      roles: expect.arrayContaining([created.role]),
    });
    await expect(requestGrpcData(users.getRole, { id })).resolves.toEqual(
      created,
    );
    await expect(
      requestGrpcData(users.updateRole, { ...input, id, permissions: [] }),
    ).resolves.toMatchObject({ role: { id, permissions: [] } });
    await expect(
      requestGrpcData(users.setUserRoles, {
        userId: fixture.userId,
        roles: [id],
      }),
    ).resolves.toMatchObject({
      user: { roles: [expect.objectContaining({ id })] },
    });
    await expect(
      requestGrpcData(users.deleteRole, { id }),
    ).rejects.toMatchObject({ status: 409 });
    await requestGrpcData(users.setUserRoles, {
      userId: fixture.userId,
      roles: [administrator.id],
    });
    await requestGrpcData(users.deleteRole, { id });
    await expect(requestGrpcData(users.getRole, { id })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('keeps a missing lookup optional instead of fabricating an empty user', async () => {
    const result = await requestGrpcData(users.getUserById, {
      userId: 'missing',
    });

    expect(result.user).toBeFalsy();
  });

  it('keeps Swagger HTTP routes and DTO metadata', async () => {
    const response = await fetch(`${baseUrl}/api/docs-json`, {
      headers: { Connection: 'close' },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      paths: {
        '/api/user': { post: expect.any(Object) },
      },
      components: {
        schemas: {
          CreateUserRequestDto: {
            required: expect.arrayContaining([
              'firstName',
              'lastName',
              'email',
              'roles',
            ]),
          },
        },
      },
    });
  });
});
