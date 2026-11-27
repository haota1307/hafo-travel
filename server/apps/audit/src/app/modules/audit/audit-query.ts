import { Buffer } from 'node:buffer';

import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

import type { AuditTarget } from '@common/schemas/audit-event.schema';

import {
  type AuditAction,
  hasText,
  isAuditAction,
  normalizeAuditTarget,
  parseAuditDate,
} from '@audit/audit-event';

export type AuditListInput = {
  from?: string;
  to?: string;
  action?: string;
  actorUserId?: string;
  target?: AuditTarget;
  limit?: number;
  cursor?: string;
};

type AuditCursor = {
  occurredAt: Date;
  eventId: string;
};

export type AuditQuery = {
  from?: Date;
  to?: Date;
  action?: AuditAction;
  actorUserId?: string;
  target?: AuditTarget;
  limit: number;
  cursor?: AuditCursor;
};

export function normalizeAuditQuery(input: AuditListInput): AuditQuery {
  const { action, actorUserId, target } = input;
  const limit = input.limit ?? 50;
  const from =
    input.from === undefined ? undefined : parseAuditDate(input.from);
  const to = input.to === undefined ? undefined : parseAuditDate(input.to);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('Audit page size must be between 1 and 100');
  }
  if (action !== undefined && !isAuditAction(action)) {
    throw new BadRequestException('Invalid audit action');
  }
  if (actorUserId !== undefined && !hasText(actorUserId)) {
    throw new BadRequestException('Invalid audit actor');
  }
  if (from && to && from >= to) {
    throw new BadRequestException('Audit date range must have from before to');
  }

  return {
    from,
    to,
    action,
    actorUserId,
    target: target && normalizeAuditTarget(target),
    limit,
    cursor: input.cursor === undefined ? undefined : decodeCursor(input.cursor),
  };
}

export function encodeAuditCursor({
  occurredAt,
  eventId,
}: AuditCursor): string {
  return Buffer.from(`${occurredAt.toISOString()}|${eventId}`).toString(
    'base64url',
  );
}

function decodeCursor(cursor: string): AuditCursor {
  if (cursor.length > 100) {
    throw new BadRequestException('Invalid audit cursor');
  }

  const [iso, eventId, extra] = Buffer.from(cursor, 'base64url')
    .toString('utf8')
    .split('|');

  if (extra !== undefined || !eventId || !isUUID(eventId)) {
    throw new BadRequestException('Invalid audit cursor');
  }

  const position = { occurredAt: parseAuditDate(iso), eventId };

  if (encodeAuditCursor(position) !== cursor) {
    throw new BadRequestException('Invalid audit cursor');
  }

  return position;
}
