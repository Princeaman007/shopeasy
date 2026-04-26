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
exports.Shop = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AboutSchema = new mongoose_1.Schema({
    description: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    ownerPhoto: { type: String, default: null },
    location: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    returnPolicy: { type: String, default: '' },
}, { _id: false } // pas besoin d'_id sur ce sous-document
);
const ShopSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
            type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
exports.Shop = mongoose_1.default.model('Shop', ShopSchema);
//# sourceMappingURL=Shop.js.map