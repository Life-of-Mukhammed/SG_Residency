import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGtmItem extends Document {
  type: 'prompt' | 'campaign' | 'kpi' | 'daily';
  section: 'guide' | 'plan' | 'system';
  category: string;
  title: string;
  content: string;
  tags: string[];
  sortOrder: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GtmItemSchema = new Schema<IGtmItem>(
  {
    type:      { type: String, enum: ['prompt','campaign','kpi','daily'], required: true },
    section:   { type: String, enum: ['guide', 'plan', 'system'], default: 'guide' },
    category:  { type: String, required: true },
    title:     { type: String, required: true },
    content:   { type: String, required: true },
    tags:      [{ type: String }],
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const GtmItem: Model<IGtmItem> =
  (mongoose.models.GtmItem as Model<IGtmItem>) ||
  mongoose.model<IGtmItem>('GtmItem', GtmItemSchema);

export default GtmItem;
