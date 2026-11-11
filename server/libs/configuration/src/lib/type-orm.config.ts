import { envNumber } from './env-number';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DatabaseType } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export class TypeOrmConfiguration {
  @IsNotEmpty()
  @IsString()
  HOST: string;

  @IsNotEmpty()
  @IsNumber()
  PORT: number;

  @IsNotEmpty()
  @IsString()
  USERNAME: string;

  @IsNotEmpty()
  @IsString()
  PASSWORD: string;

  @IsNotEmpty()
  @IsString()
  DATABASE: string;

  @IsNotEmpty()
  @IsString()
  TYPE: DatabaseType;

  constructor(data?: Partial<TypeOrmConfiguration>) {
    this.HOST = data?.HOST || process.env['TYPEORM_HOST'] || 'localhost';
    this.PORT = envNumber('TYPEORM_PORT', 5432, data?.PORT, 1, 65535);
    this.USERNAME =
      data?.USERNAME || process.env['TYPEORM_USERNAME'] || 'postgres';
    this.PASSWORD =
      data?.PASSWORD || process.env['TYPEORM_PASSWORD'] || 'password';
    this.DATABASE =
      data?.DATABASE || process.env['TYPEORM_DATABASE'] || 'backend_app';
    this.TYPE =
      data?.TYPE || (process.env['TYPEORM_TYPE'] as DatabaseType) || 'postgres';
  }
}

export const TypeOrmProviders = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    return {
      type: configService.get<string>('TYPEORM_CONFIG.TYPE') as DatabaseType,
      host: configService.get<string>('TYPEORM_CONFIG.HOST'),
      port: configService.get<number>('TYPEORM_CONFIG.PORT'),
      username: configService.get<string>('TYPEORM_CONFIG.USERNAME'),
      password: configService.get<string>('TYPEORM_CONFIG.PASSWORD'),
      database: configService.get<string>('TYPEORM_CONFIG.DATABASE'),
      synchronize: false,
      autoLoadEntities: true,
    } as TypeOrmModuleOptions;
  },
});
