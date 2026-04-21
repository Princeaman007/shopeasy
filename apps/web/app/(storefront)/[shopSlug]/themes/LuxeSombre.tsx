'use client';

import { useState }       from 'react';
import Image              from 'next/image';
import Link               from 'next/link';
import {
  ShoppingCart, Search, Menu, X,
  CheckCircle, MapPin, Clock, ChevronRight, Gem,
} from 'lucide-react';
import { getThemeConfig } from '../theme.config';
import type { ShopPublic } from '../types';

interface Props { shop: ShopPublic; produits: any[]; }

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function LuxeSombre({ shop, produits }: Props) {
  const t = getThemeConfig('luxe-sombre');
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav
        style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40 backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/${shop.slug}`} className="flex items-center gap-3">
            {shop.logo
              ? <Image src={shop.logo} alt={shop.name} width={40} height={40}
                       className="rounded-full object-cover"
                       style={{ border: `1px solid ${t.accent}` }} />
              : <div className="w-10 h-10 rounded-full flex items-center justify-center"
                     style={{ border: `1px solid ${t.accent}` }}>
                  <Gem size={18} style={{ color: t.accent }} />
                </div>
            }
            <div>
              <p className="font-light tracking-[0.2em] uppercase text-sm"
                 style={{ color: t.text }}>
                {shop.name}
              </p>
              {shop.isVerified && (
                <p className="text-xs tracking-widest" style={{ color: t.accent }}>
                  ✦ Collection exclusive
                </p>
              )}
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Collection', href: `/${shop.slug}/catalogue` },
              { label: 'À propos',   href: `/${shop.slug}/about`     },
            ].map(l => (
              <Link key={l.label} href={l.href}
                    className="text-xs tracking-[0.15em] uppercase font-light
                               hover:opacity-60 transition-opacity"
                    style={{ color: t.text }}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/${shop.slug}/recherche`}
                  className="p-2 hover:opacity-70 transition-opacity">
              <Search size={18} style={{ color: t.muted }} />
            </Link>
            <Link href={`/${shop.slug}/panier`}
                  className="p-2 hover:opacity-70 transition-opacity">
              <ShoppingCart size={18} style={{ color: t.text }} />
            </Link>
            <button onClick={() => setMenuOuvert(!menuOuvert)}
                    className="md:hidden p-2">
              {menuOuvert
                ? <X    size={18} style={{ color: t.text }} />
                : <Menu size={18} style={{ color: t.text }} />
              }
            </button>
          </div>
        </div>

        {menuOuvert && (
          <div style={{ backgroundColor: t.surface, borderTop: `1px solid ${t.border}` }}
               className="md:hidden px-6 py-4 space-y-4">
            {[
              { label: 'Collection', href: `/${shop.slug}/catalogue` },
              { label: 'À propos',   href: `/${shop.slug}/about`     },
            ].map(l => (
              <Link key={l.label} href={l.href}
                    className="block text-xs tracking-[0.15em] uppercase font-light py-2"
                    style={{ color: t.text }}
                    onClick={() => setMenuOuvert(false)}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="max-w-lg space-y-6">
            <div
              className="inline-flex items-center gap-2 text-xs tracking-[0.3em]
                         uppercase px-4 py-2"
              style={{ border: `1px solid ${t.accent}`, color: t.accent }}
            >
              ✦ Nouvelle collection
            </div>

            <h1 className="text-4xl md:text-6xl font-thin tracking-[0.1em] leading-tight"
                style={{ color: t.text }}>
              {shop.name}
            </h1>

            {shop.about?.description && (
              <p className="text-sm leading-loose font-light"
                 style={{ color: t.muted }}>
                {shop.about.description.slice(0, 150)}
                {shop.about.description.length > 150 ? '...' : ''}
              </p>
            )}

            <div className="flex gap-4 pt-2">
              <Link
                href={`/${shop.slug}/catalogue`}
                className="px-8 py-3 text-xs tracking-[0.2em] uppercase
                           font-light transition-all hover:opacity-80"
                style={{ backgroundColor: t.accent, color: t.bg }}
              >
                Découvrir
              </Link>
              {shop.whatsapp && (
                <Link
                  href={`https://wa.me/${shop.whatsapp.replace(/\D/g,'')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 text-xs tracking-[0.2em] uppercase
                             font-light transition-all hover:opacity-80"
                  style={{ border: `1px solid ${t.accent}`, color: t.accent }}
                >
                  Contact
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Décoration */}
        <div
          className="absolute top-0 right-0 w-96 h-96 opacity-5"
          style={{
            background: `radial-gradient(circle, ${t.accent}, transparent)`,
            transform: 'translate(30%, -30%)',
          }}
        />
      </div>

      {/* ── PRODUITS ── */}
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase mb-2"
               style={{ color: t.accent }}>
              ✦ Sélection
            </p>
            <h2 className="text-2xl font-thin tracking-[0.1em]"
                style={{ color: t.text }}>
              Nos pièces
            </h2>
          </div>
          <Link
            href={`/${shop.slug}/catalogue`}
            className="text-xs tracking-[0.2em] uppercase hover:opacity-60
                       transition-opacity flex items-center gap-2"
            style={{ color: t.accent }}
          >
            Tout voir <ChevronRight size={14} />
          </Link>
        </div>

        {produits.length === 0 ? (
          <div className="text-center py-20" style={{ color: t.muted }}>
            <Gem size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm tracking-widest uppercase">
              Collection bientôt disponible
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produits.map(produit => (
              <Link
                key={produit._id}
                href={`/${shop.slug}/produits/${produit._id}`}
                className="group space-y-3"
              >
                <div
                  className="aspect-square relative overflow-hidden"
                  style={{ backgroundColor: t.surface }}
                >
                  {produit.images?.[0]
                    ? <Image src={produit.images[0]} alt={produit.name}
                             fill className="object-cover group-hover:scale-105
                                            transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Gem size={32} style={{ color: t.accent, opacity: 0.3 }} />
                      </div>
                  }
                  {produit.comparePrice > produit.price && (
                    <div
                      className="absolute top-3 left-3 text-xs px-2 py-1"
                      style={{ backgroundColor: t.accent, color: t.bg }}
                    >
                      -{Math.round((1 - produit.price / produit.comparePrice) * 100)}%
                    </div>
                  )}
                  {produit.totalStock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center"
                         style={{ backgroundColor: `${t.bg}cc` }}>
                      <p className="text-xs tracking-widest uppercase"
                         style={{ color: t.muted }}>
                        Épuisé
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-light tracking-wide line-clamp-1"
                     style={{ color: t.text }}>
                    {produit.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: t.accent }}>
                      {formatFcfa(produit.price)}
                    </span>
                    {produit.comparePrice > produit.price && (
                      <span className="text-xs line-through" style={{ color: t.muted }}>
                        {formatFcfa(produit.comparePrice)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── À PROPOS ── */}
      {shop.about?.description && (
        <div style={{ backgroundColor: t.surface, borderTop: `1px solid ${t.border}` }}>
          <div className="max-w-6xl mx-auto px-6 py-16 space-y-6">
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: t.accent }}>
              ✦ Notre histoire
            </p>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <p className="text-sm font-light leading-loose" style={{ color: t.muted }}>
                {shop.about.description}
              </p>
              <div className="space-y-4">
                {shop.about.location && (
                  <div className="flex items-center gap-3 text-sm"
                       style={{ color: t.muted }}>
                    <MapPin size={14} style={{ color: t.accent }} />
                    {shop.about.location}
                  </div>
                )}
                {shop.about.workingHours && (
                  <div className="flex items-center gap-3 text-sm"
                       style={{ color: t.muted }}>
                    <Clock size={14} style={{ color: t.accent }} />
                    {shop.about.workingHours}
                  </div>
                )}
                {shop.about.ownerName && (
                  <div className="flex items-center gap-3 pt-4">
                    {shop.about.ownerPhoto
                      ? <Image src={shop.about.ownerPhoto}
                               alt={shop.about.ownerName}
                               width={48} height={48}
                               className="rounded-full object-cover"
                               style={{ border: `1px solid ${t.accent}` }} />
                      : <div className="w-12 h-12 rounded-full flex items-center
                                        justify-center text-sm font-light"
                             style={{ border: `1px solid ${t.accent}`,
                                      color: t.accent }}>
                          {shop.about.ownerName[0]}
                        </div>
                    }
                    <div>
                      <p className="text-sm font-light" style={{ color: t.text }}>
                        {shop.about.ownerName}
                      </p>
                      <p className="text-xs tracking-widest uppercase"
                         style={{ color: t.muted }}>
                        Fondateur·rice
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer
        style={{ backgroundColor: t.bg, borderTop: `1px solid ${t.border}` }}
        className="py-10"
      >
        <div className="max-w-6xl mx-auto px-6 text-center space-y-2">
          <p className="text-xs tracking-[0.3em] uppercase font-light"
             style={{ color: t.text }}>
            {shop.name}
          </p>
          <p className="text-xs" style={{ color: t.muted }}>
            Propulsé par{' '}
            <Link href="/" className="hover:opacity-70 transition-opacity"
                  style={{ color: t.accent }}>
              ShopEasy CI
            </Link>
          </p>
        </div>
      </footer>

      {/* ── WHATSAPP FLOTTANT ── */}
      {shop.whatsapp && (
        <Link
          href={`https://wa.me/${shop.whatsapp.replace(/\D/g,'')}?text=Bonjour, je suis intéressé par vos créations`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg
                     flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </Link>
      )}
    </div>
  );
}