import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// ── Stockage en mémoire — buffer envoyé directement à Cloudinary ──────────────
const storage = multer.memoryStorage();

// ── Filtre fichiers images uniquement ─────────────────────────────────────────
const fileFilterImage = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const typesAutorisés = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (typesAutorisés.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non autorisé — JPG, PNG ou WebP requis'));
  }
};

// ── Filtre fichiers video uniquement ──────────────────────────────────────────
const fileFilterVideo = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const typesAutorisés = [
    'video/mp4',
    'video/quicktime', // .mov
    'video/avi',
  ];

  if (typesAutorisés.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non autorisé — MP4 ou MOV requis'));
  }
};

// ── Upload simple image — 1 fichier (logo, photo propriétaire) ───────────────
export const uploadSingle = multer({
  storage,
  fileFilter: fileFilterImage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
}).single('file');

// ── Upload multiple images — jusqu'à 10 fichiers (photos produit) ─────────────
export const uploadMultiple = multer({
  storage,
  fileFilter: fileFilterImage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Mo par fichier
    files:    10,
  },
}).array('files', 10);

// ── Upload video — 1 fichier, limite 100 Mo (Premium uniquement) ──────────────
export const uploadVideo = multer({
  storage,
  fileFilter: fileFilterVideo,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 Mo max
}).single('file');

// ── Wrapper gestion erreurs multer ────────────────────────────────────────────
export const handleUpload = (
  uploadFn: Function
) => (req: Request, res: Response, next: NextFunction) => {
  uploadFn(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Fichier trop lourd — maximum 10 Mo pour les images, 100 Mo pour les vidéos',
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Trop de fichiers — maximum 10',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};