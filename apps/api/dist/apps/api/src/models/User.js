"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SavedAddressSchema = new mongoose_1.Schema({
    label: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
}, { _id: true });
const UserSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Product',
        },
    ],
    shopId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Shop',
        default: null,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true, // createdAt + updatedAt automatiques
});
/**
 * Hash du mot de passe avant sauvegarde
 */
UserSchema.pre('save', async function (next) {
    // Ne re-hashe que si le mot de passe a changé
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
/**
 * Compare un mot de passe en clair avec le hash stocké
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.User = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map