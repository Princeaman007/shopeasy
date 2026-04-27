import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Shop } from '../models/Shop';
import { Category, PREDEFINED_CATEGORIES } from '../models/Category';
import { RegisterMerchantSchema, LoginSchema, RegisterClientSchema } from '@shopeasy/types';
import { signToken, signRefreshToken, verifyToken, verifyRefreshToken, IJwtPayload } from '../config/jwt';
import crypto from 'crypto';
import { getRedis } from '../config/redis';
import { sendPasswordResetEmail, sendWelcomeEmail, sendEmailConfirmation } from '../services/Email';
import { rattacherCommandesInvite } from '../services/OrderAttachment';

const router = Router();

// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/register — Inscription marchand
// ---------------------------------------------------------------------------
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

    const user = await User.create({
      name, email, phone, password,
      role: 'merchant',
      emailVerified: false,
    });

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
        shopId: shop._id, name: cat.name, slug: cat.slug,
        icon: cat.icon, order: cat.order, predefined: true, parentId: null,
      }))
    );

    // Genere token confirmation email et stocke dans Redis 24h
    const confirmToken = crypto.randomBytes(32).toString('hex');
    const redis = getRedis();
    await redis.setex(`confirm:${confirmToken}`, 24 * 60 * 60, String(user._id));

    // Envoie email de confirmation
    try {
      await sendEmailConfirmation(email, name, confirmToken);
    } catch (emailErr) {
      console.error('Erreur envoi email confirmation:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Compte cree — verifiez votre email pour confirmer votre inscription',
      data: { email },
    });
  } catch (error) {
    console.error('Erreur inscription :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET ${process.env.NEXT_PUBLIC_API_URL}/auth/confirm-email?token=xxx
// ---------------------------------------------------------------------------
router.get('/confirm-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;
    if (!token) {
      res.status(400).json({ success: false, message: 'Token manquant' });
      return;
    }

    const redis = getRedis();
    const userId = await redis.get(`confirm:${String(token)}`);
    if (!userId) {
      res.status(400).json({ success: false, message: 'Lien invalide ou expire' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { emailVerified: true },
      { new: true }
    );
    if (!user) {
      res.status(400).json({ success: false, message: 'Utilisateur introuvable' });
      return;
    }

    await redis.del(`confirm:${String(token)}`);

    // Envoie email de bienvenue
    try {
      const shop = user.shopId ? await Shop.findById(user.shopId) : null;
      await sendWelcomeEmail(user.email, user.name, shop?.slug ?? '');
    } catch (emailErr) {
      console.error('Erreur envoi email bienvenue:', emailErr);
    }

    res.json({
      success: true,
      message: 'Email confirme — vous pouvez maintenant vous connecter',
    });
  } catch (error) {
    console.error('Erreur confirm-email :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/resend-confirmation — Renvoyer l'email de confirmation
// ---------------------------------------------------------------------------
router.post('/resend-confirmation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email obligatoire' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+emailVerified');
    if (!user) {
      res.json({ success: true, message: 'Si cet email existe, un nouveau lien a ete envoye' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ success: false, message: 'Email deja confirme' });
      return;
    }

    const confirmToken = crypto.randomBytes(32).toString('hex');
    const redis = getRedis();
    await redis.setex(`confirm:${confirmToken}`, 24 * 60 * 60, String(user._id));

    try {
      await sendEmailConfirmation(user.email, user.name, confirmToken);
    } catch (emailErr) {
      console.error('Erreur renvoi email:', emailErr);
    }

    res.json({ success: true, message: 'Nouveau lien de confirmation envoye' });
  } catch (error) {
    console.error('Erreur resend-confirmation :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select('+password +emailVerified');
    if (!user) {
      res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
      return;
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
      return;
    }

    // Verifie que l'email est confirme
    if (!user.emailVerified) {
      res.status(403).json({
        success: false,
        message: 'Veuillez confirmer votre email avant de vous connecter',
        code: 'EMAIL_NOT_VERIFIED',
      });
      return;
    }

    let shop = null;
if (user.role === 'merchant' && user.shopId) {
  shop = await Shop.findById(user.shopId).select(
    'slug name planType subscriptionStatus trialEndsAt selectedTheme'
  );
}

// ✅ Vérifie si l'user est équipier d'une boutique
if (!shop) {
  shop = await Shop.findOne({ admins: user._id }).select(
    'slug name planType subscriptionStatus trialEndsAt selectedTheme'
  );
}

const tokenPayload: IJwtPayload = {
  userId: String(user._id),
  role:   user.role,
  shopId: user.shopId
    ? String(user.shopId)
    : shop
    ? String((shop as any)._id)
    : undefined,
};

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.cookie('token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    if (user.role === 'client') {
      await rattacherCommandesInvite(String(user._id), user.email);
    }

    res.json({
      success: true,
      message: 'Connexion reussie',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        shop,
        token,
      },
    });
  } catch (error) {
    console.error('Erreur connexion :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/refresh
// ---------------------------------------------------------------------------
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
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, token: newToken });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token invalide' });
  }
});

// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/logout
// ---------------------------------------------------------------------------
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Deconnecte avec succes' });
});

// ---------------------------------------------------------------------------
// GET ${process.env.NEXT_PUBLIC_API_URL}/auth/me
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/register-client
// ---------------------------------------------------------------------------
router.post('/register-client', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = RegisterClientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, email, phone, password } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Cet email est deja utilise' });
      return;
    }

    // Client avec confirmation email
    const user = await User.create({
      name, email, phone, password,
      role: 'client',
      emailVerified: false,
    });

    // Genere token confirmation
    const confirmToken = crypto.randomBytes(32).toString('hex');
    const redis = getRedis();
    await redis.setex(`confirm:${confirmToken}`, 24 * 60 * 60, String(user._id));

    try {
      await sendEmailConfirmation(email, name, confirmToken);
    } catch (emailErr) {
      console.error('Erreur envoi email confirmation client:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Compte cree — verifiez votre email pour confirmer votre inscription',
      data: { email },
    });
  } catch (error) {
    console.error('Erreur inscription client :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password
// ---------------------------------------------------------------------------
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email obligatoire' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.json({ success: true, message: 'Si cet email existe, vous recevrez un lien de reinitialisation' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const redis = getRedis();
    await redis.setex(`reset:${resetToken}`, 60 * 60, String(user._id));
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({ success: true, message: 'Si cet email existe, vous recevrez un lien de reinitialisation' });
  } catch (error) {
    console.error('Erreur forgot-password :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST ${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password
// ---------------------------------------------------------------------------
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ success: false, message: 'Token et mot de passe obligatoires' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Mot de passe trop court — minimum 6 caracteres' });
      return;
    }

    const redis = getRedis();
    const userId = await redis.get(`reset:${token}`);
    if (!userId) {
      res.status(400).json({ success: false, message: 'Token invalide ou expire' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ success: false, message: 'Utilisateur introuvable' });
      return;
    }

    user.password = password;
    await user.save();
    await redis.del(`reset:${token}`);

    res.json({ success: true, message: 'Mot de passe reinitialise avec succes' });
  } catch (error) {
    console.error('Erreur reset-password :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;