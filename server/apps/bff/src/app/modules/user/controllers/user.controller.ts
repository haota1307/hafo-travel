import {
  Body,
  Controller,
  Inject,
  type OnModuleInit,
  Post,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { map } from 'rxjs';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { PERMISSION } from '@common/constants/enum/role.enum';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { Permissions } from '@common/decorators/permission.decorator';
import { ProcessId } from '@common/decorators/process-id.decorator';
import { UserData } from '@common/decorators/user-data.decorator';
import type { AuthorizedMetadata } from '@common/interfaces/common/authorization.interface';
import { ResponseDto } from '@common/interfaces/gateway/response.interface';
import { CreateUserRequestDto } from '@common/interfaces/gateway/user';
import { SetUserRolesRequestDto } from '@common/interfaces/gateway/user/user-request.dto';
import {
  USER_ACCESS_SERVICE_NAME,
  type UserAccessServiceClient,
} from '@common/interfaces/grpc/user-access/v1/user-access';
import { requestGrpc } from '@common/utils/rpc.util';

@ApiTags('User')
@Authorization({ secured: true })
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
  @Permissions([PERMISSION.USER_CREATE, PERMISSION.USER_ASSIGN_ROLES])
  @ApiOkResponse({ type: ResponseDto<string> })
  @ApiOperation({ summary: 'Create a new user.' })
  create(@Body() body: CreateUserRequestDto, @ProcessId() processId: string) {
    return requestGrpc(this.users.createUser, body, { processId }).pipe(
      map((response) => response.message),
    );
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get the authenticated profile, roles and effective permissions',
  })
  me(@UserData() actor: AuthorizedMetadata) {
    return { user: actor.user, permissions: actor.permissions };
  }

  @Patch(':userId/roles')
  @Permissions([PERMISSION.USER_ASSIGN_ROLES])
  @ApiOperation({
    summary:
      'Replace the user role using the Keycloak user ID; exactly one role is required',
  })
  setRoles(
    @Param('userId') userId: string,
    @Body() body: SetUserRolesRequestDto,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.users.setUserRoles,
      { userId, roles: body.roles },
      { processId },
    ).pipe(map((response) => response.user));
  }
}
