import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISprintTask extends Document {
  quarter: number;
  month: number;
  title: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SprintTaskSchema = new Schema<ISprintTask>(
  {
    quarter:     { type: Number, required: true, min: 1 },
    month:       { type: Number, required: true, min: 1, max: 12 },
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const SprintTask: Model<ISprintTask> =
  (mongoose.models.SprintTask as Model<ISprintTask>) ||
  mongoose.model<ISprintTask>('SprintTask', SprintTaskSchema);

export default SprintTask;
