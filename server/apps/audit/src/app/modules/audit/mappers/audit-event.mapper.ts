import type { AuditEvent } from '@common/interfaces/grpc/audit/v1/audit';
import type { AuditEventData } from '@common/schemas/audit-event.schema';

export function auditEventProfileMapper(event: AuditEventData): AuditEvent {
  return {
    eventId: event.eventId,
    schemaVersion: event.schemaVersion,
    source: event.source,
    occurredAt: event.occurredAt.toISOString(),
    actor: event.actor,
    action: event.action,
    target: event.target,
    changes: event.changes,
    processId: event.processId,
  };
}
