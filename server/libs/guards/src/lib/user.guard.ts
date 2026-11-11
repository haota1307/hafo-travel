import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MetadataKeys } from '@common/constants/common.constants';
import { getAccessToken, setUserData } from '@common/utils/request.util';
import { requestTcpData } from '@common/utils/rpc.util';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';
import { TCP_SERVICES } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { AuthorizeResponse } from '@common/interfaces/tcp/authorizer';
import { RequestContext } from '@common/interfaces/gateway/request-context.interface';

@Injectable()
export class UserGuard implements CanActivate {
  private readonly logger = new Logger(UserGuard.name);
  constructor(
    private readonly reflector: Reflector,
    @Inject(TCP_SERVICES.AUTHORIZER_SERVICE)
    private readonly authorizerClient: TcpClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const options = this.reflector.getAllAndOverride<{ secured: boolean }>(
      MetadataKeys.SECURED,
      [context.getHandler(), context.getClass()],
    );
    return options?.secured
      ? this.verifyToken(context.switchToHttp().getRequest<RequestContext>())
      : true;
  }

  private async verifyToken(request: RequestContext): Promise<boolean> {
    const token = getAccessToken(request);
    const cacheKey = this.generateTokenCacheKey(token);
    let cached: AuthorizeResponse | undefined;
    try {
      cached = await this.cacheManager.get<AuthorizeResponse>(cacheKey);
    } catch {
      this.logger.warn('Token cache read failed; verifying with authorizer');
    }
    if (cached?.valid && this.cacheTtl(cached) > 0) {
      setUserData(request, cached);
      return true;
    }
    if (cached) {
      try {
        await this.cacheManager.del(cacheKey);
      } catch {
        this.logger.warn('Token cache eviction failed');
      }
    }
    const result = await requestTcpData<AuthorizeResponse, string>(
      this.authorizerClient,
      TCP_REQUEST_MESSAGE.AUTHORIZER.VERIFY_USER_TOKEN,
      { data: token, processId: request.processId || 'unknown-process-id' },
    );
    const exp = result?.MetadataKeys?.jwt?.exp;
    if (
      !result?.valid ||
      !result.MetadataKeys ||
      (exp !== undefined && (!Number.isFinite(exp) || exp * 1000 <= Date.now()))
    ) {
      throw new UnauthorizedException('Token is invalid or missing');
    }
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
