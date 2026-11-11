import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  AUTHORIZER_SERVICE_NAME,
  type CreateKeycloakUserRequest,
  type CreateKeycloakUserResponse,
} from '@common/interfaces/grpc/authorizer/v1/authorizer';
import { KeycloakHttpService } from '../services/keycloak-http.service';

@Controller()
export class KeycloakController {
  constructor(private readonly keycloakHttpService: KeycloakHttpService) {}

  @GrpcMethod(AUTHORIZER_SERVICE_NAME, 'CreateKeycloakUser')
  async createKeycloakUser(
    data: CreateKeycloakUserRequest,
  ): Promise<CreateKeycloakUserResponse> {
    return { userId: await this.keycloakHttpService.createUser(data) };
  }
}
