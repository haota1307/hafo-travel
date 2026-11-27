import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Types } from 'mongoose';

import type {
  AuditActor,
  AuditChanges,
  AuditEventData,
  AuditTarget,
  RoleReference,
  RoleSnapshot,
  RoleUpdate,
  TextChange,
} from '@common/schemas/audit-event.schema';

const actionTargets = {
  'role.create': 'role',
  'role.update': 'role',
  'role.delete': 'role',
  'user.create': 'user',
  'user.assign_roles': 'user',
} as const;

export type AuditAction = keyof typeof actionTargets;

export type AuditEventInput = {
  eventId: string;
  schemaVersion: number;
  source: string;
  occurredAt: string;
  actor?: AuditActor;
  action: string;
  target?: AuditTarget;
  changes?: AuditChanges;
  processId: string;
};

export function isAuditAction(value: string): value is AuditAction {
  return Object.hasOwn(actionTargets, value);
}

export function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parseAuditDate(value: string): Date {
  const parts =
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?(?:Z|\+00:00)$/.exec(
      value,
    );

  if (!parts) {
    throw new BadRequestException('Expected an ISO 8601 UTC date');
  }

  const iso = `${parts[1]}.${(parts[2] ?? '').padEnd(3, '0')}Z`;
  const date = new Date(iso);

  if (!Number.isFinite(date.getTime()) || date.toISOString() !== iso) {
    throw new BadRequestException('Invalid audit date');
  }

  return date;
}

export function normalizeAuditTarget(target: AuditTarget): AuditTarget {
  if (target.type === 'role' && Types.ObjectId.isValid(target.id)) {
    return { type: target.type, id: target.id.toLowerCase() };
  }

  if (target.type === 'user' && hasText(target.id)) {
    return { type: target.type, id: target.id };
  }

  throw new BadRequestException('Invalid audit target');
}

export function normalizeAuditEvent(event?: AuditEventInput): AuditEventData {
  if (
    !event ||
    !isUUID(event.eventId) ||
    event.schemaVersion !== 1 ||
    event.source !== 'identity' ||
    !isAuditAction(event.action) ||
    !hasText(event.actor?.userId) ||
    !hasText(event.processId)
  ) {
    throw new BadRequestException('Invalid audit event');
  }

  if (!event.target || event.target.type !== actionTargets[event.action]) {
    throw new BadRequestException('Audit target does not match action');
  }

  return {
    eventId: event.eventId.toLowerCase(),
    schemaVersion: event.schemaVersion,
    source: event.source,
    occurredAt: parseAuditDate(event.occurredAt),
    actor: { userId: event.actor.userId },
    action: event.action,
    target: normalizeAuditTarget(event.target),
    changes: normalizeChanges(event.action, event.changes),
    processId: event.processId,
  };
}

function normalizeChanges(action: AuditAction, changes?: AuditChanges) {
  if (
    !changes ||
    Object.values(changes).filter((change) => change != null).length !== 1
  ) {
    throw new BadRequestException('Expected one set of audit changes');
  }

  switch (action) {
    case 'role.create':
      return { roleCreated: normalizeRoleSnapshot(changes.roleCreated) };
    case 'role.update':
      return { roleUpdated: normalizeRoleUpdate(changes.roleUpdated) };
    case 'role.delete':
      return { roleDeleted: normalizeRoleSnapshot(changes.roleDeleted) };
    case 'user.create':
      return { userCreated: normalizeRoleReference(changes.userCreated) };
    case 'user.assign_roles': {
      const before = normalizeRoleReference(changes.userRolesAssigned?.before);
      const after = normalizeRoleReference(changes.userRolesAssigned?.after);

      if (before.id === after.id) {
        throw new BadRequestException('Expected a different assigned role');
      }

      return { userRolesAssigned: { before, after } };
    }
  }
}

function normalizeRoleSnapshot(snapshot?: RoleSnapshot): RoleSnapshot {
  if (!hasText(snapshot?.name) || typeof snapshot.description !== 'string') {
    throw new BadRequestException('Invalid audit role snapshot');
  }

  return {
    name: snapshot.name,
    description: snapshot.description,
    permissions: normalizePermissions(snapshot.permissions),
  };
}

function normalizeRoleReference(role?: RoleReference): RoleReference {
  if (!hasText(role?.name) || !Types.ObjectId.isValid(role.id)) {
    throw new BadRequestException('Invalid audit role reference');
  }

  return { id: role.id.toLowerCase(), name: role.name };
}

function normalizeRoleUpdate(update?: RoleUpdate): RoleUpdate {
  if (!update || !(update.name || update.description || update.permissions)) {
    throw new BadRequestException('Expected a changed role field');
  }

  const normalized: RoleUpdate = {};

  if (update.name) {
    if (!hasText(update.name.before) || !hasText(update.name.after)) {
      throw new BadRequestException('Invalid audit role name change');
    }

    normalized.name = normalizeTextChange(update.name);
  }

  if (update.description) {
    normalized.description = normalizeTextChange(update.description);
  }

  if (update.permissions) {
    const added = normalizePermissions(update.permissions.added);
    const removed = normalizePermissions(update.permissions.removed);

    if (
      added.length + removed.length === 0 ||
      added.some((permission) => removed.includes(permission))
    ) {
      throw new BadRequestException('Invalid audit permission change');
    }

    normalized.permissions = { added, removed };
  }

  return normalized;
}

function normalizeTextChange({ before, after }: TextChange): TextChange {
  if (
    typeof before !== 'string' ||
    typeof after !== 'string' ||
    before === after
  ) {
    throw new BadRequestException('Invalid audit text change');
  }

  return { before, after };
}

function normalizePermissions(permissions: string[]): string[] {
  if (!Array.isArray(permissions) || !permissions.every(hasText)) {
    throw new BadRequestException('Invalid audit permissions');
  }

  return [...new Set(permissions)].sort();
}
