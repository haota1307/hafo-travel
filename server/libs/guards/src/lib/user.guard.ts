import { createHash } from 'node:crypto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
  Logger,
  Inject,
  type OnModuleInit,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Cache } from 'cache-manager';
import type { JwtPayload } from 'jsonwebtoken';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { MetadataKeys } from '@common/constants/common.constants';
import { Permissions } from '@common/decorators/permission.decorator';
import { AuthorizeResponse } from '@common/interfaces/common/authorization.interface';
import type { RequestContext } from '@common/interfaces/gateway/request-context.interface';
import {
  AUTHORIZER_SERVICE_NAME,
  type AuthorizerServiceClient,
} from '@common/interfaces/grpc/authorizer/v1/authorizer';
import {
  USER_ACCESS_SERVICE_NAME,
  type UserAccessServiceClient,
} from '@common/interfaces/grpc/user-access/v1/user-access';
import { getAccessToken, setUserData } from '@common/utils/request.util';
import { requestGrpcData } from '@common/utils/rpc.util';

@Injectable()
export class UserGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(UserGuard.name);
  private authorizer: AuthorizerServiceClient;
  private users: UserAccessServiceClient;

  constructor(
    private readonly reflector: Reflector,
    @Inject(GRPC_SERVICES.AUTHORIZER_SERVICE)
    private readonly authorizerClient: ClientGrpc,
    @Inject(GRPC_SERVICES.USER_ACCESS_SERVICE)
    private readonly userAccessClient: ClientGrpc,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  onModuleInit() {
    this.users = this.userAccessClient.getService<UserAccessServiceClient>(
      USER_ACCESS_SERVICE_NAME,
    );
    this.authorizer = this.authorizerClient.getService<AuthorizerServiceClient>(
      AUTHORIZER_SERVICE_NAME,
    );
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride(Permissions, [
      context.getHandler(),
      context.getClass(),
    ]);
    const options = this.reflector.getAllAndOverride<{ secured: boolean }>(
      MetadataKeys.SECURED,
      [context.getHandler(), context.getClass()],
    );

    return options?.secured !== false || Boolean(permissions?.length)
      ? this.verifyToken(context.switchToHttp().getRequest<RequestContext>())
      : true;
  }

  private async verifyToken(request: RequestContext): Promise<boolean> {
    const token = getAccessToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication is required');
    }

    const cacheKey = this.generateTokenCacheKey(token);
    let cached: AuthorizeResponse | undefined;

    try {
      cached = await this.cacheManager.get<AuthorizeResponse>(cacheKey);
    } catch {
      this.logger.warn('Token cache read failed; verifying with authorizer');
    }

    if (cached?.valid && this.cacheTtl(cached) > 0) {
      const subject = cached.MetadataKeys.jwt?.sub;

      if (typeof subject !== 'string' || !subject) {
        throw new UnauthorizedException('Invalid token subject');
      }

      const { user } = await requestGrpcData(
        this.users.getUserById,
        { userId: subject },
        { processId: request.processId },
      );

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const current = new AuthorizeResponse({
        valid: true,
        MetadataKeys: {
          jwt: cached.MetadataKeys.jwt,
          user,
          userId: user.id,
          permissions: [
            ...new Set(user.roles.flatMap((role) => role.permissions)),
          ],
        },
      });
      setUserData(request, current);

      return true;
    }
    if (cached) {
      try {
        await this.cacheManager.del(cacheKey);
      } catch {
        this.logger.warn('Token cache eviction failed');
      }
    }

    const response = await requestGrpcData(
      this.authorizer.verifyUserToken,
      { token },
      { processId: request.processId },
    );
    let jwt: JwtPayload | undefined;

    try {
      const claims: unknown = JSON.parse(response.metadata?.jwtJson || 'null');

      if (claims && typeof claims === 'object' && !Array.isArray(claims)) {
        jwt = claims as JwtPayload;
      }
    } catch {
      throw new UnauthorizedException('Token is invalid or missing');
    }

    const exp = jwt?.exp;

    if (
      !response.valid ||
      !response.metadata ||
      !jwt ||
      (exp !== undefined && (!Number.isFinite(exp) || exp * 1000 <= Date.now()))
    ) {
      throw new UnauthorizedException('Token is invalid or missing');
    }

    const result = new AuthorizeResponse({
      valid: response.valid,
      MetadataKeys: {
        userId: response.metadata.userId,
        user: response.metadata.user,
        permissions: response.metadata.permissions,
        jwt,
      },
    });
    setUserData(request, result);
    const ttl = this.cacheTtl(result);

    if (ttl > 0) {
      try {
        await this.cacheManager.set(cacheKey, result, ttl);
      } catch {
        this.logger.warn('Token cache write failed');
      }
    }

    return true;
  }

  private cacheTtl(result: AuthorizeResponse): number {
    const exp = result.MetadataKeys?.jwt?.exp;

    return typeof exp === 'number' && Number.isFinite(exp)
      ? Math.max(0, Math.min(30 * 60 * 1000, exp * 1000 - Date.now()))
      : 0;
  }

  generateTokenCacheKey(token: string): string {
    return 'user-token:' + createHash('sha256').update(token).digest('hex');
  }
}
