import mongoose, { Document, Schema } from 'mongoose';

/**
 * Définition d'un type de variante
 * ex: { type: "Taille", label: "Taille", options: ["S", "M", "L", "XL"] }
 */
export interface IVariantType {
  type: string;
  label: string;
  options: string[];
}

/**
 * Stock par combinaison de variantes
 * ex: { sku: "ROUGE-L", quantity: 5, price: 15000 }
 */
export interface IStock {
  sku: string;       // combinaison unique ex: "ROUGE-L"
  quantity: number;
  price?: number;    // prix spécifique à cette combinaison (optionnel)
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
  comparePrice?: number;        // prix barré (ancien prix)
  images: string[];             // basic: max 5, premium: illimité
  video?: string;               // premium uniquement
  hasVariants: boolean;
  variants: IVariantType[];
  stock: IStock[];
  totalStock: number;           // stock total calculé
  status: 'active' | 'draft' | 'out_of_stock';
  shareImageUrl?: string;       // image générée pour partage réseaux sociaux
  createdAt: Date;
  updatedAt: Date;
}

const VariantTypeSchema = new Schema<IVariantType>(
  {
    type:    { type: String, required: true, trim: true },
    label:   { type: String, required: true, trim: true },
    options: [{ type: String, trim: true }],
  },
  { _id: false }
);

const StockSchema = new Schema<IStock>(
  {
    sku:      { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    price:    { type: Number, min: 0, default: null },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Nom du produit obligatoire'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Prix obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
    },
    comparePrice: {
      type: Number,
      min: 0,
      default: null,
    },
    images: {
      type: [String],
      default: [],
      // basic: max 5 images — vérifié dans le middleware plan
    },
    video: {
      type: String,
      default: null,
      // premium uniquement — vérifié dans le middleware plan
    },
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variants: {
      type: [VariantTypeSchema],
      default: [],
    },
    stock: {
      type: [StockSchema],
      default: [],
    },
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'out_of_stock'],
      default: 'draft',
    },
    shareImageUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index unique : pas deux produits avec le même slug dans la même boutique
 */
ProductSchema.index({ shopId: 1, slug: 1 }, { unique: true });

/**
 * Index pour la recherche par boutique et statut
 */
ProductSchema.index({ shopId: 1, status: 1 });

/**
 * Calcul automatique du stock total avant sauvegarde
 */
ProductSchema.pre('save', function (next) {
  if (this.stock && this.stock.length > 0) {
    // Somme de toutes les quantités des combinaisons
    this.totalStock = this.stock.reduce(
      (sum, item) => sum + item.quantity, 0
    );
    // Met à jour le statut si stock épuisé
    if (this.totalStock === 0 && this.status === 'active') {
      this.status = 'out_of_stock';
    }
    if (this.totalStock > 0 && this.status === 'out_of_stock') {
      this.status = 'active';
    }
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);