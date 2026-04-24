import mongoose, { Document } from 'mongoose';
/**
 * Interface principale Category
 */
export interface ICategory extends Document {
    shopId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    parentId: mongoose.Types.ObjectId | null;
    predefined: boolean;
    icon: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Category: mongoose.Model<ICategory, {}, {}, {}, mongoose.Document<unknown, {}, ICategory, {}, {}> & ICategory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
/**
 * Catégories prédéfinies ShopEasy CI
 * Insérées automatiquement à la création d'une boutique
 */
export declare const PREDEFINED_CATEGORIES: readonly [{
    readonly name: "Mode femme";
    readonly slug: "mode-femme";
    readonly icon: "👗";
    readonly order: 1;
}, {
    readonly name: "Mode homme";
    readonly slug: "mode-homme";
    readonly icon: "👔";
    readonly order: 2;
}, {
    readonly name: "Chaussures";
    readonly slug: "chaussures";
    readonly icon: "👟";
    readonly order: 3;
}, {
    readonly name: "Accessoires";
    readonly slug: "accessoires";
    readonly icon: "👜";
    readonly order: 4;
}, {
    readonly name: "Lunettes";
    readonly slug: "lunettes";
    readonly icon: "🕶️";
    readonly order: 5;
}, {
    readonly name: "Beauté & Cosmétiques";
    readonly slug: "beaute-cosmetiques";
    readonly icon: "💄";
    readonly order: 6;
}, {
    readonly name: "Enfants";
    readonly slug: "enfants";
    readonly icon: "🧸";
    readonly order: 7;
}, {
    readonly name: "Maison & Déco";
    readonly slug: "maison-deco";
    readonly icon: "🏠";
    readonly order: 8;
}, {
    readonly name: "Alimentation";
    readonly slug: "alimentation";
    readonly icon: "🍎";
    readonly order: 9;
}, {
    readonly name: "Autre";
    readonly slug: "autre";
    readonly icon: "📦";
    readonly order: 10;
}];
//# sourceMappingURL=Category.d.ts.map