import { GrpcMethod } from '@nestjs/microservices';
import { Controller } from '@nestjs/common';
import type { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import {
  USER_ACCESS_SERVICE_NAME,
  type CreateUserRequest,
  type CreateUserResponse,
  type GetUserByIdRequest,
  type GetUserByIdResponse,
} from '@common/interfaces/grpc/user-access/v1/user-access';
import { grpcCallContext } from '@common/utils/rpc.util';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import { UserService } from '../services/user.service';
import { userProfileMapper } from '../mappers/user-profile.mapper';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod(USER_ACCESS_SERVICE_NAME, 'CreateUser')
  async createUser(
    params: CreateUserRequest,
    metadata: Metadata,
    call: ServerUnaryCall<CreateUserRequest, CreateUserResponse>,
  ): Promise<CreateUserResponse> {
    await this.userService.create(params, grpcCallContext(metadata, call));

    return { message: HTTP_MESSAGE.CREATED };
  }

  @GrpcMethod(USER_ACCESS_SERVICE_NAME, 'GetUserById')
  async getUserById(params: GetUserByIdRequest): Promise<GetUserByIdResponse> {
    const user = await this.userService.getUserByUserId(params.userId);

    return { user: user ? userProfileMapper(user) : undefined };
  }
}
