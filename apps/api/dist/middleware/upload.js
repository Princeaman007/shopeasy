"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUpload = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
/**
 * Stockage en mémoire — on envoie le buffer directement à Cloudinary
 */
const storage = multer_1.default.memoryStorage();
/**
 * Filtre les fichiers acceptés
 */
const fileFilter = (_req, file, cb) => {
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
    }
    else {
        cb(new Error('Format de fichier non autorisé'));
    }
};
/**
 * Upload simple — 1 fichier (logo, photo propriétaire)
 */
exports.uploadSingle = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
}).single('file');
/**
 * Upload multiple — jusqu'à 10 fichiers (photos produit)
 */
exports.uploadMultiple = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB par fichier
        files: 10,
    },
}).array('files', 10);
/**
 * Wrapper pour gérer les erreurs multer proprement
 */
const handleUpload = (uploadFn) => (req, res, next) => {
    uploadFn(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
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
exports.handleUpload = handleUpload;
//# sourceMappingURL=upload.js.map