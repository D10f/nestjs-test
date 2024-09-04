import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';

const schemaOptions: SchemaOptions<User> = {
  toJSON: {
    transform(_doc, ret) {
      delete ret.password;
      delete ret.sessions;
      delete ret.__v;
      delete ret._id;
      return ret;
    },
  },
};

@Schema(schemaOptions)
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false, unique: true })
  email?: string;

  @Prop({ required: true })
  password: string;

  @Prop([String])
  sessions: string[];

  @Prop()
  vaultKey: string;

  @Prop()
  data: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
