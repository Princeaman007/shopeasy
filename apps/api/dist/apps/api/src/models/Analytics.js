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
exports.Analytics = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TopProductSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name: { type: String, required: true },
    views: { type: Number, default: 0, min: 0 },
    orders: { type: Number, default: 0, min: 0 },
}, { _id: false });
const SourcesSchema = new mongoose_1.Schema({
    instagram: { type: Number, default: 0, min: 0 },
    tiktok: { type: Number, default: 0, min: 0 },
    facebook: { type: Number, default: 0, min: 0 },
    direct: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 },
}, { _id: false });
const AnalyticsSchema = new mongoose_1.Schema({
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
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
    }
    else {
        this.conversion = 0;
    }
    next();
});
/**
 * Méthode statique : upsert analytics du jour
 * Incrémente les compteurs au lieu d'écraser
 */
AnalyticsSchema.statics.incrementDay = async function (shopId, date, data) {
    const update = {};
    if (data.visitors)
        update['$inc'] = { ...(update['$inc'] || {}), visitors: data.visitors };
    if (data.orders)
        update['$inc'] = { ...(update['$inc'] || {}), orders: data.orders };
    if (data.revenue)
        update['$inc'] = { ...(update['$inc'] || {}), revenue: data.revenue };
    if (data.source)
        update['$inc'] = { ...(update['$inc'] || {}), [`sources.${data.source}`]: 1 };
    return this.findOneAndUpdate({ shopId, date }, update, { upsert: true, new: true });
};
exports.Analytics = mongoose_1.default.model('Analytics', AnalyticsSchema);
//# sourceMappingURL=Analytics.js.map