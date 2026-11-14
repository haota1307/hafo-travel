import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { PERMISSION } from '@common/constants/enum/role.enum';
import type { CreateRoleRequest } from '@common/interfaces/grpc/user-access/v1/user-access';

import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  getAll() {
    return this.roleRepository.getAll();
  }

  async getById(id: string) {
    this.validateId(id);
    const role = await this.roleRepository.getById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async create(data: CreateRoleRequest) {
    const input = this.validateInput(data);

    try {
      return await this.roleRepository.create(input);
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async update(id: string, data: CreateRoleRequest) {
    this.validateId(id);
    const input = this.validateInput(data);

    try {
      const role = await this.roleRepository.update(id, input);

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      return role;
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async delete(id: string) {
    this.validateId(id);

    if (await this.roleRepository.isAssigned(id)) {
      throw new ConflictException('Cannot delete a role assigned to a user');
    }

    const role = await this.roleRepository.delete(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }
  }

  async resolveRoleIds(ids: string[]): Promise<Types.ObjectId[]> {
    if (!Array.isArray(ids) || ids.length !== 1) {
      throw new BadRequestException('Exactly one role is required');
    }

    for (const id of ids) {
      this.validateId(id);
    }

    const roles = await this.roleRepository.getByIds(ids);

    if (roles.length !== ids.length) {
      throw new BadRequestException('One or more roles do not exist');
    }

    return ids.map((id) => new Types.ObjectId(id));
  }

  private validateId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid role ID');
    }
  }

  private validateInput(data: CreateRoleRequest) {
    if (
      typeof data.name !== 'string' ||
      !/^[a-z][a-z0-9_-]{0,63}$/.test(data.name)
    ) {
      throw new BadRequestException('Invalid role name');
    }
    if (typeof data.description !== 'string' || data.description.length > 500) {
      throw new BadRequestException('Invalid role description');
    }
    if (
      !Array.isArray(data.permissions) ||
      new Set(data.permissions).size !== data.permissions.length ||
      data.permissions.some(
        (permission) =>
          !Object.values(PERMISSION).includes(permission as PERMISSION),
      )
    ) {
      throw new BadRequestException('Invalid role permissions');
    }

    return {
      name: data.name,
      description: data.description,
      permissions: data.permissions as PERMISSION[],
    };
  }

  private rethrowWriteError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException('Role name already exists');
    }

    throw error;
  }
}
