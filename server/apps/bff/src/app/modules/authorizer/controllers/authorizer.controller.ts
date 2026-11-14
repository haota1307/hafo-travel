import {
  Body,
  Controller,
  Inject,
  type OnModuleInit,
  Post,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { ProcessId } from '@common/decorators/process-id.decorator';
import {
  LoginRequestDto,
  LoginResponseDto,
} from '@common/interfaces/gateway/authorizer';
import { ResponseDto } from '@common/interfaces/gateway/response.interface';
import {
  AUTHORIZER_SERVICE_NAME,
  type AuthorizerServiceClient,
} from '@common/interfaces/grpc/authorizer/v1/authorizer';
import { requestGrpc } from '@common/utils/rpc.util';

@ApiTags('Authorizer')
@Controller('authorizer')
export class AuthorizerController implements OnModuleInit {
  private authorizer: AuthorizerServiceClient;

  constructor(
    @Inject(GRPC_SERVICES.AUTHORIZER_SERVICE)
    private readonly authorizerClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authorizer = this.authorizerClient.getService<AuthorizerServiceClient>(
      AUTHORIZER_SERVICE_NAME,
    );
  }

  @Post('login')
  @Authorization({ secured: false })
  @ApiOkResponse({ type: ResponseDto<LoginResponseDto> })
  @ApiOperation({ summary: 'Login with username and password' })
  login(@Body() body: LoginRequestDto, @ProcessId() processId: string) {
    return requestGrpc(this.authorizer.login, body, { processId });
  }
}
