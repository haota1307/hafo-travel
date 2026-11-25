import { createHash, randomUUID } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_AUDIENCE,
  REFRESH_TOKEN_MAX_LENGTH,
  REFRESH_TOKEN_USE,
} from '@common/constants/access-token.constants';
import { CODE_ERROR } from '@common/constants/enum/code-error.enum';
import type {
  AuthTokenPair,
  LoginRequest,
} from '@common/interfaces/grpc/identity/v1/identity';
import type { UserWithRoles } from '@common/schemas/user.schema';
import {
  isLoginPasswordValid,
  verifyPassword,
} from '@common/utils/password.util';

import type { AuthConfiguration } from '../../../../configuration/auth.configuration';
import { UserService } from '../../user/services/user.service';
import { AuthSessionRepository } from '../repositories/auth.repository';

const MAX_EMAIL_LENGTH = 254;
const MILLISECONDS_PER_SECOND = 1000;

@Injectable()
export class AuthService {
  private readonly config: AuthConfiguration;

  constructor(
    private readonly users: UserService,
    private readonly sessions: AuthSessionRepository,
    private readonly jwt: JwtService,
    configuration: ConfigService,
  ) {
    this.config = configuration.getOrThrow<AuthConfiguration>('AUTH_CONFIG');
  }

  async login({ email, password }: LoginRequest): Promise<AuthTokenPair> {
    const normalizedEmail = typeof email === 'string' ? email.trim() : '';

    if (
      !normalizedEmail ||
      normalizedEmail.length > MAX_EMAIL_LENGTH ||
      !isLoginPasswordValid(password)
    ) {
      throw new UnauthorizedException(CODE_ERROR.INVALID_CREDENTIALS);
    }

    const profileLookupStartedAt = Date.now();
    const user = await this.users.getAuthProfileByEmail(normalizedEmail);
    const matches = await verifyPassword(password, user?.passwordHash);

    if (!matches) {
      throw new UnauthorizedException(CODE_ERROR.INVALID_CREDENTIALS);
    }

    return this.startSession(user, profileLookupStartedAt);
  }

  async startSession(
    user: UserWithRoles | null,
    profileLookupStartedAt: number,
  ): Promise<AuthTokenPair> {
    if (!this.hasValidRole(user)) {
      throw new UnauthorizedException(CODE_ERROR.INVALID_CREDENTIALS);
    }

    const now = new Date();
    const refreshExpiresAt = new Date(
      now.getTime() + this.config.REFRESH_TTL_SECONDS * MILLISECONDS_PER_SECOND,
    );
    const pair = await this.createTokens(
      user,
      profileLookupStartedAt,
      refreshExpiresAt,
    );

    await this.sessions.create({
      profileId: user._id,
      ...(user.credentialVersion && {
        credentialVersion: user.credentialVersion,
      }),
      refreshHash: this.hashRefreshToken(pair.refreshToken),
      refreshExpiresAt,
    });

    return pair;
  }

  async refreshSession(refreshToken: string): Promise<AuthTokenPair> {
    if (!(await this.isValidRefreshToken(refreshToken))) {
      throw new UnauthorizedException(CODE_ERROR.UNAUTHORIZED);
    }

    const refreshHash = this.hashRefreshToken(refreshToken);
    const session = await this.sessions.getByRefreshHash(
      refreshHash,
      new Date(),
    );

    if (!session) {
      throw new UnauthorizedException(CODE_ERROR.UNAUTHORIZED);
    }

    const profileLookupStartedAt = Date.now();
    const user = await this.users.getAuthProfileById(session.profileId);

    if (
      !this.hasValidRole(user) ||
      session.credentialVersion !== user.credentialVersion
    ) {
      throw new UnauthorizedException(CODE_ERROR.UNAUTHORIZED);
    }

    const pair = await this.createTokens(
      user,
      profileLookupStartedAt,
      session.refreshExpiresAt,
    );
    const rotated = await this.sessions.rotate(
      session._id,
      refreshHash,
      this.hashRefreshToken(pair.refreshToken),
      new Date(),
    );

    if (!rotated) {
      throw new UnauthorizedException(CODE_ERROR.UNAUTHORIZED);
    }

    return pair;
  }

  async logout(refreshToken: string): Promise<void> {
    if (await this.isValidRefreshToken(refreshToken)) {
      await this.sessions.deleteByRefreshHash(
        this.hashRefreshToken(refreshToken),
        new Date(),
      );
    }
  }

  private hasValidRole(user: UserWithRoles | null): user is UserWithRoles {
    return !!(
      user?.userId?.trim() &&
      user.roles.length === 1 &&
      user.roles[0]?.id
    );
  }

  private async createTokens(
    user: UserWithRoles,
    profileLookupStartedAt: number,
    refreshExpiresAt: Date,
  ): Promise<AuthTokenPair> {
    const issuedAt = Math.floor(Date.now() / MILLISECONDS_PER_SECOND);
    const refreshExpiration = Math.floor(
      refreshExpiresAt.getTime() / MILLISECONDS_PER_SECOND,
    );
    const profileExpiration =
      Math.floor(profileLookupStartedAt / MILLISECONDS_PER_SECOND) +
      ACCESS_TOKEN_MAX_AGE_SECONDS;
    const accessExpiration = Math.min(
      issuedAt + this.config.ACCESS_TTL_SECONDS,
      refreshExpiration,
      profileExpiration,
    );

    if (accessExpiration <= issuedAt) {
      throw new UnauthorizedException(CODE_ERROR.UNAUTHORIZED);
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        {
          sub: user.userId,
          profileId: user._id.toHexString(),
          roleId: user.roles[0].id,
          jti: randomUUID(),
          iat: issuedAt,
        },
        { expiresIn: accessExpiration - issuedAt },
      ),
      this.jwt.signAsync(
        {
          tokenUse: REFRESH_TOKEN_USE,
          jti: randomUUID(),
          iat: issuedAt,
          exp: refreshExpiration,
        },
        {
          secret: this.config.RF_TOKEN_KEY,
          algorithm: 'HS256',
          audience: REFRESH_TOKEN_AUDIENCE,
        },
      ),
    ]);
    const signedAt = Math.floor(Date.now() / MILLISECONDS_PER_SECOND);

    if (accessExpiration <= signedAt) {
      throw new UnauthorizedException(CODE_ERROR.UNAUTHORIZED);
    }

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: accessExpiration - signedAt,
      refreshExpiresIn: refreshExpiration - signedAt,
    };
  }

  private async isValidRefreshToken(token: string): Promise<boolean> {
    if (
      typeof token !== 'string' ||
      !token ||
      token.length > REFRESH_TOKEN_MAX_LENGTH
    ) {
      return false;
    }

    try {
      const claims = await this.jwt.verifyAsync<Record<string, unknown>>(
        token,
        {
          secret: this.config.RF_TOKEN_KEY,
          algorithms: ['HS256'],
          audience: REFRESH_TOKEN_AUDIENCE,
          maxAge: undefined,
        },
      );

      return (
        claims.aud === REFRESH_TOKEN_AUDIENCE &&
        claims.tokenUse === REFRESH_TOKEN_USE &&
        typeof claims.jti === 'string' &&
        !!claims.jti &&
        Number.isSafeInteger(claims.exp)
      );
    } catch {
      return false;
    }
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
