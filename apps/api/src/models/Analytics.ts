import mongoose, { Document, Schema } from 'mongoose';

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
  date: string;           // format: "2024-12-25"
  visitors: number;
  orders: number;
  revenue: number;
  conversion: number;     // taux de conversion en % (orders/visitors*100)
  topProducts: ITopProduct[];
  sources: ISources;
  createdAt: Date;
  updatedAt: Date;
}

const TopProductSchema = new Schema<ITopProduct>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name:   { type: String, required: true },
    views:  { type: Number, default: 0, min: 0 },
    orders: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const SourcesSchema = new Schema<ISources>(
  {
    instagram: { type: Number, default: 0, min: 0 },
    tiktok:    { type: Number, default: 0, min: 0 },
    facebook:  { type: Number, default: 0, min: 0 },
    direct:    { type: Number, default: 0, min: 0 },
    other:     { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide — utilise YYYY-MM-DD'],
    },
    visitors: {
      type: Number,
      default: 0,
      min: 0,
    },
    orders: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    topProducts: {
      type: [TopProductSchema],
      default: [],
    },
    sources: {
      type: SourcesSchema,
      default: () => ({
        instagram: 0,
        tiktok: 0,
        facebook: 0,
        direct: 0,
        other: 0,
      }),
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index unique : une seule entrée par boutique par jour
 */
AnalyticsSchema.index({ shopId: 1, date: 1 }, { unique: true });

/**
 * Index pour récupérer les analytics d'une boutique sur une période
 */
AnalyticsSchema.index({ shopId: 1, date: -1 });

/**
 * Recalcule le taux de conversion avant sauvegarde
 */
AnalyticsSchema.pre('save', function (next) {
  if (this.visitors > 0) {
    this.conversion = Math.round((this.orders / this.visitors) * 100 * 10) / 10;
  } else {
    this.conversion = 0;
  }
  next();
});

/**
 * Méthode statique : upsert analytics du jour
 * Incrémente les compteurs au lieu d'écraser
 */
AnalyticsSchema.statics.incrementDay = async function (
  shopId: mongoose.Types.ObjectId,
  date: string,
  data: Partial<{
    visitors: number;
    orders: number;
    revenue: number;
    source: keyof ISources;
  }>
) {
  const update: Record<string, unknown> = {};

  if (data.visitors) update['$inc'] = { ...((update['$inc'] as object) || {}), visitors: data.visitors };
  if (data.orders)   update['$inc'] = { ...((update['$inc'] as object) || {}), orders: data.orders };
  if (data.revenue)  update['$inc'] = { ...((update['$inc'] as object) || {}), revenue: data.revenue };
  if (data.source)   update['$inc'] = { ...((update['$inc'] as object) || {}), [`sources.${data.source}`]: 1 };

  return this.findOneAndUpdate(
    { shopId, date },
    update,
    { upsert: true, new: true }
  );
};

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);