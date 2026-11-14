import {
  Inject,
  Injectable,
  Logger,
  type OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ClientGrpc } from '@nestjs/microservices';
import { decode, type JwtPayload, verify } from 'jsonwebtoken';
import JwksRsa, { type JwksClient } from 'jwks-rsa';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import {
  type LoginRequest,
  type VerifyUserTokenResponse,
} from '@common/interfaces/grpc/authorizer/v1/authorizer';
import {
  USER_ACCESS_SERVICE_NAME,
  type UserAccessServiceClient,
  type UserProfile,
} from '@common/interfaces/grpc/user-access/v1/user-access';
import { requestGrpcData, type GrpcCallContext } from '@common/utils/rpc.util';

import { KeycloakHttpService } from '../../keycloak/services/keycloak-http.service';

@Injectable()
export class AuthorizerService implements OnModuleInit {
  private readonly logger = new Logger(AuthorizerService.name);
  private readonly jwksClient: JwksClient;
  private users: UserAccessServiceClient;

  constructor(
    private readonly keycloakHttpService: KeycloakHttpService,
    private readonly configService: ConfigService,
    @Inject(GRPC_SERVICES.USER_ACCESS_SERVICE)
    private readonly userAccessClient: ClientGrpc,
  ) {
    const host = this.configService.get<string>('KEYCLOAK_CONFIG.HOST');
    const realm = this.configService.get<string>('KEYCLOAK_CONFIG.REALM');

    this.jwksClient = JwksRsa({
      jwksUri: `${host}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
  }

  onModuleInit() {
    this.users = this.userAccessClient.getService<UserAccessServiceClient>(
      USER_ACCESS_SERVICE_NAME,
    );
  }

  async login(params: LoginRequest) {
    const { username, password } = params;
    const { access_token: accessToken, refresh_token: refreshToken } =
      await this.keycloakHttpService.exchangeUserToken({ username, password });

    return { accessToken, refreshToken };
  }

  async verifyUserToken(
    token: string,
    context: GrpcCallContext,
  ): Promise<VerifyUserTokenResponse> {
    const decodedToken = decode(token, { complete: true });

    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      throw new UnauthorizedException('Invalid token structure');
    }

    try {
      const key = await this.jwksClient.getSigningKey(decodedToken.header.kid);
      const publicKey = key.getPublicKey();
      const payload = verify(token, publicKey, {
        algorithms: ['RS256'],
      }) as JwtPayload;

      if (typeof payload.sub !== 'string' || !payload.sub) {
        throw new UnauthorizedException('Invalid token subject');
      }

      const user = await this.userValidation(payload.sub, context);

      return {
        valid: true,
        metadata: {
          jwtJson: JSON.stringify(payload),
          permissions: [
            ...new Set(user.roles.flatMap((role) => role.permissions)),
          ],
          user,
          userId: user.id,
        },
      };
    } catch {
      this.logger.warn('Token verification failed');

      throw new UnauthorizedException('Invalid token');
    }
  }

  private async userValidation(
    userId: string,
    context: GrpcCallContext,
  ): Promise<UserProfile> {
    const { user } = await requestGrpcData(
      this.users.getUserById,
      { userId },
      context,
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
