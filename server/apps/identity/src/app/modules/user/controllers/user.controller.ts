import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import {
  IDENTITY_SERVICE_METHODS,
  IDENTITY_SERVICE_NAME,
  type CreateUserRequest,
  type CreateUserResponse,
  type GetUserByIdRequest,
  type GetUserByIdResponse,
  type SetUserRolesRequest,
} from '@common/interfaces/grpc/identity/v1/identity';

import { userProfileMapper } from '@identity/user/mappers/user-profile.mapper';
import { UserService } from '@identity/user/services/user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.CREATE_USER)
  async createUser(params: CreateUserRequest): Promise<CreateUserResponse> {
    await this.userService.create(params);

    return { message: HTTP_MESSAGE.CREATED };
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.GET_USER_BY_ID)
  async getUserById(params: GetUserByIdRequest): Promise<GetUserByIdResponse> {
    const user = await this.userService.getUserByUserId(params.userId);

    if (!user) {
      return {};
    }

    return {
      user: userProfileMapper(user),
      ...(user.lockedAt && { locked: true }),
      ...(user.accessVersion && { accessVersion: user.accessVersion }),
    };
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.SET_USER_ROLES)
  async setUserRoles(
    params: SetUserRolesRequest,
  ): Promise<GetUserByIdResponse> {
    const user = await this.userService.setRoles(params.userId, params.roles);

    return { user: userProfileMapper(user) };
  }
}
