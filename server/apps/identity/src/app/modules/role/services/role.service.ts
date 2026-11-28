import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { AuthorizationCache } from '@common/configuration/authorization-cache.config';
import { PERMISSION } from '@common/constants/enum/role.enum';
import type { CreateRoleRequest } from '@common/interfaces/grpc/identity/v1/identity';
import type { Role } from '@common/schemas/role.schema';

import { RoleRepository } from '@identity/role/repositories/role.repository';

@Injectable()
export class RoleService {
  private readonly roleWrites = new Map<string, Promise<void>>();

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly cache: AuthorizationCache,
  ) {}

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
      const role = await this.withRoleWrite(id, () =>
        this.cache.change(this.cache.roleKey(id), () =>
          this.roleRepository.update(id, input),
        ),
      );

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

    const role = await this.withRoleWrite(id, async () => {
      if (await this.roleRepository.isAssigned(id)) {
        throw new ConflictException('Cannot delete a role assigned to a user');
      }

      return this.cache.change(this.cache.roleKey(id), () =>
        this.roleRepository.delete(id),
      );
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }
  }

  async withRoleAssignment<T>(
    ids: string[],
    assign: (roleIds: [Types.ObjectId], role: Role) => Promise<T>,
  ): Promise<T> {
    if (!Array.isArray(ids) || ids.length !== 1) {
      throw new BadRequestException('Exactly one role is required');
    }

    const [id] = ids;
    this.validateId(id);

    return this.withRoleWrite(id, async () => {
      const role = await this.roleRepository.getById(id);

      if (!role) {
        throw new BadRequestException('One or more roles do not exist');
      }

      return assign([role._id], role);
    });
  }

  withRoleLocks<T>(ids: string[], operation: () => Promise<T>) {
    const keys = [...new Set(ids.map((id) => id.toLowerCase()))].sort();
    const run = keys.reduceRight(
      (next, key) => () => this.withRoleWrite(key, next),
      operation,
    );

    return run();
  }

  async withClientRoleAssignment<T>(
    assign: (roleIds: [Types.ObjectId]) => Promise<T>,
  ): Promise<T> {
    const role = await this.roleRepository.getByName('client');

    if (!role) {
      throw new ServiceUnavailableException('Client role is not configured');
    }

    const id = role._id.toHexString();

    return this.withRoleWrite(id, async () => {
      const current = await this.roleRepository.getById(id);

      if (current?.name !== 'client') {
        throw new ServiceUnavailableException('Client role is not configured');
      }

      return assign([current._id]);
    });
  }

  private async withRoleWrite<T>(id: string, write: () => Promise<T>) {
    const key = id.toLowerCase();
    const previous = this.roleWrites.get(key) ?? Promise.resolve();
    const result = previous.then(write);
    const settled = result.then(
      () => undefined,
      () => undefined,
    );
    this.roleWrites.set(key, settled);

    try {
      return await result;
    } finally {
      if (this.roleWrites.get(key) === settled) {
        this.roleWrites.delete(key);
      }
    }
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
