import { Prop, Schema } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PERMISSION } from '@common/constants/enum/role.enum';

import { BaseSchema, createSchema } from './base.schema';

@Schema({
  timestamps: true,
  collection: 'role',
})
export class Role extends BaseSchema {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String, trim: true, minlength: 1, maxlength: 100 })
  displayName?: string;

  @Prop({ type: String, trim: true, minlength: 1, maxlength: 100 })
  displayNameVi?: string;

  @Prop({ type: String, trim: true, minlength: 1, maxlength: 100 })
  displayNameEn?: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: [String], enum: PERMISSION, default: [] })
  permissions: PERMISSION[];
}

export type RoleDisplayNames = Pick<
  Role,
  'displayName' | 'displayNameVi' | 'displayNameEn'
>;

export const RoleModelName = Role.name;

export const RoleSchema = createSchema(Role);

export type RoleModel = Model<Role>;

export const RoleDestination = {
  name: RoleModelName,
  schema: RoleSchema,
};
