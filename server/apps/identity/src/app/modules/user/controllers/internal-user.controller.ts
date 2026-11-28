import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import {
  IDENTITY_SERVICE_METHODS,
  IDENTITY_SERVICE_NAME,
  type InternalUserResponse,
  type InternalUserTarget,
  type ListInternalUsersRequest,
  type ListInternalUsersResponse,
  type SetInternalUserRoleRequest,
  type SetInternalUserStatusRequest,
  type UpdateInternalUserRequest,
} from '@common/interfaces/grpc/identity/v1/identity';

import { InternalUserService } from '@identity/user/services/internal-user.service';

@Controller()
export class InternalUserController {
  constructor(private readonly users: InternalUserService) {}

  @GrpcMethod(
    IDENTITY_SERVICE_NAME,
    IDENTITY_SERVICE_METHODS.LIST_INTERNAL_USERS,
  )
  async list(
    request: ListInternalUsersRequest,
  ): Promise<ListInternalUsersResponse> {
    return { users: await this.users.list(request.actorUserId) };
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.GET_INTERNAL_USER)
  async get(request: InternalUserTarget): Promise<InternalUserResponse> {
    return { user: await this.users.get(request) };
  }

  @GrpcMethod(
    IDENTITY_SERVICE_NAME,
    IDENTITY_SERVICE_METHODS.UPDATE_INTERNAL_USER,
  )
  async update(
    request: UpdateInternalUserRequest,
  ): Promise<InternalUserResponse> {
    return { user: await this.users.updateName(request) };
  }

  @GrpcMethod(
    IDENTITY_SERVICE_NAME,
    IDENTITY_SERVICE_METHODS.SET_INTERNAL_USER_ROLE,
  )
  async setRole(
    request: SetInternalUserRoleRequest,
  ): Promise<InternalUserResponse> {
    return { user: await this.users.setRole(request) };
  }

  @GrpcMethod(
    IDENTITY_SERVICE_NAME,
    IDENTITY_SERVICE_METHODS.SET_INTERNAL_USER_STATUS,
  )
  async setStatus(
    request: SetInternalUserStatusRequest,
  ): Promise<InternalUserResponse> {
    return { user: await this.users.setStatus(request) };
  }
}
