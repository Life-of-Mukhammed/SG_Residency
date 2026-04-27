import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAdSettings extends Document {
  title: string;
  description: string;
  bannerImage: string;
  websiteUrl: string;
  appStoreUrl: string;
  googlePlayUrl: string;
  enabled: boolean;
  updatedAt: Date;
}

const AdSettingsSchema = new Schema<IAdSettings>(
  {
    title:         { type: String, default: 'Founders School' },
    description:   { type: String, default: 'Bo\'lajak asoschilarga kerak bo\'lgan barcha bilimlar bir joyda jamlandi' },
    bannerImage:   { type: String, default: '' },
    websiteUrl:    { type: String, default: 'https://sgfounders.school/download' },
    appStoreUrl:   { type: String, default: 'https://apps.apple.com/uz/app/founders-school/id6759317841' },
    googlePlayUrl: { type: String, default: 'https://play.google.com/store/apps/details?id=com.shakhbozbek.FoundersSchool' },
    enabled:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

const AdSettings: Model<IAdSettings> =
  (mongoose.models.AdSettings as Model<IAdSettings>) ||
  mongoose.model<IAdSettings>('AdSettings', AdSettingsSchema);

export default AdSettings;
