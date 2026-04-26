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
exports.Product = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const VariantTypeSchema = new mongoose_1.Schema({
    type: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    options: [{ type: String, trim: true }],
    images: { type: Map, of: [String], default: {} },
}, { _id: false });
const StockSchema = new mongoose_1.Schema({
    sku: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, min: 0, default: null },
}, { _id: false });
const ProductSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
    },
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        required: false, default: null,
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
}, {
    timestamps: true,
});
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
        this.totalStock = this.stock.reduce((sum, item) => sum + item.quantity, 0);
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
exports.Product = mongoose_1.default.model('Product', ProductSchema);
//# sourceMappingURL=Product.js.map