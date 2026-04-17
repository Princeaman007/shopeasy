import mongoose from 'mongoose';


export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI as string;

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB :', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB déconnecté');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnecté');
  });
};