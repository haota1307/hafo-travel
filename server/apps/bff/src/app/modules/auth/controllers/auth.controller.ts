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
import { map } from 'rxjs';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { MetadataKeys } from '@common/constants/common.constants';
import { Authorization } from '@common/decorators/authorization.decorator';
import { ProcessId } from '@common/decorators/process-id.decorator';
import {
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
      { email: body.email.trim(), password: body.password },
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
