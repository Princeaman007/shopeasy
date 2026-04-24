import mongoose, { Document } from 'mongoose';
/**
 * Informations de la page "À propos" de la boutique
 */
export interface IAbout {
    description: string;
    ownerName: string;
    ownerPhoto?: string;
    location: string;
    workingHours: string;
    returnPolicy: string;
}
/**
 * Interface principale Shop
 */
export interface IShop extends Document {
    slug: string;
    name: string;
    ownerId: mongoose.Types.ObjectId;
    planType: 'basic' | 'premium';
    selectedTheme: string;
    logo?: string;
    whatsapp: string;
    whatsappOrderNotif: boolean;
    isVerified: boolean;
    verifiedAt?: Date;
    about: IAbout;
    admins: mongoose.Types.ObjectId[];
    trialEndsAt: Date;
    subscriptionStatus: 'trial' | 'active' | 'expired' | 'suspended';
    subscriptionExpiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Shop: mongoose.Model<IShop, {}, {}, {}, mongoose.Document<unknown, {}, IShop, {}, {}> & IShop & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Shop.d.ts.map