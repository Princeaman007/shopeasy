"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
/**
 * Configuration Cloudinary
 */
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET,
});
/**
 * Options d'upload selon le type de fichier
 */
const UPLOAD_OPTIONS = {
    image: {
        folder: 'shopeasy/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // redimensionne sans déformer
            { quality: 'auto', fetch_format: 'auto' }, // optimise automatiquement
        ],
    },
    logo: {
        folder: 'shopeasy/logos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
    },
    video: {
        folder: 'shopeasy/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi'],
        transformation: [
            { width: 1280, height: 720, crop: 'limit' },
            { quality: 'auto' },
        ],
    },
    ownerPhoto: {
        folder: 'shopeasy/owners',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
    },
};
/**
 * Upload une image depuis un buffer en mémoire
 */
const uploadImage = (buffer, type = 'image') => {
    return new Promise((resolve, reject) => {
        const options = UPLOAD_OPTIONS[type];
        const resourceType = type === 'video' ? 'video' : 'image';
        const stream = cloudinary_1.v2.uploader.upload_stream({ ...options, resource_type: resourceType }, (error, result) => {
            if (error)
                return reject(error);
            if (!result)
                return reject(new Error('Upload échoué'));
            resolve(result.secure_url);
        });
        stream.end(buffer);
    });
};
exports.uploadImage = uploadImage;
/**
 * Supprime un fichier Cloudinary depuis son URL
 */
const deleteFromCloudinary = async (url) => {
    try {
        // Extrait le public_id depuis l'URL Cloudinary
        const parts = url.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const folder = parts[parts.length - 2];
        const publicId = `${folder}/${filename}`;
        await cloudinary_1.v2.uploader.destroy(publicId);
    }
    catch (error) {
        console.error('Erreur suppression Cloudinary :', error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
exports.default = cloudinary_1.v2;
//# sourceMappingURL=Cloudinary.js.map