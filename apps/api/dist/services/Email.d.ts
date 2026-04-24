/**
 * Email de bienvenue après inscription
 */
export declare const sendWelcomeEmail: (email: string, name: string, shopSlug: string) => Promise<void>;
/**
 * Email de confirmation de commande — pour le marchand
 */
export declare const sendOrderNotificationEmail: (email: string, merchantName: string, order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    total: number;
    items: {
        name: string;
        quantity: number;
        price: number;
    }[];
}) => Promise<void>;
/**
 * Email de confirmation de commande — pour le client
 */
export declare const sendOrderConfirmationEmail: (email: string, customerName: string, order: {
    orderNumber: string;
    shopName: string;
    total: number;
    items: {
        name: string;
        quantity: number;
        price: number;
    }[];
    address: string;
    city: string;
}) => Promise<void>;
/**
 * Email de réinitialisation de mot de passe
 */
export declare const sendPasswordResetEmail: (email: string, name: string, token: string) => Promise<void>;
/**
 * Email de rappel abonnement (J-3 avant expiration)
 */
export declare const sendSubscriptionReminderEmail: (email: string, name: string, shopName: string, expiresAt: Date) => Promise<void>;
/**
 * Email de notification admin — nouveau lead Koffi
 */
export declare const sendLeadNotificationEmail: (lead: {
    name: string;
    phone: string;
    email?: string;
    message?: string;
}) => Promise<void>;
/**
 * Email de confirmation d'inscription
 */
export declare const sendEmailConfirmation: (email: string, name: string, token: string) => Promise<void>;
/**
 * Email de changement de statut commande — pour le client
 */
export declare const sendOrderStatusEmail: (email: string, customerName: string, order: {
    orderNumber: string;
    shopName: string;
    status: string;
    total: number;
}) => Promise<void>;
//# sourceMappingURL=Email.d.ts.map