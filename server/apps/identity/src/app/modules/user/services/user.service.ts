import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Types } from 'mongoose';

import { AuthorizationCache } from '@common/configuration/authorization-cache.config';
import { CODE_ERROR } from '@common/constants/enum/code-error.enum';
import type { CreateUserRequest } from '@common/interfaces/grpc/identity/v1/identity';

import { RoleService } from '@identity/role/services/role.service';
import { createUserRequestMapper } from '@identity/user/mappers/user-request.mapper';
import { UserRepository } from '@identity/user/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
    private readonly cache: AuthorizationCache,
  ) {}

  async create(data: CreateUserRequest) {
    const existingUser = await this.userRepository.exists(data.email);

    if (existingUser) {
      throw new BadRequestException(CODE_ERROR.USER_ALREADY_EXISTS);
    }

    return this.roleService.withRoleAssignment(data.roles, (roles) => {
      const input = createUserRequestMapper(data, randomUUID(), roles);

      return this.userRepository.create(input);
    });
  }

  getUserByUserId(userId: string) {
    return this.userRepository.getByUserId(userId);
  }

  getAuthProfileByEmail(email: string) {
    return this.userRepository.getAuthProfileByEmail(email);
  }

  getAuthProfileById(profileId: Types.ObjectId) {
    return this.userRepository.getAuthProfileById(profileId);
  }

  async setRoles(userId: string, roles: string[]) {
    const user = await this.roleService.withRoleAssignment(roles, (roleIds) =>
      this.cache.change(this.cache.userKey(userId), () =>
        this.userRepository.setRoles(userId, roleIds),
      ),
    );

    if (!user) {
      throw new NotFoundException(CODE_ERROR.USER_NOT_FOUND);
    }

    return user;
  }
}
