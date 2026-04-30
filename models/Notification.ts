import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  managerId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'meeting' | 'report' | 'info';
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['meeting', 'report', 'info'], default: 'info' },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index drives the hot query: pending notifications for a given recipient sorted by recency
NotificationSchema.index({ managerId: 1, deliveredAt: 1, createdAt: -1 });

const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
