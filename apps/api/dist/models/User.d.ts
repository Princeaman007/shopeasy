import mongoose, { Document } from 'mongoose';
/**
 * Adresse sauvegardée par le client
 */
export interface ISavedAddress {
    label: string;
    address: string;
    city: string;
    phone: string;
}
/**
 * Interface principale User
 */
export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: 'merchant' | 'client' | 'admin';
    savedAddresses: ISavedAddress[];
    favorites: mongoose.Types.ObjectId[];
    shopId?: mongoose.Types.ObjectId;
    emailVerified: boolean;
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map