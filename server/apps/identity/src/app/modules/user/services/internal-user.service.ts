import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isEmail } from 'class-validator';
import { Types } from 'mongoose';

import { AuthorizationCache } from '@common/configuration/authorization-cache.config';
import { CODE_ERROR } from '@common/constants/enum/code-error.enum';
import { DASHBOARD_PERMISSIONS } from '@common/constants/enum/role.enum';
import type {
  InternalUserTarget,
  InviteInternalUserRequest,
  SetInternalUserRoleRequest,
  SetInternalUserStatusRequest,
  UpdateInternalUserRequest,
} from '@common/interfaces/grpc/identity/v1/identity';

import { RoleService } from '@identity/role/services/role.service';
import { internalUserProfileMapper } from '@identity/user/mappers/user-profile.mapper';
import {
  InternalUserRepository,
  type InternalUserRecord,
} from '@identity/user/repositories/internal-user.repository';
import { UserRepository } from '@identity/user/repositories/user.repository';

@Injectable()
export class InternalUserService {
  constructor(
    private readonly internalUsers: InternalUserRepository,
    private readonly users: UserRepository,
    private readonly roles: RoleService,
    private readonly cache: AuthorizationCache,
  ) {}

  async list(actorUserId: string) {
    const users = await this.internalUsers.list();

    return users.map((user) => internalUserProfileMapper(user, actorUserId));
  }

  async get({ userId, actorUserId }: InternalUserTarget) {
    return internalUserProfileMapper(await this.find(userId), actorUserId);
  }

  async createInvitation(input: InviteInternalUserRequest) {
    const name = this.validateName(input);
    const email = input.email.trim().toLowerCase();

    if (!isEmail(email) || email.length > 254) {
      throw new BadRequestException('Invalid email');
    }
    if (await this.users.existsInsensitive(email)) {
      throw new ConflictException(CODE_ERROR.USER_ALREADY_EXISTS);
    }

    const userId = randomUUID();
    const invitationVersion = randomUUID();

    try {
      const user = await this.roles.withRoleAssignment(
        input.roles,
        async (roles, role) => {
          this.requireDashboardRole(role.permissions);
          const user = await this.users.create({
            ...name,
            email,
            userId,
            roles,
            invitationVersion,
          });

          return internalUserProfileMapper(
            {
              ...name,
              email,
              userId,
              role,
              status: 'pending',
              initialAdministrator: false,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            input.actorUserId,
          );
        },
      );

      return { user, invitationVersion };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException(CODE_ERROR.USER_ALREADY_EXISTS);
      }

      throw error;
    }
  }

  async prepareInvitation(target: InternalUserTarget) {
    return this.withCurrentRole(target.userId, async (current) => {
      const pending = await this.internalUsers.prepareInvitation(
        current.userId,
        current.role._id,
        randomUUID(),
      );

      if (!pending?.invitationVersion) {
        throw new ConflictException(
          'An invitation requires an unlocked account without a sign-in method',
        );
      }

      return {
        user: await this.get(target),
        invitationVersion: pending.invitationVersion,
      };
    });
  }

  async acceptInvitation(
    userId: string,
    invitationVersion: string,
    passwordHash: string,
  ) {
    try {
      return await this.withCurrentRole(userId, (user) =>
        this.internalUsers.acceptInvitation({
          userId,
          roleId: user.role._id,
          invitationVersion,
          passwordHash,
        }),
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        return false;
      }

      throw error;
    }
  }

  async updateName(input: UpdateInternalUserRequest) {
    const name = this.validateName(input);

    return this.withCurrentRole(input.userId, async (current) => {
      const result = await this.internalUsers.updateName(
        current.userId,
        current.role._id,
        name,
      );

      if (!result.matchedCount) {
        throw new ConflictException('Account changed. Reload and try again.');
      }

      return this.get(input);
    });
  }

  async setRole(input: SetInternalUserRoleRequest) {
    if (input.roles.length !== 1 || !Types.ObjectId.isValid(input.roles[0])) {
      throw new BadRequestException('Exactly one valid role is required');
    }

    const [roleId] = input.roles;

    return this.withCurrentRole(
      input.userId,
      async (current) => {
        this.requireAccessChange(current, input.actorUserId);
        const role = await this.roles.getById(roleId);
        this.requireDashboardRole(role.permissions);

        if (current.role._id.equals(role._id)) {
          return internalUserProfileMapper(current, input.actorUserId);
        }

        const result = await this.cache.change(
          this.cache.userKey(input.userId),
          () =>
            this.internalUsers.setRole(
              input.userId,
              current.role._id,
              role._id,
            ),
        );

        if (!result.matchedCount) {
          throw new ConflictException('Account changed. Reload and try again.');
        }

        return this.get(input);
      },
      roleId,
    );
  }

  async setStatus(input: SetInternalUserStatusRequest) {
    return this.withCurrentRole(input.userId, async (current) => {
      this.requireAccessChange(current, input.actorUserId);

      if ((current.status === 'locked') === input.locked) {
        return internalUserProfileMapper(current, input.actorUserId);
      }

      const result = await this.cache.change(
        this.cache.userKey(input.userId),
        () =>
          this.internalUsers.setLocked(
            input.userId,
            current.role._id,
            input.locked,
            randomUUID(),
          ),
      );

      if (!result.matchedCount) {
        throw new ConflictException('Account changed. Reload and try again.');
      }

      return this.get(input);
    });
  }

  private async find(userId: string) {
    const user = userId.trim()
      ? await this.internalUsers.get(userId)
      : undefined;

    if (!user) {
      throw new NotFoundException(CODE_ERROR.USER_NOT_FOUND);
    }

    return user;
  }

  private async withCurrentRole<T>(
    userId: string,
    operation: (user: InternalUserRecord) => Promise<T>,
    additionalRoleId?: string,
  ) {
    const current = await this.find(userId);
    const roleIds = [current.role._id.toHexString()];

    if (additionalRoleId) {
      roleIds.push(additionalRoleId);
    }

    return this.roles.withRoleLocks(roleIds, async () => {
      const user = await this.find(userId);

      if (!current.role._id.equals(user.role._id)) {
        throw new ConflictException('Account changed. Reload and try again.');
      }

      return operation(user);
    });
  }

  private validateName(input: { firstName: string; lastName: string }) {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    if (
      !firstName ||
      !lastName ||
      firstName.length > 100 ||
      lastName.length > 100
    ) {
      throw new BadRequestException('Invalid account name');
    }

    return { firstName, lastName };
  }

  private requireDashboardRole(permissions: typeof DASHBOARD_PERMISSIONS) {
    if (
      !permissions.some((permission) =>
        DASHBOARD_PERMISSIONS.includes(permission),
      )
    ) {
      throw new BadRequestException(
        'The role must grant access to a dashboard page',
      );
    }
  }

  private requireAccessChange(user: InternalUserRecord, actorUserId: string) {
    if (
      !actorUserId ||
      user.userId === actorUserId ||
      user.initialAdministrator
    ) {
      throw new ForbiddenException('Cannot change this account access');
    }
  }
}
