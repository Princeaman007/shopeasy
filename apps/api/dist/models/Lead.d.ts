import mongoose, { Document } from 'mongoose';
/**
 * Interface principale Lead
 * Collecté par l'agent Koffi sur la landing page
 * Représente un prospect intéressé par ShopEasy CI
 */
export interface ILead extends Document {
    name: string;
    phone: string;
    email?: string;
    message?: string;
    status: 'new' | 'contacted' | 'converted';
    createdAt: Date;
    updatedAt: Date;
}
export declare const Lead: mongoose.Model<ILead, {}, {}, {}, mongoose.Document<unknown, {}, ILead, {}, {}> & ILead & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Lead.d.ts.map