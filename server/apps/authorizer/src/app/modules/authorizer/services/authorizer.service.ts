import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { requestTcpData } from '@common/utils/rpc.util';
import { ConfigService } from '@nestjs/config';
import JwksRsa, { JwksClient } from 'jwks-rsa';
import { decode, JwtPayload, verify } from 'jsonwebtoken';

import {
  AuthorizeResponse,
  LoginTcpRequest,
} from '@common/interfaces/tcp/authorizer';
import { UserWithRoles } from '@common/schemas/user.schema';
import { TCP_SERVICES } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { KeycloakHttpService } from '../../keycloak/services/keycloak-http.service';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';

@Injectable()
export class AuthorizerService {
  private readonly logger = new Logger(AuthorizerService.name);
  private jwksClient: JwksClient;

  constructor(
    private readonly keycloakHttpService: KeycloakHttpService,
    private readonly configService: ConfigService,
    @Inject(TCP_SERVICES.USER_ACCESS_SERVICE)
    private readonly userAccessClient: TcpClient,
  ) {
    const host = this.configService.get<string>('KEYCLOAK_CONFIG.HOST');
    const realm = this.configService.get<string>('KEYCLOAK_CONFIG.REALM');

    this.jwksClient = JwksRsa({
      jwksUri: `${host}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
  }

  async login(params: LoginTcpRequest) {
    const { username, password } = params;

    const { access_token: accessToken, refresh_token: refreshToken } =
      await this.keycloakHttpService.exchangeUserToken({ username, password });

    return { accessToken, refreshToken };
  }

  async verifyUserToken(
    token: string,
    processId: string,
  ): Promise<AuthorizeResponse> {
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

      const user = await this.userValidation(payload.sub, processId);

      return {
        valid: true,
        MetadataKeys: {
          jwt: payload,
          permissions: user.roles.map((role) => role.permissions).flat(),
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
    processId: string,
  ): Promise<UserWithRoles> {
    const user = await this.getUserByUserId(userId, processId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private getUserByUserId(userId: string, processId: string) {
    return requestTcpData<UserWithRoles | null, string>(
      this.userAccessClient,
      TCP_REQUEST_MESSAGE.USER.GET_BY_ID,
      { data: userId, processId },
    );
  }
}
