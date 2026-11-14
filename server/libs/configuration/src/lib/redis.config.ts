import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

import { envNumber } from './env-number';

export class RedisConfiguration {
  @IsString()
  @IsNotEmpty()
  HOST: string;

  @IsNumber()
  @IsNotEmpty()
  PORT: number;

  @IsNumber()
  @IsNotEmpty()
  TTL: number;

  constructor(data?: Partial<RedisConfiguration>) {
    this.HOST = data?.HOST || process.env['REDIS_HOST'] || 'localhost';
    this.PORT = envNumber('REDIS_PORT', 6379, data?.PORT, 1, 65535);
    this.TTL = envNumber('REDIS_TTL', 3600, data?.TTL);
  }
}

export const RedisProvider = CacheModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const host = configService.get<string>('REDIS_CONFIG.HOST');
    const port = configService.get<number>('REDIS_CONFIG.PORT');
    const ttl = configService.get<number>('REDIS_CONFIG.TTL');

    return {
      stores: [createKeyv({ url: `redis://${host}:${port}` })],
      ttl,
    };
  },
});
