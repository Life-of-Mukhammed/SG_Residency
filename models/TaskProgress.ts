import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITaskProgress extends Document {
  userId: mongoose.Types.ObjectId;
  startupId: mongoose.Types.ObjectId;
  taskId: string;
  quarter: number;
  month: number;
  completed: boolean;
  comment: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskProgressSchema = new Schema<ITaskProgress>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User',    required: true },
    startupId:   { type: Schema.Types.ObjectId, ref: 'Startup', required: true },
    taskId:      { type: String, required: true },
    quarter:     { type: Number, required: true },
    month:       { type: Number, required: true },
    completed:   { type: Boolean, default: false },
    comment:     { type: String, default: '' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

TaskProgressSchema.index({ userId: 1, startupId: 1, taskId: 1 }, { unique: true });

const TaskProgress: Model<ITaskProgress> =
  (mongoose.models.TaskProgress as Model<ITaskProgress>) ||
  mongoose.model<ITaskProgress>('TaskProgress', TaskProgressSchema);

export default TaskProgress;
