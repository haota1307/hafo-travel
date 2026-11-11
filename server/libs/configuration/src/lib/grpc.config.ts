import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Transport,
  type ClientsProviderAsyncOptions,
  type GrpcOptions,
} from '@nestjs/microservices';
import { IsNotEmpty, IsObject } from 'class-validator';
import { AUTHORIZER_V1_PACKAGE_NAME } from '@common/interfaces/grpc/authorizer/v1/authorizer';
import { USERACCESS_V1_PACKAGE_NAME } from '@common/interfaces/grpc/user-access/v1/user-access';
import { envNumber } from './env-number';

export enum GRPC_SERVICES {
  AUTHORIZER_SERVICE = 'GRPC_AUTHORIZER_SERVICE',
  USER_ACCESS_SERVICE = 'GRPC_USER_ACCESS_SERVICE',
}

const definitions = {
  [GRPC_SERVICES.AUTHORIZER_SERVICE]: {
    package: AUTHORIZER_V1_PACKAGE_NAME,
    file: 'authorizer/v1/authorizer.proto',
    prefix: 'AUTHORIZER_SERVICE',
    port: 5100,
  },
  [GRPC_SERVICES.USER_ACCESS_SERVICE]: {
    package: USERACCESS_V1_PACKAGE_NAME,
    file: 'user-access/v1/user-access.proto',
    prefix: 'USER_ACCESS_SERVICE',
    port: 5101,
  },
};

export function grpcOptions(
  service: GRPC_SERVICES,
  endpoint: { host?: string; port?: number } = {},
): GrpcOptions {
  const definition = definitions[service];
  const bundledRoot = resolve(__dirname, 'proto');
  const protoRoot = existsSync(resolve(bundledRoot, definition.file))
    ? bundledRoot
    : resolve(__dirname, '../../../interfaces/src/lib/proto');
  const host =
    endpoint.host ?? process.env[`${definition.prefix}_HOST`] ?? 'localhost';
  const port =
    endpoint.port ??
    envNumber(
      `${definition.prefix}_PORT`,
      definition.port,
      undefined,
      1,
      65535,
    );

  return {
    transport: Transport.GRPC,
    options: {
      url: `${host}:${port}`,
      package: definition.package,
      protoPath: resolve(protoRoot, definition.file),
      loader: {
        keepCase: false,
        longs: Number,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [protoRoot],
      },
      channelOptions: { 'grpc.enable_retries': 0 },
    },
  };
}

export function grpcServerOptions(service: GRPC_SERVICES): GrpcOptions {
  return grpcOptions(service, {
    host: process.env['GRPC_BIND_HOST'] || '0.0.0.0',
  });
}

export class GrpcConfiguration {
  @IsNotEmpty()
  @IsObject()
  GRPC_AUTHORIZER_SERVICE = grpcOptions(GRPC_SERVICES.AUTHORIZER_SERVICE);

  @IsNotEmpty()
  @IsObject()
  GRPC_USER_ACCESS_SERVICE = grpcOptions(GRPC_SERVICES.USER_ACCESS_SERVICE);
}

export function GrpcProvider(
  service: GRPC_SERVICES,
): ClientsProviderAsyncOptions {
  return {
    name: service,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      configService.getOrThrow<GrpcOptions>(`GRPC_SERV.${service}`),
  };
}
