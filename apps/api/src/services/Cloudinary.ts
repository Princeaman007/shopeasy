import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

/**
 * Configuration Cloudinary
 */
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Options d'upload selon le type de fichier
 */
const UPLOAD_OPTIONS = {
  image: {
    folder:         'shopeasy/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' }, // redimensionne sans déformer
      { quality: 'auto', fetch_format: 'auto' },     // optimise automatiquement
    ],
  },
  logo: {
    folder:         'shopeasy/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
  video: {
    folder:           'shopeasy/videos',
    resource_type:    'video' as const,
    allowed_formats:  ['mp4', 'mov', 'avi'],
    transformation:   [
      { width: 1280, height: 720, crop: 'limit' },
      { quality: 'auto' },
    ],
  },
  ownerPhoto: {
    folder:         'shopeasy/owners',
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
export const uploadImage = (
  buffer: Buffer,
  type: keyof typeof UPLOAD_OPTIONS = 'image'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const options = UPLOAD_OPTIONS[type];
    const resourceType = type === 'video' ? 'video' : 'image';

    const stream = cloudinary.uploader.upload_stream(
      { ...options, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Upload échoué'));
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

/**
 * Supprime un fichier Cloudinary depuis son URL
 */
export const deleteFromCloudinary = async (url: string): Promise<void> => {
  try {
    // Extrait le public_id depuis l'URL Cloudinary
    const parts    = url.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder   = parts[parts.length - 2];
    const publicId = `${folder}/${filename}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Erreur suppression Cloudinary :', error);
  }
};

export default cloudinary;