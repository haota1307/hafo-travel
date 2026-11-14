import type { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import {
  USER_ACCESS_SERVICE_METHODS,
  USER_ACCESS_SERVICE_NAME,
  type CreateUserRequest,
  type CreateUserResponse,
  type GetUserByIdRequest,
  type GetUserByIdResponse,
  type SetUserRolesRequest,
} from '@common/interfaces/grpc/user-access/v1/user-access';
import { grpcCallContext } from '@common/utils/rpc.util';

import { userProfileMapper } from '../mappers/user-profile.mapper';
import { UserService } from '../services/user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod(USER_ACCESS_SERVICE_NAME, USER_ACCESS_SERVICE_METHODS.CREATE_USER)
  async createUser(
    params: CreateUserRequest,
    metadata: Metadata,
    call: ServerUnaryCall<CreateUserRequest, CreateUserResponse>,
  ): Promise<CreateUserResponse> {
    await this.userService.create(params, grpcCallContext(metadata, call));

    return { message: HTTP_MESSAGE.CREATED };
  }

  @GrpcMethod(
    USER_ACCESS_SERVICE_NAME,
    USER_ACCESS_SERVICE_METHODS.GET_USER_BY_ID,
  )
  async getUserById(params: GetUserByIdRequest): Promise<GetUserByIdResponse> {
    const user = await this.userService.getUserByUserId(params.userId);

    return { user: user ? userProfileMapper(user) : undefined };
  }

  @GrpcMethod(
    USER_ACCESS_SERVICE_NAME,
    USER_ACCESS_SERVICE_METHODS.SET_USER_ROLES,
  )
  async setUserRoles(
    params: SetUserRolesRequest,
  ): Promise<GetUserByIdResponse> {
    const user = await this.userService.setRoles(params.userId, params.roles);

    return { user: userProfileMapper(user) };
  }
}
