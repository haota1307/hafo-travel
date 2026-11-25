import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Transport,
  type ClientsProviderAsyncOptions,
  type GrpcOptions,
} from '@nestjs/microservices';
import { IsNotEmpty, IsObject } from 'class-validator';

import {
  IDENTITY_V1_PACKAGE_NAME,
  protobufFileName as identityProtoFile,
} from '@common/interfaces/grpc/identity/v1/identity';
import { envNumber } from '@common/utils/env-number.util';

export enum GRPC_SERVICES {
  IDENTITY_SERVICE = 'GRPC_IDENTITY_SERVICE',
}

const definitions = {
  [GRPC_SERVICES.IDENTITY_SERVICE]: {
    package: IDENTITY_V1_PACKAGE_NAME,
    file: identityProtoFile,
    prefix: 'IDENTITY_SERVICE',
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
  GRPC_IDENTITY_SERVICE = grpcOptions(GRPC_SERVICES.IDENTITY_SERVICE);
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
