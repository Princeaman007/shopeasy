import { Request, Response, NextFunction } from 'express';
import { verifyToken, IJwtPayload } from '../config/jwt';
import { User } from '../models/User';
import { Shop } from '../models/Shop';

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
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Recupere le token depuis le cookie ou le header
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Non authentifie — token manquant',
      });
      return;
    }

    // Verifie et decode le token
    const payload = verifyToken(token);

    // Verifie que l'utilisateur existe toujours en DB
    const user = await User.findById(payload.userId).select('_id role shopId');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
      return;
    }

    // Attache le payload au request
    req.user = {
      userId: String(user._id),
      role: user.role,
      shopId: user.shopId ? String(user.shopId) : undefined,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token invalide ou expire',
    });
  }
};

/**
 * Middleware marchand
 * Verifie que l'utilisateur est un marchand + charge les infos boutique
 */
export const requireMerchant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(403).json({ success: false, message: 'Non authentifie' });
    return;
  }

  // ✅ Autorise marchands ET équipiers (client avec shopId)
  const estMarchand = req.user.role === 'merchant';
  const estEquipier = req.user.role === 'client' && !!req.user.shopId;

  if (!estMarchand && !estEquipier) {
    res.status(403).json({
      success: false,
      message: 'Acces reserve aux marchands et equipiers',
    });
    return;
  }

  // ✅ Pour les équipiers, trouve la boutique via admins
  let shopId = req.user.shopId;
  if (estEquipier && !shopId) {
    const shopAdmin = await Shop.findOne({ admins: req.user.userId }).select('_id');
    if (shopAdmin) shopId = String(shopAdmin._id);
  }

  if (!shopId) {
    res.status(403).json({
      success: false,
      message: 'Aucune boutique associee a ce compte',
    });
    return;
  }

  // Charge les infos de la boutique
  const shop = await Shop.findById(shopId).select(
    'planType subscriptionStatus trialEndsAt'
  );

  if (!shop) {
    res.status(403).json({
      success: false,
      message: 'Boutique introuvable',
    });
    return;
  }

  // Verifie que l'abonnement est actif
  const isActive =
    shop.subscriptionStatus === 'active' ||
    (shop.subscriptionStatus === 'trial' && shop.trialEndsAt > new Date());

  if (!isActive) {
    res.status(403).json({
      success: false,
      message: 'Abonnement expire — renouvelez votre abonnement pour continuer',
      code: 'SUBSCRIPTION_EXPIRED',
    });
    return;
  }

  // Attache les infos boutique au request
  req.shop = {
    id: String(shop._id),
    planType: shop.planType,
    subscriptionStatus: shop.subscriptionStatus,
  };

  next();
};

/**
 * Middleware client
 * Verifie que l'utilisateur est un client
 */
export const requireClient = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'client') {
    res.status(403).json({
      success: false,
      message: 'Acces reserve aux clients',
    });
    return;
  }
  next();
};

/**
 * Middleware admin
 * Verifie que l'utilisateur est un super admin
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Acces reserve aux administrateurs',
    });
    return;
  }
  next();
};

/**
 * Middleware optionnel
 * Authentifie si token present, continue sinon (pour les routes publiques)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const payload = verifyToken(token);
      req.user = payload;
    }
  } catch {
    // Token invalide — on continue sans authentification
  }
  next();
};