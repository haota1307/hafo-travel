import { Controller } from '@nestjs/common';

import { MessagePattern } from '@nestjs/microservices';
import { AuthorizerService } from '../services/authorizer.service';
import { LoginTcpRequest } from '@common/interfaces/tcp/authorizer';
import { ProcessId } from '@common/decorators/process-id.decorator';
import { RequestParams } from '@common/decorators/request-param.decorator';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';

@Controller()
export class AuthorizerController {
  constructor(private readonly authorizerService: AuthorizerService) {}

  @MessagePattern(TCP_REQUEST_MESSAGE.AUTHORIZER.LOGIN)
  login(@RequestParams() body: LoginTcpRequest) {
    return this.authorizerService.login(body);
  }

  @MessagePattern(TCP_REQUEST_MESSAGE.AUTHORIZER.VERIFY_USER_TOKEN)
  verifyUserToken(
    @RequestParams() token: string,
    @ProcessId() processId: string,
  ) {
    return this.authorizerService.verifyUserToken(token, processId);
  }
}
