import { requestTcp } from '@common/utils/rpc.util';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Inject, Post } from '@nestjs/common';

import {
  LoginRequestDto,
  LoginResponseDto,
} from '@common/interfaces/gateway/authorizer';
import { TCP_SERVICES } from '@common/configuration/tcp.config';
import { ProcessId } from '@common/decorators/process-id.decorator';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { ResponseDto } from '@common/interfaces/gateway/response.interface';
import {
  LoginTcpRequest,
  LoginTcpResponse,
} from '@common/interfaces/tcp/authorizer';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';

@ApiTags('Authorizer')
@Controller('authorizer')
export class AuthorizerController {
  constructor(
    @Inject(TCP_SERVICES.AUTHORIZER_SERVICE)
    private readonly authorizerClient: TcpClient,
  ) {}

  @Post('login')
  @ApiOkResponse({ type: ResponseDto<LoginResponseDto> })
  @ApiOperation({ summary: 'Login with username and password' })
  login(@Body() body: LoginRequestDto, @ProcessId() processId: string) {
    return requestTcp<LoginTcpResponse, LoginTcpRequest>(
      this.authorizerClient,
      TCP_REQUEST_MESSAGE.AUTHORIZER.LOGIN,
      { data: body, processId },
    );
  }
}
