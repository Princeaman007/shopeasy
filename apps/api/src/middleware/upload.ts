import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

/**
 * Stockage en mémoire — on envoie le buffer directement à Cloudinary
 */
const storage = multer.memoryStorage();

/**
 * Filtre les fichiers acceptés
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const typesAutorisés = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime', // .mov
  ];

  if (typesAutorisés.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé'));
  }
};

/**
 * Upload simple — 1 fichier (logo, photo propriétaire)
 */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
}).single('file');

/**
 * Upload multiple — jusqu'à 10 fichiers (photos produit)
 */
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize:  10 * 1024 * 1024, // 10 MB par fichier
    files:     10,
  },
}).array('files', 10);

/**
 * Wrapper pour gérer les erreurs multer proprement
 */
export const handleUpload = (
  uploadFn: Function
) => (req: Request, res: Response, next: NextFunction) => {
  uploadFn(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Fichier trop lourd — maximum 10 MB',
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