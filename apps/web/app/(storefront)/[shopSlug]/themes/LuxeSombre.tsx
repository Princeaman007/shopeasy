'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Menu, X,
  MapPin, Clock, ChevronRight, Gem,
  Flame, Users, Zap, ShoppingBag,
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

// ── Compte à rebours vente flash ─────────────────────────────────────────────
function useCompteurFlash() {
  const [temps, setTemps] = useState({ h: 3, m: 12, s: 44 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTemps(prev => {
        const { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: 3, m: 12, s: 44 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return temps;
}

// ── Visiteurs actifs simulés ──────────────────────────────────────────────────
function useVisiteursActifs() {
  const [nb, setNb] = useState(Math.floor(Math.random() * 10) + 5);
  useEffect(() => {
    const interval = setInterval(() => {
      setNb(Math.floor(Math.random() * 10) + 5);
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  return nb;
}

export default function LuxeSombre({ shop, produits }: Props) {
  const t         = getThemeConfig('luxe-sombre');
  const temps     = useCompteurFlash();
  const visiteurs = useVisiteursActifs();

  const [menuOuvert,  setMenuOuvert]  = useState(false);
  const [refreshAvis, setRefreshAvis] = useState(0);

  // Achats récents simulés par produit
  const achatsSim = useMemo(() => {
    const map: Record<string, number> = {};
    produits.forEach(p => { map[p._id] = Math.floor(Math.random() * 15) + 2; });
    return map;
  }, [produits]);

  // Vérifie si un produit est nouveau (moins de 7 jours)
  const estNouveau = (createdAt: string) =>
    Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <Link href="https://www.shopeasyci.store" className="flex items-center gap-3">
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
                <p className="font-light tracking-[0.2em] uppercase text-sm" style={{ color: t.text }}>
                  {shop.name}
                </p>
                {shop.isVerified && (
                  <p className="text-xs tracking-widest" style={{ color: t.accent }}>
                    Collection exclusive
                  </p>
                )}
              </div>
            </Link>
            <Link href="https://www.shopeasyci.store"
              className="hidden md:flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: `${t.accent}15`, color: t.accent }}>
              ShopEasy CI
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Collection', href: '/catalogue' },
              { label: 'A propos',   href: '/about'     },
            ].map(l => (
              <Link key={l.label} href={l.href}
                className="text-xs tracking-[0.15em] uppercase font-light hover:opacity-60 transition-opacity"
                style={{ color: t.text }}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/recherche" className="p-2 hover:opacity-70 transition-opacity">
              <Search size={18} style={{ color: t.muted }} />
            </Link>
            <BoutonPanier shopSlug={shop.slug} accent={t.accent} />
            <button onClick={() => setMenuOuvert(!menuOuvert)} className="md:hidden p-2">
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
              { label: 'Collection', href: '/catalogue' },
              { label: 'A propos',   href: '/about'     },
            ].map(l => (
              <Link key={l.label} href={l.href}
                className="block text-xs tracking-[0.15em] uppercase font-light py-2"
                style={{ color: t.text }}
                onClick={() => setMenuOuvert(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="https://www.shopeasyci.store"
              className="block text-xs tracking-[0.15em] uppercase font-light py-2"
              style={{ color: t.accent }}>
              ShopEasy CI
            </Link>
          </div>
        )}
      </nav>

      {/* ── BANDEAU URGENCE — adapté au style luxe ── */}
      <div style={{ backgroundColor: `${t.accent}08`, borderBottom: `1px solid ${t.accent}20` }}>
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">

          {/* Offre exclusive + compte à rebours */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Flame size={13} style={{ color: t.accent }} />
              <span className="text-xs tracking-[0.15em] uppercase font-light"
                style={{ color: t.accent }}>
                Offre exclusive
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs"
              style={{ color: t.text }}>
              <span className="px-1.5 py-0.5 rounded"
                style={{ backgroundColor: t.elevated, border: `1px solid ${t.border}` }}>
                {String(temps.h).padStart(2, '0')}
              </span>
              <span style={{ color: t.accent }}>:</span>
              <span className="px-1.5 py-0.5 rounded"
                style={{ backgroundColor: t.elevated, border: `1px solid ${t.border}` }}>
                {String(temps.m).padStart(2, '0')}
              </span>
              <span style={{ color: t.accent }}>:</span>
              <span className="px-1.5 py-0.5 rounded"
                style={{ backgroundColor: t.elevated, border: `1px solid ${t.border}` }}>
                {String(temps.s).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Visiteurs */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: t.muted }}>
            <Users size={12} style={{ color: t.accent }} />
            <span>
              <strong style={{ color: t.text }}>{visiteurs} personnes</strong> consultent la collection
            </span>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <HeroBoutique shop={shop} accent={t.accent} />

      {!shop.heroImage && (
        <div style={{ backgroundColor: t.surface, position: 'relative', overflow: 'hidden' }}>
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center space-y-6 relative z-10">
            {shop.isVerified && (
              <p className="text-xs tracking-[0.3em] uppercase" style={{ color: t.accent }}>
                Collection exclusive
              </p>
            )}
            <h1 className="text-4xl md:text-6xl font-thin tracking-[0.15em] uppercase"
              style={{ color: t.text }}>
              {shop.name}
            </h1>
            {shop.about?.description && (
              <p className="text-sm font-light leading-loose max-w-xl mx-auto" style={{ color: t.muted }}>
                {shop.about.description.slice(0, 150)}
                {shop.about.description.length > 150 ? '...' : ''}
              </p>
            )}
            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <Link href="/catalogue"
                className="inline-flex items-center gap-2 px-8 py-3 text-xs tracking-[0.2em] uppercase font-light transition-all hover:opacity-80"
                style={{ backgroundColor: t.accent, color: t.bg }}>
                Decouvrir <ChevronRight size={14} />
              </Link>
              {shop.whatsapp && (
                <Link href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 text-xs tracking-[0.2em] uppercase font-light transition-all hover:opacity-80"
                  style={{ border: `1px solid ${t.accent}`, color: t.accent }}>
                  Nous ecrire
                </Link>
              )}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 opacity-5"
            style={{
              background:  `radial-gradient(circle, ${t.accent}, transparent)`,
              transform:   'translate(30%, -30%)',
            }}
          />
        </div>
      )}

      {/* ── PRODUITS ── */}
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: t.accent }}>
              Selection
            </p>
            <h2 className="text-2xl font-thin tracking-[0.1em]" style={{ color: t.text }}>
              Nos pieces
            </h2>
          </div>
          <Link href="/catalogue"
            className="text-xs tracking-[0.2em] uppercase hover:opacity-60 transition-opacity flex items-center gap-2"
            style={{ color: t.accent }}>
            Tout voir <ChevronRight size={14} />
          </Link>
        </div>

        {produits.length === 0 ? (
          <div className="text-center py-20" style={{ color: t.muted }}>
            <Gem size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm tracking-widest uppercase">Collection bientot disponible</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {produits.map(produit => {
                const aReduction  = produit.comparePrice > produit.price;
                const pct         = aReduction
                  ? Math.round((1 - produit.price / produit.comparePrice) * 100)
                  : 0;
                const stockFaible = produit.totalStock > 0 && produit.totalStock <= 5;
                const nouveau     = estNouveau(produit.createdAt);
                const enRupture   = produit.totalStock === 0;
                const achats      = achatsSim[produit._id] ?? 4;

                return (
                  <Link key={produit._id} href={`/produits/${produit._id}`}
                    className="group space-y-3">

                    {/* ── IMAGE ── */}
                    <div className="aspect-square relative overflow-hidden"
                      style={{ backgroundColor: t.elevated }}>
                      {produit.images?.[0]
                        ? <Image src={produit.images[0]} alt={produit.name} fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">...</div>
                      }

                      {/* Badge réduction — priorité 1 */}
                      {aReduction && (
                        <div className="absolute top-2 left-2 text-xs font-light px-2.5 py-1 tracking-wider"
                          style={{ backgroundColor: t.accent, color: t.bg }}>
                          -{pct}%
                        </div>
                      )}

                      {/* Badge Nouveau — priorité 2 */}
                      {nouveau && !aReduction && !enRupture && (
                        <div className="absolute top-2 left-2 text-xs font-light px-2.5 py-1 tracking-wider"
                          style={{ border: `1px solid ${t.accent}`, color: t.accent }}>
                          Nouveau
                        </div>
                      )}

                      {/* Badge stock faible — bas gauche */}
                      {stockFaible && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs px-2 py-1 animate-pulse"
                          style={{ backgroundColor: '#f59e0b', color: '#000' }}>
                          <Flame size={10} />
                          Plus que {produit.totalStock} !
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

                      {/* Rupture de stock */}
                      {enRupture && (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ backgroundColor: `${t.bg}bb` }}>
                          <span className="text-xs tracking-widest uppercase px-3 py-1"
                            style={{ backgroundColor: t.surface, color: t.muted }}>
                            Epuise
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ── INFOS ── */}
                    <div className="space-y-1.5">
                      <p className="text-sm font-light tracking-wide line-clamp-1"
                        style={{ color: t.text }}>
                        {produit.name}
                      </p>

                      {/* Prix */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: t.accent }}>
                          {formatFcfa(produit.price)}
                        </span>
                        {aReduction && (
                          <span className="text-xs line-through" style={{ color: t.muted }}>
                            {formatFcfa(produit.comparePrice)}
                          </span>
                        )}
                      </div>

                      {/* Preuve sociale */}
                      {!enRupture && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: t.muted }}>
                          <Zap size={10} style={{ color: t.accent }} />
                          <span>
                            <strong style={{ color: t.text }}>{achats}</strong> vendus cette semaine
                          </span>
                        </div>
                      )}

                      {/* Barre stock faible */}
                      {stockFaible && (
                        <div className="space-y-1 pt-1">
                          <div className="w-full h-px overflow-hidden"
                            style={{ backgroundColor: t.elevated }}>
                            <div className="h-full"
                              style={{
                                width:           `${Math.min((produit.totalStock / 20) * 100, 100)}%`,
                                backgroundColor: '#f59e0b',
                              }}
                            />
                          </div>
                          <p className="text-xs" style={{ color: '#f59e0b' }}>
                            {produit.totalStock} restant{produit.totalStock > 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* CTA voir tout */}
            <div className="text-center pt-6">
              <Link href="/catalogue"
                className="inline-flex items-center gap-2 px-10 py-3.5 text-xs tracking-[0.2em] uppercase font-light transition-all hover:opacity-80"
                style={{ backgroundColor: t.accent, color: t.bg }}>
                <ShoppingBag size={14} />
                Voir toute la collection
              </Link>
              <p className="text-xs mt-3 tracking-wider" style={{ color: t.muted }}>
                Livraison rapide · Paiement a la livraison
              </p>
            </div>
          </>
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

      {/* ── A PROPOS ── */}
      {shop.about?.description && (
        <div style={{ backgroundColor: t.surface, borderTop: `1px solid ${t.border}` }}>
          <div className="max-w-6xl mx-auto px-6 py-16 space-y-6">
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: t.accent }}>
              Notre histoire
            </p>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <p className="text-sm font-light leading-loose" style={{ color: t.muted }}>
                {shop.about.description}
              </p>
              <div className="space-y-4">
                {shop.about.location && (
                  <div className="flex items-center gap-3 text-sm" style={{ color: t.muted }}>
                    <MapPin size={14} style={{ color: t.accent }} />
                    {shop.about.location}
                  </div>
                )}
                {shop.about.workingHours && (
                  <div className="flex items-center gap-3 text-sm" style={{ color: t.muted }}>
                    <Clock size={14} style={{ color: t.accent }} />
                    {shop.about.workingHours}
                  </div>
                )}
                {shop.about.ownerName && (
                  <div className="flex items-center gap-3 pt-4">
                    {shop.about.ownerPhoto
                      ? <Image src={shop.about.ownerPhoto} alt={shop.about.ownerName}
                          width={48} height={48}
                          className="rounded-full object-cover"
                          style={{ border: `1px solid ${t.accent}` }} />
                      : <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-light"
                          style={{ border: `1px solid ${t.accent}`, color: t.accent }}>
                          {shop.about.ownerName.charAt(0)}
                        </div>
                    }
                    <div>
                      <p className="text-sm font-light" style={{ color: t.text }}>
                        {shop.about.ownerName}
                      </p>
                      <p className="text-xs tracking-widest uppercase" style={{ color: t.muted }}>
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
      <footer style={{ backgroundColor: t.bg, borderTop: `1px solid ${t.border}` }}
        className="py-10">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-3">
          <p className="text-xs tracking-[0.3em] uppercase font-light" style={{ color: t.text }}>
            {shop.name}
          </p>
          <Link href="/boutiques"
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full transition-colors hover:opacity-80"
            style={{ backgroundColor: `${t.accent}15`, color: t.accent, border: `1px solid ${t.accent}30` }}>
            Decouvrir d'autres boutiques
          </Link>
          <p className="text-xs" style={{ color: t.muted }}>
            Propulse par{' '}
            <Link href="https://www.shopeasyci.store"
              className="hover:opacity-70 transition-opacity"
              style={{ color: t.accent }}>
              ShopEasy CI
            </Link>
          </p>
        </div>
      </footer>

      {/* ── WHATSAPP FLOTTANT ── */}
      {shop.whatsapp && (
        <Link
          href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=Bonjour, je suis interesse par vos creations`}
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