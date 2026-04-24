"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ MongoDB connecté');
    }
    catch (error) {
        console.error('❌ Erreur connexion MongoDB :', error);
        process.exit(1);
    }
    mongoose_1.default.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB déconnecté');
    });
    mongoose_1.default.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnecté');
    });
};
exports.connectDB = connectDB;
//# sourceMappingURL=db.js.map