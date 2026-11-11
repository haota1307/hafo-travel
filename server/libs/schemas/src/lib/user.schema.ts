import { Model, Types } from 'mongoose';
import { Prop, Schema } from '@nestjs/mongoose';

import { BaseSchema, createSchema } from './base.schema';
import { Role } from './role.schema';

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends BaseSchema {
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
  roles: Types.ObjectId[];
}

export const UserModelName = User.name;

export const UserSchema = createSchema(User);

export type UserModel = Model<User>;
export type UserWithRoles = Omit<User, 'roles'> & { roles: Role[] };

export const UserDestination = {
  name: UserModelName,
  schema: UserSchema,
};
