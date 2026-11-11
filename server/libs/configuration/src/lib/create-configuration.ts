import { BaseConfiguration } from './base.config';

/** Validate after all nested configuration fields have been initialized. */
export function createConfiguration<T extends BaseConfiguration>(
  Configuration: new () => T,
): T {
  const configuration = new Configuration();
  configuration.validate();

  return configuration;
}
