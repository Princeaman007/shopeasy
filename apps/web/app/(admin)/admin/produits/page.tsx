'use client';

import { useState, useEffect } from 'react';
import Image                   from 'next/image';
import Link                    from 'next/link';
import {
  Search, X, Loader2, RefreshCw,
  Package, Eye, Trash2, CheckCircle,
  AlertTriangle, ExternalLink,
} from 'lucide-react';

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

// -- Helper fetch avec credentials --
const authFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers, credentials: 'include' });
};

// ---------------------------------------------------------------------------
interface Produit {
  _id:        string;
  name:       string;
  price:      number;
  status:     'active' | 'draft' | 'out_of_stock';
  images:     string[];
  totalStock: number;
  shopId:     string;
  createdAt:  string;
  shopName?:  string;
  shopSlug?:  string;
}

// ---------------------------------------------------------------------------
export default function PageProduitsAdmin() {
  const [produits,     setProduits]     = useState<Produit[]>([]);
  const [chargement,   setChargement]   = useState(true);
  const [recherche,    setRecherche]    = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [stats,        setStats]        = useState({
    total: 0, actifs: 0, draft: 0, rupture: 0,
  });

  // -- Chargement --
  const charger = async () => {
    setChargement(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: '20',
        ...(filtreStatut && { status: filtreStatut }),
        ...(recherche    && { search: recherche    }),
      });

      const res  = await authFetch(`${API}/admin/products?${params}`);
      const data = await res.json();

      if (data.success) {
        setProduits(data.data);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
        if (data.stats) setStats(data.stats);
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [page, filtreStatut]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); charger(); }, 400);
    return () => clearTimeout(timer);
  }, [recherche]);

  // -- Supprimer produit --
  const supprimer = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    setActionId(id);
    try {
      await authFetch(`${API}/admin/products/${id}`, { method: 'DELETE' });
      charger();
    } finally {
      setActionId(null);
    }
  };

  // -- Changer statut --
  const changerStatut = async (id: string, status: string) => {
    setActionId(id);
    try {
      await authFetch(`${API}/admin/products/${id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      charger();
    } finally {
      setActionId(null);
    }
  };

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Produits</h1>
          <p className="text-muted text-sm mt-1">
            {total} produit{total > 1 ? 's' : ''} sur la plateforme
          </p>
        </div>
        <button
          onClick={charger}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border
                     border-border text-muted hover:text-white text-sm
                     transition-colors"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {/* ── Stats rapides ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',      valeur: stats.total,   couleur: '#06C167', filtre: ''             },
          { label: 'Actifs',     valeur: stats.actifs,  couleur: '#3b82f6', filtre: 'active'       },
          { label: 'Brouillons', valeur: stats.draft,   couleur: '#f59e0b', filtre: 'draft'        },
          { label: 'Rupture',    valeur: stats.rupture, couleur: '#ef4444', filtre: 'out_of_stock' },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => {
              setFiltreStatut(filtreStatut === s.filtre ? '' : s.filtre);
              setPage(1);
            }}
            className={`p-4 rounded-2xl border text-left transition-all
                        ${filtreStatut === s.filtre
                          ? 'border-primary bg-primary/10'
                          : 'bg-surface border-border hover:border-primary/30'}`}
          >
            <p className="text-muted text-xs">{s.label}</p>
            <p className="font-bold text-2xl mt-1" style={{ color: s.couleur }}>
              {s.valeur}
            </p>
          </button>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60 flex items-center gap-2 px-4 py-2.5
                        bg-surface border border-border rounded-xl">
          <Search size={16} className="text-muted" />
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un produit..."
            className="flex-1 bg-transparent outline-none text-sm text-white
                       placeholder-muted"
          />
          {recherche && (
            <button onClick={() => setRecherche('')}>
              <X size={14} className="text-muted hover:text-white" />
            </button>
          )}
        </div>

        <select
          value={filtreStatut}
          onChange={e => { setFiltreStatut(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl
                     text-sm text-white outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="draft">Brouillons</option>
          <option value="out_of_stock">Rupture</option>
        </select>
      </div>

      {/* ── Liste produits ── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {chargement ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : produits.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <Package size={36} className="mx-auto mb-3 opacity-30" />
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Produit', 'Boutique', 'Prix', 'Stock', 'Statut', 'Créé le', 'Actions'].map(h => (
                    <th key={h}
                        className="text-left px-5 py-3.5 text-xs font-semibold
                                   text-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {produits.map(p => {
                  const loading = actionId === p._id;
                  return (
                    <tr key={p._id} className="hover:bg-elevated/50 transition-colors">

                      {/* Produit */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden
                                          flex-shrink-0 relative bg-elevated">
                            {p.images?.[0]
                              ? <Image src={p.images[0]} alt={p.name}
                                       fill className="object-cover" />
                              : <div className="w-full h-full flex items-center
                                                justify-center text-lg"></div>
                            }
                          </div>
                          <p className="text-white text-sm font-medium truncate max-w-[180px]">
                            {p.name}
                          </p>
                        </div>
                      </td>

                      {/* Boutique */}
                      <td className="px-5 py-4">
                        {p.shopSlug ? (
                          <Link href={`/${p.shopSlug}`} target="_blank"
                                className="flex items-center gap-1 text-primary
                                           text-sm hover:underline">
                            {p.shopName ?? p.shopId}
                            <ExternalLink size={11} />
                          </Link>
                        ) : (
                          <p className="text-muted text-sm">—</p>
                        )}
                      </td>

                      {/* Prix */}
                      <td className="px-5 py-4">
                        <p className="text-white text-sm font-semibold">
                          {formatFcfa(p.price)}
                        </p>
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-4">
                        <p className={`text-sm font-medium
                                      ${p.totalStock === 0   ? 'text-red-400'   :
                                        p.totalStock <= 5    ? 'text-amber-400' :
                                        'text-white'}`}>
                          {p.totalStock}
                          {p.totalStock <= 5 && p.totalStock > 0 && (
                            <AlertTriangle size={12} className="inline ml-1 text-amber-400" />
                          )}
                        </p>
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1
                                         rounded-full border
                                         ${p.status === 'active'
                                           ? 'bg-primary/10 text-primary border-primary/30'
                                           : p.status === 'draft'
                                             ? 'bg-muted/10 text-muted border-border'
                                             : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                          {p.status === 'active' ? 'Actif' :
                           p.status === 'draft'  ? 'Brouillon' : 'Rupture'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <p className="text-muted text-xs">{formatDate(p.createdAt)}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {loading ? (
                            <Loader2 size={15} className="animate-spin text-muted" />
                          ) : (
                            <>
                              {p.shopSlug && (
                                <Link href={`/${p.shopSlug}/produits/${p._id}`}
                                      target="_blank"
                                      className="p-1.5 rounded-lg text-muted hover:text-white
                                                 hover:bg-elevated transition-colors"
                                      title="Voir le produit">
                                  <Eye size={15} />
                                </Link>
                              )}
                              {p.status !== 'active' && (
                                <button
                                  onClick={() => changerStatut(p._id, 'active')}
                                  className="p-1.5 rounded-lg text-muted hover:text-primary
                                             hover:bg-primary/10 transition-colors"
                                  title="Activer"
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => supprimer(p._id)}
                                className="p-1.5 rounded-lg text-muted hover:text-red-400
                                           hover:bg-red-400/10 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-border text-sm
                       text-muted hover:text-white disabled:opacity-30 transition-colors"
          >
            ← Précédent
          </button>
          <span className="text-muted text-sm">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-border text-sm
                       text-muted hover:text-white disabled:opacity-30 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}