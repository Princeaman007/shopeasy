'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, BadgeCheck, Loader2, Tag, Flame, Users, Zap,
  ShoppingBag, ChevronRight, TrendingUp, Shield, Truck, RotateCcw,
} from 'lucide-react';
import BottomNavBar from '@/components/client/BottomNavBar';
import ClientNavbar from '@/components/client/ClientNavbar';

interface Boutique {
  _id:        string;
  slug:       string;
  name:       string;
  isVerified: boolean;
  logo?:      string;
}

interface BoutiquePopulaire extends Boutique {
  totalCommandes: number;
}

interface Produit {
  _id:          string;
  name:         string;
  price:        number;
  comparePrice: number;
  images:       string[];
  createdAt:    string;
  boutique:     Boutique | null;
}

interface Pagination {
  page:    number;
  total:   number;
  pages:   number;
  parPage: number;
}

const CATEGORIES = [
  { label: 'Tout',          slug: ''                   },
  { label: 'Mode femme',    slug: 'mode-femme'         },
  { label: 'Mode homme',    slug: 'mode-homme'         },
  { label: 'Chaussures',    slug: 'chaussures'         },
  { label: 'Accessoires',   slug: 'accessoires'        },
  { label: 'Lunettes',      slug: 'lunettes'           },
  { label: 'Beaute',        slug: 'beaute-cosmetiques' },
  { label: 'Enfants',       slug: 'enfants'            },
  { label: 'Maison & Deco', slug: 'maison-deco'        },
  { label: 'Alimentation',  slug: 'alimentation'       },
  { label: 'Autre',         slug: 'autre'              },
];

const PRENOMS = [
  'Konan', 'Awa', 'Adjoua', 'Koffi', 'Aminata', 'Yao', 'Fatou',
  'Brice', 'Mariama', 'Seydou', 'Aicha', 'Kouadio', 'Natacha',
  'Abou', 'Clarisse', 'Mamadou', 'Estelle', 'Drissa', 'Fatoumata',
];

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

// ── Compte a rebours vente flash ──────────────────────────────────────────────
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

// ── Visiteurs actifs simules ───────────────────────────────────────────────────
function useVisiteursActifs() {
  const [nb, setNb] = useState(Math.floor(Math.random() * 40) + 20);
  useEffect(() => {
    const interval = setInterval(() => {
      setNb(Math.floor(Math.random() * 40) + 20);
    }, 12000);
    return () => clearInterval(interval);
  }, []);
  return nb;
}

// ── Toast notification — achat recent simule ──────────────────────────────────
function useToastAchat(boutiquesNoms: string[]) {
  const [toast, setToast]     = useState<{ prenom: string; boutique: string; minutes: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (boutiquesNoms.length === 0) return;
    const premier = setTimeout(() => afficherToast(), 9000);
    return () => clearTimeout(premier);
  }, [boutiquesNoms.length]);

  const afficherToast = () => {
    const prenom   = PRENOMS[Math.floor(Math.random() * PRENOMS.length)];
    const boutique = boutiquesNoms[Math.floor(Math.random() * boutiquesNoms.length)];
    const minutes  = Math.floor(Math.random() * 20) + 2;
    setToast({ prenom, boutique, minutes });
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => afficherToast(), Math.random() * 20000 + 25000);
    }, 4500);
  };

  return { toast, visible };
}

function SkeletonProduit() {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-elevated" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-elevated rounded-full w-3/4" />
        <div className="h-3 bg-elevated rounded-full w-1/3" />
      </div>
    </div>
  );
}

export default function BoutiquesPage() {
  const [produits,       setProduits]       = useState<Produit[]>([]);
  const [pagination,     setPagination]     = useState<Pagination | null>(null);
  const [boutiquesPop,   setBoutiquesPop]   = useState<BoutiquePopulaire[]>([]);
  const [categorie,      setCategorie]      = useState('');
  const [page,           setPage]           = useState(1);
  const [chargement,     setChargement]     = useState(true);
  const [chargementPlus, setChargementPlus] = useState(false);

  const temps     = useCompteurFlash();
  const visiteurs = useVisiteursActifs();

  const nomsBoutiques = useMemo(
    () => produits.map(p => p.boutique?.name).filter(Boolean) as string[],
    [produits]
  );
  const { toast, visible: toastVisible } = useToastAchat(nomsBoutiques);

  // ── Achats simules + top vendeurs par produit ───────────────────────────────
  const achatsSim = useMemo(() => {
    const map: Record<string, number> = {};
    produits.forEach(p => { map[p._id] = Math.floor(Math.random() * 35) + 5; });
    return map;
  }, [produits]);

  const topVendeurs = useMemo(() => {
    return new Set(
      Object.entries(achatsSim)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([id]) => id)
    );
  }, [achatsSim]);

  // ── Boutiques populaires ─────────────────────────────────────────────────────
  useEffect(() => {
    const chargerPopulaires = async () => {
      try {
        const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shops/populaires?limite=8`);
        const data = await res.json();
        setBoutiquesPop(data.boutiques || []);
      } catch {
        setBoutiquesPop([]);
      }
    };
    chargerPopulaires();
  }, []);

  // ── Produits — vitrine multi-boutiques ──────────────────────────────────────
  const fetchProduits = useCallback(async (cat: string, p: number, append = false) => {
    append ? setChargementPlus(true) : setChargement(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (cat) params.set('categorie', cat);
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shops/vitrine?${params}`);
      const data = await res.json();
      setProduits(prev => append ? [...prev, ...(data.produits || [])] : (data.produits || []));
      setPagination(data.pagination || null);
    } catch {
      setProduits([]);
    } finally {
      append ? setChargementPlus(false) : setChargement(false);
    }
  }, []);

  useEffect(() => { fetchProduits(categorie, 1); }, [categorie, fetchProduits]);

  const chargerPlus = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProduits(categorie, nextPage, true);
  };

  const changerCategorie = (slug: string) => {
    setCategorie(slug);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-bg pb-20 md:pb-0">

      <ClientNavbar />

      {/* ── BANDEAU URGENCE ── */}
      <div style={{ backgroundColor: '#ef444412', borderBottom: '1px solid #ef444428' }}>
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-red-400" />
              <span className="text-xs font-bold text-red-400">PRIX SPECIAUX</span>
            </div>
            <span className="text-xs hidden sm:inline text-muted">— Offre valable encore</span>
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-white">
              {[temps.h, temps.m, temps.s].map((v, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-elevated">{String(v).padStart(2, '0')}</span>
                  {i < 2 && <span className="text-red-400">:</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Users size={12} className="text-primary" />
            <span>
              <strong className="text-white">{visiteurs} personnes</strong> achetent en ce moment
            </span>
          </div>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div className="border-b border-border bg-surface sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">

          <div className="text-center space-y-1 pb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Des milliers de produits, livres chez vous
            </h1>
            <p className="text-muted text-sm">
              Paiement uniquement a la livraison — partout en Cote d'Ivoire
            </p>
          </div>

          {/* Recherche — mene vers /recherche */}
          <Link href="/recherche"
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-primary/40 bg-elevated w-full shadow-sm">
            <Search size={18} className="text-primary" />
            <span className="text-sm text-muted">Rechercher un produit ou une boutique...</span>
          </Link>

          {/* Filtres categorie */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {CATEGORIES.map((cat) => (
              <button key={cat.slug}
                onClick={() => changerCategorie(cat.slug)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: categorie === cat.slug ? '#06C167' : 'transparent',
                  borderColor:     categorie === cat.slug ? '#06C167' : '#2a2a2a',
                  color:           categorie === cat.slug ? '#000' : '#888',
                }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">

        {/* ── BLOC CONFIANCE ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icone: <Shield    size={16} />, label: 'Paiement a la reception'  },
            { icone: <Truck     size={16} />, label: 'Livraison partout en CI'  },
            { icone: <RotateCcw size={16} />, label: 'Retour sans questions'    },
          ].map((g, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl border border-border bg-surface">
              <span className="text-primary">{g.icone}</span>
              <p className="text-muted text-xs leading-tight">{g.label}</p>
            </div>
          ))}
        </div>

        {/* ── BOUTIQUES POPULAIRES ── */}
        {boutiquesPop.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="text-white font-bold">Boutiques les plus actives</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto sm:overflow-visible sm:flex-wrap sm:justify-center pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
              {boutiquesPop.map((boutique) => (
                <Link key={boutique._id} href={`https://${boutique.slug}.shopeasyci.store`}
                  className="flex-shrink-0 snap-start w-32 sm:w-36 bg-surface border border-border rounded-2xl p-4 text-center hover:border-primary/40 hover:shadow-lg transition-all">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-2.5 overflow-hidden relative bg-elevated ring-1 ring-border">
                    {boutique.logo ? (
                      <Image src={boutique.logo} alt={boutique.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary">
                        <span className="text-black font-bold text-lg">
                          {boutique.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xs font-semibold truncate">{boutique.name}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {boutique.isVerified && <BadgeCheck size={10} className="text-primary flex-shrink-0" />}
                    <span className="text-muted text-[10px] truncate">
                      {boutique.totalCommandes}+ commandes
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── GRILLE PRODUITS ── */}
        <div className="space-y-4">
          <h2 className="text-white font-bold text-lg">
            {categorie ? CATEGORIES.find(c => c.slug === categorie)?.label : 'Decouvrez nos produits'}
          </h2>

          {chargement && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonProduit key={i} />)}
            </div>
          )}

          {!chargement && produits.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={28} className="text-muted" />
              </div>
              <h3 className="text-white font-semibold mb-2">Aucun produit dans cette categorie</h3>
              <p className="text-muted text-sm">Essayez une autre categorie</p>
            </div>
          )}

          {!chargement && produits.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {produits.map((produit) => {
                  const aReduction    = produit.comparePrice > produit.price;
                  const pct           = aReduction
                    ? Math.round((1 - produit.price / produit.comparePrice) * 100)
                    : 0;
                  const economie      = aReduction ? produit.comparePrice - produit.price : 0;
                  const achats        = achatsSim[produit._id] ?? 5;
                  const estTopVendeur = topVendeurs.has(produit._id);

                  return (
                    <Link
                      key={produit._id}
                      href={produit.boutique ? `https://${produit.boutique.slug}.shopeasyci.store/produits/${produit._id}?ref=vitrine` : '#'}
                      className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-xl transition-all flex flex-col"
                    >
                      <div className="aspect-square relative overflow-hidden bg-elevated">
                        {produit.images?.[0] ? (
                          <Image src={produit.images[0]} alt={produit.name} fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={24} className="text-muted" />
                          </div>
                        )}

                        {aReduction && (
                          <div className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full text-white"
                            style={{ backgroundColor: '#ef4444' }}>
                            -{pct}%
                          </div>
                        )}

                        {estTopVendeur && !aReduction && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full text-white"
                            style={{ backgroundColor: '#f59e0b' }}>
                            <TrendingUp size={10} />
                            Top vente
                          </div>
                        )}
                      </div>

                      <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                        <p className="text-white text-sm font-medium line-clamp-2">{produit.name}</p>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-primary font-bold text-sm">
                              {formatFcfa(produit.price)}
                            </span>
                            {aReduction && (
                              <span className="text-muted text-xs line-through">
                                {formatFcfa(produit.comparePrice)}
                              </span>
                            )}
                          </div>
                          {aReduction && economie > 0 && (
                            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#10b981' }}>
                              <Tag size={9} />
                              Economisez {formatFcfa(economie)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted">
                          <Zap size={10} className="text-primary" />
                          <span><strong className="text-white">{achats}</strong> vendus cette semaine</span>
                        </div>

                        {produit.boutique && (
                          <p className="text-muted text-xs truncate pt-0.5 border-t border-border mt-1">
                            Vendu par {produit.boutique.name}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {pagination && page < pagination.pages && (
                <div className="text-center pt-4">
                  <button onClick={chargerPlus} disabled={chargementPlus}
                    className="inline-flex items-center gap-2 bg-surface hover:bg-elevated border border-border hover:border-primary/40 text-white font-semibold px-6 py-3 rounded-2xl transition-all disabled:opacity-50">
                    {chargementPlus
                      ? <><Loader2 size={16} className="animate-spin" /> Chargement...</>
                      : <><Tag size={16} /> Voir plus de produits</>
                    }
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── LIEN VERS L'ANNUAIRE COMPLET ── */}
        <div className="text-center pt-4 border-t border-border">
          <Link href="/annuaire"
            className="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:underline pt-6">
            Voir toutes les boutiques <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className={`fixed left-4 bottom-20 md:bottom-6 z-[60] transition-all duration-500 ${
          toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl max-w-[270px] bg-surface border border-border"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/20">
              <ShoppingBag size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight text-white">
                {toast.prenom} vient d'acheter
              </p>
              <p className="text-xs leading-tight text-muted truncate">
                chez {toast.boutique} — il y a {toast.minutes} min
              </p>
            </div>
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
}