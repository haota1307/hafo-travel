import type { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export const protobufPackage = 'notification.v1';

export const protobufFileName = 'notification/v1/notification.proto';

export interface SendEmailRequest {
  to: string;
  subject: string;
  text?: string | undefined;
  html?: string | undefined;
  idempotencyKey: string;
}

export interface SendEmailResponse {
  emailId: string;
}

export const NOTIFICATION_V1_PACKAGE_NAME = 'notification.v1';

export interface NotificationServiceClient {
  sendEmail(
    request: SendEmailRequest,
    metadata?: Metadata,
  ): Observable<SendEmailResponse>;
}

export interface NotificationServiceController {
  sendEmail(
    request: SendEmailRequest,
    metadata?: Metadata,
  ):
    | Promise<SendEmailResponse>
    | Observable<SendEmailResponse>
    | SendEmailResponse;
}

export const NOTIFICATION_SERVICE_NAME = 'NotificationService';

export const NOTIFICATION_SERVICE_METHODS = {
  SEND_EMAIL: 'SendEmail',
} as const;
