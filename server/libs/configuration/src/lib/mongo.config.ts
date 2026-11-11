import { envNumber } from './env-number';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export class MongoConfig {
  @IsString()
  @IsNotEmpty()
  URL: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsNumber()
  @IsOptional()
  POOL_SIZE?: number;

  @IsNumber()
  @IsOptional()
  CONNECT_TIMEOUT_MS?: number;

  @IsNumber()
  @IsOptional()
  SOCKET_TIMEOUT_MS?: number;

  constructor(data?: Partial<MongoConfig>) {
    this.URL =
      data?.URL ||
      process.env['MONGODB_URL'] ||
      'mongodb://root:password@localhost:27017/';

    this.DB_NAME =
      data?.DB_NAME || process.env['MONGODB_DB_NAME'] || 'backend_app';

    this.POOL_SIZE = envNumber('MONGO_POOL_SIZE', 10, data?.POOL_SIZE, 1);

    this.CONNECT_TIMEOUT_MS = envNumber(
      'MONGO_CONNECT_TIMEOUT_MS',
      15000,
      data?.CONNECT_TIMEOUT_MS,
    );

    this.SOCKET_TIMEOUT_MS = envNumber(
      'MONGO_SOCKET_TIMEOUT_MS',
      360000,
      data?.SOCKET_TIMEOUT_MS,
    );
  }
}

export const MongoProvider = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGO_CONFIG.URL'),
    dbName: configService.get<string>('MONGO_CONFIG.DB_NAME'),
    maxPoolSize: configService.get<number>('MONGO_CONFIG.POOL_SIZE'),
    connectTimeoutMS: configService.get<number>(
      'MONGO_CONFIG.CONNECT_TIMEOUT_MS',
    ),
    socketTimeoutMS: configService.get<number>(
      'MONGO_CONFIG.SOCKET_TIMEOUT_MS',
    ),
    onConnectionCreate: (connection: Connection) => {
      connection.on('connected', () => Logger.log('🟢 🟢 🟢 >> connected'));
      connection.on('open', () => Logger.log('🟢 🟢 🟢 >> open'));
      connection.on('disconnected', () => Logger.log('❌❌❌ >> disconnected'));
      connection.on('reconnected', () => Logger.log('🧡 🧡 🧡 >> reconnected'));
      connection.on('disconnecting', () =>
        Logger.log('❌❌❌ >> disconnecting'),
      );

      return connection;
    },
  }),
});
