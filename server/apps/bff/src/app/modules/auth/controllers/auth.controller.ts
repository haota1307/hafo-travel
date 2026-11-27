import {
  Body,
  Controller,
  Header,
  HttpCode,
  Inject,
  Post,
  SetMetadata,
  type OnModuleInit,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { map } from 'rxjs';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { MetadataKeys } from '@common/constants/common.constants';
import { Authorization } from '@common/decorators/authorization.decorator';
import { ProcessId } from '@common/decorators/process-id.decorator';
import {
  EmailActionRequestDto,
  GoogleLoginRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
  LoginRequestDto,
  RefreshSessionRequestDto,
} from '@common/interfaces/gateway/auth/auth-request.dto';
import {
  IDENTITY_SERVICE_NAME,
  type IdentityServiceClient,
} from '@common/interfaces/grpc/identity/v1/identity';
import { requestGrpc } from '@common/utils/rpc.util';

@ApiTags('Authentication')
@Authorization({ secured: false })
@Controller('auth')
export class AuthController implements OnModuleInit {
  private identity: IdentityServiceClient;

  constructor(
    @Inject(GRPC_SERVICES.IDENTITY_SERVICE) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.identity = this.client.getService<IdentityServiceClient>(
      IDENTITY_SERVICE_NAME,
    );
  }

  @Post('register')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @SetMetadata(MetadataKeys.LOGIN_THROTTLE, true)
  register(
    @Body() body: EmailActionRequestDto,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.identity.register,
      { email: body.email, locale: body.locale || 'vi' },
      { processId },
    );
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @SetMetadata(MetadataKeys.LOGIN_THROTTLE, true)
  forgotPassword(
    @Body() body: EmailActionRequestDto,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.identity.forgotPassword,
      { email: body.email, locale: body.locale || 'vi' },
      { processId },
    );
  }

  @Post('verify-email')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  verifyEmail(
    @Body() body: VerifyEmailRequestDto,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(this.identity.verifyEmail, body, { processId });
  }

  @Post('reset-password')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  resetPassword(
    @Body() body: ResetPasswordRequestDto,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(this.identity.resetPassword, body, { processId });
  }

  @Post('google')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  googleLogin(
    @Body() body: GoogleLoginRequestDto,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(this.identity.googleLogin, body, { processId });
  }

  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @SetMetadata(MetadataKeys.LOGIN_THROTTLE, true)
  @ApiOperation({
    summary: 'Exchange email and password for an access and refresh token pair',
  })
  login(@Body() body: LoginRequestDto, @ProcessId() processId: string) {
    return requestGrpc(
      this.identity.login,
      { email: body.email, password: body.password },
      { processId },
    );
  }

  @Post('refresh')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Rotate both tokens within the current session lifetime',
  })
  refresh(
    @Body() body: RefreshSessionRequestDto,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.identity.refreshSession,
      { refreshToken: body.refreshToken },
      { processId },
    );
  }

  @Post('logout')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Revoke the session using its refresh token' })
  logout(
    @Body() body: RefreshSessionRequestDto,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.identity.logout,
      { refreshToken: body.refreshToken },
      { processId },
    ).pipe(map(() => ({ loggedOut: true })));
  }
}
