import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import {
  IDENTITY_SERVICE_METHODS,
  IDENTITY_SERVICE_NAME,
  type LoginRequest,
  type LogoutRequest,
  type LogoutResponse,
  type RefreshSessionRequest,
} from '@common/interfaces/grpc/identity/v1/identity';

import { AuthService } from '../services/auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.LOGIN)
  login(request: LoginRequest) {
    return this.authService.login(request);
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.REFRESH_SESSION)
  refreshSession({ refreshToken }: RefreshSessionRequest) {
    return this.authService.refreshSession(refreshToken);
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.LOGOUT)
  async logout({ refreshToken }: LogoutRequest): Promise<LogoutResponse> {
    await this.authService.logout(refreshToken);

    return {};
  }
}
