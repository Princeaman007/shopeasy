'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, X, SlidersHorizontal, ChevronLeft,
  ShoppingCart, ChevronRight, Grid3X3, List, Flame,
  Users, Zap, TrendingUp, Tag, ShoppingBag,
} from 'lucide-react';
import { getThemeConfig } from '../theme.config';
import type { ShopPublic } from '../types';
import BoutonFavori from '@/components/storefront/BoutonFavori';

interface Props {
  shop:       ShopPublic;
  categories: any[];
  produits:   any[];
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const PAR_PAGE = 12;

// ── Prénoms ivoiriens ─────────────────────────────────────────────────────────
const PRENOMS = [
  'Konan', 'Awa', 'Adjoua', 'Koffi', 'Aminata', 'Yao', 'Fatou',
  'Brice', 'Mariama', 'Seydou', 'Aïcha', 'Kouadio', 'Natacha',
  'Abou', 'Clarisse', 'Mamadou', 'Estelle', 'Drissa', 'Fatoumata',
];

// ── Toast notification — achat récent simulé ──────────────────────────────────
function useToastAchat() {
  const [toast,   setToast]   = useState<{ prenom: string; minutes: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const premier = setTimeout(() => afficherToast(), 10000);
    return () => clearTimeout(premier);
  }, []);

  const afficherToast = () => {
    const prenom  = PRENOMS[Math.floor(Math.random() * PRENOMS.length)];
    const minutes = Math.floor(Math.random() * 25) + 2;
    setToast({ prenom, minutes });
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => afficherToast(), Math.random() * 20000 + 25000);
    }, 4000);
  };

  return { toast, visible };
}

// ── Compte à rebours vente flash ─────────────────────────────────────────────
function useCompteurFlash() {
  const [temps, setTemps] = useState({ h: 3, m: 47, s: 22 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTemps(prev => {
        const { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: 3, m: 47, s: 22 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return temps;
}

// ── Visiteurs actifs simulés ──────────────────────────────────────────────────
function useVisiteursActifs() {
  const [nb, setNb] = useState(Math.floor(Math.random() * 15) + 8);
  useEffect(() => {
    const interval = setInterval(() => {
      setNb(Math.floor(Math.random() * 15) + 8);
    }, 12000);
    return () => clearInterval(interval);
  }, []);
  return nb;
}

export default function CatalogueClient({ shop, categories, produits }: Props) {
  const t         = getThemeConfig(shop.selectedTheme);
  const temps     = useCompteurFlash();
  const visiteurs = useVisiteursActifs();
  const { toast, visible: toastVisible } = useToastAchat();

  const [recherche,      setRecherche]      = useState('');
  const [categorie,      setCategorie]      = useState('');
  const [tri,            setTri]            = useState<'recent' | 'prix-asc' | 'prix-desc' | 'nom'>('recent');
  const [filtrePrix,     setFiltrePrix]     = useState<[number, number]>([0, 500000]);
  const [grille,         setGrille]         = useState<'grid' | 'list'>('grid');
  const [page,           setPage]           = useState(1);
  const [filtresOuverts, setFiltresOuverts] = useState(false);

  const prixMax = useMemo(
    () => Math.max(...produits.map(p => p.price), 10000),
    [produits]
  );

  const achatsSim = useMemo(() => {
    const map: Record<string, number> = {};
    produits.forEach(p => { map[p._id] = Math.floor(Math.random() * 40) + 5; });
    return map;
  }, [produits]);

  const topVendeurs = useMemo(() => {
    return new Set(
      Object.entries(achatsSim)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => id)
    );
  }, [achatsSim]);

  const produitsFiltres = useMemo(() => {
    let liste = [...produits];
    if (recherche) liste = liste.filter(p =>
      p.name.toLowerCase().includes(recherche.toLowerCase()) ||
      p.description?.toLowerCase().includes(recherche.toLowerCase())
    );
    if (categorie) liste = liste.filter(p => p.categoryId === categorie);
    liste = liste.filter(p => p.price >= filtrePrix[0] && p.price <= filtrePrix[1]);
    switch (tri) {
      case 'prix-asc':  liste.sort((a, b) => a.price - b.price); break;
      case 'prix-desc': liste.sort((a, b) => b.price - a.price); break;
      case 'nom':       liste.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: liste.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return liste;
  }, [produits, recherche, categorie, filtrePrix, tri]);

  const totalPages    = Math.ceil(produitsFiltres.length / PAR_PAGE);
  const produitsPaged = produitsFiltres.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const changerPage = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reinitialiserFiltres = () => {
    setRecherche(''); setCategorie(''); setTri('recent');
    setFiltrePrix([0, prixMax]); setPage(1);
  };

  const filtresActifs = recherche || categorie ||
    filtrePrix[0] > 0 || filtrePrix[1] < prixMax || tri !== 'recent';

  const estNouveau = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  const ContenuFiltres = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm" style={{ color: t.text }}>Filtres</h3>
        {filtresActifs && (
          <button onClick={reinitialiserFiltres} className="text-xs hover:underline font-medium"
            style={{ color: t.accent }}>
            Tout effacer
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.muted }}>
            Categories
          </p>
          <div className="space-y-1">
            <button
              onClick={() => { setCategorie(''); setPage(1); setFiltresOuverts(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: !categorie ? `${t.accent}20` : 'transparent',
                color:      !categorie ? t.accent : t.muted,
                fontWeight: !categorie ? 600 : 400,
              }}>
              Tous les produits ({produits.length})
            </button>
            {categories.map(cat => {
              const count = produits.filter(p => p.categoryId === cat._id).length;
              return (
                <button key={cat._id}
                  onClick={() => { setCategorie(cat._id); setPage(1); setFiltresOuverts(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between"
                  style={{
                    backgroundColor: categorie === cat._id ? `${t.accent}20` : 'transparent',
                    color:      categorie === cat._id ? t.accent : t.muted,
                    fontWeight: categorie === cat._id ? 600 : 400,
                  }}>
                  <span>{cat.name}</span>
                  <span className="text-xs opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.muted }}>
          Budget maximum
        </p>
        <input type="range" min={0} max={prixMax} step={500} value={filtrePrix[1]}
          onChange={e => { setFiltrePrix([filtrePrix[0], Number(e.target.value)]); setPage(1); }}
          className="w-full" style={{ accentColor: t.accent }} />
        <div className="flex justify-between text-xs" style={{ color: t.muted }}>
          <span>0 FCFA</span>
          <span style={{ color: t.accent }} className="font-semibold">{formatFcfa(filtrePrix[1])}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── DRAWER FILTRES MOBILE ── */}
      {filtresOuverts && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            onClick={() => setFiltresOuverts(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ color: t.text }}>Filtres</h2>
              <button onClick={() => setFiltresOuverts(false)}
                className="p-2 rounded-xl" style={{ backgroundColor: t.elevated }}>
                <X size={18} style={{ color: t.text }} />
              </button>
            </div>
            <ContenuFiltres />
          </div>
        </>
      )}

      {/* ── BANDEAU DEFILANT ── */}
      <div className="overflow-hidden py-2" style={{ backgroundColor: t.accent }}>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex items-center gap-6 mx-6 text-xs font-semibold text-black">
              <span>Livraison a domicile partout en CI</span>
              <span>·</span>
              <span>Paiement uniquement a la livraison</span>
              <span>·</span>
              <span>Retour sans questions</span>
              <span>·</span>
              <span>Commandez en 2 minutes</span>
              <span>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/"
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70 flex-shrink-0"
            style={{ color: t.muted }}>
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">{shop.name}</span>
          </Link>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ backgroundColor: t.elevated, borderColor: t.border }}>
            <Search size={15} style={{ color: t.muted }} />
            <input
              value={recherche}
              onChange={e => { setRecherche(e.target.value); setPage(1); }}
              placeholder="Rechercher un produit..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: t.text }}
            />
            {recherche && (
              <button onClick={() => { setRecherche(''); setPage(1); }}>
                <X size={13} style={{ color: t.muted }} />
              </button>
            )}
          </div>
          <Link href="/panier" className="p-2 rounded-xl flex-shrink-0"
            style={{ backgroundColor: t.elevated }}>
            <ShoppingCart size={20} style={{ color: t.text }} />
          </Link>
        </div>
      </nav>

      {/* ── BANDEAU URGENCE ── */}
      <div style={{ backgroundColor: '#ef444412', borderBottom: '1px solid #ef444428' }}>
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-red-400" />
              <span className="text-xs font-bold text-red-400">PRIX SPECIAUX</span>
            </div>
            <span className="text-xs hidden sm:inline" style={{ color: t.muted }}>
              — Offre valable encore
            </span>
            <div className="flex items-center gap-1 text-xs font-mono font-bold" style={{ color: t.text }}>
              <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: t.elevated }}>
                {String(temps.h).padStart(2, '0')}
              </span>
              <span className="text-red-400">:</span>
              <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: t.elevated }}>
                {String(temps.m).padStart(2, '0')}
              </span>
              <span className="text-red-400">:</span>
              <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: t.elevated }}>
                {String(temps.s).padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: t.muted }}>
            <Users size={12} style={{ color: t.accent }} />
            <span>
              <strong style={{ color: t.text }}>{visiteurs} personnes</strong> visitent la boutique maintenant
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">

        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: t.text }}>
              {categorie
                ? categories.find(c => c._id === categorie)?.name ?? 'Produits'
                : 'Decouvrez notre selection'
              }
            </h1>
            <p className="text-sm mt-0.5" style={{ color: t.muted }}>
              {produitsFiltres.length} produit{produitsFiltres.length > 1 ? 's' : ''} disponible{produitsFiltres.length > 1 ? 's' : ''}
              {filtresActifs && ' — filtre actif'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltresOuverts(!filtresOuverts)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors lg:hidden"
              style={{
                backgroundColor: filtresActifs ? `${t.accent}15` : t.surface,
                borderColor:     filtresActifs ? t.accent : t.border,
                color:           filtresActifs ? t.accent : t.text,
              }}>
              <SlidersHorizontal size={15} />
              Filtres
              {filtresActifs && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />}
            </button>

            <div className="flex border rounded-xl overflow-hidden" style={{ borderColor: t.border }}>
              {(['grid', 'list'] as const).map(v => (
                <button key={v} onClick={() => setGrille(v)} className="p-2 transition-colors"
                  style={{
                    backgroundColor: grille === v ? t.accent : t.surface,
                    color:           grille === v ? '#fff' : t.muted,
                  }}>
                  {v === 'grid' ? <Grid3X3 size={15} /> : <List size={15} />}
                </button>
              ))}
            </div>

            <select value={tri}
              onChange={e => { setTri(e.target.value as any); setPage(1); }}
              className="px-3 py-2 rounded-xl border text-sm outline-none hidden sm:block"
              style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }}>
              <option value="recent">Plus recents</option>
              <option value="prix-asc">Prix croissant</option>
              <option value="prix-desc">Prix decroissant</option>
              <option value="nom">Nom A-Z</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">

          <aside className="hidden lg:block flex-shrink-0 w-56">
            <div className="rounded-2xl border p-5 sticky top-20"
              style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <ContenuFiltres />
            </div>
          </aside>

          <div className="flex-1 space-y-5">
            {produitsPaged.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: t.elevated }}>
                  <Search size={28} style={{ color: t.muted }} />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold" style={{ color: t.text }}>Aucun produit ne correspond</p>
                  <p className="text-sm" style={{ color: t.muted }}>
                    Essayez d'autres mots-cles ou elargissez vos filtres
                  </p>
                </div>
                <button onClick={reinitialiserFiltres}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: t.accent, color: '#fff' }}>
                  Voir tous les produits
                </button>
              </div>

            ) : grille === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {produitsPaged.map(produit => {
                  const stockFaible   = produit.totalStock > 0 && produit.totalStock <= 5;
                  const nouveau       = estNouveau(produit.createdAt);
                  const aReduction    = produit.comparePrice > produit.price;
                  const pct           = aReduction ? Math.round((1 - produit.price / produit.comparePrice) * 100) : 0;
                  const economie      = aReduction ? produit.comparePrice - produit.price : 0;
                  const achats        = achatsSim[produit._id] ?? 5;
                  const estTopVendeur = topVendeurs.has(produit._id);

                  return (
                    <Link key={produit._id} href={`/produits/${produit._id}`}
                      className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl flex flex-col"
                      style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>

                      <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: t.elevated }}>
                        {produit.images?.[0]
                          ? <Image src={produit.images[0]} alt={produit.name} fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center text-4xl">...</div>
                        }

                        {aReduction && (
                          <div className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full text-white"
                            style={{ backgroundColor: '#ef4444' }}>
                            -{pct}%
                          </div>
                        )}

                        {estTopVendeur && !aReduction && produit.totalStock > 0 && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full text-white"
                            style={{ backgroundColor: '#f59e0b' }}>
                            <TrendingUp size={10} />
                            Top vente
                          </div>
                        )}

                        {nouveau && !aReduction && !estTopVendeur && produit.totalStock > 0 && (
                          <div className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full text-white"
                            style={{ backgroundColor: t.accent }}>
                            Nouveau
                          </div>
                        )}

                        {stockFaible && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full animate-pulse"
                            style={{ backgroundColor: '#f59e0b', color: '#000' }}>
                            <Flame size={11} />
                            Plus que {produit.totalStock} !
                          </div>
                        )}

                        <div className="absolute top-2 right-2 z-10">
                          <BoutonFavori
                            shopSlug={shop.slug} produitId={produit._id}
                            nom={produit.name} prix={produit.price}
                            image={produit.images?.[0] ?? null} accent={t.accent}
                            className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full"
                          />
                        </div>

                        {produit.totalStock === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ backgroundColor: `${t.bg}bb` }}>
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                              style={{ backgroundColor: t.elevated, color: t.muted }}>
                              Epuise
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                        <p className="font-medium text-sm line-clamp-2" style={{ color: t.text }}>
                          {produit.name}
                        </p>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm" style={{ color: t.accent }}>
                              {formatFcfa(produit.price)}
                            </span>
                            {aReduction && (
                              <span className="text-xs line-through" style={{ color: t.muted }}>
                                {formatFcfa(produit.comparePrice)}
                              </span>
                            )}
                          </div>
                          {aReduction && economie > 0 && (
                            <div className="flex items-center gap-1 text-xs font-medium"
                              style={{ color: '#10b981' }}>
                              <Tag size={10} />
                              Vous economisez {formatFcfa(economie)}
                            </div>
                          )}
                        </div>

                        {produit.totalStock > 0 && (
                          <div className="flex items-center gap-1 text-xs" style={{ color: t.muted }}>
                            <Zap size={10} style={{ color: t.accent }} />
                            <span><strong style={{ color: t.text }}>{achats}</strong> vendus cette semaine</span>
                          </div>
                        )}

                        {stockFaible && (
                          <div className="space-y-1">
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: t.elevated }}>
                              <div className="h-full rounded-full" style={{
                                width: `${Math.min((produit.totalStock / 20) * 100, 100)}%`,
                                backgroundColor: '#f59e0b',
                              }} />
                            </div>
                            <p className="text-xs" style={{ color: '#f59e0b' }}>
                              {produit.totalStock} restant{produit.totalStock > 1 ? 's' : ''} seulement
                            </p>
                          </div>
                        )}

                        <div
                          className="w-full py-2 rounded-xl text-xs font-bold text-center mt-1 transition-all"
                          style={{ backgroundColor: `${t.accent}20`, color: t.accent }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = t.accent;
                            (e.currentTarget as HTMLElement).style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = `${t.accent}20`;
                            (e.currentTarget as HTMLElement).style.color = t.accent;
                          }}>
                          Je veux ce produit →
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

            ) : (
              <div className="space-y-3">
                {produitsPaged.map(produit => {
                  const stockFaible   = produit.totalStock > 0 && produit.totalStock <= 5;
                  const aReduction    = produit.comparePrice > produit.price;
                  const economie      = aReduction ? produit.comparePrice - produit.price : 0;
                  const achats        = achatsSim[produit._id] ?? 5;
                  const estTopVendeur = topVendeurs.has(produit._id);

                  return (
                    <Link key={produit._id} href={`/produits/${produit._id}`}
                      className="flex gap-4 p-4 rounded-2xl border transition-all hover:shadow-md"
                      style={{ backgroundColor: t.surface, borderColor: t.border }}>
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative"
                        style={{ backgroundColor: t.elevated }}>
                        {produit.images?.[0]
                          ? <Image src={produit.images[0]} alt={produit.name} fill className="object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">...</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: t.text }}>{produit.name}</p>
                          {estTopVendeur && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"
                              style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                              <TrendingUp size={9} /> Top vente
                            </span>
                          )}
                        </div>
                        {produit.description && (
                          <p className="text-xs line-clamp-2" style={{ color: t.muted }}>
                            {produit.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm" style={{ color: t.accent }}>
                            {formatFcfa(produit.price)}
                          </span>
                          {aReduction && (
                            <span className="text-xs line-through" style={{ color: t.muted }}>
                              {formatFcfa(produit.comparePrice)}
                            </span>
                          )}
                          {aReduction && economie > 0 && (
                            <span className="text-xs font-medium flex items-center gap-1"
                              style={{ color: '#10b981' }}>
                              <Tag size={9} /> -{formatFcfa(economie)}
                            </span>
                          )}
                          {stockFaible && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                              <Flame size={10} /> Plus que {produit.totalStock} !
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs" style={{ color: t.muted }}>
                          <Zap size={10} style={{ color: t.accent }} />
                          <span><strong style={{ color: t.text }}>{achats}</strong> vendus cette semaine</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="flex-shrink-0 self-center" style={{ color: t.muted }} />
                    </Link>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button onClick={() => changerPage(page - 1)} disabled={page === 1}
                  className="p-2 rounded-xl border transition-colors disabled:opacity-30"
                  style={{ backgroundColor: t.surface, borderColor: t.border }}>
                  <ChevronLeft size={18} style={{ color: t.text }} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce((acc: (number | '...')[], n, i, arr) => {
                    if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(n); return acc;
                  }, [])
                  .map((n, i) => n === '...'
                    ? <span key={`dot-${i}`} style={{ color: t.muted }}>...</span>
                    : <button key={n} onClick={() => changerPage(n as number)}
                        className="w-9 h-9 rounded-xl border text-sm font-semibold transition-colors"
                        style={{
                          backgroundColor: page === n ? t.accent : t.surface,
                          borderColor:     page === n ? t.accent : t.border,
                          color:           page === n ? '#fff' : t.text,
                        }}>{n}</button>
                  )
                }
                <button onClick={() => changerPage(page + 1)} disabled={page === totalPages}
                  className="p-2 rounded-xl border transition-colors disabled:opacity-30"
                  style={{ backgroundColor: t.surface, borderColor: t.border }}>
                  <ChevronRight size={18} style={{ color: t.text }} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION — achat récent simulé ── */}
      {toast && (
        <div className={`fixed left-4 bottom-6 z-50 transition-all duration-500 ${
          toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl max-w-[260px]"
            style={{
              backgroundColor: t.surface,
              border:          `1px solid ${t.border}`,
              boxShadow:       '0 8px 32px rgba(0,0,0,0.4)',
            }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${t.accent}20` }}>
              <ShoppingBag size={16} style={{ color: t.accent }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight" style={{ color: t.text }}>
                {toast.prenom} vient d'acheter
              </p>
              <p className="text-xs leading-tight" style={{ color: t.muted }}>
                il y a {toast.minutes} min
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── WHATSAPP FLOTTANT ── */}
      {shop.whatsapp && (
        <Link
          href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=Bonjour, je suis interesse par vos produits`}
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: '#25D366' }}>
          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </Link>
      )}

    </div>
  );
}