import mongoose, { Document } from 'mongoose';
/**
 * Définition d'un type de variante
 * ex: { type: "Taille", label: "Taille", options: ["S", "M", "L", "XL"] }
 */
export interface IVariantType {
    type: string;
    label: string;
    options: string[];
    images: Record<string, string[]>;
}
/**
 * Stock par combinaison de variantes
 * ex: { sku: "ROUGE-L", quantity: 5, price: 15000 }
 */
export interface IStock {
    sku: string;
    quantity: number;
    price?: number;
}
/**
 * Interface principale Product
 */
export interface IProduct extends Document {
    shopId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    slug: string;
    price: number;
    comparePrice?: number;
    images: string[];
    video?: string;
    hasVariants: boolean;
    variants: IVariantType[];
    stock: IStock[];
    totalStock: number;
    status: 'active' | 'draft' | 'out_of_stock';
    shareImageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Product: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, {}> & IProduct & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Product.d.ts.map