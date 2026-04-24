import { z } from 'zod';
import { ProductStatus, PromoType } from './enums';
export declare const RegisterMerchantSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodString;
    shopName: z.ZodString;
    shopSlug: z.ZodString;
    whatsapp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    name: string;
    email: string;
    password: string;
    whatsapp: string;
    shopName: string;
    shopSlug: string;
}, {
    phone: string;
    name: string;
    email: string;
    password: string;
    whatsapp: string;
    shopName: string;
    shopSlug: string;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RegisterClientSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    name: string;
    email: string;
    password: string;
}, {
    phone: string;
    name: string;
    email: string;
    password: string;
}>;
export declare const UpdateShopSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    whatsapp: z.ZodOptional<z.ZodString>;
    whatsappOrderNotif: z.ZodOptional<z.ZodBoolean>;
    selectedTheme: z.ZodOptional<z.ZodString>;
    about: z.ZodOptional<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        ownerName: z.ZodOptional<z.ZodString>;
        ownerPhoto: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        workingHours: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        ownerName?: string | undefined;
        ownerPhoto?: string | undefined;
        location?: string | undefined;
        workingHours?: string | undefined;
    }, {
        description?: string | undefined;
        ownerName?: string | undefined;
        ownerPhoto?: string | undefined;
        location?: string | undefined;
        workingHours?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    selectedTheme?: string | undefined;
    whatsapp?: string | undefined;
    whatsappOrderNotif?: boolean | undefined;
    about?: {
        description?: string | undefined;
        ownerName?: string | undefined;
        ownerPhoto?: string | undefined;
        location?: string | undefined;
        workingHours?: string | undefined;
    } | undefined;
}, {
    name?: string | undefined;
    selectedTheme?: string | undefined;
    whatsapp?: string | undefined;
    whatsappOrderNotif?: boolean | undefined;
    about?: {
        description?: string | undefined;
        ownerName?: string | undefined;
        ownerPhoto?: string | undefined;
        location?: string | undefined;
        workingHours?: string | undefined;
    } | undefined;
}>;
export declare const VariantSchema: z.ZodObject<{
    type: z.ZodString;
    label: z.ZodString;
    options: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    label: string;
    type: string;
    options: string[];
}, {
    label: string;
    type: string;
    options: string[];
}>;
export declare const StockSchema: z.ZodObject<{
    sku: z.ZodString;
    quantity: z.ZodNumber;
    price: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sku: string;
    quantity: number;
    price?: number | undefined;
}, {
    sku: string;
    quantity: number;
    price?: number | undefined;
}>;
export declare const CreateProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    comparePrice: z.ZodOptional<z.ZodNumber>;
    hasVariants: z.ZodDefault<z.ZodBoolean>;
    variants: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        label: z.ZodString;
        options: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        label: string;
        type: string;
        options: string[];
    }, {
        label: string;
        type: string;
        options: string[];
    }>, "many">>;
    stock: z.ZodDefault<z.ZodArray<z.ZodObject<{
        sku: z.ZodString;
        quantity: z.ZodNumber;
        price: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        sku: string;
        quantity: number;
        price?: number | undefined;
    }, {
        sku: string;
        quantity: number;
        price?: number | undefined;
    }>, "many">>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof ProductStatus>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    hasVariants: boolean;
    variants: {
        label: string;
        type: string;
        options: string[];
    }[];
    stock: {
        sku: string;
        quantity: number;
        price?: number | undefined;
    }[];
    status: ProductStatus;
    description?: string | undefined;
    categoryId?: string | undefined;
    comparePrice?: number | undefined;
}, {
    name: string;
    price: number;
    description?: string | undefined;
    categoryId?: string | undefined;
    comparePrice?: number | undefined;
    hasVariants?: boolean | undefined;
    variants?: {
        label: string;
        type: string;
        options: string[];
    }[] | undefined;
    stock?: {
        sku: string;
        quantity: number;
        price?: number | undefined;
    }[] | undefined;
    status?: ProductStatus | undefined;
}>;
export declare const OrderItemSchema: z.ZodObject<{
    productId: z.ZodString;
    name: z.ZodString;
    price: z.ZodNumber;
    quantity: z.ZodNumber;
    variant: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    quantity: number;
    price: number;
    productId: string;
    variant?: string | undefined;
    image?: string | undefined;
}, {
    name: string;
    quantity: number;
    price: number;
    productId: string;
    variant?: string | undefined;
    image?: string | undefined;
}>;
export declare const CreateOrderSchema: z.ZodObject<{
    shopId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        name: z.ZodString;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        variant: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        quantity: number;
        price: number;
        productId: string;
        variant?: string | undefined;
        image?: string | undefined;
    }, {
        name: string;
        quantity: number;
        price: number;
        productId: string;
        variant?: string | undefined;
        image?: string | undefined;
    }>, "many">;
    promoCode: z.ZodOptional<z.ZodString>;
    customer: z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        address: z.ZodString;
        city: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        address: string;
        city: string;
        phone: string;
        name: string;
        email?: string | undefined;
    }, {
        address: string;
        city: string;
        phone: string;
        name: string;
        email?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    shopId: string;
    items: {
        name: string;
        quantity: number;
        price: number;
        productId: string;
        variant?: string | undefined;
        image?: string | undefined;
    }[];
    customer: {
        address: string;
        city: string;
        phone: string;
        name: string;
        email?: string | undefined;
    };
    promoCode?: string | undefined;
}, {
    shopId: string;
    items: {
        name: string;
        quantity: number;
        price: number;
        productId: string;
        variant?: string | undefined;
        image?: string | undefined;
    }[];
    customer: {
        address: string;
        city: string;
        phone: string;
        name: string;
        email?: string | undefined;
    };
    promoCode?: string | undefined;
}>;
export declare const CreatePromoSchema: z.ZodObject<{
    code: z.ZodString;
    type: z.ZodNativeEnum<typeof PromoType>;
    value: z.ZodNumber;
    minOrder: z.ZodOptional<z.ZodNumber>;
    maxUses: z.ZodOptional<z.ZodNumber>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: PromoType;
    value: number;
    code: string;
    minOrder?: number | undefined;
    maxUses?: number | undefined;
    expiresAt?: string | undefined;
}, {
    type: PromoType;
    value: number;
    code: string;
    minOrder?: number | undefined;
    maxUses?: number | undefined;
    expiresAt?: string | undefined;
}>;
export declare const CreateLeadSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    name: string;
    message?: string | undefined;
    email?: string | undefined;
}, {
    phone: string;
    name: string;
    message?: string | undefined;
    email?: string | undefined;
}>;
export type RegisterMerchantInput = z.infer<typeof RegisterMerchantSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterClientInput = z.infer<typeof RegisterClientSchema>;
export type UpdateShopInput = z.infer<typeof UpdateShopSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreatePromoInput = z.infer<typeof CreatePromoSchema>;
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
//# sourceMappingURL=schemas.d.ts.map