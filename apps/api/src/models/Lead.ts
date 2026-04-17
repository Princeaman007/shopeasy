import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface principale Lead
 * Collecté par l'agent Koffi sur la landing page
 * Représente un prospect intéressé par ShopEasy CI
 */
export interface ILead extends Document {
  name: string;
  phone: string;
  email?: string;
  message?: string;                              // résumé de la conversation Koffi
  status: 'new' | 'contacted' | 'converted';
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Nom obligatoire'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Téléphone obligatoire'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    message: {
      type: String,
      default: null,   // résumé de ce que le prospect cherche
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index pour trier les leads par date (les plus récents en premier)
 */
LeadSchema.index({ createdAt: -1 });

/**
 * Index pour filtrer par statut
 */
LeadSchema.index({ status: 1 });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);