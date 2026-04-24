import mongoose, { Document } from 'mongoose';
export interface INotification extends Document {
    titre: string;
    message: string;
    cible: 'tous' | 'marchands' | 'premium' | 'expires';
    envoye: number;
    createdBy: string;
    createdAt: Date;
}
export declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Notification.d.ts.map