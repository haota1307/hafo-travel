import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';

import type {
  SendEmailRequest,
  SendEmailResponse,
} from '@common/interfaces/grpc/notification/v1/notification';
import { RPC_TIMEOUT_MS, type GrpcCallContext } from '@common/utils/rpc.util';

import type { EmailConfiguration } from '@notification/config/email.configuration';

@Injectable()
export class NotificationService {
  private readonly config: EmailConfiguration;

  constructor(configuration: ConfigService) {
    this.config = configuration.getOrThrow<EmailConfiguration>('EMAIL_CONFIG');
  }

  async sendEmail(
    request: SendEmailRequest,
    context: GrpcCallContext,
  ): Promise<SendEmailResponse> {
    const to = request.to.trim();
    const subject = request.subject.trim();
    const { text, html, idempotencyKey } = request;

    if (!isEmail(to) || !subject || (!text?.trim() && !html?.trim())) {
      throw new BadRequestException(
        'A recipient, subject and email body are required',
      );
    }
    if (!/^[!-~]{1,256}$/.test(idempotencyKey)) {
      throw new BadRequestException('Invalid email idempotency key');
    }
    if (!this.config.API_KEY || !this.config.FROM) {
      throw new ServiceUnavailableException('Email sending is not configured');
    }

    const remaining = Math.min(
      RPC_TIMEOUT_MS,
      Number(context.deadline ?? Infinity) - Date.now(),
    );

    if (remaining <= 0) {
      throw new GatewayTimeoutException();
    }

    const signal = AbortSignal.timeout(remaining);
    let response: Response;
    let result: unknown;

    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          from: this.config.FROM,
          to,
          subject,
          text,
          html,
        }),
        signal,
      });

      if (response.ok) {
        result = await response.json();
      } else {
        await response.body?.cancel();
      }
    } catch {
      if (signal.aborted) {
        throw new GatewayTimeoutException();
      }

      throw new ServiceUnavailableException();
    }

    if (response.status === 409) {
      throw new ConflictException(
        'Email request conflicts with an existing send',
      );
    }
    if (response.status === 429 || response.status >= 500) {
      throw new ServiceUnavailableException();
    }
    if (
      !result ||
      typeof result !== 'object' ||
      !('id' in result) ||
      typeof result.id !== 'string' ||
      !result.id
    ) {
      throw new BadGatewayException();
    }

    return { emailId: result.id };
  }
}
