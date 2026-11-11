import { MessagePattern } from '@nestjs/microservices';
import { Controller } from '@nestjs/common';

import { CreateUserTcpRequest } from '@common/interfaces/tcp/user';
import { UserService } from '../services/user.service';
import { RequestParams } from '@common/decorators/request-param.decorator';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import { ProcessId } from '@common/decorators/process-id.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(TCP_REQUEST_MESSAGE.USER.CREATE)
  async create(
    @RequestParams() params: CreateUserTcpRequest,
    @ProcessId() processId: string,
  ): Promise<string> {
    await this.userService.create(params, processId);
    return HTTP_MESSAGE.CREATED;
  }

  @MessagePattern(TCP_REQUEST_MESSAGE.USER.GET_BY_ID)
  getByUserId(@RequestParams() userId: string) {
    return this.userService.getUserByUserId(userId);
  }
}
