import { Prop, Schema } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AUTH_SESSIONS_COLLECTION } from '@common/constants/auth-storage.constants';

import { BaseSchema, createSchema } from './base.schema';

@Schema({
  collection: AUTH_SESSIONS_COLLECTION,
  autoCreate: false,
  autoIndex: false,
})
export class AuthSession extends BaseSchema {
  @Prop({ type: Types.ObjectId, required: true })
  profileId: Types.ObjectId;

  @Prop({ type: String, required: true })
  refreshHash: string;

  @Prop({ type: String })
  previousRefreshHash?: string;

  @Prop({ type: Date })
  previousRefreshValidUntil?: Date;

  @Prop({ type: Date, required: true })
  refreshExpiresAt: Date;
}

export const AuthSessionModelName = AuthSession.name;

export type AuthSessionModel = Model<AuthSession>;

export const AuthSessionDestination = {
  name: AuthSessionModelName,
  schema: createSchema(AuthSession),
};
