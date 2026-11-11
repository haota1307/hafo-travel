import type { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export const protobufPackage = 'useraccess.v1';

export const protobufFileName = 'user-access/v1/user-access.proto';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  password: string;
}

export interface CreateUserResponse {
  message: string;
}

export interface GetUserByIdRequest {
  userId: string;
}

export interface GetUserByIdResponse {
  user?: UserProfile | undefined;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: RoleProfile[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleProfile {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export const USERACCESS_V1_PACKAGE_NAME = 'useraccess.v1';

export interface UserAccessServiceClient {
  createUser(
    request: CreateUserRequest,
    metadata?: Metadata,
  ): Observable<CreateUserResponse>;
  getUserById(
    request: GetUserByIdRequest,
    metadata?: Metadata,
  ): Observable<GetUserByIdResponse>;
}

export interface UserAccessServiceController {
  createUser(
    request: CreateUserRequest,
    metadata?: Metadata,
  ):
    | Promise<CreateUserResponse>
    | Observable<CreateUserResponse>
    | CreateUserResponse;
  getUserById(
    request: GetUserByIdRequest,
    metadata?: Metadata,
  ):
    | Promise<GetUserByIdResponse>
    | Observable<GetUserByIdResponse>
    | GetUserByIdResponse;
}

export const USER_ACCESS_SERVICE_NAME = 'UserAccessService';
