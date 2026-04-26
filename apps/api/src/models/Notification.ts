// apps${process.env.NEXT_PUBLIC_API_URL}/src/models/Notification.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  titre:     string;
  message:   string;
  cible:     'tous' | 'marchands' | 'premium' | 'expires';
  envoye:    number;
  createdBy: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  titre:     { type: String, required: true },
  message:   { type: String, required: true },
  cible:     {
    type:    String,
    enum:    ['tous', 'marchands', 'premium', 'expires'],
    default: 'tous',
  },
  envoye:    { type: Number, default: 0 },
  createdBy: { type: String },
}, { timestamps: true });

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);