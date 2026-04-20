import mongoose, { Document, Schema } from 'mongoose';

/**
 * Un article dans la commande
 */
export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  variant?: string;   // ex: "Rouge - L"
  image?: string;
}

/**
 * Informations du client (connecté ou invité)
 */
export interface IOrderCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  isGuest: boolean;
}

/**
 * Historique d'un changement de statut
 */
export interface IStatusHistory {
  status: string;
  date: Date;
  note?: string;
}

/**
 * Interface principale Order
 */
export interface IOrder extends Document {
  shopId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;   // null si invité
  orderNumber: string;                     // ex: SEC-2024-0042
  items: IOrderItem[];
  promoCode?: string;
  discount: number;
  subtotal: number;
  total: number;
  customer: IOrderCustomer;
  status: 'new' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  statusHistory: IStatusHistory[];
  smsSent: boolean;
  waNotifSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name:     { type: String, required: true },
    price:    { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    variant:  { type: String, default: null },
    image:    { type: String, default: null },
  },
  { _id: false }
);

const OrderCustomerSchema = new Schema<IOrderCustomer>(
  {
    name:    { type: String, required: true, trim: true },
    phone:   { type: String, required: true, trim: true },
    email:   { type: String, required: false, default: '', lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    city:    { type: String, required: true, trim: true },
    isGuest: { type: Boolean, default: true },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, required: true },
    date:   { type: Date, default: () => new Date() },
    note:   { type: String, default: null },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'La commande doit contenir au moins un article',
      },
    },
    promoCode: {
      type: String,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    customer: {
      type: OrderCustomerSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'confirmed', 'shipping', 'delivered', 'cancelled'],
      default: 'new',
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    smsSent: {
      type: Boolean,
      default: false,
    },
    waNotifSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index pour récupérer les commandes d'une boutique rapidement
 */
OrderSchema.index({ shopId: 1, createdAt: -1 });

/**
 * Index pour rattacher les commandes invité à un compte
 */
OrderSchema.index({ 'customer.email': 1 });

/**
 * Génère le numéro de commande automatiquement
 * Format : SEC-YYYY-XXXX (ex: SEC-2024-0042)
 */
OrderSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  try {
    const year = new Date().getFullYear();
    // Compte les commandes de l'année en cours
    const count = await mongoose.model('Order').countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`),
      },
    });
    // Padde le numéro sur 4 chiffres
    this.orderNumber = `SEC-${year}-${String(count + 1).padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);