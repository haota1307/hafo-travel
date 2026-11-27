import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaTypes, type Model } from 'mongoose';

import { BaseSchema, createSchema } from './base.schema';

export type AuditActor = {
  userId: string;
};

export type AuditTarget = {
  type: string;
  id: string;
};

export type RoleReference = {
  id: string;
  name: string;
};

export type RoleSnapshot = {
  name: string;
  description: string;
  permissions: string[];
};

export type TextChange = {
  before?: string;
  after?: string;
};

type PermissionChange = {
  added: string[];
  removed: string[];
};

export type RoleUpdate = {
  name?: TextChange;
  description?: TextChange;
  permissions?: PermissionChange;
};

type UserRoleChange = {
  before?: RoleReference;
  after?: RoleReference;
};

export type AuditChanges = {
  roleCreated?: RoleSnapshot;
  roleUpdated?: RoleUpdate;
  roleDeleted?: RoleSnapshot;
  userCreated?: RoleReference;
  userRolesAssigned?: UserRoleChange;
};

@Schema({ collection: 'audit_events', autoIndex: true })
export class AuditEvent extends BaseSchema {
  @Prop({ type: String, required: true, unique: true })
  eventId: string;

  @Prop({ type: Number, required: true })
  schemaVersion: number;

  @Prop({ type: String, required: true })
  source: string;

  @Prop({ type: Date, required: true })
  occurredAt: Date;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  actor: AuditActor;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  target: AuditTarget;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  changes: AuditChanges;

  @Prop({ type: String, required: true })
  processId: string;
}

export const AuditEventModelName = AuditEvent.name;
export const AuditEventSchema = createSchema(AuditEvent);
AuditEventSchema.index({ occurredAt: -1, eventId: -1 });
AuditEventSchema.index({
  'target.type': 1,
  'target.id': 1,
  occurredAt: -1,
  eventId: -1,
});

export type AuditEventModel = Model<AuditEvent>;

export type AuditEventData = Omit<AuditEvent, keyof BaseSchema>;

export const AuditEventDestination = {
  name: AuditEventModelName,
  schema: AuditEventSchema,
};
