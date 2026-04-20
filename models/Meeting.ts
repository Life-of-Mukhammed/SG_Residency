import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMeeting extends Document {
  managerId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  startupId?: mongoose.Types.ObjectId;
  title: string;
  topic?: string;
  scheduledAt: Date;
  duration: number;
  meetLink: string;
  meetingType: 'online' | 'offline';
  officeAddress?: string;
  status: 'available' | 'booked' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    managerId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userId:        { type: Schema.Types.ObjectId, ref: 'User' },
    startupId:     { type: Schema.Types.ObjectId, ref: 'Startup' },
    title:         { type: String, required: true },
    topic:         { type: String },
    scheduledAt:   { type: Date, required: true },
    duration:      { type: Number, default: 30 },
    meetLink:      { type: String, required: true },
    meetingType:   { type: String, enum: ['online', 'offline'], default: 'online' },
    officeAddress: { type: String },
    status:        { type: String, enum: ['available','booked','completed','cancelled'], default: 'available' },
    notes:         { type: String },
  },
  { timestamps: true }
);

const Meeting: Model<IMeeting> =
  (mongoose.models.Meeting as Model<IMeeting>) ||
  mongoose.model<IMeeting>('Meeting', MeetingSchema);

export default Meeting;
