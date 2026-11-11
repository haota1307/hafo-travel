import { Type } from '@nestjs/common';
import { Types, Schema } from 'mongoose';
import { Prop, SchemaFactory, Virtual } from '@nestjs/mongoose';

export class BaseSchema {
  _id: Types.ObjectId;

  @Virtual({
    get: function (this: BaseSchema) {
      return this?._id?.toString();
    },
  })
  id: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const createSchema = <TClass = unknown>(
  target: Type<TClass>,
): Schema<TClass> => {
  const schema = SchemaFactory.createForClass(target);

  schema.set('toJSON', {
    virtuals: true,
  });

  schema.set('toObject', {
    virtuals: true,
  });

  schema.set('versionKey', false);

  schema.set('timestamps', true);

  return schema;
};
