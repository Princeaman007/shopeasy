import { Request, Response, NextFunction } from 'express';
/**
 * Limites par plan
 */
export declare const PLAN_LIMITS: {
    readonly basic: {
        readonly maxProducts: 10;
        readonly maxPhotos: 5;
        readonly hasVideo: false;
        readonly hasAnalytics: false;
        readonly hasPromo: false;
        readonly hasSms: false;
        readonly hasMultiAdmin: false;
        readonly themes: readonly ["vitrine-moderne", "marche-colore"];
    };
    readonly premium: {
        readonly maxProducts: number;
        readonly maxPhotos: number;
        readonly hasVideo: true;
        readonly hasAnalytics: true;
        readonly hasPromo: true;
        readonly hasSms: true;
        readonly hasMultiAdmin: true;
        readonly themes: readonly ["vitrine-moderne", "marche-colore", "luxe-sombre", "boutique-pro", "stories-style"];
    };
};
export type PlanType = keyof typeof PLAN_LIMITS;
/**
 * Middleware — verifie que le plan est Premium
 * Utilise sur les routes reservees au plan Premium
 */
export declare const requirePremium: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware — verifie la limite de produits selon le plan
 * Utilise avant la creation d'un produit
 */
export declare const checkProductLimit: (productCount: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware — verifie la limite de photos selon le plan
 * Utilise avant l'upload d'images
 */
export declare const checkPhotoLimit: (photoCount: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware — verifie si le theme est disponible pour le plan
 */
export declare const checkThemeAccess: (theme: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Helper — retourne les limites du plan courant
 */
export declare const getPlanLimits: (planType: PlanType) => {
    readonly maxProducts: 10;
    readonly maxPhotos: 5;
    readonly hasVideo: false;
    readonly hasAnalytics: false;
    readonly hasPromo: false;
    readonly hasSms: false;
    readonly hasMultiAdmin: false;
    readonly themes: readonly ["vitrine-moderne", "marche-colore"];
} | {
    readonly maxProducts: number;
    readonly maxPhotos: number;
    readonly hasVideo: true;
    readonly hasAnalytics: true;
    readonly hasPromo: true;
    readonly hasSms: true;
    readonly hasMultiAdmin: true;
    readonly themes: readonly ["vitrine-moderne", "marche-colore", "luxe-sombre", "boutique-pro", "stories-style"];
};
//# sourceMappingURL=plan.d.ts.map