import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Types } from 'mongoose';

import { CODE_ERROR } from '@common/constants/enum/code-error.enum';
import type { CreateUserRequest } from '@common/interfaces/grpc/identity/v1/identity';

import { RoleService } from '../../role/services/role.service';
import { createUserRequestMapper } from '../mappers/user-request.mapper';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
  ) {}

  async create(data: CreateUserRequest) {
    const existingUser = await this.userRepository.exists(data.email);

    if (existingUser) {
      throw new BadRequestException(CODE_ERROR.USER_ALREADY_EXISTS);
    }

    await this.roleService.resolveRoleIds(data.roles);

    const input = createUserRequestMapper(data, randomUUID());

    return this.userRepository.create(input);
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
    const roleIds = await this.roleService.resolveRoleIds(roles);
    const user = await this.userRepository.setRoles(userId, roleIds);

    if (!user) {
      throw new NotFoundException(CODE_ERROR.USER_NOT_FOUND);
    }

    return user;
  }
}
