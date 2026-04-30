import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResidentGtmTask extends Document {
  residentId: mongoose.Types.ObjectId;
  startupId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  deadline: Date;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentGtmTaskSchema = new Schema<IResidentGtmTask>(
  {
    residentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo', index: true },
    deadline: { type: Date, required: true, index: true },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ResidentGtmTaskSchema.index({ residentId: 1, status: 1, deadline: 1 });
ResidentGtmTaskSchema.index({ startupId: 1, createdAt: -1 });

const ResidentGtmTask: Model<IResidentGtmTask> =
  (mongoose.models.ResidentGtmTask as Model<IResidentGtmTask>) ||
  mongoose.model<IResidentGtmTask>('ResidentGtmTask', ResidentGtmTaskSchema);

export default ResidentGtmTask;
