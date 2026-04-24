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
exports.PREDEFINED_CATEGORIES = exports.Category = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CategorySchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
/**
 * Index unique : pas deux catégories avec le même slug dans la même boutique
 */
CategorySchema.index({ shopId: 1, slug: 1 }, { unique: true });
exports.Category = mongoose_1.default.model('Category', CategorySchema);
/**
 * Catégories prédéfinies ShopEasy CI
 * Insérées automatiquement à la création d'une boutique
 */
exports.PREDEFINED_CATEGORIES = [
    { name: 'Mode femme', slug: 'mode-femme', icon: '👗', order: 1 },
    { name: 'Mode homme', slug: 'mode-homme', icon: '👔', order: 2 },
    { name: 'Chaussures', slug: 'chaussures', icon: '👟', order: 3 },
    { name: 'Accessoires', slug: 'accessoires', icon: '👜', order: 4 },
    { name: 'Lunettes', slug: 'lunettes', icon: '🕶️', order: 5 },
    { name: 'Beauté & Cosmétiques', slug: 'beaute-cosmetiques', icon: '💄', order: 6 },
    { name: 'Enfants', slug: 'enfants', icon: '🧸', order: 7 },
    { name: 'Maison & Déco', slug: 'maison-deco', icon: '🏠', order: 8 },
    { name: 'Alimentation', slug: 'alimentation', icon: '🍎', order: 9 },
    { name: 'Autre', slug: 'autre', icon: '📦', order: 10 },
];
//# sourceMappingURL=Category.js.map