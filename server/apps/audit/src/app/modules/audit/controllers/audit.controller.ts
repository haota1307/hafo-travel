import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import {
  type AppendAuditEventRequest,
  type AppendAuditEventResponse,
  AUDIT_SERVICE_METHODS,
  AUDIT_SERVICE_NAME,
  type ListAuditEventsRequest,
  type ListAuditEventsResponse,
} from '@common/interfaces/grpc/audit/v1/audit';

import { auditEventProfileMapper } from '@audit/mappers/audit-event.mapper';
import { AuditService } from '@audit/services/audit.service';

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @GrpcMethod(AUDIT_SERVICE_NAME, AUDIT_SERVICE_METHODS.APPEND_AUDIT_EVENT)
  appendAuditEvent(
    request: AppendAuditEventRequest,
  ): Promise<AppendAuditEventResponse> {
    return this.auditService.appendAuditEvent(request.event);
  }

  @GrpcMethod(AUDIT_SERVICE_NAME, AUDIT_SERVICE_METHODS.LIST_AUDIT_EVENTS)
  async listAuditEvents(
    request: ListAuditEventsRequest,
  ): Promise<ListAuditEventsResponse> {
    const { events, nextCursor } =
      await this.auditService.listAuditEvents(request);

    return { events: events.map(auditEventProfileMapper), nextCursor };
  }
}
