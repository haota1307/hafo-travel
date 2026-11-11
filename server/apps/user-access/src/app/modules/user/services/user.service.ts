import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  type OnModuleInit,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import {
  AUTHORIZER_SERVICE_NAME,
  type AuthorizerServiceClient,
  type CreateKeycloakUserRequest,
} from '@common/interfaces/grpc/authorizer/v1/authorizer';
import type { CreateUserRequest } from '@common/interfaces/grpc/user-access/v1/user-access';
import { CODE_ERROR } from '@common/constants/enum/code-error.enum';
import { requestGrpcData, type GrpcCallContext } from '@common/utils/rpc.util';
import { UserRepository } from '../repositories/user.repository';
import { createUserRequestMapper } from '../mappers/user-request.mapper';

@Injectable()
export class UserService implements OnModuleInit {
  private authorizer: AuthorizerServiceClient;

  constructor(
    private readonly userRepository: UserRepository,
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
}
