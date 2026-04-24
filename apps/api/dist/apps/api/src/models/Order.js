"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const OrderItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    variant: { type: String, default: null },
    image: { type: String, default: null },
}, { _id: false });
const OrderCustomerSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: false, default: '', lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    isGuest: { type: Boolean, default: true },
}, { _id: false });
const StatusHistorySchema = new mongoose_1.Schema({
    status: { type: String, required: true },
    date: { type: Date, default: () => new Date() },
    note: { type: String, default: null },
}, { _id: false });
const OrderSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: (items) => items.length > 0,
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
    nomClient: { type: String, default: '' },
    telephone: { type: String, default: '' },
    adresse: { type: String, default: '' },
    ville: { type: String, default: '' },
    modeLivraison: { type: String, default: 'livraison' },
    notes: { type: String, default: '' },
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
}, {
    timestamps: true,
});
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
    if (!this.isNew)
        return next();
    try {
        const year = new Date().getFullYear();
        // Compte les commandes de l'année en cours
        const count = await mongoose_1.default.model('Order').countDocuments({
            createdAt: {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`),
            },
        });
        // Padde le numéro sur 4 chiffres
        this.orderNumber = `SEC-${year}-${String(count + 1).padStart(4, '0')}`;
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.Order = mongoose_1.default.model('Order', OrderSchema);
//# sourceMappingURL=Order.js.map