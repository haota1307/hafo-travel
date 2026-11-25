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
  AIAGENT_V1_PACKAGE_NAME,
  protobufFileName as aiAgentProtoFile,
} from '@common/interfaces/grpc/ai-agent/v1/ai-agent';
import {
  BOOKING_V1_PACKAGE_NAME,
  protobufFileName as bookingProtoFile,
} from '@common/interfaces/grpc/booking/v1/booking';
import {
  IDENTITY_V1_PACKAGE_NAME,
  protobufFileName as identityProtoFile,
} from '@common/interfaces/grpc/identity/v1/identity';
import {
  PAYMENT_V1_PACKAGE_NAME,
  protobufFileName as paymentProtoFile,
} from '@common/interfaces/grpc/payment/v1/payment';
import { envNumber } from '@common/utils/env-number.util';

export enum GRPC_SERVICES {
  IDENTITY_SERVICE = 'GRPC_IDENTITY_SERVICE',
  BOOKING_SERVICE = 'GRPC_BOOKING_SERVICE',
  PAYMENT_SERVICE = 'GRPC_PAYMENT_SERVICE',
  AI_AGENT_SERVICE = 'GRPC_AI_AGENT_SERVICE',
}

const definitions = {
  [GRPC_SERVICES.IDENTITY_SERVICE]: {
    package: IDENTITY_V1_PACKAGE_NAME,
    file: identityProtoFile,
    prefix: 'IDENTITY_SERVICE',
    port: 5101,
  },
  [GRPC_SERVICES.BOOKING_SERVICE]: {
    package: BOOKING_V1_PACKAGE_NAME,
    file: bookingProtoFile,
    prefix: 'BOOKING_SERVICE',
    port: 5103,
  },
  [GRPC_SERVICES.PAYMENT_SERVICE]: {
    package: PAYMENT_V1_PACKAGE_NAME,
    file: paymentProtoFile,
    prefix: 'PAYMENT_SERVICE',
    port: 5104,
  },
  [GRPC_SERVICES.AI_AGENT_SERVICE]: {
    package: AIAGENT_V1_PACKAGE_NAME,
    file: aiAgentProtoFile,
    prefix: 'AI_AGENT_SERVICE',
    port: 5106,
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

export function grpcServerOptions(
  service: GRPC_SERVICES,
  { registerPackage = true } = {},
): GrpcOptions {
  const options = grpcOptions(service, {
    host: process.env['GRPC_BIND_HOST'] || '0.0.0.0',
  });

  if (!registerPackage) {
    options.options.package = [];
  }

  return options;
}

export class GrpcConfiguration {
  @IsNotEmpty()
  @IsObject()
  GRPC_IDENTITY_SERVICE = grpcOptions(GRPC_SERVICES.IDENTITY_SERVICE);

  @IsNotEmpty()
  @IsObject()
  GRPC_BOOKING_SERVICE = grpcOptions(GRPC_SERVICES.BOOKING_SERVICE);

  @IsNotEmpty()
  @IsObject()
  GRPC_PAYMENT_SERVICE = grpcOptions(GRPC_SERVICES.PAYMENT_SERVICE);

  @IsNotEmpty()
  @IsObject()
  GRPC_AI_AGENT_SERVICE = grpcOptions(GRPC_SERVICES.AI_AGENT_SERVICE);
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
