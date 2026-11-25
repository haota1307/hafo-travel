import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

import type { BaseConfiguration } from './base.config';

/** Validate after all nested configuration fields have been initialized. */
export function createConfiguration<T extends BaseConfiguration>(
  Configuration: new () => T,
): T {
  if (existsSync('.env')) {
    loadEnvFile('.env');
  }

  const configuration = new Configuration();
  configuration.validate();

  return configuration;
}
