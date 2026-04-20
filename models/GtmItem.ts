import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGtmItem extends Document {
  type: 'prompt' | 'campaign' | 'kpi' | 'daily';
  category: string;
  title: string;
  content: string;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GtmItemSchema = new Schema<IGtmItem>(
  {
    type:      { type: String, enum: ['prompt','campaign','kpi','daily'], required: true },
    category:  { type: String, required: true },
    title:     { type: String, required: true },
    content:   { type: String, required: true },
    tags:      [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const GtmItem: Model<IGtmItem> =
  (mongoose.models.GtmItem as Model<IGtmItem>) ||
  mongoose.model<IGtmItem>('GtmItem', GtmItemSchema);

export default GtmItem;
