import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import {
  USER_ACCESS_SERVICE_METHODS,
  USER_ACCESS_SERVICE_NAME,
  type CreateRoleRequest,
  type UpdateRoleRequest,
  type RoleIdRequest,
} from '@common/interfaces/grpc/user-access/v1/user-access';

import { roleProfileMapper } from '../mappers/role-profile.mapper';
import { RoleService } from '../services/role.service';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @GrpcMethod(USER_ACCESS_SERVICE_NAME, USER_ACCESS_SERVICE_METHODS.LIST_ROLES)
  async list() {
    const roles = await this.roleService.getAll();

    return { roles: roles.map(roleProfileMapper) };
  }

  @GrpcMethod(USER_ACCESS_SERVICE_NAME, USER_ACCESS_SERVICE_METHODS.GET_ROLE)
  async get(params: RoleIdRequest) {
    const role = await this.roleService.getById(params.id);

    return { role: roleProfileMapper(role) };
  }

  @GrpcMethod(USER_ACCESS_SERVICE_NAME, USER_ACCESS_SERVICE_METHODS.CREATE_ROLE)
  async create(params: CreateRoleRequest) {
    const role = await this.roleService.create(params);

    return { role: roleProfileMapper(role) };
  }

  @GrpcMethod(USER_ACCESS_SERVICE_NAME, USER_ACCESS_SERVICE_METHODS.UPDATE_ROLE)
  async update(params: UpdateRoleRequest) {
    const role = await this.roleService.update(params.id, params);

    return { role: roleProfileMapper(role) };
  }

  @GrpcMethod(USER_ACCESS_SERVICE_NAME, USER_ACCESS_SERVICE_METHODS.DELETE_ROLE)
  async delete(params: RoleIdRequest) {
    await this.roleService.delete(params.id);

    return { message: HTTP_MESSAGE.DELETED };
  }
}
