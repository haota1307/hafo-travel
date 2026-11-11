import { envNumber } from './env-number';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ClientsProviderAsyncOptions,
  TcpClientOptions,
  Transport,
} from '@nestjs/microservices';
import { IsNotEmpty, IsObject } from 'class-validator';

export enum TCP_SERVICES {
  USER_ACCESS_SERVICE = 'TCP_USER_ACCESS_SERVICE',
  AUTHORIZER_SERVICE = 'TCP_AUTHORIZER_SERVICE',
}

export class TcpConfiguration {
  @IsNotEmpty()
  @IsObject()
  TCP_USER_ACCESS_SERVICE: TcpClientOptions;

  @IsNotEmpty()
  @IsObject()
  TCP_AUTHORIZER_SERVICE: TcpClientOptions;

  constructor() {
    Object.entries(TCP_SERVICES).forEach(([key, serviceName]) => {
      const host = process.env[`${key}_HOST`] || 'localhost';
      const port = envNumber(`${serviceName}_PORT`, 3000, undefined, 1, 65535);

      this[serviceName] = TcpConfiguration.setValue(port, host);
    });
  }

  static setValue(port: number, host: string): TcpClientOptions {
    return {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    };
  }
}

export function TcpProvider(
  serviceName: keyof TcpConfiguration,
): ClientsProviderAsyncOptions {
  return {
    name: serviceName,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      configService.get(`TCP_SERV.${serviceName}`) as TcpClientOptions,
  };
}
