import mongoose, { Schema, Document, Model } from 'mongoose';

interface SprintMonthConfig {
  month: number;
  name: string;
}

interface SprintQuarterConfig {
  quarter: number;
  name: string;
  months: SprintMonthConfig[];
}

export interface ISprintConfig extends Document {
  quarters: SprintQuarterConfig[];
  createdAt: Date;
  updatedAt: Date;
}

const SprintMonthSchema = new Schema<SprintMonthConfig>(
  {
    month: { type: Number, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const SprintQuarterSchema = new Schema<SprintQuarterConfig>(
  {
    quarter: { type: Number, required: true },
    name: { type: String, required: true },
    months: { type: [SprintMonthSchema], default: [] },
  },
  { _id: false }
);

const SprintConfigSchema = new Schema<ISprintConfig>(
  {
    quarters: { type: [SprintQuarterSchema], default: [] },
  },
  { timestamps: true }
);

const SprintConfig: Model<ISprintConfig> =
  (mongoose.models.SprintConfig as Model<ISprintConfig>) ||
  mongoose.model<ISprintConfig>('SprintConfig', SprintConfigSchema);

export default SprintConfig;
