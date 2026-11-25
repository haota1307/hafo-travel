import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { MetadataKeys } from '@common/constants/common.constants';
import type { RequestContext } from '@common/interfaces/gateway/request-context.interface';

export const UserData = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestContext>();
    const userData = request[MetadataKeys.USER_DATA];

    if (!userData) {
      throw new UnauthorizedException('User data not found');
    }

    return userData;
  },
);
