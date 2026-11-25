import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
} from '@common/constants/access-token.constants';
import { MetadataKeys } from '@common/constants/common.constants';
import { Permissions } from '@common/decorators/permission.decorator';
import type { RequestContext } from '@common/interfaces/gateway/request-context.interface';

import { AuthorizationService } from './authorization.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly authorization: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride(Permissions, [
      context.getHandler(),
      context.getClass(),
    ]);
    const options = this.reflector.getAllAndOverride<{ secured: boolean }>(
      MetadataKeys.SECURED,
      [context.getHandler(), context.getClass()],
    );

    if (options?.secured === false && !permissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestContext>();
    const token =
      /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(
        request.headers.authorization ?? '',
      )?.[1];

    if (!token) {
      throw new UnauthorizedException('Authentication is required');
    }

    let claims: Record<string, unknown>;

    try {
      claims = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Authentication is required');
    }

    const { sub, profileId, roleId, iat, exp, aud, tokenUse } = claims;
    const now = Math.floor(Date.now() / 1000);

    if (
      aud !== ACCESS_TOKEN_AUDIENCE ||
      (tokenUse !== undefined && tokenUse !== 'access') ||
      typeof sub !== 'string' ||
      !sub.trim() ||
      typeof profileId !== 'string' ||
      !/^[a-f0-9]{24}$/.test(profileId) ||
      (roleId !== undefined &&
        (typeof roleId !== 'string' || !/^[a-f0-9]{24}$/.test(roleId))) ||
      typeof iat !== 'number' ||
      !Number.isSafeInteger(iat) ||
      iat > now ||
      typeof exp !== 'number' ||
      !Number.isSafeInteger(exp) ||
      exp <= now ||
      exp - iat > ACCESS_TOKEN_MAX_AGE_SECONDS
    ) {
      throw new UnauthorizedException('Authentication is required');
    }

    request[MetadataKeys.USER_DATA] = {
      userId: sub,
      profileId,
      permissions: await this.authorization.permissions(
        sub,
        profileId,
        request.processId,
      ),
    };

    return true;
  }
}
