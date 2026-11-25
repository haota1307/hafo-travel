import { createServer, type AddressInfo } from 'node:net';

import {
  type INestApplication,
  type INestMicroservice,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClientGrpcProxy, type GrpcOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';

import { GRPC_SERVICES, grpcOptions } from '@common/configuration/grpc.config';
import { ROLE, PERMISSION } from '@common/constants/enum/role.enum';
import { PermissionGuard } from '@common/guards/permissions.guard';
import { UserGuard } from '@common/guards/user.guard';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { GrpcLoggingInterceptor } from '@common/interceptors/grpc-logging.interceptor';
import { HttpResponseInterceptor } from '@common/interceptors/http-response.interceptor';
import {
  IDENTITY_SERVICE_NAME,
  type IdentityServiceClient,
} from '@common/interfaces/grpc/identity/v1/identity';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import type { UserWithRoles } from '@common/schemas/user.schema';
import { requestGrpcData } from '@common/utils/rpc.util';

import { RoleController as RpcRoleController } from '../../identity/src/app/modules/role/controllers/role.controller';
import { RoleRepository } from '../../identity/src/app/modules/role/repositories/role.repository';
import { RoleService } from '../../identity/src/app/modules/role/services/role.service';
import { UserController as RpcUserController } from '../../identity/src/app/modules/user/controllers/user.controller';
import { UserRepository } from '../../identity/src/app/modules/user/repositories/user.repository';
import { UserService } from '../../identity/src/app/modules/user/services/user.service';
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
  const fixture: UserWithRoles = {
    _id: new Types.ObjectId(),
    id: 'user-1',
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
  let users: IdentityServiceClient;

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
      controllers: [RpcUserController, RpcRoleController],
      providers: [
        UserService,
        RoleService,
        { provide: RoleRepository, useValue: roleRepository },
        { provide: UserRepository, useValue: repository },
      ],
    }).compile();
    userApp = userModule.createNestMicroservice<GrpcOptions>({
      ...userOptions,
      logger: false,
    });
    userApp.useGlobalInterceptors(new GrpcLoggingInterceptor());
    await userApp.listen();

    const bffModule = await Test.createTestingModule({
      controllers: [BffUserController, BffRoleController],
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
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('exposes no login route', async () => {
    const response = await fetch(baseUrl + '/api/authorizer/login', {
      method: 'POST',
    });

    expect(response.status).toBe(404);
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
