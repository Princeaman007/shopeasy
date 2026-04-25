"use strict";
// ── Énumérations partagées ShopEasy CI ──────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.Theme = exports.LeadStatus = exports.PromoType = exports.ProductStatus = exports.OrderStatus = exports.SubscriptionStatus = exports.PlanType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["MERCHANT"] = "merchant";
    UserRole["CLIENT"] = "client";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var PlanType;
(function (PlanType) {
    PlanType["BASIC"] = "basic";
    PlanType["PREMIUM"] = "premium";
})(PlanType || (exports.PlanType = PlanType = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["TRIAL"] = "trial";
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["EXPIRED"] = "expired";
    SubscriptionStatus["SUSPENDED"] = "suspended";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["NEW"] = "new";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["SHIPPING"] = "shipping";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["ACTIVE"] = "active";
    ProductStatus["DRAFT"] = "draft";
    ProductStatus["OUT_OF_STOCK"] = "out_of_stock";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var PromoType;
(function (PromoType) {
    PromoType["PERCENT"] = "percent";
    PromoType["FIXED"] = "fixed";
})(PromoType || (exports.PromoType = PromoType = {}));
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "new";
    LeadStatus["CONTACTED"] = "contacted";
    LeadStatus["CONVERTED"] = "converted";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var Theme;
(function (Theme) {
    Theme["VITRINE_MODERNE"] = "vitrine-moderne";
    Theme["MARCHE_COLORE"] = "marche-colore";
    Theme["LUXE_SOMBRE"] = "luxe-sombre";
    Theme["BOUTIQUE_PRO"] = "boutique-pro";
    Theme["STORIES_STYLE"] = "stories-style";
})(Theme || (exports.Theme = Theme = {}));
