import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { AppConfiguration } from '@common/configuration/app.config';
import { BaseConfiguration } from '@common/configuration/base.config';
import { createConfiguration } from '@common/configuration/create-configuration';
import { GrpcConfiguration } from '@common/configuration/grpc.config';
import { TypeOrmConfiguration } from '@common/configuration/type-orm.config';

class Configuration extends BaseConfiguration {
  @ValidateNested()
  @Type(() => GrpcConfiguration)
  GRPC_SERV = new GrpcConfiguration();

  @ValidateNested()
  @Type(() => AppConfiguration)
  APP_CONFIG = new AppConfiguration();

  @ValidateNested()
  @Type(() => TypeOrmConfiguration)
  TYPEORM_CONFIG = new TypeOrmConfiguration({
    DATABASE: process.env['PAYMENT_POSTGRES_DATABASE'] || 'payment',
  });
}

export const CONFIGURATION = createConfiguration(Configuration);
export type TConfiguration = typeof CONFIGURATION;
