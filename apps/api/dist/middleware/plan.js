"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlanLimits = exports.checkThemeAccess = exports.checkPhotoLimit = exports.checkProductLimit = exports.requirePremium = exports.PLAN_LIMITS = void 0;
/**
 * Limites par plan
 */
exports.PLAN_LIMITS = {
    basic: {
        maxProducts: 10,
        maxPhotos: 5,
        hasVideo: false,
        hasAnalytics: false,
        hasPromo: false,
        hasSms: false,
        hasMultiAdmin: false,
        themes: ['vitrine-moderne', 'marche-colore'],
    },
    premium: {
        maxProducts: Infinity,
        maxPhotos: Infinity,
        hasVideo: true,
        hasAnalytics: true,
        hasPromo: true,
        hasSms: true,
        hasMultiAdmin: true,
        themes: [
            'vitrine-moderne',
            'marche-colore',
            'luxe-sombre',
            'boutique-pro',
            'stories-style',
        ],
    },
};
/**
 * Middleware — verifie que le plan est Premium
 * Utilise sur les routes reservees au plan Premium
 */
const requirePremium = (req, res, next) => {
    if (!req.shop) {
        res.status(403).json({
            success: false,
            message: 'Boutique non chargee — utilisez requireMerchant avant requirePremium',
        });
        return;
    }
    if (req.shop.planType !== 'premium') {
        res.status(403).json({
            success: false,
            message: 'Cette fonctionnalite est reservee au plan Premium',
            code: 'PLAN_UPGRADE_REQUIRED',
            data: {
                currentPlan: req.shop.planType,
                requiredPlan: 'premium',
            },
        });
        return;
    }
    next();
};
exports.requirePremium = requirePremium;
/**
 * Middleware — verifie la limite de produits selon le plan
 * Utilise avant la creation d'un produit
 */
const checkProductLimit = (productCount) => (req, res, next) => {
    if (!req.shop) {
        res.status(403).json({ success: false, message: 'Boutique non chargee' });
        return;
    }
    const limit = exports.PLAN_LIMITS[req.shop.planType].maxProducts;
    if (productCount >= limit) {
        res.status(403).json({
            success: false,
            message: `Limite de ${limit} produits atteinte pour le plan Basic`,
            code: 'PRODUCT_LIMIT_REACHED',
            data: {
                currentCount: productCount,
                limit,
                plan: req.shop.planType,
            },
        });
        return;
    }
    next();
};
exports.checkProductLimit = checkProductLimit;
/**
 * Middleware — verifie la limite de photos selon le plan
 * Utilise avant l'upload d'images
 */
const checkPhotoLimit = (photoCount) => (req, res, next) => {
    if (!req.shop) {
        res.status(403).json({ success: false, message: 'Boutique non chargee' });
        return;
    }
    const limit = exports.PLAN_LIMITS[req.shop.planType].maxPhotos;
    if (photoCount >= limit) {
        res.status(403).json({
            success: false,
            message: `Limite de ${limit} photos par produit atteinte pour le plan Basic`,
            code: 'PHOTO_LIMIT_REACHED',
            data: {
                currentCount: photoCount,
                limit,
                plan: req.shop.planType,
            },
        });
        return;
    }
    next();
};
exports.checkPhotoLimit = checkPhotoLimit;
/**
 * Middleware — verifie si le theme est disponible pour le plan
 */
const checkThemeAccess = (theme) => (req, res, next) => {
    if (!req.shop) {
        res.status(403).json({ success: false, message: 'Boutique non chargee' });
        return;
    }
    const allowedThemes = exports.PLAN_LIMITS[req.shop.planType].themes;
    if (!allowedThemes.includes(theme)) {
        res.status(403).json({
            success: false,
            message: `Le theme "${theme}" est reserve au plan Premium`,
            code: 'THEME_UPGRADE_REQUIRED',
            data: {
                requestedTheme: theme,
                allowedThemes,
                plan: req.shop.planType,
            },
        });
        return;
    }
    next();
};
exports.checkThemeAccess = checkThemeAccess;
/**
 * Helper — retourne les limites du plan courant
 */
const getPlanLimits = (planType) => exports.PLAN_LIMITS[planType];
exports.getPlanLimits = getPlanLimits;
//# sourceMappingURL=plan.js.map