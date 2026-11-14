import type { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

import { UserProfile } from '../../user-access/v1/user-access';

export const protobufPackage = 'authorizer.v1';

export const protobufFileName = 'authorizer/v1/authorizer.proto';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyUserTokenRequest {
  token: string;
}

export interface VerifyUserTokenResponse {
  valid: boolean;
  metadata?: AuthorizedMetadata | undefined;
}

export interface AuthorizedMetadata {
  userId: string;
  user?: UserProfile | undefined;
  permissions: string[];
  jwtJson: string;
}

export interface CreateKeycloakUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface CreateKeycloakUserResponse {
  userId: string;
}

export const AUTHORIZER_V1_PACKAGE_NAME = 'authorizer.v1';

export interface AuthorizerServiceClient {
  login(request: LoginRequest, metadata?: Metadata): Observable<LoginResponse>;
  verifyUserToken(
    request: VerifyUserTokenRequest,
    metadata?: Metadata,
  ): Observable<VerifyUserTokenResponse>;
  createKeycloakUser(
    request: CreateKeycloakUserRequest,
    metadata?: Metadata,
  ): Observable<CreateKeycloakUserResponse>;
}

export interface AuthorizerServiceController {
  login(
    request: LoginRequest,
    metadata?: Metadata,
  ): Promise<LoginResponse> | Observable<LoginResponse> | LoginResponse;
  verifyUserToken(
    request: VerifyUserTokenRequest,
    metadata?: Metadata,
  ):
    | Promise<VerifyUserTokenResponse>
    | Observable<VerifyUserTokenResponse>
    | VerifyUserTokenResponse;
  createKeycloakUser(
    request: CreateKeycloakUserRequest,
    metadata?: Metadata,
  ):
    | Promise<CreateKeycloakUserResponse>
    | Observable<CreateKeycloakUserResponse>
    | CreateKeycloakUserResponse;
}

export const AUTHORIZER_SERVICE_NAME = 'AuthorizerService';

export const AUTHORIZER_SERVICE_METHODS = {
  LOGIN: 'Login',
  VERIFY_USER_TOKEN: 'VerifyUserToken',
  CREATE_KEYCLOAK_USER: 'CreateKeycloakUser',
} as const;
