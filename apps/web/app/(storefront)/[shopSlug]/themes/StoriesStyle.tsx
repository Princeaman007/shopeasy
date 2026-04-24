'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Menu, X,
  CheckCircle, MapPin, Clock, ChevronRight, Zap,
} from 'lucide-react';
import { getThemeConfig } from '../theme.config';
import type { ShopPublic } from '../types';
import BoutonPanier from '@/components/storefront/BoutonPanier';
import HeroBoutique from '@/components/storefront/HeroBoutique';
import BoutonFavori from '@/components/storefront/BoutonFavori';
import FormulaireAvis from '@/components/storefront/FormulaireAvis';
import ListeAvis from '@/components/storefront/ListeAvis';

interface Props { shop: ShopPublic; produits: any[]; }

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function StoriesStyle({ shop, produits }: Props) {
  const t = getThemeConfig('stories-style');
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [refreshAvis, setRefreshAvis] = useState(0);


  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ backgroundColor: `${t.surface}ee`, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <Link href={`/${shop.slug}`} className="flex items-center gap-2">
              {shop.logo
                ? <Image src={shop.logo} alt={shop.name} width={36} height={36}
                  className="rounded-full object-cover"
                  style={{ border: `2px solid ${t.accent}` }} />
                : <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${t.accent}, #ec4899)` }}>
                  {shop.name[0]}
                </div>
              }
              <div>
                <p className="font-bold text-sm" style={{ color: t.text }}>{shop.name}</p>
                {shop.isVerified && (
                  <div className="flex items-center gap-1">
                    <CheckCircle size={10} style={{ color: t.accent }} />
                    <span className="text-xs" style={{ color: t.accent }}>Certifie</span>
                  </div>
                )}
              </div>
            </Link>

            <Link href="/"
              className="hidden md:flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: `${t.accent}15`, color: t.accent }}>
              ShopEasy CI
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-5">
            {[
              { label: 'Catalogue', href: `/${shop.slug}/catalogue` },
              { label: 'A propos', href: `/${shop.slug}/about` },
            ].map(l => (
              <Link key={l.label} href={l.href}
                className="text-sm font-semibold hover:opacity-70 transition-opacity"
                style={{ color: t.muted }}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/${shop.slug}/recherche`}
              className="p-2 rounded-xl" style={{ backgroundColor: t.elevated }}>
              <Search size={18} style={{ color: t.muted }} />
            </Link>
            <BoutonPanier shopSlug={shop.slug} accent={t.accent} />
            <button onClick={() => setMenuOuvert(!menuOuvert)}
              className="md:hidden p-2 rounded-xl" style={{ backgroundColor: t.elevated }}>
              {menuOuvert
                ? <X size={18} style={{ color: t.text }} />
                : <Menu size={18} style={{ color: t.text }} />
              }
            </button>
          </div>
        </div>

        {menuOuvert && (
          <div style={{ backgroundColor: t.surface, borderTop: `1px solid ${t.border}` }}
            className="md:hidden px-4 py-4 space-y-2">
            {[
              { label: 'Catalogue', href: `/${shop.slug}/catalogue` },
              { label: 'A propos', href: `/${shop.slug}/about` },
            ].map(l => (
              <Link key={l.label} href={l.href}
                className="block text-sm font-semibold py-2"
                style={{ color: t.muted }}
                onClick={() => setMenuOuvert(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/" className="block text-sm font-semibold py-2" style={{ color: t.accent }}>
              ShopEasy CI
            </Link>
          </div>
        )}
      </nav>

      <HeroBoutique shop={shop} accent={t.accent} />

      {!shop.heroImage && (
        <div style={{ backgroundColor: t.surface }}>
          <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
            <div className="text-center space-y-5 max-w-2xl mx-auto">
              {shop.isVerified && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${t.accent}15`, color: t.accent, border: `1px solid ${t.accent}30` }}>
                  Boutique certifiee
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: t.text }}>
                {shop.name}
              </h1>
              {shop.about?.description && (
                <p className="text-base leading-relaxed" style={{ color: t.muted }}>
                  {shop.about.description.slice(0, 150)}{shop.about.description.length > 150 ? '...' : ''}
                </p>
              )}
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href={`/${shop.slug}/catalogue`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all hover:opacity-90"
                  style={{ backgroundColor: t.accent, color: '#fff' }}>
                  Explorer la boutique <ChevronRight size={16} />
                </Link>
                {shop.whatsapp && (
                  <Link href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: t.elevated, color: t.text, border: `1px solid ${t.border}` }}>
                    Nous ecrire
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link href={`/${shop.slug}/recherche`}
          className="flex items-center gap-3 px-4 py-3 rounded-full border w-full"
          style={{ backgroundColor: t.surface, borderColor: t.accent }}>
          <Search size={18} style={{ color: t.accent }} />
          <span className="text-sm" style={{ color: t.muted }}>Rechercher un article...</span>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black" style={{ color: t.text }}>Nouveautes</h2>
          <Link href={`/${shop.slug}/catalogue`}
            className="text-sm font-bold flex items-center gap-1 hover:opacity-80 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: `${t.accent}20`, color: t.accent }}>
            Tout voir <ChevronRight size={14} />
          </Link>
        </div>

        {produits.length === 0 ? (
          <div className="text-center py-16" style={{ color: t.muted }}>
            <Zap size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">Collection bientot disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produits.map(produit => (
              <Link key={produit._id} href={`/${shop.slug}/produits/${produit._id}`}
                className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.03] hover:shadow-2xl"
                style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: t.elevated }}>
                  {produit.images?.[0]
                    ? <Image src={produit.images[0]} alt={produit.name} fill
                      className="object-cover group-hover:scale-105 transition-transform" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">...</div>
                  }
                  {produit.comparePrice > produit.price && (
                    <div className="absolute top-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm text-white"
                      style={{ backgroundColor: t.accent }}>
                      -{Math.round((1 - produit.price / produit.comparePrice) * 100)}%
                    </div>
                  )}

                  {/* Bouton favori */}
                  <div className="absolute top-2 right-2 z-10">
                    <BoutonFavori
                      shopSlug={shop.slug}
                      produitId={produit._id}
                      nom={produit.name}
                      prix={produit.price}
                      image={produit.images?.[0] ?? null}
                      accent={t.accent}
                      className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full"
                    />
                  </div>

                  {produit.totalStock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: `${t.bg}bb` }}>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                        style={{ backgroundColor: t.surface, color: t.muted }}>
                        Epuise
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="font-bold text-sm line-clamp-1" style={{ color: t.text }}>{produit.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm" style={{ color: t.accent }}>{formatFcfa(produit.price)}</span>
                    {produit.comparePrice > produit.price && (
                      <span className="text-xs line-through" style={{ color: t.muted }}>{formatFcfa(produit.comparePrice)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>


      {/* ── AVIS BOUTIQUE ── */}
      <div style={{ borderTop: `1px solid ${t.border}` }}>
        <div className="max-w-6xl mx-auto px-4 py-14 space-y-8">
          <h2 className="text-2xl font-bold" style={{ color: t.text }}>
            Avis sur {shop.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <ListeAvis
              shopSlug={shop.slug}
              type="boutique"
              accent={t.accent}
              surface={t.surface}
              border={t.border}
              text={t.text}
              muted={t.muted}
              refresh={refreshAvis}
            />
            <div className="p-5 rounded-2xl border"
              style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <FormulaireAvis
                shopSlug={shop.slug}
                type="boutique"
                accent={t.accent}
                bg={t.bg}
                surface={t.surface}
                border={t.border}
                text={t.text}
                muted={t.muted}
                onSuccess={() => setRefreshAvis(r => r + 1)}
              />
            </div>
          </div>
        </div>
      </div>
      {shop.about?.description && (
        <div style={{ backgroundColor: t.surface, borderTop: `1px solid ${t.border}` }}>
          <div className="max-w-6xl mx-auto px-4 py-14 space-y-6">
            <h2 className="text-2xl font-black" style={{ color: t.text }}>Notre histoire</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="leading-relaxed" style={{ color: t.muted }}>{shop.about.description}</p>
                <div className="space-y-2">
                  {shop.about.location && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: t.muted }}>
                      <MapPin size={14} style={{ color: t.accent }} />{shop.about.location}
                    </div>
                  )}
                  {shop.about.workingHours && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: t.muted }}>
                      <Clock size={14} style={{ color: t.accent }} />{shop.about.workingHours}
                    </div>
                  )}
                </div>
              </div>
              {shop.about.ownerName && (
                <div className="flex items-center gap-4 p-5 rounded-2xl"
                  style={{ backgroundColor: t.elevated, border: `1px solid ${t.border}` }}>
                  {shop.about.ownerPhoto
                    ? <Image src={shop.about.ownerPhoto} alt={shop.about.ownerName}
                      width={56} height={56} className="rounded-full object-cover flex-shrink-0"
                      style={{ border: `2px solid ${t.accent}` }} />
                    : <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${t.accent}, #ec4899)`, color: '#fff' }}>
                      {shop.about.ownerName[0]}
                    </div>
                  }
                  <div>
                    <p className="font-bold" style={{ color: t.text }}>{shop.about.ownerName}</p>
                    <p className="text-sm" style={{ color: t.muted }}>Createur·rice</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer style={{ backgroundColor: t.bg, borderTop: `1px solid ${t.border}` }} className="py-8">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-3">
          <p className="font-black" style={{ color: t.text }}>
            {shop.name}<span style={{ color: t.accent }}>.</span>
          </p>
          <Link href="/boutiques"
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full transition-colors hover:opacity-80"
            style={{ backgroundColor: `${t.accent}15`, color: t.accent, border: `1px solid ${t.accent}30` }}>
            Decouvrir d'autres boutiques
          </Link>
          <p className="text-xs" style={{ color: t.muted }}>
            Propulse par{' '}
            <Link href="/" className="font-bold hover:underline" style={{ color: t.accent }}>ShopEasy CI</Link>
          </p>
        </div>
      </footer>

      {shop.whatsapp && (
        <Link href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=Bonjour, je suis interesse par vos produits`}
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: '#25D366' }}>
          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </Link>
      )}
    </div>
  );
}