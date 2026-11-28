import type { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export const protobufPackage = 'identity.v1';

export const protobufFileName = 'identity/v1/identity.proto';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

export interface CreateUserResponse {
  message: string;
}

export interface GetUserByIdRequest {
  userId: string;
}

export interface GetUserByIdResponse {
  user?: UserProfile | undefined;
  locked?: boolean | undefined;
  accessVersion?: string | undefined;
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
  displayName?: string | undefined;
  memberCount?: number | undefined;
  displayNameVi?: string | undefined;
  displayNameEn?: string | undefined;
}

export interface SetUserRolesRequest {
  userId: string;
  roles: string[];
}

export interface InternalUserRole {
  id: string;
  name: string;
  displayName?: string | undefined;
  displayNameVi?: string | undefined;
  displayNameEn?: string | undefined;
}

export interface InternalUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: InternalUserRole | undefined;
  status: string;
  accessProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListInternalUsersRequest {
  actorUserId: string;
}

export interface ListInternalUsersResponse {
  users: InternalUser[];
}

export interface InternalUserTarget {
  userId: string;
  actorUserId: string;
}

export interface InternalUserResponse {
  user?: InternalUser | undefined;
}

export interface UpdateInternalUserRequest {
  userId: string;
  actorUserId: string;
  firstName: string;
  lastName: string;
}

export interface SetInternalUserRoleRequest {
  userId: string;
  actorUserId: string;
  roles: string[];
}

export interface SetInternalUserStatusRequest {
  userId: string;
  actorUserId: string;
  locked: boolean;
}

export interface InviteInternalUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  locale: string;
  actorUserId: string;
}

export interface ResendInternalUserInvitationRequest {
  userId: string;
  actorUserId: string;
  locale: string;
}

export interface InternalUserInvitationResponse {
  user?: InternalUser | undefined;
  invitationDelivery: string;
}

export type ListRolesRequest = Record<string, never>;

export interface ListRolesResponse {
  roles: RoleProfile[];
}

export interface RoleIdRequest {
  id: string;
  includeMemberCount?: boolean | undefined;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
  displayName?: string | undefined;
  displayNameVi?: string | undefined;
  displayNameEn?: string | undefined;
}

export interface UpdateRoleRequest {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  displayName?: string | undefined;
  displayNameVi?: string | undefined;
  displayNameEn?: string | undefined;
}

export interface RoleResponse {
  role?: RoleProfile | undefined;
}

export interface DeleteRoleResponse {
  message: string;
}

export interface EmailActionRequest {
  email: string;
  locale: string;
}

export interface VerifyEmailRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface GoogleLoginRequest {
  credential: string;
  emailToken?: string | undefined;
  locale?: string | undefined;
}

export type AccountActionResponse = Record<string, never>;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

export interface RefreshSessionRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export type LogoutResponse = Record<string, never>;

export const IDENTITY_V1_PACKAGE_NAME = 'identity.v1';

export interface IdentityServiceClient {
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
  listInternalUsers(
    request: ListInternalUsersRequest,
    metadata?: Metadata,
  ): Observable<ListInternalUsersResponse>;
  getInternalUser(
    request: InternalUserTarget,
    metadata?: Metadata,
  ): Observable<InternalUserResponse>;
  updateInternalUser(
    request: UpdateInternalUserRequest,
    metadata?: Metadata,
  ): Observable<InternalUserResponse>;
  setInternalUserRole(
    request: SetInternalUserRoleRequest,
    metadata?: Metadata,
  ): Observable<InternalUserResponse>;
  setInternalUserStatus(
    request: SetInternalUserStatusRequest,
    metadata?: Metadata,
  ): Observable<InternalUserResponse>;
  inviteInternalUser(
    request: InviteInternalUserRequest,
    metadata?: Metadata,
  ): Observable<InternalUserInvitationResponse>;
  resendInternalUserInvitation(
    request: ResendInternalUserInvitationRequest,
    metadata?: Metadata,
  ): Observable<InternalUserInvitationResponse>;
  acceptInvitation(
    request: ResetPasswordRequest,
    metadata?: Metadata,
  ): Observable<AccountActionResponse>;
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
  register(
    request: EmailActionRequest,
    metadata?: Metadata,
  ): Observable<AccountActionResponse>;
  verifyEmail(
    request: VerifyEmailRequest,
    metadata?: Metadata,
  ): Observable<AccountActionResponse>;
  forgotPassword(
    request: EmailActionRequest,
    metadata?: Metadata,
  ): Observable<AccountActionResponse>;
  resetPassword(
    request: ResetPasswordRequest,
    metadata?: Metadata,
  ): Observable<AccountActionResponse>;
  googleLogin(
    request: GoogleLoginRequest,
    metadata?: Metadata,
  ): Observable<AuthTokenPair>;
  login(request: LoginRequest, metadata?: Metadata): Observable<AuthTokenPair>;
  refreshSession(
    request: RefreshSessionRequest,
    metadata?: Metadata,
  ): Observable<AuthTokenPair>;
  logout(
    request: LogoutRequest,
    metadata?: Metadata,
  ): Observable<LogoutResponse>;
}

export interface IdentityServiceController {
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
  listInternalUsers(
    request: ListInternalUsersRequest,
    metadata?: Metadata,
  ):
    | Promise<ListInternalUsersResponse>
    | Observable<ListInternalUsersResponse>
    | ListInternalUsersResponse;
  getInternalUser(
    request: InternalUserTarget,
    metadata?: Metadata,
  ):
    | Promise<InternalUserResponse>
    | Observable<InternalUserResponse>
    | InternalUserResponse;
  updateInternalUser(
    request: UpdateInternalUserRequest,
    metadata?: Metadata,
  ):
    | Promise<InternalUserResponse>
    | Observable<InternalUserResponse>
    | InternalUserResponse;
  setInternalUserRole(
    request: SetInternalUserRoleRequest,
    metadata?: Metadata,
  ):
    | Promise<InternalUserResponse>
    | Observable<InternalUserResponse>
    | InternalUserResponse;
  setInternalUserStatus(
    request: SetInternalUserStatusRequest,
    metadata?: Metadata,
  ):
    | Promise<InternalUserResponse>
    | Observable<InternalUserResponse>
    | InternalUserResponse;
  inviteInternalUser(
    request: InviteInternalUserRequest,
    metadata?: Metadata,
  ):
    | Promise<InternalUserInvitationResponse>
    | Observable<InternalUserInvitationResponse>
    | InternalUserInvitationResponse;
  resendInternalUserInvitation(
    request: ResendInternalUserInvitationRequest,
    metadata?: Metadata,
  ):
    | Promise<InternalUserInvitationResponse>
    | Observable<InternalUserInvitationResponse>
    | InternalUserInvitationResponse;
  acceptInvitation(
    request: ResetPasswordRequest,
    metadata?: Metadata,
  ):
    | Promise<AccountActionResponse>
    | Observable<AccountActionResponse>
    | AccountActionResponse;
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
  register(
    request: EmailActionRequest,
    metadata?: Metadata,
  ):
    | Promise<AccountActionResponse>
    | Observable<AccountActionResponse>
    | AccountActionResponse;
  verifyEmail(
    request: VerifyEmailRequest,
    metadata?: Metadata,
  ):
    | Promise<AccountActionResponse>
    | Observable<AccountActionResponse>
    | AccountActionResponse;
  forgotPassword(
    request: EmailActionRequest,
    metadata?: Metadata,
  ):
    | Promise<AccountActionResponse>
    | Observable<AccountActionResponse>
    | AccountActionResponse;
  resetPassword(
    request: ResetPasswordRequest,
    metadata?: Metadata,
  ):
    | Promise<AccountActionResponse>
    | Observable<AccountActionResponse>
    | AccountActionResponse;
  googleLogin(
    request: GoogleLoginRequest,
    metadata?: Metadata,
  ): Promise<AuthTokenPair> | Observable<AuthTokenPair> | AuthTokenPair;
  login(
    request: LoginRequest,
    metadata?: Metadata,
  ): Promise<AuthTokenPair> | Observable<AuthTokenPair> | AuthTokenPair;
  refreshSession(
    request: RefreshSessionRequest,
    metadata?: Metadata,
  ): Promise<AuthTokenPair> | Observable<AuthTokenPair> | AuthTokenPair;
  logout(
    request: LogoutRequest,
    metadata?: Metadata,
  ): Promise<LogoutResponse> | Observable<LogoutResponse> | LogoutResponse;
}

export const IDENTITY_SERVICE_NAME = 'IdentityService';

export const IDENTITY_SERVICE_METHODS = {
  CREATE_USER: 'CreateUser',
  GET_USER_BY_ID: 'GetUserById',
  SET_USER_ROLES: 'SetUserRoles',
  LIST_INTERNAL_USERS: 'ListInternalUsers',
  GET_INTERNAL_USER: 'GetInternalUser',
  UPDATE_INTERNAL_USER: 'UpdateInternalUser',
  SET_INTERNAL_USER_ROLE: 'SetInternalUserRole',
  SET_INTERNAL_USER_STATUS: 'SetInternalUserStatus',
  INVITE_INTERNAL_USER: 'InviteInternalUser',
  RESEND_INTERNAL_USER_INVITATION: 'ResendInternalUserInvitation',
  ACCEPT_INVITATION: 'AcceptInvitation',
  LIST_ROLES: 'ListRoles',
  GET_ROLE: 'GetRole',
  CREATE_ROLE: 'CreateRole',
  UPDATE_ROLE: 'UpdateRole',
  DELETE_ROLE: 'DeleteRole',
  REGISTER: 'Register',
  VERIFY_EMAIL: 'VerifyEmail',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',
  GOOGLE_LOGIN: 'GoogleLogin',
  LOGIN: 'Login',
  REFRESH_SESSION: 'RefreshSession',
  LOGOUT: 'Logout',
} as const;
