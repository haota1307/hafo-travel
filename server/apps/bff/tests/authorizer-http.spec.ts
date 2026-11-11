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
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ClientGrpcProxy, type GrpcOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createServer, type AddressInfo } from 'node:net';
import { generateKeyPairSync } from 'node:crypto';
import { sign } from 'jsonwebtoken';
import type { SigningKey } from 'jwks-rsa';
import { Types } from 'mongoose';
import { GRPC_SERVICES, grpcOptions } from '@common/configuration/grpc.config';
import {
  USER_ACCESS_SERVICE_NAME,
  type UserAccessServiceClient,
} from '@common/interfaces/grpc/user-access/v1/user-access';
import type { UserWithRoles } from '@common/schemas/user.schema';
import { ROLE, PERMISSION } from '@common/constants/enum/role.enum';
import { Authorization } from '@common/decorators/authorizer.decorator';
import type { RequestContext } from '@common/interfaces/gateway/request-context.interface';
import { UserGuard } from '@common/guards/user.guard';
import { GrpcLoggingInterceptor } from '@common/interceptors/grpc-logging.interceptor';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { HttpResponseInterceptor } from '@common/interceptors/http-response.interceptor';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import { requestGrpcData } from '@common/utils/rpc.util';
import { AuthorizerController } from '../src/app/modules/authorizer/controllers/authorizer.controller';
import { UserController as BffUserController } from '../src/app/modules/user/controllers/user.controller';
import { AuthorizerController as RpcAuthorizerController } from '../../authorizer/src/app/modules/authorizer/controllers/authorizer.controller';
import { AuthorizerService } from '../../authorizer/src/app/modules/authorizer/services/authorizer.service';
import { KeycloakController } from '../../authorizer/src/app/modules/keycloak/controllers/keycloak.controller';
import { KeycloakHttpService } from '../../authorizer/src/app/modules/keycloak/services/keycloak-http.service';
import { UserController as RpcUserController } from '../../user-access/src/app/modules/user/controllers/user.controller';
import { UserService } from '../../user-access/src/app/modules/user/services/user.service';
import { UserRepository } from '../../user-access/src/app/modules/user/repositories/user.repository';

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
        permissions: [PERMISSION.USER_CREATE],
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
      id === fixture.userId ? fixture : null,
    ),
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
      controllers: [RpcUserController],
      providers: [
        UserService,
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
      controllers: [AuthorizerController, BffUserController, SecuredController],
      providers: [
        {
          provide: GRPC_SERVICES.AUTHORIZER_SERVICE,
          useValue: authorizerClient,
        },
        { provide: GRPC_SERVICES.USER_ACCESS_SERVICE, useValue: userClient },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: APP_GUARD, useClass: UserGuard },
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
  });

  afterAll(async () => {
    await app?.close();
    authorizerClient?.close();
    userClient?.close();
    await Promise.all([authorizerApp?.close(), userApp?.close()]);
    jest.restoreAllMocks();
  });

  beforeEach(() => jest.clearAllMocks());

  async function post(path: string, body: unknown) {
    return fetch(`${baseUrl}/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify(body),
    });
  }

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
      roles: [],
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
      expect.objectContaining({ userId: 'keycloak-new', roles: [] }),
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
        roles: [],
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
