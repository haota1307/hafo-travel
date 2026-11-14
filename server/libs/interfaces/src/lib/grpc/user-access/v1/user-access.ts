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

export interface SetUserRolesRequest {
  userId: string;
  roles: string[];
}

export interface ListRolesRequest {}

export interface ListRolesResponse {
  roles: RoleProfile[];
}

export interface RoleIdRequest {
  id: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface RoleResponse {
  role?: RoleProfile | undefined;
}

export interface DeleteRoleResponse {
  message: string;
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
  setUserRoles(
    request: SetUserRolesRequest,
    metadata?: Metadata,
  ): Observable<GetUserByIdResponse>;
  listRoles(
    request: ListRolesRequest,
    metadata?: Metadata,
  ): Observable<ListRolesResponse>;
  getRole(
    request: RoleIdRequest,
    metadata?: Metadata,
  ): Observable<RoleResponse>;
  createRole(
    request: CreateRoleRequest,
    metadata?: Metadata,
  ): Observable<RoleResponse>;
  updateRole(
    request: UpdateRoleRequest,
    metadata?: Metadata,
  ): Observable<RoleResponse>;
  deleteRole(
    request: RoleIdRequest,
    metadata?: Metadata,
  ): Observable<DeleteRoleResponse>;
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
  setUserRoles(
    request: SetUserRolesRequest,
    metadata?: Metadata,
  ):
    | Promise<GetUserByIdResponse>
    | Observable<GetUserByIdResponse>
    | GetUserByIdResponse;
  listRoles(
    request: ListRolesRequest,
    metadata?: Metadata,
  ):
    | Promise<ListRolesResponse>
    | Observable<ListRolesResponse>
    | ListRolesResponse;
  getRole(
    request: RoleIdRequest,
    metadata?: Metadata,
  ): Promise<RoleResponse> | Observable<RoleResponse> | RoleResponse;
  createRole(
    request: CreateRoleRequest,
    metadata?: Metadata,
  ): Promise<RoleResponse> | Observable<RoleResponse> | RoleResponse;
  updateRole(
    request: UpdateRoleRequest,
    metadata?: Metadata,
  ): Promise<RoleResponse> | Observable<RoleResponse> | RoleResponse;
  deleteRole(
    request: RoleIdRequest,
    metadata?: Metadata,
  ):
    | Promise<DeleteRoleResponse>
    | Observable<DeleteRoleResponse>
    | DeleteRoleResponse;
}

export const USER_ACCESS_SERVICE_NAME = 'UserAccessService';

export const USER_ACCESS_SERVICE_METHODS = {
  CREATE_USER: 'CreateUser',
  GET_USER_BY_ID: 'GetUserById',
  SET_USER_ROLES: 'SetUserRoles',
  LIST_ROLES: 'ListRoles',
  GET_ROLE: 'GetRole',
  CREATE_ROLE: 'CreateRole',
  UPDATE_ROLE: 'UpdateRole',
  DELETE_ROLE: 'DeleteRole',
} as const;
