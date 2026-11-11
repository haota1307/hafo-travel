import { createConfiguration } from '@common/configuration/create-configuration';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { AppConfiguration } from '@common/configuration/app.config';

import { BaseConfiguration } from '@common/configuration/base.config';
import { GrpcConfiguration } from '@common/configuration/grpc.config';
import { KeycloakConfiguration } from '@common/configuration/keycloak.config';
class Configuration extends BaseConfiguration {
  @ValidateNested()
  @Type(() => AppConfiguration)
  APP_CONFIG = new AppConfiguration();

  @ValidateNested()
  @Type(() => KeycloakConfiguration)
  KEYCLOAK_CONFIG = new KeycloakConfiguration();

  @ValidateNested()
  @Type(() => GrpcConfiguration)
  GRPC_SERV = new GrpcConfiguration();
}

export const CONFIGURATION = createConfiguration(Configuration);
export type TConfiguration = typeof CONFIGURATION;
