import { randomUUID } from 'node:crypto';

import {
  Injectable,
  Logger,
  Module,
  type OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

const readEntry = `
  local value = redis.call('HGET', KEYS[1], 'value')
  if value then return {value, ''} end
  if redis.call('EXISTS', KEYS[1]) == 0 then
    redis.call('HSET', KEYS[1], 'revision', ARGV[1])
    redis.call('EXPIRE', KEYS[1], ARGV[2])
  end
  return {'', redis.call('HGET', KEYS[1], 'revision') or ''}
`;

const fillEntry = `
  if redis.call('HGET', KEYS[1], 'revision') == ARGV[1] then
    redis.call('HSET', KEYS[1], 'value', ARGV[2])
    redis.call('EXPIRE', KEYS[1], ARGV[3])
  end
`;

const beginChange = `
  redis.call('HDEL', KEYS[1], 'value', 'revision')
  redis.call('HSET', KEYS[1], ARGV[1], 1)
  redis.call('EXPIRE', KEYS[1], ARGV[2])
`;

@Injectable()
export class AuthorizationCache implements OnModuleDestroy {
  private readonly logger = new Logger(AuthorizationCache.name);
  private readonly redis: Redis;
  private readonly ttl: number;

  constructor(config: ConfigService) {
    this.ttl = config.getOrThrow<number>('REDIS_CONFIG.TTL');
    this.redis = new Redis({
      host: config.getOrThrow<string>('REDIS_CONFIG.HOST'),
      port: config.getOrThrow<number>('REDIS_CONFIG.PORT'),
      maxRetriesPerRequest: 1,
      commandTimeout: 1500,
      lazyConnect: true,
    });
  }

  userKey(userId: string) {
    return `authz:v1:user:${userId}`;
  }

  roleKey(roleId: string) {
    return `authz:v1:role:${roleId.toLowerCase()}`;
  }

  async read<T>(key: string, load: () => Promise<T>): Promise<T> {
    let revision: string;

    try {
      const entry = (await this.redis.eval(
        readEntry,
        1,
        key,
        randomUUID(),
        this.ttl,
      )) as [string, string];

      if (entry[0]) {
        return JSON.parse(entry[0]) as T;
      }

      revision = entry[1];
    } catch {
      return load();
    }

    const value = await load();

    if (revision) {
      await this.redis
        .eval(fillEntry, 1, key, revision, JSON.stringify(value), this.ttl)
        .catch(() => undefined);
    }

    return value;
  }

  async change<T>(key: string, write: () => Promise<T>): Promise<T> {
    const writer = randomUUID();

    try {
      await this.redis.eval(beginChange, 1, key, writer, this.ttl);
    } catch {
      throw new ServiceUnavailableException('Authorization cache unavailable');
    }

    try {
      return await write();
    } finally {
      try {
        await this.redis.hdel(key, writer, 'value', 'revision');
      } catch {
        this.logger.warn(
          'Could not clear the authorization cache write marker',
        );
      }
    }
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}

@Module({
  providers: [AuthorizationCache],
  exports: [AuthorizationCache],
})
export class AuthorizationCacheModule {}
