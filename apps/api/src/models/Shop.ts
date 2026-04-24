import mongoose, { Document, Schema } from 'mongoose';

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
  slug: string;                    // ex: "boutique-awa" → boutique-awa.shopeasyci.ci
  name: string;
  ownerId: mongoose.Types.ObjectId;
  planType: 'basic' | 'premium';
  selectedTheme: string;
  logo?: string;
  heroImage?: string;
  whatsapp: string;
  whatsappOrderNotif: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  about: IAbout;
  admins: mongoose.Types.ObjectId[];  // premium uniquement
  trialEndsAt: Date;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'suspended';
  subscriptionExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AboutSchema = new Schema<IAbout>(
  {
    description:  { type: String, default: '' },
    ownerName:    { type: String, default: '' },
    ownerPhoto:   { type: String, default: null },
    location:     { type: String, default: '' },
    workingHours: { type: String, default: '' },
    returnPolicy: { type: String, default: '' },
  },
  { _id: false } // pas besoin d'_id sur ce sous-document
);

const ShopSchema = new Schema<IShop>(
  {
    slug: {
      type: String,
      required: [true, 'Slug obligatoire'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug invalide — lettres minuscules, chiffres et tirets uniquement'],
    },
    name: {
      type: String,
      required: [true, 'Nom de boutique obligatoire'],
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planType: {
      type: String,
      enum: ['basic', 'premium'],
      default: 'basic',
    },
    selectedTheme: {
      type: String,
      default: 'vitrine-moderne',
    },
    logo: {
      type: String,
      default: null,
    },
    heroImage: { type: String, default: null },
    whatsapp: {
      type: String,
      required: [true, 'Numéro WhatsApp obligatoire'],
      trim: true,
    },
    whatsappOrderNotif: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    about: {
      type: AboutSchema,
      default: () => ({
        description: '',
        ownerName: '',
        ownerPhoto: null,
        location: '',
        workingHours: '',
        returnPolicy: '',
      }),
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    trialEndsAt: {
      type: Date,
      required: true,
      // 7 jours d'essai gratuit par défaut
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'expired', 'suspended'],
      default: 'trial',
    },
    subscriptionExpiresAt: {
      type: Date,
      // 37 jours par défaut (7 essai + 30 premier mois)
      default: () => new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

export const Shop = mongoose.model<IShop>('Shop', ShopSchema);