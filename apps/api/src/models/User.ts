import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Adresse sauvegardée par le client
 */
export interface ISavedAddress {
  label: string;       // ex: "Maison", "Bureau"
  address: string;     // rue / quartier
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
  createdAt: Date;
  // Méthode utilitaire
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const SavedAddressSchema = new Schema<ISavedAddress>(
  {
    label:   { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city:    { type: String, required: true, trim: true },
    phone:   { type: String, required: true, trim: true },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email obligatoire'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Mot de passe obligatoire'],
      minlength: [6, 'Minimum 6 caractères'],
      select: false, // jamais retourné dans les queries par défaut
    },
    name: {
      type: String,
      required: [true, 'Nom obligatoire'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Téléphone obligatoire'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['merchant', 'client', 'admin'],
      default: 'client',
    },
    savedAddresses: {
      type: [SavedAddressSchema],
      default: [],
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      default: null,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt automatiques
  }
);

/**
 * Hash du mot de passe avant sauvegarde
 */
UserSchema.pre('save', async function (next) {
  // Ne re-hashe que si le mot de passe a changé
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Compare un mot de passe en clair avec le hash stocké
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);