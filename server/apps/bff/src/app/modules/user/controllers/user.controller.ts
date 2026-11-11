import { requestGrpc } from '@common/utils/rpc.util';
import {
  Body,
  Controller,
  Inject,
  type OnModuleInit,
  Post,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { map } from 'rxjs';
import { CreateUserRequestDto } from '@common/interfaces/gateway/user';
import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import {
  USER_ACCESS_SERVICE_NAME,
  type UserAccessServiceClient,
} from '@common/interfaces/grpc/user-access/v1/user-access';
import { ResponseDto } from '@common/interfaces/gateway/response.interface';
import { ProcessId } from '@common/decorators/process-id.decorator';

@ApiTags('User')
@Controller('user')
export class UserController implements OnModuleInit {
  private users: UserAccessServiceClient;

  constructor(
    @Inject(GRPC_SERVICES.USER_ACCESS_SERVICE)
    private readonly userAccessClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.users = this.userAccessClient.getService<UserAccessServiceClient>(
      USER_ACCESS_SERVICE_NAME,
    );
  }

  @Post()
  @ApiOkResponse({ type: ResponseDto<string> })
  @ApiOperation({ summary: 'Create a new user.' })
  create(@Body() body: CreateUserRequestDto, @ProcessId() processId: string) {
    return requestGrpc(this.users.createUser, body, { processId }).pipe(
      map((response) => response.message),
    );
  }
}
