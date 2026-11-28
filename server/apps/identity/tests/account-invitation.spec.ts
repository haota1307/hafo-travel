import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { InternalUser } from '@common/interfaces/grpc/identity/v1/identity';
import { verifyPassword } from '@common/utils/password.util';

import type { AccountRepository } from '@identity/auth/repositories/account.repository';
import type { AccountEmailService } from '@identity/auth/services/account-email.service';
import { AccountService } from '@identity/auth/services/account.service';
import type { AuthService } from '@identity/auth/services/auth.service';
import type { RoleService } from '@identity/role/services/role.service';
import type { InternalUserService } from '@identity/user/services/internal-user.service';
import type { UserService } from '@identity/user/services/user.service';

describe('internal account invitations', () => {
  const password = 'invitation password test fixture';
  const invitationVersion = 'pending-invitation-version';
  const context = { processId: 'process-invitation' };
  const user = {
    userId: 'user-invitation',
    firstName: 'Invitation',
    lastName: 'User',
    email: 'invited@example.test',
    role: { id: 'role-id', name: 'operations' },
    status: 'pending',
    accessProtected: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } satisfies InternalUser;
  const create = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roles: [user.role.id],
    actorUserId: 'actor-user',
    locale: 'vi',
  };
  const target = {
    userId: user.userId,
    actorUserId: create.actorUserId,
    locale: 'en',
  };
  const accounts = {} as AccountRepository;
  const users = {} as UserService;
  const sessions = {} as AuthService;
  const roles = {} as RoleService;
  const internalUsers = {
    createInvitation: jest.fn().mockResolvedValue({ user, invitationVersion }),
    prepareInvitation: jest.fn().mockResolvedValue({ user, invitationVersion }),
    acceptInvitation: jest.fn<Promise<boolean>, [string, string, string]>(),
  };
  const send = jest.fn<
    Promise<void>,
    Parameters<AccountEmailService['send']>
  >();
  const mail = { send } as unknown as AccountEmailService;
  const configuration = new ConfigService({
    AUTH_CONFIG: { RF_TOKEN_KEY: 'invitation-credential-for-tests' },
  });
  const service = new AccountService(
    accounts,
    users,
    internalUsers as unknown as InternalUserService,
    sessions,
    mail,
    new JwtService(),
    roles,
    configuration,
  );

  function sentToken() {
    const call = send.mock.lastCall;

    if (!call) {
      throw new Error('No invitation was sent');
    }

    return call[2];
  }

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick'] });
    jest.clearAllMocks();
    send.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the saved profile when email delivery is unconfirmed and supports resend', async () => {
    send.mockRejectedValueOnce(new Error('Test notification timeout'));

    await expect(service.inviteInternalUser(create, context)).resolves.toEqual({
      user,
      invitationDelivery: 'unconfirmed',
    });
    expect(internalUsers.createInvitation).toHaveBeenCalledWith(create);
    await expect(
      service.resendInternalUserInvitation(target, context),
    ).resolves.toEqual({
      user,
      invitationDelivery: 'sent',
    });
    expect(internalUsers.prepareInvitation).toHaveBeenCalledWith(target);
    expect(send).toHaveBeenLastCalledWith(
      'accept-invitation',
      user.email,
      sentToken(),
      'en',
      context,
    );
  });

  it('accepts a purpose-bound invitation once, sends a password hash, and rejects an expired link', async () => {
    internalUsers.acceptInvitation
      .mockResolvedValueOnce(true)
      .mockResolvedValue(false);
    await service.inviteInternalUser(create, context);
    const token = sentToken();

    await expect(
      service.resetPassword({ token, password }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.acceptInvitation({ token, password }),
    ).resolves.toEqual({});
    const [id, version, hash] = internalUsers.acceptInvitation.mock.calls[0];

    expect(id).toBe(user.userId);
    expect(version).toBe(invitationVersion);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(
      service.acceptInvitation({ token, password }),
    ).rejects.toBeInstanceOf(BadRequestException);
    jest.advanceTimersByTime(30 * 60 * 1000 + 1000);
    await expect(
      service.acceptInvitation({ token, password }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(internalUsers.acceptInvitation).toHaveBeenCalledTimes(2);
  });
});
