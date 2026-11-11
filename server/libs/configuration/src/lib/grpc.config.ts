import { envNumber } from './env-number';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { IsNotEmpty, IsObject } from 'class-validator';
import { join } from 'path';

export enum GRPC_SERVICES {
  AUTHORIZER_SERVICE = 'AUTHORIZER_SERVICE',
  USER_ACCESS_SERVICE = 'USER_ACCESS_SERVICE',
}

export class GrpcConfiguration {
  @IsNotEmpty()
  @IsObject()
  GRPC_AUTHORIZER_SERVICE: GrpcOptions & { name: GRPC_SERVICES };

  @IsNotEmpty()
  @IsObject()
  GRPC_USER_ACCESS_SERVICE: GrpcOptions & { name: GRPC_SERVICES };

  constructor() {
    this.GRPC_AUTHORIZER_SERVICE = GrpcConfiguration.setValue({
      serviceName: GRPC_SERVICES.AUTHORIZER_SERVICE,
      protoPath: ['./proto/authorizer.proto'],
      host: process.env['AUTHORIZER_SERVICE_HOST'] || 'localhost',
      port: envNumber('AUTHORIZER_SERVICE_PORT', 5100, undefined, 1, 65535),
    });
    this.GRPC_USER_ACCESS_SERVICE = GrpcConfiguration.setValue({
      serviceName: GRPC_SERVICES.USER_ACCESS_SERVICE,
      protoPath: ['./proto/user-access.proto'],
      host: process.env['USER_ACCESS_SERVICE_HOST'] || 'localhost',
      port: envNumber('USER_ACCESS_SERVICE_PORT', 5101, undefined, 1, 65535),
    });
  }

  private static setValue({
    serviceName,
    protoPath,
    port,
    host,
  }: {
    serviceName: GRPC_SERVICES;
    protoPath: string | string[];
    port?: number;
    host?: string;
  }): GrpcOptions & { name: GRPC_SERVICES } {
    return {
      name: serviceName,
      transport: Transport.GRPC,
      options: {
        url: `${host}:${port}`,
        package: 'package',
        protoPath: Array.isArray(protoPath)
          ? protoPath.map((path) => join(__dirname, path))
          : join(__dirname, protoPath),
      },
    };
  }
}
