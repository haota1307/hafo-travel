import type { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import {
  IDENTITY_SERVICE_NAME,
  IDENTITY_SERVICE_METHODS,
  type EmailActionRequest,
  type GoogleLoginRequest,
  type InviteInternalUserRequest,
  type ResendInternalUserInvitationRequest,
  type VerifyEmailRequest,
  type ResetPasswordRequest,
} from '@common/interfaces/grpc/identity/v1/identity';
import { grpcCallContext } from '@common/utils/rpc.util';

import { AccountService } from '@identity/auth/services/account.service';

@Controller()
export class AccountController {
  constructor(private readonly accounts: AccountService) {}

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.REGISTER)
  register(
    request: EmailActionRequest,
    metadata: Metadata,
    call: ServerUnaryCall<EmailActionRequest, unknown>,
  ) {
    return this.accounts.register(request, grpcCallContext(metadata, call));
  }

  @GrpcMethod(
    IDENTITY_SERVICE_NAME,
    IDENTITY_SERVICE_METHODS.INVITE_INTERNAL_USER,
  )
  inviteInternalUser(
    request: InviteInternalUserRequest,
    metadata: Metadata,
    call: ServerUnaryCall<InviteInternalUserRequest, unknown>,
  ) {
    return this.accounts.inviteInternalUser(
      request,
      grpcCallContext(metadata, call),
    );
  }

  @GrpcMethod(
    IDENTITY_SERVICE_NAME,
    IDENTITY_SERVICE_METHODS.RESEND_INTERNAL_USER_INVITATION,
  )
  resendInternalUserInvitation(
    request: ResendInternalUserInvitationRequest,
    metadata: Metadata,
    call: ServerUnaryCall<ResendInternalUserInvitationRequest, unknown>,
  ) {
    return this.accounts.resendInternalUserInvitation(
      request,
      grpcCallContext(metadata, call),
    );
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.ACCEPT_INVITATION)
  acceptInvitation(request: ResetPasswordRequest) {
    return this.accounts.acceptInvitation(request);
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.FORGOT_PASSWORD)
  forgotPassword(
    request: EmailActionRequest,
    metadata: Metadata,
    call: ServerUnaryCall<EmailActionRequest, unknown>,
  ) {
    return this.accounts.forgotPassword(
      request,
      grpcCallContext(metadata, call),
    );
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.VERIFY_EMAIL)
  verifyEmail(request: VerifyEmailRequest) {
    return this.accounts.verifyEmail(request);
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.RESET_PASSWORD)
  resetPassword(request: ResetPasswordRequest) {
    return this.accounts.resetPassword(request);
  }

  @GrpcMethod(IDENTITY_SERVICE_NAME, IDENTITY_SERVICE_METHODS.GOOGLE_LOGIN)
  googleLogin(
    request: GoogleLoginRequest,
    metadata: Metadata,
    call: ServerUnaryCall<GoogleLoginRequest, unknown>,
  ) {
    return this.accounts.googleLogin(request, grpcCallContext(metadata, call));
  }
}
