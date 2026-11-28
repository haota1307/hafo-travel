import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import {
  IDENTITY_SERVICE_METHODS,
  IDENTITY_SERVICE_NAME,
  type CreateRoleRequest,
  type UpdateRoleRequest,
  type RoleIdRequest,
} from '@common/interfaces/grpc/identity/v1/identity';

import { roleProfileMapper } from '@identity/role/mappers/role-profile.mapper';
import { RoleService } from '@identity/role/services/role.service';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.LIST_ROLES)
  async list() {
    const roles = await this.roleService.getAll();
    const memberCounts = await this.roleService.getMemberCounts(roles);

    return {
      roles: roles.map((role) =>
        roleProfileMapper(role, memberCounts.get(role.id) ?? 0),
      ),
    };
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.GET_ROLE)
  async get(params: RoleIdRequest) {
    const role = await this.roleService.getById(params.id);

    if (!params.includeMemberCount) {
      return { role: roleProfileMapper(role) };
    }

    const memberCounts = await this.roleService.getMemberCounts([role]);

    return { role: roleProfileMapper(role, memberCounts.get(role.id) ?? 0) };
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.CREATE_ROLE)
  async create(params: CreateRoleRequest) {
    const role = await this.roleService.create(params);

    return { role: roleProfileMapper(role) };
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.UPDATE_ROLE)
  async update(params: UpdateRoleRequest) {
    const role = await this.roleService.update(params.id, params);

    return { role: roleProfileMapper(role) };
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.DELETE_ROLE)
  async delete(params: RoleIdRequest) {
    await this.roleService.delete(params.id);

    return { message: HTTP_MESSAGE.DELETED };
  }
}
