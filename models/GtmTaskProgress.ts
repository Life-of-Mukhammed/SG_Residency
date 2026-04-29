import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGtmTaskProgress extends Document {
  userId: mongoose.Types.ObjectId;
  startupId: mongoose.Types.ObjectId;
  gtmItemId: mongoose.Types.ObjectId;
  completed: boolean;
  comment: string;
  reviewed: boolean;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GtmTaskProgressSchema = new Schema<IGtmTaskProgress>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startupId:   { type: Schema.Types.ObjectId, ref: 'Startup', required: true },
    gtmItemId:   { type: Schema.Types.ObjectId, ref: 'GtmItem', required: true },
    completed:   { type: Boolean, default: false },
    comment:     { type: String, default: '' },
    reviewed:    { type: Boolean, default: false },
    reviewedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt:  { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

GtmTaskProgressSchema.index({ userId: 1, startupId: 1, gtmItemId: 1 }, { unique: true });
GtmTaskProgressSchema.index({ startupId: 1, updatedAt: -1 });
GtmTaskProgressSchema.index({ gtmItemId: 1, completed: 1 });

const GtmTaskProgress: Model<IGtmTaskProgress> =
  (mongoose.models.GtmTaskProgress as Model<IGtmTaskProgress>) ||
  mongoose.model<IGtmTaskProgress>('GtmTaskProgress', GtmTaskProgressSchema);

export default GtmTaskProgress;
