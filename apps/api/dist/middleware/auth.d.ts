import { Request, Response, NextFunction } from 'express';
import { IJwtPayload } from '../config/jwt';
/**
 * Extension du type Request pour inclure l'utilisateur connecte
 */
declare global {
    namespace Express {
        interface Request {
            user?: IJwtPayload;
            shop?: {
                id: string;
                planType: 'basic' | 'premium';
                subscriptionStatus: 'trial' | 'active' | 'expired' | 'suspended';
            };
        }
    }
}
/**
 * Middleware d'authentification
 * Verifie le JWT depuis le cookie ou le header Authorization
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware marchand
 * Verifie que l'utilisateur est un marchand + charge les infos boutique
 */
export declare const requireMerchant: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware client
 * Verifie que l'utilisateur est un client
 */
export declare const requireClient: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware admin
 * Verifie que l'utilisateur est un super admin
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware optionnel
 * Authentifie si token present, continue sinon (pour les routes publiques)
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map