import { createHmac, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isEmail } from 'class-validator';
import { OAuth2Client } from 'google-auth-library';

import type {
  EmailActionRequest,
  GoogleLoginRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '@common/interfaces/grpc/identity/v1/identity';
import type { UserWithRoles } from '@common/schemas/user.schema';
import {
  hashPassword,
  isProvisioningPasswordValid,
} from '@common/utils/password.util';
import type { GrpcCallContext } from '@common/utils/rpc.util';

import { AccountRepository } from '@identity/auth/repositories/account.repository';
import { AccountEmailService } from '@identity/auth/services/account-email.service';
import { AuthService } from '@identity/auth/services/auth.service';
import type { AuthConfiguration } from '@identity/config/auth.configuration';
import { UserService } from '@identity/user/services/user.service';

type EmailAction = 'verify-email' | 'reset-password' | 'verify-google';

function duplicateKey(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class AccountService {
  private readonly google = new OAuth2Client();
  private readonly config: AuthConfiguration;
  private readonly actionKey: Buffer;

  constructor(
    private readonly accounts: AccountRepository,
    private readonly users: UserService,
    private readonly sessions: AuthService,
    private readonly mail: AccountEmailService,
    private readonly jwt: JwtService,
    configuration: ConfigService,
  ) {
    this.config = configuration.getOrThrow<AuthConfiguration>('AUTH_CONFIG');
    this.actionKey = createHmac('sha256', this.config.RF_TOKEN_KEY)
      .update('identity/email-actions/v1')
      .digest();
  }

  async register(
    { email, locale }: EmailActionRequest,
    context: GrpcCallContext,
  ) {
    const address = email.trim().toLowerCase();

    if (!isEmail(address) || address.length > 254) {
      throw new BadRequestException('Invalid email');
    }
    if (await this.accounts.existingEmail(address)) {
      return {};
    }

    const token = await this.issueToken('verify-email', address);
    await this.mail.send('verify-email', address, token, locale, context);

    return {};
  }

  async verifyEmail({
    token,
    password,
    firstName,
    lastName,
  }: VerifyEmailRequest) {
    const { sub: email } = await this.readToken('verify-email', token);

    if (
      !isProvisioningPasswordValid(password) ||
      !firstName.trim() ||
      !lastName.trim() ||
      firstName.length > 100 ||
      lastName.length > 100
    ) {
      throw new BadRequestException('Invalid account details');
    }
    if (await this.accounts.existingEmail(email)) {
      throw new BadRequestException('Invalid or used link');
    }

    try {
      await this.accounts.createClient({
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash: await hashPassword(password),
      });
    } catch (error) {
      if (duplicateKey(error)) {
        throw new BadRequestException('Invalid or used link');
      }

      throw error;
    }

    return {};
  }

  async forgotPassword(
    { email, locale }: EmailActionRequest,
    context: GrpcCallContext,
  ) {
    const user = await this.users.getAuthProfileByEmail(email.trim());

    if (user?.passwordHash && user.userId) {
      const token = await this.issueToken(
        'reset-password',
        user._id.toHexString(),
        { version: user.credentialVersion },
      );
      await this.mail.send(
        'reset-password',
        user.email,
        token,
        locale,
        context,
      );
    }

    return {};
  }

  async resetPassword({ token, password }: ResetPasswordRequest) {
    const { sub, version } = await this.readToken('reset-password', token);

    if (!isProvisioningPasswordValid(password)) {
      throw new BadRequestException('Invalid password');
    }

    const updated = await this.accounts.replacePassword(
      sub,
      version,
      await hashPassword(password),
    );

    if (!updated) {
      throw new BadRequestException('Invalid or used link');
    }

    return {};
  }

  async googleLogin(
    { credential, emailToken, locale }: GoogleLoginRequest,
    context: GrpcCallContext,
  ) {
    if (!this.config.GOOGLE_CLIENT_ID) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }

    const ticket = await this.google
      .verifyIdToken({
        idToken: credential,
        audience: this.config.GOOGLE_CLIENT_ID,
      })
      .catch(() => {
        throw new UnauthorizedException('Invalid Google credential');
      });
    const profile = ticket.getPayload();

    if (
      !profile?.sub ||
      profile.email_verified !== true ||
      !profile.email ||
      !isEmail(profile.email)
    ) {
      throw new UnauthorizedException('Google email verification required');
    }

    const email = profile.email.toLowerCase();

    if (emailToken) {
      const claims = await this.readToken('verify-google', emailToken);

      if (claims.sub !== profile.sub || claims.email !== email) {
        throw new BadRequestException(
          'Invalid confirmation link or Google account',
        );
      }
    }

    const lookupStartedAt = Date.now();
    let user: UserWithRoles | null = await this.accounts.byGoogleSubject(
      profile.sub,
    );

    if (!user) {
      if (!emailToken && !email.endsWith('@gmail.com') && !profile.hd) {
        const confirmation = await this.issueToken(
          'verify-google',
          profile.sub,
          { email },
        );
        await this.mail.send(
          'verify-google',
          email,
          confirmation,
          locale || 'vi',
          context,
        );

        throw new ForbiddenException('GOOGLE_EMAIL_CONFIRMATION_REQUIRED');
      }

      try {
        if (!(await this.accounts.existingEmail(email))) {
          user = await this.accounts.createClient({
            email,
            googleSubject: profile.sub,
            firstName:
              profile.given_name || profile.name || email.split('@')[0],
            lastName: profile.family_name || '',
          });
        }
      } catch (error) {
        if (!duplicateKey(error)) {
          throw error;
        }
      }

      if (!user) {
        try {
          user = await this.accounts.linkRegisteredAccount(email, profile.sub);
        } catch (error) {
          if (!duplicateKey(error)) {
            throw error;
          }
        }

        user ??= await this.accounts.byGoogleSubject(profile.sub);
      }

      if (!user) {
        throw new ConflictException(
          'Use the existing sign-in method for this email',
        );
      }
    }

    return this.sessions.startSession(user, lookupStartedAt);
  }

  private issueToken(
    action: EmailAction,
    subject: string,
    claims: { version?: string; email?: string } = {},
  ) {
    return this.jwt.signAsync(
      { ...claims, version: claims.version ?? '', jti: randomUUID() },
      {
        secret: this.actionKey,
        algorithm: 'HS256',
        audience: action,
        subject,
        expiresIn: 1800,
      },
    );
  }

  private async readToken(action: EmailAction, token: string) {
    try {
      const claims = await this.jwt.verifyAsync<{
        sub: string;
        version: string;
        email?: string;
      }>(token, {
        secret: this.actionKey,
        algorithms: ['HS256'],
        audience: action,
        maxAge: 1800,
      });

      if (
        typeof claims.sub === 'string' &&
        claims.sub &&
        typeof claims.version === 'string'
      ) {
        return claims;
      }
    } catch {
      throw new BadRequestException('Invalid or expired link');
    }

    throw new BadRequestException('Invalid or expired link');
  }
}
