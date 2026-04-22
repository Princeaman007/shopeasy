import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Shop } from '../models/Shop';
import { Category, PREDEFINED_CATEGORIES } from '../models/Category';
import { RegisterMerchantSchema, LoginSchema, RegisterClientSchema } from '@shopeasy/types';
import { signToken, signRefreshToken, verifyToken, verifyRefreshToken, IJwtPayload } from '../config/jwt';
import crypto from 'crypto';
import { getRedis } from '../config/redis';
import { sendPasswordResetEmail } from '../services/Email';
import { rattacherCommandesInvite } from '../services/OrderAttachment';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {


    const parsed = RegisterMerchantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, email, phone, password, shopName, shopSlug, whatsapp } = parsed.data;


    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Cet email est deja utilise' });
      return;
    }

    const existingShop = await Shop.findOne({ slug: shopSlug });
    if (existingShop) {
      res.status(409).json({ success: false, message: 'Ce nom de boutique est deja pris' });
      return;
    }

    const user = await User.create({ name, email, phone, password, role: 'merchant' });

    const shop = await Shop.create({
      slug: shopSlug,
      name: shopName,
      ownerId: user._id,
      whatsapp,
      planType: 'basic' as const,
      selectedTheme: 'vitrine-moderne',
      subscriptionStatus: 'trial' as const,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subscriptionExpiresAt: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
    });

    await User.findByIdAndUpdate(user._id, { shopId: shop._id });

    await Category.insertMany(
      PREDEFINED_CATEGORIES.map((cat) => ({
        shopId: shop._id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        order: cat.order,
        predefined: true,
        parentId: null,
      }))
    );

    const token = signToken({
      userId: String(user._id),
      role: 'merchant',
      shopId: String(shop._id),
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Compte cree avec succes',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        shop: { id: shop._id, slug: shop.slug, name: shop.name, planType: shop.planType, subscriptionStatus: shop.subscriptionStatus, trialEndsAt: shop.trialEndsAt },
        token,
      },
    });
  } catch (error) {
    console.error('Erreur inscription :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/login
 * Connexion marchand ou client
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parsed.data;

    // Cherche l'utilisateur avec le mot de passe (select: false par defaut)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
      return;
    }

    // Verifie le mot de passe
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
      return;
    }

    // Recupere la boutique si marchand
    let shop = null;
    if (user.role === 'merchant' && user.shopId) {
      shop = await Shop.findById(user.shopId).select(
        'slug name planType subscriptionStatus trialEndsAt selectedTheme'
      );
    }

    // Genere les tokens
    const tokenPayload: IJwtPayload = {
      userId: String(user._id),
      role: user.role,
      shopId: user.shopId ? String(user.shopId) : undefined,
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Cookies httpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
    });
    if (user.role === 'client') {
      await rattacherCommandesInvite(String(user._id), user.email);
    }
    res.json({
      success: true,
      message: 'Connexion reussie',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        shop,
        token,
      },
    });
  } catch (error) {
    console.error('Erreur connexion :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/refresh
 * Renouvelle l'access token via le refresh token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token manquant' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
      return;
    }

    const newToken = signToken({
      userId: String(user._id),
      role: user.role,
      shopId: user.shopId ? String(user.shopId) : undefined,
    });

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, token: newToken });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token invalide' });
  }
});

/**
 * POST /api/auth/logout
 * Deconnexion — supprime les cookies
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Deconnecte avec succes' });
});

/**
 * GET /api/auth/me
 * Retourne l'utilisateur connecte
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ success: false, message: 'Non authentifie' });
      return;
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
      return;
    }

    let shop = null;
    if (user.role === 'merchant' && user.shopId) {
      shop = await Shop.findById(user.shopId).select(
        'slug name planType subscriptionStatus trialEndsAt selectedTheme isVerified'
      );
    }

    res.json({ success: true, data: { user, shop } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
});

/**
 * POST /api/auth/register-client
 * Inscription client
 */
router.post('/register-client', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = RegisterClientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, phone, password } = parsed.data;

    // Verifie si email deja utilise
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Cet email est deja utilise',
      });
      return;
    }

    // Cree le client
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'client',
    });
    await rattacherCommandesInvite(String(user._id), email);
    // Genere le token
    const token = signToken({
      userId: String(user._id),
      role: 'client',
    });

    const refreshToken = signRefreshToken({
      userId: String(user._id),
      role: 'client',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Compte client cree avec succes',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Erreur inscription client :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Demande de reinitialisation — envoie un email avec le token
 */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email obligatoire' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Reponse identique meme si l'email n'existe pas (securite)
    if (!user) {
      res.json({
        success: true,
        message: 'Si cet email existe, vous recevrez un lien de reinitialisation',
      });
      return;
    }

    // Genere un token securise
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Stocke dans Redis — expire dans 1 heure
    const redis = getRedis();
    await redis.setex(
      `reset:${resetToken}`,
      60 * 60, // 1 heure
      String(user._id)
    );

    // Envoie l'email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({
      success: true,
      message: 'Si cet email existe, vous recevrez un lien de reinitialisation',
    });
  } catch (error) {
    console.error('Erreur forgot-password :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reinitialisation effective avec le token
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        message: 'Token et nouveau mot de passe obligatoires',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mot de passe trop court — minimum 6 caracteres',
      });
      return;
    }

    // Verifie le token dans Redis
    const redis = getRedis();
    const userId = await redis.get(`reset:${token}`);

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'Token invalide ou expire',
      });
      return;
    }

    // Recupere l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
      return;
    }

    // Met a jour le mot de passe (le pre-save hook le hashera)
    user.password = password;
    await user.save();

    // Supprime le token Redis
    await redis.del(`reset:${token}`);

    res.json({
      success: true,
      message: 'Mot de passe reinitialise avec succes',
    });
  } catch (error) {
    console.error('Erreur reset-password :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;