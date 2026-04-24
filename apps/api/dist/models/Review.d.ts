import mongoose, { Document } from 'mongoose';
export interface IReview extends Document {
    shopId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId | null;
    nomClient: string;
    note: number;
    commentaire: string;
    statut: 'pending' | 'approved' | 'rejected';
    type: 'produit' | 'boutique';
    createdAt: Date;
}
export declare const Review: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview, {}, {}> & IReview & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Review.d.ts.map