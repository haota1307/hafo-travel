import { GrpcConfiguration } from '@common/configuration/grpc.config';
import { createConfiguration } from '@common/configuration/create-configuration';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseConfiguration } from '@common/configuration/base.config';
import { AppConfiguration } from '@common/configuration/app.config';

import { RedisConfiguration } from '@common/configuration/redis.config';
class Configuration extends BaseConfiguration {
  @ValidateNested()
  @Type(() => GrpcConfiguration)
  GRPC_SERV = new GrpcConfiguration();
  @ValidateNested()
  @Type(() => AppConfiguration)
  APP_CONFIG = new AppConfiguration();

  @ValidateNested()
  @Type(() => RedisConfiguration)
  REDIS_CONFIG = new RedisConfiguration();
}

export const CONFIGURATION = createConfiguration(Configuration);
export type TConfiguration = typeof CONFIGURATION;
