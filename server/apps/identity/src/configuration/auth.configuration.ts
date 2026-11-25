import { IsOptional, IsString } from 'class-validator';

import { readTokenKey } from '@common/configuration/access-token.config';
import { ACCESS_TOKEN_MAX_AGE_SECONDS } from '@common/constants/access-token.constants';
import { envNumber } from '@common/utils/env-number.util';

export class AuthConfiguration {
  @IsString()
  readonly PUBLIC_ORIGIN =
    process.env['AUTH_PUBLIC_ORIGIN'] ||
    (process.env['NODE_ENV'] === 'production' ? '' : 'http://localhost:3000');
  @IsOptional()
  @IsString()
  readonly GOOGLE_CLIENT_ID = process.env['GOOGLE_CLIENT_ID']?.trim();
  readonly RF_TOKEN_KEY = readTokenKey('RF_TOKEN_KEY');
  readonly ACCESS_TTL_SECONDS = Math.min(
    ACCESS_TOKEN_MAX_AGE_SECONDS,
    envNumber(
      'AUTH_ACCESS_TTL_SECONDS',
      ACCESS_TOKEN_MAX_AGE_SECONDS,
      undefined,
      1,
      31_536_000,
    ),
  );
  readonly REFRESH_TTL_SECONDS = envNumber(
    'AUTH_REFRESH_TTL_SECONDS',
    604_800,
    undefined,
    2,
    31_536_000,
  );

  constructor() {
    if (this.PUBLIC_ORIGIN) {
      const origin = new URL(this.PUBLIC_ORIGIN);
      const protocols =
        process.env['NODE_ENV'] === 'production'
          ? ['https:']
          : ['https:', 'http:'];

      if (
        !protocols.includes(origin.protocol) ||
        origin.username ||
        origin.password ||
        origin.search ||
        origin.hash ||
        origin.pathname !== '/'
      ) {
        throw new Error('AUTH_PUBLIC_ORIGIN must be the public web origin');
      }
    }

    if (this.RF_TOKEN_KEY === readTokenKey('AC_TOKEN_KEY')) {
      throw new Error('AC_TOKEN_KEY and RF_TOKEN_KEY must be different');
    }

    if (this.REFRESH_TTL_SECONDS <= this.ACCESS_TTL_SECONDS) {
      throw new Error(
        'AUTH_REFRESH_TTL_SECONDS must exceed AUTH_ACCESS_TTL_SECONDS',
      );
    }
  }
}
