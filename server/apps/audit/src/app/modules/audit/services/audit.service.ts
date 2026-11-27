import { isDeepStrictEqual } from 'node:util';

import { ConflictException, Injectable } from '@nestjs/common';

import { type AuditEventInput, normalizeAuditEvent } from '@audit/audit-event';
import {
  type AuditListInput,
  encodeAuditCursor,
  normalizeAuditQuery,
} from '@audit/audit-query';
import { AuditRepository } from '@audit/repositories/audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async appendAuditEvent(input?: AuditEventInput) {
    const event = normalizeAuditEvent(input);

    try {
      await this.auditRepository.create(event);

      return { eventId: event.eventId, duplicate: false };
    } catch (error) {
      if (!this.isDuplicateEventId(error)) {
        throw error;
      }

      const existing = await this.auditRepository.getByEventId(event.eventId);

      if (!existing) {
        throw error;
      }
      if (!isDeepStrictEqual(existing, event)) {
        throw new ConflictException('Audit event ID is already in use');
      }

      return { eventId: event.eventId, duplicate: true };
    }
  }

  async listAuditEvents(input: AuditListInput) {
    const query = normalizeAuditQuery(input);
    const results = await this.auditRepository.list(query);
    const events = results.slice(0, query.limit);
    const nextCursor =
      results.length > query.limit
        ? encodeAuditCursor(events[query.limit - 1])
        : undefined;

    return { events, nextCursor };
  }

  private isDuplicateEventId(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000 &&
      'keyPattern' in error &&
      typeof error.keyPattern === 'object' &&
      error.keyPattern !== null &&
      Object.hasOwn(error.keyPattern, 'eventId')
    );
  }
}
