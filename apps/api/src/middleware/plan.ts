import { Request, Response, NextFunction } from 'express';

/**
 * Limites par plan
 */
export const PLAN_LIMITS = {
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
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * Middleware — verifie que le plan est Premium
 * Utilise sur les routes reservees au plan Premium
 */
export const requirePremium = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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

/**
 * Middleware — verifie la limite de produits selon le plan
 * Utilise avant la creation d'un produit
 */
export const checkProductLimit = (productCount: number) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.shop) {
    res.status(403).json({ success: false, message: 'Boutique non chargee' });
    return;
  }

  const limit = PLAN_LIMITS[req.shop.planType].maxProducts;

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

/**
 * Middleware — verifie la limite de photos selon le plan
 * Utilise avant l'upload d'images
 */
export const checkPhotoLimit = (photoCount: number) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.shop) {
    res.status(403).json({ success: false, message: 'Boutique non chargee' });
    return;
  }

  const limit = PLAN_LIMITS[req.shop.planType].maxPhotos;

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

/**
 * Middleware — verifie si le theme est disponible pour le plan
 */
export const checkThemeAccess = (theme: string) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.shop) {
    res.status(403).json({ success: false, message: 'Boutique non chargee' });
    return;
  }

  const allowedThemes = PLAN_LIMITS[req.shop.planType].themes as readonly string[];

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

/**
 * Helper — retourne les limites du plan courant
 */
export const getPlanLimits = (planType: PlanType) => PLAN_LIMITS[planType];