import mongoose, { Document } from 'mongoose';
/**
 * Interface principale PromoCode
 * Disponible uniquement pour les boutiques Premium
 */
export interface IPromoCode extends Document {
    shopId: mongoose.Types.ObjectId;
    code: string;
    type: 'percent' | 'fixed';
    value: number;
    minOrder?: number;
    maxUses?: number;
    usedCount: number;
    expiresAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PromoCode: mongoose.Model<IPromoCode, {}, {}, {}, mongoose.Document<unknown, {}, IPromoCode, {}, {}> & IPromoCode & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=PromoCode.d.ts.map