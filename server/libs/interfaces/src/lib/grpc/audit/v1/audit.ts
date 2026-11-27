import type { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export const protobufPackage = 'audit.v1';

export const protobufFileName = 'audit/v1/audit.proto';

export interface AuditActor {
  userId: string;
}

export interface AuditTarget {
  type: string;
  id: string;
}

export interface AuditRoleReference {
  id: string;
  name: string;
}

export interface AuditRoleSnapshot {
  name: string;
  description: string;
  permissions: string[];
}

export interface AuditTextChange {
  before?: string | undefined;
  after?: string | undefined;
}

export interface AuditPermissionChange {
  added: string[];
  removed: string[];
}

export interface AuditRoleUpdate {
  name?: AuditTextChange | undefined;
  description?: AuditTextChange | undefined;
  permissions?: AuditPermissionChange | undefined;
}

export interface AuditUserRoleChange {
  before?: AuditRoleReference | undefined;
  after?: AuditRoleReference | undefined;
}

export interface AuditChanges {
  roleCreated?: AuditRoleSnapshot | undefined;
  roleUpdated?: AuditRoleUpdate | undefined;
  roleDeleted?: AuditRoleSnapshot | undefined;
  userCreated?: AuditRoleReference | undefined;
  userRolesAssigned?: AuditUserRoleChange | undefined;
}

export interface AuditEvent {
  eventId: string;
  schemaVersion: number;
  source: string;
  occurredAt: string;
  actor?: AuditActor | undefined;
  action: string;
  target?: AuditTarget | undefined;
  changes?: AuditChanges | undefined;
  processId: string;
}

export interface AppendAuditEventRequest {
  event?: AuditEvent | undefined;
}

export interface AppendAuditEventResponse {
  eventId: string;
  duplicate: boolean;
}

export interface ListAuditEventsRequest {
  from?: string | undefined;
  to?: string | undefined;
  action?: string | undefined;
  actorUserId?: string | undefined;
  target?: AuditTarget | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}

export interface ListAuditEventsResponse {
  events: AuditEvent[];
  nextCursor?: string | undefined;
}

export const AUDIT_V1_PACKAGE_NAME = 'audit.v1';

export interface AuditServiceClient {
  appendAuditEvent(
    request: AppendAuditEventRequest,
    metadata?: Metadata,
  ): Observable<AppendAuditEventResponse>;
  listAuditEvents(
    request: ListAuditEventsRequest,
    metadata?: Metadata,
  ): Observable<ListAuditEventsResponse>;
}

export interface AuditServiceController {
  appendAuditEvent(
    request: AppendAuditEventRequest,
    metadata?: Metadata,
  ):
    | Promise<AppendAuditEventResponse>
    | Observable<AppendAuditEventResponse>
    | AppendAuditEventResponse;
  listAuditEvents(
    request: ListAuditEventsRequest,
    metadata?: Metadata,
  ):
    | Promise<ListAuditEventsResponse>
    | Observable<ListAuditEventsResponse>
    | ListAuditEventsResponse;
}

export const AUDIT_SERVICE_NAME = 'AuditService';

export const AUDIT_SERVICE_METHODS = {
  APPEND_AUDIT_EVENT: 'AppendAuditEvent',
  LIST_AUDIT_EVENTS: 'ListAuditEvents',
} as const;
