import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId;
  startupId: mongoose.Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  completed: string;
  notCompleted: string;
  plans: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    completed: { type: String, required: true },
    notCompleted: { type: String, required: true },
    plans: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
export default Report;
