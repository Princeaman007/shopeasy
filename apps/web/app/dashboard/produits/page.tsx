'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, Search, Filter, Edit2, Trash2,
  Package, Eye, EyeOff, Loader2, ImageOff,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Produit {
  _id:         string;
  name:        string;
  price:       number;
  comparePrice?: number;
  images:      string[];
  status:      'active' | 'draft' | 'out_of_stock';
  totalStock:  number;
  hasVariants: boolean;
  categoryId?: string;
  createdAt:   string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const STATUT_LABELS: Record<string, { label: string; classe: string }> = {
  active:       { label: 'Actif',        classe: 'bg-primary/20 text-primary' },
  draft:        { label: 'Brouillon',    classe: 'bg-elevated text-muted border border-border' },
  out_of_stock: { label: 'Rupture',      classe: 'bg-red-500/20 text-red-400' },
};

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ProduitsPage() {
  const { token, shop } = useAuth();

  const [produits,   setProduits]   = useState<Produit[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [recherche,  setRecherche]  = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [suppression, setSuppression] = useState<string | null>(null);

  const isPremium   = shop?.planType === 'premium';
  const maxProduits = isPremium ? Infinity : 10;

  // ── Chargement des produits ──
  const fetchProduits = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: '12',
        ...(filtreStatut && { status: filtreStatut }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/shop/me?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      if (result.success) {
        setProduits(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);
      }
    } catch (error) {
      console.error('Erreur chargement produits :', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProduits(); }, [token, page, filtreStatut]);

  // ── Suppression ──
  const supprimerProduit = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    setSuppression(id);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`,
        {
          method:  'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchProduits();
    } catch (error) {
      console.error('Erreur suppression :', error);
    } finally {
      setSuppression(null);
    }
  };

  // ── Changer statut rapide ──
  const toggleStatut = async (produit: Produit) => {
    const nouveauStatut = produit.status === 'active' ? 'draft' : 'active';
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${produit._id}`,
        {
          method:  'PATCH',
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: nouveauStatut }),
        }
      );
      fetchProduits();
    } catch (error) {
      console.error('Erreur changement statut :', error);
    }
  };

  // ── Filtre local par recherche ──
  const produitsFiltres = produits.filter((p) =>
    p.name.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produits</h1>
          <p className="text-muted text-sm mt-1">
            {total} produit{total > 1 ? 's' : ''}
            {!isPremium && ` · ${total}/${maxProduits} (Basic)`}
          </p>
        </div>
        <Link
          href="/dashboard/produits/nouveau"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            !isPremium && total >= 10
              ? 'bg-elevated text-muted cursor-not-allowed border border-border'
              : 'bg-primary hover:bg-primary-hover text-black hover:scale-105'
          }`}
        >
          <Plus size={18} />
          Nouveau produit
        </Link>
      </div>

      {/* Alerte limite Basic */}
      {!isPremium && total >= 8 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-orange-400 text-sm">
            ⚠️ Vous avez {total}/10 produits (plan Basic).
            {total >= 10 ? ' Limite atteinte.' : ` Il vous reste ${10 - total} emplacement(s).`}
          </p>
          <Link
            href="/dashboard/parametres/abonnement"
            className="text-primary text-sm font-medium hover:underline"
          >
            Passer en Premium →
          </Link>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => { setFiltreStatut(e.target.value); setPage(1); }}
          className="bg-surface border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="draft">Brouillons</option>
          <option value="out_of_stock">Rupture de stock</option>
        </select>
      </div>

      {/* Liste produits */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-elevated rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : produitsFiltres.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <Package size={48} className="text-muted mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Aucun produit</h3>
          <p className="text-muted text-sm mb-6">
            {recherche
              ? 'Aucun produit ne correspond à votre recherche'
              : 'Ajoutez votre premier produit pour commencer à vendre'}
          </p>
          {!recherche && (
            <Link
              href="/dashboard/produits/nouveau"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <Plus size={18} />
              Ajouter un produit
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {produitsFiltres.map((produit) => (
            <div
              key={produit._id}
              className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
            >
              {/* Image */}
              <div className="h-40 bg-elevated relative overflow-hidden">
                {produit.images?.[0] ? (
                  <img
                    src={produit.images[0]}
                    alt={produit.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff size={32} className="text-muted" />
                  </div>
                )}

                {/* Badge statut */}
                <div className="absolute top-2 left-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    STATUT_LABELS[produit.status]?.classe
                  }`}>
                    {STATUT_LABELS[produit.status]?.label}
                  </span>
                </div>
              </div>

              {/* Infos */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm truncate mb-1">
                  {produit.name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-primary font-bold text-sm">
                    {formatFcfa(produit.price)}
                  </span>
                  {produit.comparePrice && (
                    <span className="text-muted text-xs line-through">
                      {formatFcfa(produit.comparePrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted mb-3">
                  <span>Stock : {produit.totalStock}</span>
                  {produit.hasVariants && <span>Avec variantes</span>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/produits/${produit._id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-elevated hover:bg-border border border-border text-white text-xs font-medium py-2 rounded-lg transition-colors"
                  >
                    <Edit2 size={13} />
                    Modifier
                  </Link>
                  <button
                    onClick={() => toggleStatut(produit)}
                    className="w-9 h-9 flex items-center justify-center bg-elevated hover:bg-border border border-border text-muted hover:text-white rounded-lg transition-colors"
                    title={produit.status === 'active' ? 'Masquer' : 'Publier'}
                  >
                    {produit.status === 'active'
                      ? <EyeOff size={14} />
                      : <Eye size={14} />
                    }
                  </button>
                  <button
                    onClick={() => supprimerProduit(produit._id)}
                    disabled={suppression === produit._id}
                    className="w-9 h-9 flex items-center justify-center bg-elevated hover:bg-red-500/10 border border-border hover:border-red-500/30 text-muted hover:text-red-400 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    {suppression === produit._id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-white text-sm disabled:opacity-40 hover:bg-elevated transition-colors"
          >
            ← Précédent
          </button>
          <span className="text-muted text-sm">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-white text-sm disabled:opacity-40 hover:bg-elevated transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}