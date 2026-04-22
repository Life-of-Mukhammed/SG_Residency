import mongoose, { Document, Model, Schema } from 'mongoose';

interface GtmSectionConfig {
  key: 'guide' | 'plan' | 'system';
  title: string;
}

export interface IGtmConfig extends Document {
  title: string;
  intro: string;
  quote: string;
  quoteAuthor: string;
  sections: GtmSectionConfig[];
  createdAt: Date;
  updatedAt: Date;
}

const GtmSectionSchema = new Schema<GtmSectionConfig>(
  {
    key: { type: String, enum: ['guide', 'plan', 'system'], required: true },
    title: { type: String, required: true },
  },
  { _id: false }
);

const GtmConfigSchema = new Schema<IGtmConfig>(
  {
    title: { type: String, required: true },
    intro: { type: String, required: true },
    quote: { type: String, required: true },
    quoteAuthor: { type: String, required: true },
    sections: { type: [GtmSectionSchema], default: [] },
  },
  { timestamps: true }
);

const GtmConfig: Model<IGtmConfig> =
  (mongoose.models.GtmConfig as Model<IGtmConfig>) ||
  mongoose.model<IGtmConfig>('GtmConfig', GtmConfigSchema);

export default GtmConfig;
