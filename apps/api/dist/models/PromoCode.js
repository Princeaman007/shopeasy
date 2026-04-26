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
exports.PromoCode = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PromoCodeSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        default: null, // null = illimité
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    expiresAt: {
        type: Date,
        default: null, // null = pas d'expiration
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
/**
 * Index unique : pas deux codes identiques dans la même boutique
 */
PromoCodeSchema.index({ shopId: 1, code: 1 }, { unique: true });
/**
 * Vérifie si le code promo est encore valide
 */
PromoCodeSchema.methods.isValid = function (orderTotal) {
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
PromoCodeSchema.methods.calculateDiscount = function (orderTotal) {
    if (this.type === 'percent') {
        // Réduction en pourcentage
        return Math.round((orderTotal * this.value) / 100);
    }
    // Réduction fixe — ne peut pas dépasser le total
    return Math.min(this.value, orderTotal);
};
exports.PromoCode = mongoose_1.default.model('PromoCode', PromoCodeSchema);
//# sourceMappingURL=PromoCode.js.map