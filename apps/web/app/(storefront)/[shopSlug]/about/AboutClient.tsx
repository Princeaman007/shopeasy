'use client';

import Image from 'next/image';
import Link  from 'next/link';
import {
  ChevronLeft, MapPin, Clock, MessageCircle,
  CheckCircle, ShoppingBag, ChevronRight, Share2,
} from 'lucide-react';
import { getThemeConfig } from '../theme.config';
import type { ShopPublic } from '../types';

// ---------------------------------------------------------------------------
interface Props {
  shop:     ShopPublic;
  produits: any[];
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

// ---------------------------------------------------------------------------
export default function AboutClient({ shop, produits }: Props) {
  const t = getThemeConfig(shop.selectedTheme);

  const partager = () => {
    if (navigator.share) {
      navigator.share({
        title: shop.name,
        text:  `Découvrez ${shop.name} sur ShopEasy CI`,
        url:   window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav
        style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40"
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/${shop.slug}`}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70"
            style={{ color: t.muted }}
          >
            <ChevronLeft size={18} />
            {shop.name}
          </Link>
          <button onClick={partager} className="p-2 rounded-xl"
                  style={{ backgroundColor: t.elevated }}>
            <Share2 size={18} style={{ color: t.muted }} />
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── HERO BOUTIQUE ── */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0
                         flex items-center justify-center text-3xl relative"
              style={{ backgroundColor: t.elevated }}
            >
              {shop.logo
                ? <Image src={shop.logo} alt={shop.name} fill
                         className="object-cover" />
                : <span>🛍️</span>
              }
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold truncate" style={{ color: t.text }}>
                  {shop.name}
                </h1>
                {shop.isVerified && (
                  <CheckCircle size={18} style={{ color: t.accent }} />
                )}
              </div>
              {shop.isVerified && (
                <p className="text-xs mt-0.5" style={{ color: t.accent }}>
                  ✓ Boutique vérifiée ShopEasy CI
                </p>
              )}
              <p className="text-sm mt-1" style={{ color: t.muted }}>
                {produits.length} produit{produits.length > 1 ? 's' : ''} disponible{produits.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Description */}
          {shop.about?.description && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: t.muted }}
            >
              {shop.about.description}
            </p>
          )}

          {/* Infos pratiques */}
          <div className="space-y-2">
            {shop.about?.location && (
              <div className="flex items-center gap-2 text-sm"
                   style={{ color: t.muted }}>
                <MapPin size={15} style={{ color: t.accent }} />
                {shop.about.location}
              </div>
            )}
            {shop.about?.workingHours && (
              <div className="flex items-center gap-2 text-sm"
                   style={{ color: t.muted }}>
                <Clock size={15} style={{ color: t.accent }} />
                {shop.about.workingHours}
              </div>
            )}
          </div>

          {/* Bouton WhatsApp */}
          {shop.whatsapp && (
            <Link
              href={`https://wa.me/${shop.whatsapp.replace(/\D/g,'')}?text=Bonjour, je suis intéressé par votre boutique ${shop.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3
                         rounded-xl font-semibold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#25D366', color: '#fff' }}
            >
              <MessageCircle size={16} />
              Contacter sur WhatsApp
            </Link>
          )}
        </div>

        {/* ── PROPRIÉTAIRE ── */}
        {shop.about?.ownerName && (
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
          >
            <h2 className="font-semibold" style={{ color: t.text }}>
              La personne derrière la boutique
            </h2>

            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0
                           flex items-center justify-center text-2xl relative"
                style={{ backgroundColor: t.elevated }}
              >
                {shop.about.ownerPhoto
                  ? <Image src={shop.about.ownerPhoto}
                           alt={shop.about.ownerName}
                           fill className="object-cover" />
                  : <span>👤</span>
                }
              </div>
              <div>
                <p className="font-bold" style={{ color: t.text }}>
                  {shop.about.ownerName}
                </p>
                <p className="text-sm" style={{ color: t.muted }}>
                  Propriétaire de {shop.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── APERÇU PRODUITS ── */}
        {produits.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: t.text }}>
                Quelques produits
              </h2>
              <Link
                href={`/${shop.slug}/catalogue`}
                className="text-sm flex items-center gap-1 hover:opacity-80"
                style={{ color: t.accent }}
              >
                Tout voir <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {produits.map(p => (
                <Link
                  key={p._id}
                  href={`/${shop.slug}/produits/${p._id}`}
                  className="group rounded-xl overflow-hidden transition-all
                             hover:scale-[1.02]"
                  style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
                >
                  <div className="aspect-square relative overflow-hidden"
                       style={{ backgroundColor: t.elevated }}>
                    {p.images?.[0]
                      ? <Image src={p.images[0]} alt={p.name} fill
                               className="object-cover group-hover:scale-105
                                          transition-transform" />
                      : <div className="w-full h-full flex items-center
                                        justify-center text-2xl">🛍️</div>
                    }
                  </div>
                  <div className="p-2 space-y-0.5">
                    <p className="text-xs font-medium truncate"
                       style={{ color: t.text }}>
                      {p.name}
                    </p>
                    <p className="text-xs font-bold" style={{ color: t.accent }}>
                      {formatFcfa(p.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href={`/${shop.slug}/catalogue`}
              className="flex items-center justify-center gap-2 w-full py-3
                         rounded-xl border font-semibold text-sm transition-colors"
              style={{
                backgroundColor: 'transparent',
                borderColor:     t.border,
                color:           t.text,
              }}
            >
              <ShoppingBag size={16} />
              Voir tous les produits
            </Link>
          </div>
        )}

        {/* ── BADGE SHOPEASY ── */}
        <div
          className="rounded-2xl p-4 text-center space-y-1"
          style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
        >
          <p className="text-xs" style={{ color: t.muted }}>
            Boutique propulsée par
          </p>
          <Link
            href="/"
            className="font-bold text-sm hover:underline"
            style={{ color: t.accent }}
          >
            ShopEasy CI 🛍️
          </Link>
          <p className="text-xs" style={{ color: t.muted }}>
            Crée ta propre boutique en ligne gratuitement
          </p>
        </div>
      </div>
    </div>
  );
}