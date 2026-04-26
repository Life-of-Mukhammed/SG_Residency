import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStartup extends Document {
  userId: mongoose.Types.ObjectId;
  applicationType: 'existing_resident' | 'new_applicant';
  name: string;
  surname: string;
  gmail: string;
  startup_name: string;
  region: string;
  startup_logo?: string;
  description: string;
  startup_sphere: string;
  stage: 'idea' | 'mvp' | 'growth' | 'scale';
  founder_name: string;
  phone: string;
  telegram: string;
  team_size: number;
  pitch_deck?: string;
  resume_url?: string;
  applicationAnswers?: Array<{
    questionId?: string;
    question: string;
    answer: string;
  }>;
  commitment: 'full-time' | 'part-time';
  mrr: number;
  users_count: number;
  investment_raised: number;
  status: 'pending' | 'lead_accepted' | 'active' | 'inactive' | 'rejected';
  rejectionReason?: string;
  managerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StartupSchema = new Schema<IStartup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicationType: { type: String, enum: ['existing_resident', 'new_applicant'], default: 'new_applicant' },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    gmail: { type: String, required: true },
    startup_name: { type: String, required: true },
    region: { type: String, required: true },
    startup_logo: { type: String },
    description: { type: String, required: true },
    startup_sphere: { type: String, required: true },
    stage: { type: String, enum: ['idea', 'mvp', 'growth', 'scale'], required: true },
    founder_name: { type: String, required: true },
    phone: { type: String, required: true },
    telegram: { type: String, required: true },
    team_size: { type: Number, required: true, min: 1 },
    pitch_deck: { type: String },
    resume_url: { type: String },
    applicationAnswers: [
      {
        questionId: { type: String },
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    commitment: { type: String, enum: ['full-time', 'part-time'], required: true },
    mrr: { type: Number, default: 0 },
    users_count: { type: Number, default: 0 },
    investment_raised: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'lead_accepted', 'active', 'inactive', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Startup: Model<IStartup> = mongoose.models.Startup || mongoose.model<IStartup>('Startup', StartupSchema);
export default Startup;
