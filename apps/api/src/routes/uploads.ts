import { Router, Request, Response } from 'express';
import { authenticate, requireMerchant } from '../middleware/auth';
import { uploadSingle, uploadMultiple, uploadVideo, handleUpload } from '../middleware/upload';
import { uploadImage, deleteFromCloudinary } from '../services/Cloudinary';
import { Shop }    from '../models/Shop';
import { Product } from '../models/Product';

const router = Router();

// ─── POST /uploads/logo — Upload logo boutique ───────────────────────────────

router.post(
  '/logo',
  authenticate,
  requireMerchant,
  handleUpload(uploadSingle),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
        return;
      }

      const url  = await uploadImage(req.file.buffer, 'logo');
      const shop = await Shop.findOneAndUpdate(
        { ownerId: req.user!.userId },
        { logo: url },
        { new: true }
      );

      res.json({ success: true, data: { url, shop }, message: 'Logo mis à jour' });
    } catch (error) {
      console.error('Erreur upload logo :', error);
      res.status(500).json({ success: false, message: 'Erreur upload' });
    }
  }
);

// ─── POST /uploads/owner-photo — Upload photo propriétaire ───────────────────

router.post(
  '/owner-photo',
  authenticate,
  requireMerchant,
  handleUpload(uploadSingle),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
        return;
      }

      const url = await uploadImage(req.file.buffer, 'ownerPhoto');
      res.json({ success: true, data: { url }, message: 'Photo uploadée' });
    } catch (error) {
      console.error('Erreur upload owner-photo :', error);
      res.status(500).json({ success: false, message: 'Erreur upload' });
    }
  }
);

// ─── POST /uploads/products — Upload photos produit (max 10) ─────────────────

router.post(
  '/products',
  authenticate,
  requireMerchant,
  handleUpload(uploadMultiple),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
        return;
      }

      const { planType } = req.shop!;
      if (planType === 'basic' && files.length > 5) {
        res.status(403).json({
          success: false,
          message: 'Plan Basic : maximum 5 photos par produit',
        });
        return;
      }

      const urls = await Promise.all(
        files.map((file) => uploadImage(file.buffer, 'image'))
      );

      res.json({
        success: true,
        data:    { urls },
        message: `${urls.length} photo(s) uploadée(s)`,
      });
    } catch (error) {
      console.error('Erreur upload products :', error);
      res.status(500).json({ success: false, message: 'Erreur upload' });
    }
  }
);

// ─── POST /uploads/video — Upload vidéo produit (Premium uniquement) ─────────

router.post(
  '/video',
  authenticate,
  requireMerchant,
  handleUpload(uploadVideo),        // ← limite 100 Mo, filtre video uniquement
  async (req: Request, res: Response) => {
    try {
      if (req.shop!.planType !== 'premium') {
        res.status(403).json({
          success: false,
          message: 'Les vidéos sont réservées au plan Premium',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: 'Aucun fichier envoyé' });
        return;
      }

      const url = await uploadImage(req.file.buffer, 'video');

      res.json({ success: true, data: { url }, message: 'Vidéo uploadée' });
    } catch (error) {
      console.error('Erreur upload video :', error);
      res.status(500).json({ success: false, message: 'Erreur upload' });
    }
  }
);

// ─── DELETE /uploads — Supprimer un fichier Cloudinary ───────────────────────

router.delete(
  '/',
  authenticate,
  requireMerchant,
  async (req: Request, res: Response) => {
    try {
      const { url } = req.body;

      if (!url) {
        res.status(400).json({ success: false, message: 'URL obligatoire' });
        return;
      }

      await deleteFromCloudinary(url);
      res.json({ success: true, message: 'Fichier supprimé' });
    } catch (error) {
      console.error('Erreur suppression upload :', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

export default router;