import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { authenticate } from '../middleware/auth';
import { rattacherCommandesInvite } from '../services/OrderAttachment';

const router = Router();

/**
 * GET /backend/users/favoris
 * Retourne les produits favoris du client connecté
 */
router.get('/favoris', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('favorites');
    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    const favoris = await Product.find({
      _id: { $in: user.favorites },
      status: { $ne: 'draft' },
    })
      .populate('shopId', 'name slug')
      .select('name price comparePrice images slug status shopId')
      .lean();

    res.json({ favoris });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * POST /backend/users/favoris/:productId
 * Ajoute un produit aux favoris
 */
router.post('/favoris/:productId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await User.findByIdAndUpdate(
      req.user!.userId,
      { $addToSet: { favorites: req.params.productId } }
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * DELETE /backend/users/favoris/:productId
 * Retire un produit des favoris
 */
router.delete('/favoris/:productId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await User.findByIdAndUpdate(
      req.user!.userId,
      { $pull: { favorites: req.params.productId } }
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * GET /backend/users/adresses
 */
router.get('/adresses', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('savedAddresses');
    res.json({ adresses: user?.savedAddresses || [] });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * POST /backend/users/adresses
 */
router.post('/adresses', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { label, address, city, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $push: { savedAddresses: { label, address, city, phone } } },
      { new: true }
    ).select('savedAddresses');
    res.json({ adresses: user?.savedAddresses || [] });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * PUT /backend/users/adresses/:id
 */
router.put('/adresses/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { label, address, city, phone } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.user!.userId, 'savedAddresses._id': req.params.id },
      {
        $set: {
          'savedAddresses.$.label':   label,
          'savedAddresses.$.address': address,
          'savedAddresses.$.city':    city,
          'savedAddresses.$.phone':   phone,
        },
      },
      { new: true }
    ).select('savedAddresses');
    res.json({ adresses: user?.savedAddresses || [] });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * DELETE /backend/users/adresses/:id
 */
router.delete('/adresses/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $pull: { savedAddresses: { _id: req.params.id } } },
      { new: true }
    ).select('savedAddresses');
    res.json({ adresses: user?.savedAddresses || [] });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * PUT /backend/users/profil
 * Mise à jour nom et téléphone
 */
router.put('/profil', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const update: Record<string, string> = {};
    if (name?.trim())  update.name  = name.trim();
    if (phone?.trim()) update.phone = phone.trim();

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: update },
      { new: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * PUT /backend/users/changer-mot-de-passe
 */
router.put('/changer-mot-de-passe', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Champs obligatoires manquants' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Minimum 6 caractères' });
      return;
    }

    const user = await User.findById(req.user!.userId).select('+password');
    if (!user) { res.status(404).json({ message: 'Utilisateur introuvable' }); return; }

    const valide = await user.comparePassword(currentPassword);
    if (!valide) { res.status(401).json({ message: 'Mot de passe actuel incorrect' }); return; }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Mot de passe modifié' });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
/**
 * POST /backend/users/rattacher-commandes
 * Rattachement manuel — utile si le client se connecte après avoir commandé
 */
router.post('/rattacher-commandes', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('email');
    if (!user) { res.status(404).json({ message: 'Utilisateur introuvable' }); return; }

    const count = await rattacherCommandesInvite(req.user!.userId, user.email);
    res.json({ success: true, commandesRattachees: count });
  } catch {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;