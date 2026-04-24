import { v2 as cloudinary } from 'cloudinary';
/**
 * Options d'upload selon le type de fichier
 */
declare const UPLOAD_OPTIONS: {
    image: {
        folder: string;
        allowed_formats: string[];
        transformation: ({
            width: number;
            height: number;
            crop: string;
            quality?: undefined;
            fetch_format?: undefined;
        } | {
            quality: string;
            fetch_format: string;
            width?: undefined;
            height?: undefined;
            crop?: undefined;
        })[];
    };
    logo: {
        folder: string;
        allowed_formats: string[];
        transformation: ({
            width: number;
            height: number;
            crop: string;
            quality?: undefined;
            fetch_format?: undefined;
        } | {
            quality: string;
            fetch_format: string;
            width?: undefined;
            height?: undefined;
            crop?: undefined;
        })[];
    };
    video: {
        folder: string;
        resource_type: "video";
        allowed_formats: string[];
        transformation: ({
            width: number;
            height: number;
            crop: string;
            quality?: undefined;
        } | {
            quality: string;
            width?: undefined;
            height?: undefined;
            crop?: undefined;
        })[];
    };
    ownerPhoto: {
        folder: string;
        allowed_formats: string[];
        transformation: ({
            width: number;
            height: number;
            crop: string;
            gravity: string;
            quality?: undefined;
            fetch_format?: undefined;
        } | {
            quality: string;
            fetch_format: string;
            width?: undefined;
            height?: undefined;
            crop?: undefined;
            gravity?: undefined;
        })[];
    };
};
/**
 * Upload une image depuis un buffer en mémoire
 */
export declare const uploadImage: (buffer: Buffer, type?: keyof typeof UPLOAD_OPTIONS) => Promise<string>;
/**
 * Supprime un fichier Cloudinary depuis son URL
 */
export declare const deleteFromCloudinary: (url: string) => Promise<void>;
export default cloudinary;
//# sourceMappingURL=Cloudinary.d.ts.map