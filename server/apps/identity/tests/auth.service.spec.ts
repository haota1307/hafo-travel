import { createHash, randomBytes } from 'node:crypto';

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { AccessTokenModule } from '@common/configuration/access-token.config';
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_AUDIENCE,
  REFRESH_TOKEN_USE,
} from '@common/constants/access-token.constants';
import { PERMISSION } from '@common/constants/enum/role.enum';
import type { UserWithRoles } from '@common/schemas/user.schema';
import { hashPassword } from '@common/utils/password.util';

import type { AuthSessionRepository } from '@identity/auth/repositories/auth.repository';
import { AuthService } from '@identity/auth/services/auth.service';
import type { UserService } from '@identity/user/services/user.service';

const EMAIL = 'ExactCase@example.test';
const PASSWORD = 'long fixture password ';
const ACCESS_TTL_SECONDS = 60;
const REFRESH_TTL_SECONDS = 600;
const ACCESS_TOKEN_KEY = randomBytes(32).toString('base64url');
const REFRESH_TOKEN_KEY = randomBytes(32).toString('base64url');
const REFRESH_SIGN_OPTIONS = {
  audience: REFRESH_TOKEN_AUDIENCE,
  secret: REFRESH_TOKEN_KEY,
};
const REFRESH_VERIFY_OPTIONS = {
  ...REFRESH_SIGN_OPTIONS,
  maxAge: undefined,
};

type StoredSession = Parameters<AuthSessionRepository['create']>[0] & {
  _id: Types.ObjectId;
};

function digest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

describe('AuthService', () => {
  const profileId = new Types.ObjectId();
  const roleId = new Types.ObjectId();
  const sessionId = new Types.ObjectId();
  let user: UserWithRoles;
  let jwt: JwtService;
  let jwtModule: TestingModule;
  let stored: StoredSession | null;
  let service: AuthService;
  const users = {
    getAuthProfileByEmail: jest.fn(async (email: string) =>
      email === EMAIL ? user : null,
    ),
    getAuthProfileById: jest.fn(async (id: Types.ObjectId) =>
      id.equals(profileId) ? user : null,
    ),
  };
  const sessions = {
    create: jest.fn(
      async (data: Parameters<AuthSessionRepository['create']>[0]) => {
        stored = { ...data, _id: sessionId };

        return stored;
      },
    ),
    getByRefreshHash: jest.fn(async (hash: string, now: Date) =>
      stored?.refreshHash === hash && stored.refreshExpiresAt > now
        ? stored
        : null,
    ),
    rotate: jest.fn(
      async (
        ...[id, hash, nextRefreshHash, now]: Parameters<
          AuthSessionRepository['rotate']
        >
      ) => {
        if (
          !stored ||
          !stored._id.equals(id) ||
          stored.refreshHash !== hash ||
          stored.refreshExpiresAt <= now
        ) {
          return false;
        }

        stored = { ...stored, refreshHash: nextRefreshHash };

        return true;
      },
    ),
    deleteByRefreshHash: jest.fn(async (hash: string) => {
      if (stored?.refreshHash === hash) {
        stored = null;
      }
    }),
  };

  beforeAll(async () => {
    const env = jest.replaceProperty(process, 'env', {
      AC_TOKEN_KEY: ACCESS_TOKEN_KEY,
    });

    try {
      jwtModule = await Test.createTestingModule({
        imports: [AccessTokenModule],
      }).compile();
      jwt = jwtModule.get(JwtService);
    } finally {
      env.restore();
    }

    const now = new Date();
    user = {
      _id: profileId,
      id: profileId.toString(),
      userId: 'fixture-user',
      email: EMAIL,
      firstName: 'Fixture',
      lastName: 'User',
      passwordHash: await hashPassword(PASSWORD),
      createdAt: now,
      updatedAt: now,
      roles: [
        {
          _id: roleId,
          id: roleId.toString(),
          name: 'fixture-role',
          description: 'Fixture',
          permissions: [PERMISSION.ROLE_GET_ALL],
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
  });

  beforeEach(() => {
    stored = null;
    jest.clearAllMocks();
    jest.useFakeTimers({
      now: new Date('2026-01-01T00:00:00Z'),
      doNotFake: ['nextTick'],
    });
    const configuration = new ConfigService({
      AUTH_CONFIG: {
        ACCESS_TTL_SECONDS,
        REFRESH_TTL_SECONDS,
        RF_TOKEN_KEY: REFRESH_TOKEN_KEY,
      },
    });
    service = new AuthService(
      users as unknown as UserService,
      sessions as unknown as AuthSessionRepository,
      jwt,
      configuration,
    );
  });

  afterAll(async () => {
    await jwtModule?.close();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('signs access claims for the exact trimmed email and stores only the refresh digest', async () => {
    const result = await service.login({
      email: ` ${EMAIL} `,
      password: PASSWORD,
    });

    expect(result).toMatchObject({
      accessExpiresIn: ACCESS_TTL_SECONDS,
      refreshExpiresIn: REFRESH_TTL_SECONDS,
    });
    expect(stored).toEqual({
      _id: sessionId,
      profileId,
      refreshHash: digest(result.refreshToken),
      refreshExpiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
    });
    const accessClaims = {
      sub: user.userId,
      profileId: profileId.toHexString(),
      roleId: roleId.toHexString(),
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + ACCESS_TTL_SECONDS,
    };
    const claims = await jwt.verifyAsync(result.accessToken);
    expect(claims).toEqual({
      ...accessClaims,
      jti: expect.any(String),
      iss: ACCESS_TOKEN_ISSUER,
      aud: ACCESS_TOKEN_AUDIENCE,
    });
    await expect(
      jwt.verifyAsync(result.refreshToken, REFRESH_VERIFY_OPTIONS),
    ).resolves.toEqual({
      tokenUse: REFRESH_TOKEN_USE,
      jti: expect.any(String),
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + REFRESH_TTL_SECONDS,
      iss: ACCESS_TOKEN_ISSUER,
      aud: REFRESH_TOKEN_AUDIENCE,
    });
    const accessSignedWithRefreshKey = await jwt.signAsync(
      { ...accessClaims, jti: 'fixture-access-id' },
      { secret: REFRESH_TOKEN_KEY },
    );
    await expect(jwt.verifyAsync(accessSignedWithRefreshKey)).rejects.toThrow(
      'invalid signature',
    );
    await expect(
      jwt.verifyAsync(result.refreshToken, {
        ...REFRESH_VERIFY_OPTIONS,
        secret: ACCESS_TOKEN_KEY,
      }),
    ).rejects.toThrow('invalid signature');
  });

  it.each([
    [EMAIL.toLowerCase(), PASSWORD],
    [EMAIL, PASSWORD.trimEnd()],
    ['unknown@example.test', PASSWORD],
  ])(
    'rejects invalid credentials with a generic error',
    async (email, password) => {
      await expect(service.login({ email, password })).rejects.toMatchObject({
        message: 'INVALID_CREDENTIALS',
      });
      expect(sessions.create).not.toHaveBeenCalled();
    },
  );

  it('rejects refresh sessions issued before the password changed', async () => {
    const initial = await service.login({ email: EMAIL, password: PASSWORD });
    const original = user;

    try {
      user = { ...original, credentialVersion: 'changed' };

      await expect(
        service.refreshSession(initial.refreshToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessions.rotate).not.toHaveBeenCalled();

      const current = await service.login({ email: EMAIL, password: PASSWORD });
      await expect(
        service.refreshSession(current.refreshToken),
      ).resolves.toHaveProperty('accessToken');
    } finally {
      user = original;
    }
  });

  it('allows only one refresh winner and keeps the absolute session expiry', async () => {
    const initial = await service.login({ email: EMAIL, password: PASSWORD });
    const elapsedSeconds = ACCESS_TOKEN_MAX_AGE_SECONDS + 1;
    jest.advanceTimersByTime(elapsedSeconds * 1000);

    await expect(jwt.verifyAsync(initial.accessToken)).rejects.toMatchObject({
      name: 'TokenExpiredError',
    });
    const results = await Promise.allSettled([
      service.refreshSession(initial.refreshToken),
      service.refreshSession(initial.refreshToken),
    ]);

    const fulfilled = results.find((result) => result.status === 'fulfilled');
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(fulfilled?.value.refreshExpiresIn).toBe(
      REFRESH_TTL_SECONDS - elapsedSeconds,
    );
    await expect(
      service.refreshSession(initial.refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    if (!fulfilled) {
      throw new Error('Refresh did not return a new token pair');
    }

    await expect(
      jwt.verifyAsync(fulfilled.value.accessToken),
    ).resolves.toHaveProperty('sub', user.userId);
    expect(fulfilled.value.refreshToken).not.toBe(initial.refreshToken);
    const initialClaims = await jwt.verifyAsync(
      initial.refreshToken,
      REFRESH_VERIFY_OPTIONS,
    );
    const rotatedClaims = await jwt.verifyAsync(
      fulfilled.value.refreshToken,
      REFRESH_VERIFY_OPTIONS,
    );
    expect(rotatedClaims.exp).toBe(initialClaims.exp);
    expect(rotatedClaims.jti).not.toBe(initialClaims.jti);
    expect(users.getAuthProfileById).toHaveBeenCalledWith(profileId);
    jest.advanceTimersByTime((REFRESH_TTL_SECONDS - elapsedSeconds) * 1000);
    sessions.getByRefreshHash.mockClear();

    await expect(
      service.refreshSession(fulfilled.value.refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.getByRefreshHash).not.toHaveBeenCalled();
  });

  it('validates the refresh token audience, purpose and signature before reading or deleting sessions', async () => {
    const exp = Date.now() / 1000 + REFRESH_TTL_SECONDS;
    const refreshClaims = {
      tokenUse: REFRESH_TOKEN_USE,
      jti: 'fixture-id',
      exp,
    };
    const invalidTokens = await Promise.all([
      randomBytes(32).toString('base64url'),
      jwt.signAsync(
        { ...refreshClaims, tokenUse: 'access' },
        REFRESH_SIGN_OPTIONS,
      ),
      jwt.signAsync(refreshClaims, {
        ...REFRESH_SIGN_OPTIONS,
        audience: ACCESS_TOKEN_AUDIENCE,
      }),
      jwt.signAsync(refreshClaims, {
        ...REFRESH_SIGN_OPTIONS,
        audience: [REFRESH_TOKEN_AUDIENCE, ACCESS_TOKEN_AUDIENCE],
      }),
      jwt.signAsync(refreshClaims, {
        audience: REFRESH_TOKEN_AUDIENCE,
      }),
    ]);

    for (const token of invalidTokens) {
      await expect(service.refreshSession(token)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      await service.logout(token);
    }

    expect(sessions.getByRefreshHash).not.toHaveBeenCalled();
    expect(sessions.deleteByRefreshHash).not.toHaveBeenCalled();
  });

  it('bounds access tokens to five minutes from when the profile lookup starts', async () => {
    const lookupStartedAt = Date.now() / 1000;
    users.getAuthProfileByEmail.mockImplementationOnce(async () => {
      jest.advanceTimersByTime((ACCESS_TOKEN_MAX_AGE_SECONDS - 2) * 1000);

      return user;
    });

    const result = await service.login({ email: EMAIL, password: PASSWORD });

    expect(result.accessExpiresIn).toBe(2);
    await expect(jwt.verifyAsync(result.accessToken)).resolves.toMatchObject({
      iat: lookupStartedAt + ACCESS_TOKEN_MAX_AGE_SECONDS - 2,
      exp: lookupStartedAt + ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
  });

  it('revokes refresh on logout while signed access remains valid until expiry', async () => {
    const initial = await service.login({ email: EMAIL, password: PASSWORD });
    const rotated = await service.refreshSession(initial.refreshToken);

    expect(rotated.accessToken).not.toBe(initial.accessToken);
    await service.logout(rotated.refreshToken);
    await service.logout(rotated.refreshToken);

    await expect(jwt.verifyAsync(initial.accessToken)).resolves.toHaveProperty(
      'sub',
      user.userId,
    );
    await expect(jwt.verifyAsync(rotated.accessToken)).resolves.toHaveProperty(
      'sub',
      user.userId,
    );
    await expect(
      service.refreshSession(rotated.refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
