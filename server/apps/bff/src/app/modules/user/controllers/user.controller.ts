import { requestTcp } from '@common/utils/rpc.util';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateUserRequestDto } from '@common/interfaces/gateway/user';
import { CreateUserTcpRequest } from '@common/interfaces/tcp/user';
import { TCP_SERVICES } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { ResponseDto } from '@common/interfaces/gateway/response.interface';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';
import { ProcessId } from '@common/decorators/process-id.decorator';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    @Inject(TCP_SERVICES.USER_ACCESS_SERVICE)
    private readonly userAccessClient: TcpClient,
  ) {}

  @Post()
  @ApiOkResponse({ type: ResponseDto<string> })
  @ApiOperation({ summary: 'Create a new user.' })
  create(@Body() body: CreateUserRequestDto, @ProcessId() processId: string) {
    return requestTcp<string, CreateUserTcpRequest>(
      this.userAccessClient,
      TCP_REQUEST_MESSAGE.USER.CREATE,
      { data: body, processId },
    );
  }
}
