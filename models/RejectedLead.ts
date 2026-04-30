import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRejectedLead extends Document {
  startupId: mongoose.Types.ObjectId;
  startupName: string;
  founderName: string;
  phone?: string;
  telegram?: string;
  region?: string;
  rejectionReason: string;
  rejectedAt: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RejectedLeadSchema = new Schema<IRejectedLead>(
  {
    startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, unique: true, index: true },
    startupName: { type: String, required: true, trim: true, index: true },
    founderName: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    telegram: { type: String, trim: true },
    region: { type: String, trim: true },
    rejectionReason: { type: String, required: true, trim: true },
    rejectedAt: { type: Date, required: true, index: true },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

RejectedLeadSchema.index({ startupName: 'text', founderName: 'text', phone: 'text', telegram: 'text' });

const RejectedLead: Model<IRejectedLead> =
  (mongoose.models.RejectedLead as Model<IRejectedLead>) ||
  mongoose.model<IRejectedLead>('RejectedLead', RejectedLeadSchema);

export default RejectedLead;
