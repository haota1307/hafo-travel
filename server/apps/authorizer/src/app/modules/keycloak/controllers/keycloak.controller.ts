import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { KeycloakHttpService } from '../services/keycloak-http.service';
import { RequestParams } from '@common/decorators/request-param.decorator';
import { CreateKeycloakUserTcpRequest } from '@common/interfaces/tcp/authorizer';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';

@Controller()
export class KeycloakController {
  constructor(private readonly keycloakHttpService: KeycloakHttpService) {}

  @MessagePattern(TCP_REQUEST_MESSAGE.KEYCLOAK.CREATE_USER)
  createUser(
    @RequestParams() data: CreateKeycloakUserTcpRequest,
  ): Promise<string> {
    return this.keycloakHttpService.createUser(data);
  }
}
