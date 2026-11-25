import { randomUUID } from 'node:crypto';

import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ClientGrpc } from '@nestjs/microservices';

import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import {
  NOTIFICATION_SERVICE_NAME,
  type NotificationServiceClient,
} from '@common/interfaces/grpc/notification/v1/notification';
import { requestGrpcData, type GrpcCallContext } from '@common/utils/rpc.util';

import type { AuthConfiguration } from '../../../../configuration/auth.configuration';

const messages = {
  vi: {
    'verify-google': [
      'Xác thực email đăng nhập Google',
      'Mở liên kết trong vòng 30 phút và chọn lại cùng tài khoản Google để hoàn tất đăng ký.',
    ],
    'verify-email': [
      'Xác thực địa chỉ email',
      'Mở liên kết trong vòng 30 phút để hoàn tất đăng ký tài khoản.',
    ],
    'reset-password': [
      'Đặt lại mật khẩu',
      'Mở liên kết trong vòng 30 phút để chọn mật khẩu mới.',
    ],
  },
  en: {
    'verify-google': [
      'Verify your Google sign-in email',
      'Open this link within 30 minutes and select the same Google account to finish registration.',
    ],
    'verify-email': [
      'Verify your email',
      'Open this link within 30 minutes to finish creating your account.',
    ],
    'reset-password': [
      'Reset your password',
      'Open this link within 30 minutes to choose a new password.',
    ],
  },
};

@Injectable()
export class AccountEmailService implements OnModuleInit {
  private notification: NotificationServiceClient;
  private readonly config: AuthConfiguration;

  constructor(
    @Inject(GRPC_SERVICES.NOTIFICATION_SERVICE)
    private readonly client: ClientGrpc,
    configuration: ConfigService,
  ) {
    this.config = configuration.getOrThrow<AuthConfiguration>('AUTH_CONFIG');
  }

  onModuleInit() {
    this.notification = this.client.getService<NotificationServiceClient>(
      NOTIFICATION_SERVICE_NAME,
    );
  }

  async send(
    action: keyof typeof messages.vi,
    email: string,
    token: string,
    language: string,
    context: GrpcCallContext,
  ) {
    const locale = language === 'en' ? 'en' : 'vi';

    if (!this.config.PUBLIC_ORIGIN) {
      throw new ServiceUnavailableException(
        'Email link origin is not configured',
      );
    }

    const link = new URL(
      `/${locale}/auth/${action}`,
      this.config.PUBLIC_ORIGIN,
    );
    link.hash = token;
    const [subject, message] = messages[locale][action];

    await requestGrpcData(
      this.notification.sendEmail,
      {
        to: email,
        subject,
        text: `${message}\n\n${link.href}`,
        idempotencyKey: randomUUID(),
      },
      context,
    );
  }
}
