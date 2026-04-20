import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  description: string;
  fileUrl: string;
  coverUrl?: string;
  category: string;
  uploadedBy: mongoose.Types.ObjectId;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    fileUrl: { type: String, required: true },
    coverUrl: { type: String },
    category: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Book: Model<IBook> = mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);
export default Book;
