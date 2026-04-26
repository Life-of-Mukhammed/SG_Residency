import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IResidencyQuestion extends Document {
  question: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'url';
  required: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResidencyQuestionSchema = new Schema<IResidencyQuestion>(
  {
    question: { type: String, required: true, trim: true },
    placeholder: { type: String, trim: true },
    type: { type: String, enum: ['text', 'textarea', 'url'], default: 'textarea' },
    required: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ResidencyQuestion: Model<IResidencyQuestion> =
  (mongoose.models.ResidencyQuestion as Model<IResidencyQuestion>) ||
  mongoose.model<IResidencyQuestion>('ResidencyQuestion', ResidencyQuestionSchema);

export default ResidencyQuestion;
