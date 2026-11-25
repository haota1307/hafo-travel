import type { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import {
  NOTIFICATION_SERVICE_METHODS,
  NOTIFICATION_SERVICE_NAME,
  type SendEmailRequest,
  type SendEmailResponse,
} from '@common/interfaces/grpc/notification/v1/notification';
import { grpcCallContext } from '@common/utils/rpc.util';

import { NotificationService } from '../services/notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @GrpcMethod(
    NOTIFICATION_SERVICE_NAME,
    NOTIFICATION_SERVICE_METHODS.SEND_EMAIL,
  )
  sendEmail(
    request: SendEmailRequest,
    metadata: Metadata,
    call: ServerUnaryCall<SendEmailRequest, SendEmailResponse>,
  ): Promise<SendEmailResponse> {
    return this.notificationService.sendEmail(
      request,
      grpcCallContext(metadata, call),
    );
  }
}
