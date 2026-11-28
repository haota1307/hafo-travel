import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Inject,
  type OnModuleInit,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { map } from 'rxjs';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { PERMISSION } from '@common/constants/enum/role.enum';
import { Authorization } from '@common/decorators/authorization.decorator';
import { Permissions } from '@common/decorators/permission.decorator';
import { ProcessId } from '@common/decorators/process-id.decorator';
import { UserData } from '@common/decorators/user-data.decorator';
import type { AuthenticatedActor } from '@common/interfaces/common/authorization.interface';
import {
  InternalUserInvitationLocaleRequestDto,
  InternalUserNameRequestDto,
  InternalUserStatusRequestDto,
  InviteInternalUserRequestDto,
  SetUserRolesRequestDto,
} from '@common/interfaces/gateway/user';
import {
  IDENTITY_SERVICE_NAME,
  type IdentityServiceClient,
} from '@common/interfaces/grpc/identity/v1/identity';
import { requestGrpc } from '@common/utils/rpc.util';

const invitationTimeoutMs = 15_000;

@ApiTags('User')
@Authorization({ secured: true })
@Controller('user/internal')
export class InternalUserController implements OnModuleInit {
  private users: IdentityServiceClient;

  constructor(
    @Inject(GRPC_SERVICES.IDENTITY_SERVICE)
    private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.users = this.client.getService<IdentityServiceClient>(
      IDENTITY_SERVICE_NAME,
    );
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  @Permissions([PERMISSION.USER_GET_ALL])
  @ApiOperation({ summary: 'List internal accounts' })
  list(@UserData() actor: AuthenticatedActor, @ProcessId() processId: string) {
    return requestGrpc(
      this.users.listInternalUsers,
      { actorUserId: actor.userId },
      { processId },
    ).pipe(map((response) => response.users));
  }

  @Get(':userId')
  @Header('Cache-Control', 'no-store')
  @Permissions([PERMISSION.USER_GET_BY_ID])
  @ApiOperation({ summary: 'Read an internal account' })
  get(
    @Param('userId') userId: string,
    @UserData() actor: AuthenticatedActor,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.users.getInternalUser,
      { userId, actorUserId: actor.userId },
      { processId },
    ).pipe(map((response) => response.user));
  }

  @Post()
  @Permissions([PERMISSION.USER_CREATE, PERMISSION.USER_ASSIGN_ROLES])
  @ApiOperation({ summary: 'Create and invite an internal account' })
  invite(
    @Body() body: InviteInternalUserRequestDto,
    @UserData() actor: AuthenticatedActor,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.users.inviteInternalUser,
      { ...body, actorUserId: actor.userId, locale: body.locale || 'vi' },
      { processId },
      invitationTimeoutMs,
    );
  }

  @Patch(':userId')
  @Permissions([PERMISSION.USER_UPDATE])
  @ApiOperation({ summary: 'Update the name of an internal account' })
  update(
    @Param('userId') userId: string,
    @Body() body: InternalUserNameRequestDto,
    @UserData() actor: AuthenticatedActor,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.users.updateInternalUser,
      { ...body, userId, actorUserId: actor.userId },
      { processId },
    ).pipe(map((response) => response.user));
  }

  @Patch(':userId/roles')
  @Permissions([PERMISSION.USER_ASSIGN_ROLES])
  @ApiOperation({ summary: 'Replace the role of an internal account' })
  setRole(
    @Param('userId') userId: string,
    @Body() body: SetUserRolesRequestDto,
    @UserData() actor: AuthenticatedActor,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.users.setInternalUserRole,
      { userId, actorUserId: actor.userId, roles: body.roles },
      { processId },
    ).pipe(map((response) => response.user));
  }

  @Patch(':userId/status')
  @Permissions([PERMISSION.USER_UPDATE])
  @ApiOperation({ summary: 'Lock or unlock an internal account' })
  setStatus(
    @Param('userId') userId: string,
    @Body() body: InternalUserStatusRequestDto,
    @UserData() actor: AuthenticatedActor,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.users.setInternalUserStatus,
      { userId, actorUserId: actor.userId, locked: body.locked },
      { processId },
    ).pipe(map((response) => response.user));
  }

  @Post(':userId/invitation')
  @HttpCode(200)
  @Permissions([PERMISSION.USER_CREATE, PERMISSION.USER_ASSIGN_ROLES])
  @ApiOperation({ summary: 'Resend an internal account invitation' })
  resendInvitation(
    @Param('userId') userId: string,
    @Body() body: InternalUserInvitationLocaleRequestDto,
    @UserData() actor: AuthenticatedActor,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.users.resendInternalUserInvitation,
      { userId, actorUserId: actor.userId, locale: body.locale || 'vi' },
      { processId },
      invitationTimeoutMs,
    );
  }
}
