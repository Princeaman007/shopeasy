import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface principale PromoCode
 * Disponible uniquement pour les boutiques Premium
 */
export interface IPromoCode extends Document {
  shopId: mongoose.Types.ObjectId;
  code: string;                        // ex: "NOEL2024"
  type: 'percent' | 'fixed';          // réduction en % ou montant fixe
  value: number;                       // ex: 10 (10%) ou 5000 (5000 FCFA)
  minOrder?: number;                   // commande minimum pour activer
  maxUses?: number;                    // nombre max d'utilisations (null = illimité)
  usedCount: number;                   // nombre d'utilisations actuelles
  expiresAt?: Date;                    // date d'expiration (null = pas d'expiration)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    code: {
      type: String,
      required: [true, 'Code promo obligatoire'],
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percent', 'fixed'],
      required: [true, 'Type de réduction obligatoire'],
    },
    value: {
      type: Number,
      required: [true, 'Valeur de réduction obligatoire'],
      min: [0, 'La valeur ne peut pas être négative'],
    },
    minOrder: {
      type: Number,
      min: 0,
      default: null,
    },
    maxUses: {
      type: Number,
      min: 1,
      default: null,   // null = illimité
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null,   // null = pas d'expiration
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index unique : pas deux codes identiques dans la même boutique
 */
PromoCodeSchema.index({ shopId: 1, code: 1 }, { unique: true });

/**
 * Vérifie si le code promo est encore valide
 */
PromoCodeSchema.methods.isValid = function (orderTotal: number): {
  valid: boolean;
  reason?: string;
} {
  // Code désactivé
  if (!this.isActive) {
    return { valid: false, reason: 'Code promo désactivé' };
  }

  // Code expiré
  if (this.expiresAt && new Date() > this.expiresAt) {
    return { valid: false, reason: 'Code promo expiré' };
  }

  // Nombre max d'utilisations atteint
  if (this.maxUses !== null && this.usedCount >= this.maxUses) {
    return { valid: false, reason: 'Code promo épuisé' };
  }

  // Commande minimum non atteinte
  if (this.minOrder !== null && orderTotal < this.minOrder) {
    return {
      valid: false,
      reason: `Commande minimum de ${this.minOrder} FCFA requise`,
    };
  }

  return { valid: true };
};

/**
 * Calcule le montant de la réduction
 */
PromoCodeSchema.methods.calculateDiscount = function (
  orderTotal: number
): number {
  if (this.type === 'percent') {
    // Réduction en pourcentage
    return Math.round((orderTotal * this.value) / 100);
  }
  // Réduction fixe — ne peut pas dépasser le total
  return Math.min(this.value, orderTotal);
};

export const PromoCode = mongoose.model<IPromoCode>('PromoCode', PromoCodeSchema);