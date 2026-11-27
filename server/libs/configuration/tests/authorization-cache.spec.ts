import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import { AuthorizationCache } from '../src/lib/authorization-cache.config';

describe('AuthorizationCache mutations', () => {
  let cache: AuthorizationCache;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Redis.prototype, 'eval').mockResolvedValue(undefined);
    jest
      .spyOn(Redis.prototype, 'hdel')
      .mockRejectedValue(new Error('Redis unavailable'));
    cache = new AuthorizationCache(
      new ConfigService({
        REDIS_CONFIG: { HOST: '127.0.0.1', PORT: 6379, TTL: 60 },
      }),
    );
  });

  afterEach(() => {
    cache.onModuleDestroy();
    jest.restoreAllMocks();
  });

  it('preserves the database result when Redis cleanup fails', async () => {
    const key = cache.roleKey('role');

    await expect(cache.change(key, async () => 'saved')).resolves.toBe('saved');
    expect(Redis.prototype.hdel).toHaveBeenCalledWith(
      key,
      expect.any(String),
      'value',
      'revision',
    );
  });

  it('preserves the original database error when Redis cleanup also fails', async () => {
    const error = new Error('Database unavailable');
    const write = jest.fn().mockRejectedValue(error);

    await expect(cache.change(cache.roleKey('role'), write)).rejects.toBe(
      error,
    );
  });
});
