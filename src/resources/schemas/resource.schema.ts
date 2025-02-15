import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ResourceStatus } from '../resources.enum';

@Schema({ timestamps: true })
export class Resource extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  status: ResourceStatus;

  @Prop({ nullable: true })
  httpCode: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
