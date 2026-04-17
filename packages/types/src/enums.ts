// ── Énumérations partagées ShopEasy CI ──────────────────────────

export enum UserRole {
  MERCHANT = 'merchant',
  CLIENT = 'client',
  ADMIN = 'admin',
}

export enum PlanType {
  BASIC = 'basic',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

export enum OrderStatus {
  NEW = 'new',
  CONFIRMED = 'confirmed',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum ProductStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum PromoType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  CONVERTED = 'converted',
}

export enum Theme {
  VITRINE_MODERNE = 'vitrine-moderne',
  MARCHE_COLORE = 'marche-colore',
  LUXE_SOMBRE = 'luxe-sombre',
  BOUTIQUE_PRO = 'boutique-pro',
  STORIES_STYLE = 'stories-style',
}