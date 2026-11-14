import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  type OnModuleInit,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { map } from 'rxjs';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { PERMISSION } from '@common/constants/enum/role.enum';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { Permissions } from '@common/decorators/permission.decorator';
import { ProcessId } from '@common/decorators/process-id.decorator';
import { SaveRoleRequestDto } from '@common/interfaces/gateway/role/role-request.dto';
import {
  USER_ACCESS_SERVICE_NAME,
  type UserAccessServiceClient,
} from '@common/interfaces/grpc/user-access/v1/user-access';
import { requestGrpc } from '@common/utils/rpc.util';

@ApiTags('Role')
@Authorization({ secured: true })
@Controller('role')
export class RoleController implements OnModuleInit {
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

  @Get('permissions')
  @Permissions([PERMISSION.ROLE_GET_ALL])
  @ApiOperation({ summary: 'List available application permissions' })
  permissions() {
    return Object.values(PERMISSION);
  }

  @Get()
  @Permissions([PERMISSION.ROLE_GET_ALL])
  @ApiOperation({ summary: 'List roles' })
  list(@ProcessId() processId: string) {
    return requestGrpc(this.users.listRoles, {}, { processId }).pipe(
      map((response) => response.roles),
    );
  }

  @Get(':id')
  @Permissions([PERMISSION.ROLE_GET_BY_ID])
  @ApiOperation({ summary: 'Get a role by MongoDB ID' })
  get(@Param('id') id: string, @ProcessId() processId: string) {
    return requestGrpc(this.users.getRole, { id }, { processId }).pipe(
      map((response) => response.role),
    );
  }

  @Post()
  @Permissions([PERMISSION.ROLE_CREATE])
  @ApiOperation({ summary: 'Create a role' })
  create(@Body() body: SaveRoleRequestDto, @ProcessId() processId: string) {
    return requestGrpc(this.users.createRole, body, { processId }).pipe(
      map((response) => response.role),
    );
  }

  @Put(':id')
  @Permissions([PERMISSION.ROLE_UPDATE])
  @ApiOperation({ summary: 'Replace role name, description and permissions' })
  update(
    @Param('id') id: string,
    @Body() body: SaveRoleRequestDto,
    @ProcessId() processId: string,
  ) {
    return requestGrpc(
      this.users.updateRole,
      {
        id,
        name: body.name,
        description: body.description,
        permissions: body.permissions,
      },
      { processId },
    ).pipe(map((response) => response.role));
  }

  @Delete(':id')
  @Permissions([PERMISSION.ROLE_DELETE])
  @ApiOperation({ summary: 'Delete a role and revoke its permissions' })
  delete(@Param('id') id: string, @ProcessId() processId: string) {
    return requestGrpc(this.users.deleteRole, { id }, { processId }).pipe(
      map((response) => response.message),
    );
  }
}
