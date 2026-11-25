import {
  Body,
  Controller,
  Inject,
  type OnModuleInit,
  Post,
  Get,
  Header,
  Patch,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { map } from 'rxjs';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { PERMISSION } from '@common/constants/enum/role.enum';
import { Authorization } from '@common/decorators/authorization.decorator';
import { Permissions } from '@common/decorators/permission.decorator';
import { ProcessId } from '@common/decorators/process-id.decorator';
import { UserData } from '@common/decorators/user-data.decorator';
import type { AuthenticatedActor } from '@common/interfaces/common/authorization.interface';
import { ResponseDto } from '@common/interfaces/gateway/response.interface';
import { CreateUserRequestDto } from '@common/interfaces/gateway/user';
import { SetUserRolesRequestDto } from '@common/interfaces/gateway/user/user-request.dto';
import {
  IDENTITY_SERVICE_NAME,
  type IdentityServiceClient,
} from '@common/interfaces/grpc/identity/v1/identity';
import { requestGrpc } from '@common/utils/rpc.util';

@ApiTags('User')
@Authorization({ secured: true })
@Controller('user')
export class UserController implements OnModuleInit {
  private users: IdentityServiceClient;

  constructor(
    @Inject(GRPC_SERVICES.IDENTITY_SERVICE)
    private readonly identityClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.users = this.identityClient.getService<IdentityServiceClient>(
      IDENTITY_SERVICE_NAME,
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
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get the current profile and effective permissions',
  })
  me(@UserData() actor: AuthenticatedActor, @ProcessId() processId: string) {
    return requestGrpc(
      this.users.getUserById,
      { userId: actor.userId },
      { processId },
    ).pipe(
      map(({ user }) => {
        if (
          !user ||
          user.id !== actor.profileId ||
          user.userId !== actor.userId ||
          user.roles.length !== 1
        ) {
          throw new UnauthorizedException('Authentication is required');
        }

        return { user, permissions: actor.permissions };
      }),
    );
  }

  @Patch(':userId/roles')
  @Permissions([PERMISSION.USER_ASSIGN_ROLES])
  @ApiOperation({
    summary:
      'Replace the user role using the user ID; exactly one role is required',
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
