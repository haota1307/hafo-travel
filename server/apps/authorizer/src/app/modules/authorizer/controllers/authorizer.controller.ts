import type { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import {
  AUTHORIZER_SERVICE_METHODS,
  AUTHORIZER_SERVICE_NAME,
  type LoginRequest,
  type VerifyUserTokenRequest,
  type VerifyUserTokenResponse,
} from '@common/interfaces/grpc/authorizer/v1/authorizer';
import { grpcCallContext } from '@common/utils/rpc.util';

import { AuthorizerService } from '../services/authorizer.service';

@Controller()
export class AuthorizerController {
  constructor(private readonly authorizerService: AuthorizerService) {}

  @GrpcMethod(AUTHORIZER_SERVICE_NAME, AUTHORIZER_SERVICE_METHODS.LOGIN)
  login(body: LoginRequest) {
    return this.authorizerService.login(body);
  }

  @GrpcMethod(
    AUTHORIZER_SERVICE_NAME,
    AUTHORIZER_SERVICE_METHODS.VERIFY_USER_TOKEN,
  )
  verifyUserToken(
    body: VerifyUserTokenRequest,
    metadata: Metadata,
    call: ServerUnaryCall<VerifyUserTokenRequest, VerifyUserTokenResponse>,
  ) {
    return this.authorizerService.verifyUserToken(
      body.token,
      grpcCallContext(metadata, call),
    );
  }
}
