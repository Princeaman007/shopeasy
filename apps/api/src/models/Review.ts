import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  shopId:    mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId | null;
  nomClient: string;
  note:      number;
  commentaire: string;
  statut:    'pending' | 'approved' | 'rejected';
  type:      'produit' | 'boutique';
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    shopId:      { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    productId:   { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    nomClient:   { type: String, required: true, trim: true, maxlength: 50 },
    note:        { type: Number, required: true, min: 1, max: 5 },
    commentaire: { type: String, required: true, trim: true, maxlength: 500 },
    statut:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    type:        { type: String, enum: ['produit', 'boutique'], required: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ shopId: 1, statut: 1 });
ReviewSchema.index({ productId: 1, statut: 1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);