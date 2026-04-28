'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, X, SlidersHorizontal, ChevronLeft,
  ShoppingCart, ChevronRight, Grid3X3, List,
} from 'lucide-react';
import { getThemeConfig } from '../theme.config';
import type { ShopPublic } from '../types';
import BoutonFavori from '@/components/storefront/BoutonFavori';

interface Props {
  shop: ShopPublic;
  categories: any[];
  produits: any[];
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const PAR_PAGE = 12;

export default function CatalogueClient({ shop, categories, produits }: Props) {
  const t = getThemeConfig(shop.selectedTheme);

  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('');
  const [tri, setTri] = useState<'recent' | 'prix-asc' | 'prix-desc' | 'nom'>('recent');
  const [filtrePrix, setFiltrePrix] = useState<[number, number]>([0, 500000]);
  const [grille, setGrille] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [filtresOuverts, setFiltresOuverts] = useState(false);

  const prixMax = useMemo(
    () => Math.max(...produits.map(p => p.price), 10000),
    [produits]
  );

  const produitsFiltres = useMemo(() => {
    let liste = [...produits];
    if (recherche) liste = liste.filter(p =>
      p.name.toLowerCase().includes(recherche.toLowerCase()) ||
      p.description?.toLowerCase().includes(recherche.toLowerCase())
    );
    if (categorie) liste = liste.filter(p => p.categoryId === categorie);
    liste = liste.filter(p => p.price >= filtrePrix[0] && p.price <= filtrePrix[1]);
    switch (tri) {
      case 'prix-asc': liste.sort((a, b) => a.price - b.price); break;
      case 'prix-desc': liste.sort((a, b) => b.price - a.price); break;
      case 'nom': liste.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: liste.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return liste;
  }, [produits, recherche, categorie, filtrePrix, tri]);

  const totalPages = Math.ceil(produitsFiltres.length / PAR_PAGE);
  const produitsPaged = produitsFiltres.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const changerPage = (n: number) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const reinitialiserFiltres = () => {
    setRecherche(''); setCategorie(''); setTri('recent');
    setFiltrePrix([0, prixMax]); setPage(1);
  };

  const filtresActifs = recherche || categorie ||
    filtrePrix[0] > 0 || filtrePrix[1] < prixMax || tri !== 'recent';

  // Contenu filtres (reutilise dans sidebar + drawer)
  const ContenuFiltres = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm" style={{ color: t.text }}>Filtres</h3>
        {filtresActifs && (
          <button onClick={reinitialiserFiltres} className="text-xs hover:underline"
            style={{ color: t.accent }}>
            Reinitialiser
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.muted }}>
            Categories
          </p>
          <div className="space-y-1">
            <button onClick={() => { setCategorie(''); setPage(1); setFiltresOuverts(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: !categorie ? `${t.accent}20` : 'transparent',
                color: !categorie ? t.accent : t.muted,
                fontWeight: !categorie ? 600 : 400,
              }}>
              Tous ({produits.length})
            </button>
            {categories.map(cat => {
              const count = produits.filter(p => p.categoryId === cat._id).length;
              return (
                <button key={cat._id}
                  onClick={() => { setCategorie(cat._id); setPage(1); setFiltresOuverts(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between"
                  style={{
                    backgroundColor: categorie === cat._id ? `${t.accent}20` : 'transparent',
                    color: categorie === cat._id ? t.accent : t.muted,
                    fontWeight: categorie === cat._id ? 600 : 400,
                  }}>
                  <span>{cat.icon} {cat.name}</span>
                  <span className="text-xs">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.muted }}>
          Prix maximum
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

      {/* ── NAVBAR ── */}
      <nav style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link  href="https://www.shopeasyci.store"
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70 flex-shrink-0"
            style={{ color: t.muted }}>
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">{shop.name}</span>
          </Link>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ backgroundColor: t.elevated, borderColor: t.border }}>
            <Search size={15} style={{ color: t.muted }} />
            <input value={recherche}
              onChange={e => { setRecherche(e.target.value); setPage(1); }}
              placeholder="Rechercher..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: t.text }} />
            {recherche && (
              <button onClick={() => { setRecherche(''); setPage(1); }}>
                <X size={13} style={{ color: t.muted }} />
              </button>
            )}
          </div>
          <Link href={"/panier"} className="p-2 rounded-xl flex-shrink-0"
            style={{ backgroundColor: t.elevated }}>
            <ShoppingCart size={20} style={{ color: t.text }} />
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-5">

        {/* ── EN-TETE ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: t.text }}>Catalogue</h1>
            <p className="text-sm mt-0.5" style={{ color: t.muted }}>
              {produitsFiltres.length} produit{produitsFiltres.length > 1 ? 's' : ''}
              {filtresActifs && ' (filtre)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton filtres — visible partout sur mobile */}
            <button onClick={() => setFiltresOuverts(!filtresOuverts)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors lg:hidden"
              style={{
                backgroundColor: filtresActifs ? `${t.accent}15` : t.surface,
                borderColor: filtresActifs ? t.accent : t.border,
                color: filtresActifs ? t.accent : t.text,
              }}>
              <SlidersHorizontal size={15} />
              Filtres
              {filtresActifs && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />}
            </button>

            {/* Vue grille / liste */}
            <div className="flex border rounded-xl overflow-hidden" style={{ borderColor: t.border }}>
              {(['grid', 'list'] as const).map(v => (
                <button key={v} onClick={() => setGrille(v)} className="p-2 transition-colors"
                  style={{ backgroundColor: grille === v ? t.accent : t.surface, color: grille === v ? '#fff' : t.muted }}>
                  {v === 'grid' ? <Grid3X3 size={15} /> : <List size={15} />}
                </button>
              ))}
            </div>

            {/* Tri */}
            <select value={tri} onChange={e => { setTri(e.target.value as any); setPage(1); }}
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

          {/* ── SIDEBAR FILTRES DESKTOP ── */}
          <aside className="hidden lg:block flex-shrink-0 w-56">
            <div className="rounded-2xl border p-5 sticky top-20"
              style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <ContenuFiltres />
            </div>
          </aside>

          {/* ── GRILLE PRODUITS ── */}
          <div className="flex-1 space-y-5">
            {produitsPaged.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <p className="font-semibold" style={{ color: t.text }}>Aucun produit trouve</p>
                <button onClick={reinitialiserFiltres} className="text-sm hover:underline"
                  style={{ color: t.accent }}>
                  Reinitialiser les filtres
                </button>
              </div>
            ) : grille === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {produitsPaged.map(produit => (
                  <Link key={produit._id} href={`/produits/${produit._id}`}
                    className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl"
                    style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                    <div className="aspect-square relative overflow-hidden"
                      style={{ backgroundColor: t.elevated }}>
                      {produit.images?.[0]
                        ? <Image src={produit.images[0]} alt={produit.name} fill
                          className="object-cover group-hover:scale-105 transition-transform" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">...</div>
                      }
                      {produit.comparePrice > produit.price && (
                        <div className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full text-white"
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
                          <span className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{ backgroundColor: t.elevated, color: t.muted }}>
                            Rupture
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="font-medium text-sm line-clamp-2" style={{ color: t.text }}>
                        {produit.name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: t.accent }}>
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
            ) : (
              <div className="space-y-3">
                {produitsPaged.map(produit => (
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
                      <p className="font-semibold text-sm" style={{ color: t.text }}>{produit.name}</p>
                      {produit.description && (
                        <p className="text-xs line-clamp-2" style={{ color: t.muted }}>{produit.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: t.accent }}>{formatFcfa(produit.price)}</span>
                        {produit.comparePrice > produit.price && (
                          <span className="text-xs line-through" style={{ color: t.muted }}>{formatFcfa(produit.comparePrice)}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} className="flex-shrink-0 self-center" style={{ color: t.muted }} />
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
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
                        borderColor: page === n ? t.accent : t.border,
                        color: page === n ? '#fff' : t.text,
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

      {/* WhatsApp flottant */}
      {shop.whatsapp && (
        <Link href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=Bonjour, je suis interesse par vos produits`}
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