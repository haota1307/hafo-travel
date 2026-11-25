import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { MetadataKeys } from '@common/constants/common.constants';

export const ThrottlerProvider = ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    throttlers: [
      {
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'account',
        ttl: 60000,
        limit: 10,
        skipIf: (context) =>
          !Reflect.getMetadata(
            MetadataKeys.LOGIN_THROTTLE,
            context.getHandler(),
          ),
        getTracker: (request) => {
          const email: unknown = request['body']?.email;

          return typeof email === 'string' ? email.trim().toLowerCase() : '';
        },
      },
    ],
    errorMessage: 'Too many requests, please try again later.',
    storage: new ThrottlerStorageRedisService({
      host: configService.get<string>('REDIS_CONFIG.HOST'),
      port: configService.get<number>('REDIS_CONFIG.PORT'),
    }),
  }),
});
