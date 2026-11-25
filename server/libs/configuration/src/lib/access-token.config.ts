import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
} from '@common/constants/access-token.constants';

export function readTokenKey(name: 'AC_TOKEN_KEY' | 'RF_TOKEN_KEY'): string {
  const key = process.env[name];

  if (!key || Buffer.byteLength(key.trim(), 'utf8') < 32) {
    throw new Error(`${name} must contain at least 32 bytes`);
  }

  return key;
}

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: readTokenKey('AC_TOKEN_KEY'),
        signOptions: {
          algorithm: 'HS256',
          issuer: ACCESS_TOKEN_ISSUER,
          audience: ACCESS_TOKEN_AUDIENCE,
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: ACCESS_TOKEN_ISSUER,
          audience: ACCESS_TOKEN_AUDIENCE,
          maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
        },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AccessTokenModule {}
