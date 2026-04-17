import { z } from 'zod'
import { UserRole, PlanType, OrderStatus, ProductStatus, PromoType, LeadStatus } from './enums'

// ── Auth ────────────────────────────────────────────────────────

export const RegisterMerchantSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court'),
  phone: z.string().min(8, 'Numéro invalide').max(20),
  shopName: z.string().min(2, 'Nom de boutique trop court').max(100),
  shopSlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug invalide (minuscules, chiffres, tirets)'),
})

export const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const RegisterClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(8).max(20),
})

// ── Boutique ────────────────────────────────────────────────────

export const UpdateShopSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  whatsapp: z.string().min(8).max(20).optional(),
  whatsappOrderNotif: z.boolean().optional(),
  selectedTheme: z.string().optional(),
  about: z.object({
    description: z.string().max(500).optional(),
    ownerName: z.string().max(100).optional(),
    ownerPhoto: z.string().url().optional(),
    location: z.string().max(200).optional(),
    workingHours: z.string().max(200).optional(),
  }).optional(),
})

// ── Produit ─────────────────────────────────────────────────────

export const VariantSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
  options: z.array(z.string()).min(1),
})

export const StockSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().min(0),
  price: z.number().positive().optional(),
})

export const CreateProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.string().optional(),
  price: z.number().positive('Prix invalide'),
  comparePrice: z.number().positive().optional(),
  hasVariants: z.boolean().default(false),
  variants: z.array(VariantSchema).default([]),
  stock: z.array(StockSchema).default([]),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
})

// ── Commande ────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  variant: z.string().optional(),
  image: z.string().optional(),
})

export const CreateOrderSchema = z.object({
  shopId: z.string(),
  items: z.array(OrderItemSchema).min(1, 'Panier vide'),
  promoCode: z.string().optional(),
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional(),
    address: z.string().min(5),
    city: z.string().min(2),
  }),
})

// ── Code promo ──────────────────────────────────────────────────

export const CreatePromoSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.nativeEnum(PromoType),
  value: z.number().positive(),
  minOrder: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
})

// ── Lead ────────────────────────────────────────────────────────

export const CreateLeadSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  message: z.string().max(500).optional(),
})

// ── Types inférés ───────────────────────────────────────────────

export type RegisterMerchantInput = z.infer<typeof RegisterMerchantSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterClientInput = z.infer<typeof RegisterClientSchema>
export type UpdateShopInput = z.infer<typeof UpdateShopSchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type CreatePromoInput = z.infer<typeof CreatePromoSchema>
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>