import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { LoginTicket, OAuth2Client } from 'google-auth-library';

import { AccountRepository } from '@identity/auth/repositories/account.repository';
import { AccountEmailService } from '@identity/auth/services/account-email.service';
import { AccountService } from '@identity/auth/services/account.service';
import { AuthService } from '@identity/auth/services/auth.service';
import { UserService } from '@identity/user/services/user.service';

describe('Google sign-in', () => {
  const accounts = {
    byGoogleSubject: jest.fn(),
    existingEmail: jest.fn(),
    linkRegisteredAccount: jest.fn(),
    createClient: jest.fn(),
  };
  const startSession = jest.fn();
  const send = jest.fn();
  const registered = { userId: 'existing', roles: [{ name: 'client' }] };
  const profile = {
    iss: 'https://accounts.google.com',
    aud: 'web-client',
    sub: 'google-user',
    email: 'Guest@gmail.com',
    email_verified: true,
    iat: 1,
    exp: 2,
  };
  let module: TestingModule;
  let service: AccountService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: AccountRepository, useValue: accounts },
        { provide: AuthService, useValue: { startSession } },
        { provide: AccountEmailService, useValue: { send } },
        { provide: UserService, useValue: {} },
        {
          provide: JwtService,
          useValue: { signAsync: async () => 'confirmation' },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => ({
              GOOGLE_CLIENT_ID: profile.aud,
              RF_TOKEN_KEY: 'fixture',
            }),
          },
        },
      ],
    }).compile();
    service = module.get(AccountService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(OAuth2Client.prototype, 'verifyIdToken')
      .mockImplementation(async () => new LoginTicket(undefined, profile));
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });

  function login() {
    return service.googleLogin({ credential: 'verified-by-test-double' }, {});
  }

  it('links the verified password account and starts its existing profile session', async () => {
    accounts.existingEmail.mockResolvedValue(true);
    accounts.linkRegisteredAccount.mockResolvedValue(registered);
    await login();

    expect(accounts.linkRegisteredAccount).toHaveBeenCalledWith(
      'guest@gmail.com',
      profile.sub,
    );
    expect(accounts.createClient).not.toHaveBeenCalled();
    expect(startSession).toHaveBeenCalledWith(registered, expect.any(Number));
  });

  it('creates a client for a new email and uses the subject on later logins', async () => {
    accounts.createClient.mockResolvedValue(registered);
    await login();
    accounts.byGoogleSubject.mockResolvedValue(registered);
    await login();

    expect(accounts.createClient).toHaveBeenCalledTimes(1);
    expect(accounts.createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'guest@gmail.com',
        googleSubject: profile.sub,
      }),
    );
    expect(accounts.linkRegisteredAccount).not.toHaveBeenCalled();
    expect(startSession).toHaveBeenCalledTimes(2);
  });

  it('keeps an ineligible or already linked account intact', async () => {
    accounts.existingEmail.mockResolvedValue(true);
    accounts.linkRegisteredAccount.mockResolvedValue(null);
    await expect(login()).rejects.toBeInstanceOf(ConflictException);
    expect(startSession).not.toHaveBeenCalled();
    expect(accounts.createClient).not.toHaveBeenCalled();
  });

  it('checks third-party email ownership before linking or creating', async () => {
    jest
      .spyOn(OAuth2Client.prototype, 'verifyIdToken')
      .mockImplementation(
        async () =>
          new LoginTicket(undefined, {
            ...profile,
            email: 'guest@example.org',
          }),
      );
    await expect(login()).rejects.toBeInstanceOf(ForbiddenException);
    expect(send).toHaveBeenCalledTimes(1);
    expect(accounts.linkRegisteredAccount).not.toHaveBeenCalled();
    expect(accounts.createClient).not.toHaveBeenCalled();
    expect(startSession).not.toHaveBeenCalled();
  });
});
