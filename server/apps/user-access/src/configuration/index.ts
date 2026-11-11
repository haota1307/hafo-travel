import { createConfiguration } from '@common/configuration/create-configuration';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseConfiguration } from '@common/configuration/base.config';
import { AppConfiguration } from '@common/configuration/app.config';
import { TcpConfiguration } from '@common/configuration/tcp.config';
import { MongoConfig } from '@common/configuration/mongo.config';

class Configuration extends BaseConfiguration {
  @ValidateNested()
  @Type(() => AppConfiguration)
  APP_CONFIG = new AppConfiguration();

  @ValidateNested()
  @Type(() => TcpConfiguration)
  TCP_SERV = new TcpConfiguration();

  @ValidateNested()
  @Type(() => MongoConfig)
  MONGO_CONFIG = new MongoConfig();
}

export const CONFIGURATION = createConfiguration(Configuration);
export type TConfiguration = typeof CONFIGURATION;
