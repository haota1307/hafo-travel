import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { CODE_ERROR } from '@common/constants/enum/code-error.enum';
import {
  AUTHORIZER_SERVICE_NAME,
  type AuthorizerServiceClient,
  type CreateKeycloakUserRequest,
} from '@common/interfaces/grpc/authorizer/v1/authorizer';
import type { CreateUserRequest } from '@common/interfaces/grpc/user-access/v1/user-access';
import { requestGrpcData, type GrpcCallContext } from '@common/utils/rpc.util';

import { RoleService } from '../../role/services/role.service';
import { createUserRequestMapper } from '../mappers/user-request.mapper';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService implements OnModuleInit {
  private authorizer: AuthorizerServiceClient;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
    @Inject(GRPC_SERVICES.AUTHORIZER_SERVICE)
    private readonly authorizerClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authorizer = this.authorizerClient.getService<AuthorizerServiceClient>(
      AUTHORIZER_SERVICE_NAME,
    );
  }

  async create(data: CreateUserRequest, context: GrpcCallContext) {
    const { email, firstName, lastName, password } = data;
    const existingUser = await this.userRepository.exists(email);

    if (existingUser) {
      throw new BadRequestException(CODE_ERROR.USER_ALREADY_EXISTS);
    }

    await this.roleService.resolveRoleIds(data.roles);

    const { userId } = await this.createKeycloakUser(
      { email, firstName, lastName, password },
      context,
    );

    if (!userId) {
      throw new InternalServerErrorException('Keycloak returned no user ID');
    }

    const input = createUserRequestMapper(data, userId);

    return this.userRepository.create(input);
  }

  private createKeycloakUser(
    data: CreateKeycloakUserRequest,
    context: GrpcCallContext,
  ) {
    return requestGrpcData(this.authorizer.createKeycloakUser, data, context);
  }

  getUserByUserId(userId: string) {
    return this.userRepository.getByUserId(userId);
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
