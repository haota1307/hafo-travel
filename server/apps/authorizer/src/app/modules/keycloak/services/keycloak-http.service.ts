import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import {
  CreateKeycloakUserRequest,
  ExchangeClientTokenResponse,
  ExchangeUserTokenResponse,
} from '@common/interfaces/common';
import type { LoginRequest } from '@common/interfaces/grpc/authorizer/v1/authorizer';

@Injectable()
export class KeycloakHttpService {
  private readonly logger = new Logger(KeycloakHttpService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create({
      baseURL: this.configService.getOrThrow<string>('KEYCLOAK_CONFIG.HOST'),
    });

    this.realm = this.configService.getOrThrow<string>('KEYCLOAK_CONFIG.REALM');
    this.clientId = this.configService.getOrThrow<string>(
      'KEYCLOAK_CONFIG.CLIENT_ID',
    );
    this.clientSecret = this.configService.getOrThrow<string>(
      'KEYCLOAK_CONFIG.CLIENT_SECRET',
    );
  }

  exchangeClientToken(): Promise<ExchangeClientTokenResponse> {
    return this.requestToken<ExchangeClientTokenResponse>({
      grant_type: 'client_credentials',
    });
  }

  async createUser(data: CreateKeycloakUserRequest): Promise<string> {
    const { email, firstName, lastName, password } = data;

    const { access_token: accessToken } = await this.exchangeClientToken();

    const { headers } = await this.axiosInstance.post(
      `/admin/realms/${this.realm}/users`,
      {
        firstName,
        lastName,
        email,
        username: email,
        enabled: true,
        emailVerified: true,
        credentials: password
          ? [
              {
                type: 'password',
                value: password,
                temporary: false,
              },
            ]
          : [],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const location: unknown = headers['location'];

    if (typeof location !== 'string') {
      throw new InternalServerErrorException(
        'Failed to create user in Keycloak',
      );
    }

    const userId = location.split('/').pop();

    if (!userId) {
      throw new InternalServerErrorException(
        'Failed to create user in Keycloak',
      );
    }

    this.logger.log(`Created user in Keycloak with ID: ${userId}`);

    return userId;
  }

  exchangeUserToken(params: LoginRequest): Promise<ExchangeUserTokenResponse> {
    return this.requestToken<ExchangeUserTokenResponse>({
      grant_type: 'password',
      username: params.username,
      password: params.password,
    });
  }

  private async requestToken<T>(
    grant:
      | { grant_type: 'client_credentials' }
      | { grant_type: 'password'; username: string; password: string },
  ): Promise<T> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'openid',
      ...grant,
    });
    const { data } = await this.axiosInstance.post<T>(
      `/realms/${this.realm}/protocol/openid-connect/token`,
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return data;
  }
}
