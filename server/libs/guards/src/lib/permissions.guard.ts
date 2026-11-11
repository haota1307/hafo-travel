import { Reflector } from '@nestjs/core';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PERMISSION } from '@common/constants/enum/role.enum';
import { MetadataKeys } from '@common/constants/common.constants';
import { RequestContext } from '@common/interfaces/gateway/request-context.interface';
import { Permissions } from '@common/decorators/permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PERMISSION[]>(
      Permissions,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestContext>();
    const userData = request[MetadataKeys.USER_DATA];
    if (!userData?.valid || !userData.MetadataKeys) {
      throw new UnauthorizedException('Authentication is required');
    }
    const userPermissions = userData.MetadataKeys.permissions ?? [];

    const isValid = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!isValid) {
      throw new ForbiddenException(
        "Permission denied: You don't have the required permissions.",
      );
    }

    return isValid;
  }
}
