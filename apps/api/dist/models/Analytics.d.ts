import mongoose, { Document } from 'mongoose';
/**
 * Stats par produit pour une journée donnée
 */
export interface ITopProduct {
    productId: mongoose.Types.ObjectId;
    name: string;
    views: number;
    orders: number;
}
/**
 * Sources de trafic pour une journée donnée
 */
export interface ISources {
    instagram: number;
    tiktok: number;
    facebook: number;
    direct: number;
    other: number;
}
/**
 * Interface principale Analytics
 * Pré-agrégé par jour pour des performances optimales
 * Une entrée = une boutique + une date
 */
export interface IAnalytics extends Document {
    shopId: mongoose.Types.ObjectId;
    date: string;
    visitors: number;
    orders: number;
    revenue: number;
    conversion: number;
    topProducts: ITopProduct[];
    sources: ISources;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Analytics: mongoose.Model<IAnalytics, {}, {}, {}, mongoose.Document<unknown, {}, IAnalytics, {}, {}> & IAnalytics & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Analytics.d.ts.map