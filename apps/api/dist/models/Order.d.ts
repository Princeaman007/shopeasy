import mongoose, { Document } from 'mongoose';
/**
 * Un article dans la commande
 */
export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    image?: string;
}
/**
 * Informations du client (connecté ou invité)
 */
export interface IOrderCustomer {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    isGuest: boolean;
}
/**
 * Historique d'un changement de statut
 */
export interface IStatusHistory {
    status: string;
    date: Date;
    note?: string;
}
/**
 * Interface principale Order
 */
export interface IOrder extends Document {
    shopId: mongoose.Types.ObjectId;
    customerId?: mongoose.Types.ObjectId;
    orderNumber: string;
    items: IOrderItem[];
    promoCode?: string;
    discount: number;
    subtotal: number;
    total: number;
    customer: IOrderCustomer;
    status: 'new' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
    statusHistory: IStatusHistory[];
    smsSent: boolean;
    waNotifSent: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Order: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Order.d.ts.map