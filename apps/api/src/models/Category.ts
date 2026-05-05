import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface principale Category
 */
export interface ICategory extends Document {
  shopId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  parentId: mongoose.Types.ObjectId | null;  // pour les sous-catégories
  predefined: boolean;                        // catégorie prédéfinie ShopEasy CI
  icon: string;                               // emoji ou nom d'icône
  order: number;                              // ordre d'affichage
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Nom de catégorie obligatoire'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    predefined: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: '🛍️',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index unique : pas deux catégories avec le même slug dans la même boutique
 */
CategorySchema.index({ shopId: 1, slug: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);

/**
 * Catégories prédéfinies ShopEasy CI
 * Insérées automatiquement à la création d'une boutique
 */
export const PREDEFINED_CATEGORIES = [
  { name: 'Mode femme',           slug: 'mode-femme',         icon: '', order: 1  },
  { name: 'Mode homme',           slug: 'mode-homme',         icon: '', order: 2  },
  { name: 'Chaussures',           slug: 'chaussures',         icon: '', order: 3  },
  { name: 'Accessoires',          slug: 'accessoires',        icon: '', order: 4  },
  { name: 'Lunettes',             slug: 'lunettes',           icon: '', order: 5  },
  { name: 'Beauté & Cosmétiques', slug: 'beaute-cosmetiques', icon: '', order: 6  },
  { name: 'Enfants',              slug: 'enfants',            icon: '', order: 7  },
  { name: 'Maison & Déco',        slug: 'maison-deco',        icon: '', order: 8  },
  { name: 'Alimentation',         slug: 'alimentation',       icon: '', order: 9  },
  { name: 'Autre',                slug: 'autre',              icon: '', order: 10 },
] as const;