import { readTokenKey } from '@common/configuration/access-token.config';
import { ACCESS_TOKEN_MAX_AGE_SECONDS } from '@common/constants/access-token.constants';
import { envNumber } from '@common/utils/env-number.util';

export class AuthConfiguration {
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
