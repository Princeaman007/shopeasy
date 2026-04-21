'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search, Eye, Clock, CheckCircle,
  Truck, XCircle, Package, Filter,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Commande {
  _id:         string;
  orderNumber: string;
  customer: {
    name:    string;
    phone:   string;
    city:    string;
    isGuest: boolean;
  };
  items:    { name: string; quantity: number; price: number }[];
  total:    number;
  status:   'new' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

const STATUTS = {
  new:       { label: 'Nouvelle',     icone: Clock,        classe: 'bg-blue-500/20 text-blue-400'    },
  confirmed: { label: 'Confirmée',    icone: CheckCircle,  classe: 'bg-primary/20 text-primary'      },
  shipping:  { label: 'En livraison', icone: Truck,        classe: 'bg-orange-500/20 text-orange-400'},
  delivered: { label: 'Livrée',       icone: CheckCircle,  classe: 'bg-green-500/20 text-green-400'  },
  cancelled: { label: 'Annulée',      icone: XCircle,      classe: 'bg-red-500/20 text-red-400'      },
};

// ─── Composant ────────────────────────────────────────────────────────────────

export default function CommandesPage() {
  const { token } = useAuth();

  const [commandes,    setCommandes]    = useState<Commande[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [recherche,    setRecherche]    = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);

  const fetchCommandes = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: '15',
        ...(filtreStatut && { status: filtreStatut }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/shop/me?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      if (result.success) {
        setCommandes(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);
      }
    } catch (error) {
      console.error('Erreur chargement commandes :', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCommandes(); }, [token, page, filtreStatut]);

  const commandesFiltrees = commandes.filter((c) =>
    c.orderNumber.toLowerCase().includes(recherche.toLowerCase()) ||
    c.customer.name.toLowerCase().includes(recherche.toLowerCase()) ||
    c.customer.phone.includes(recherche)
  );

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Commandes</h1>
          <p className="text-muted text-sm mt-1">{total} commande{total > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client, téléphone..."
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
          <option value="new">Nouvelles</option>
          <option value="confirmed">Confirmées</option>
          <option value="shipping">En livraison</option>
          <option value="delivered">Livrées</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      {/* Liste commandes */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-elevated rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : commandesFiltrees.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <Package size={48} className="text-muted mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Aucune commande</h3>
          <p className="text-muted text-sm">
            {recherche || filtreStatut
              ? 'Aucune commande ne correspond à vos filtres'
              : 'Partagez votre boutique pour recevoir vos premières commandes'}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {/* En-tête tableau */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-muted text-xs font-medium uppercase tracking-wider">
            <div className="col-span-2">Numéro</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Montant</div>
            <div className="col-span-2">Statut</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Action</div>
          </div>

          {/* Lignes */}
          {commandesFiltrees.map((commande, index) => {
            const statut = STATUTS[commande.status];
            const Icone  = statut.icone;

            return (
              <div
                key={commande._id}
                className={`grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 items-center hover:bg-elevated transition-colors ${
                  index < commandesFiltrees.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                {/* Numéro */}
                <div className="col-span-2">
                  <p className="text-white font-mono text-sm font-semibold">
                    {commande.orderNumber}
                  </p>
                  <p className="text-muted text-xs sm:hidden">
                    {commande.customer.name}
                  </p>
                </div>

                {/* Client */}
                <div className="hidden sm:block col-span-3">
                  <p className="text-white text-sm font-medium">{commande.customer.name}</p>
                  <p className="text-muted text-xs">{commande.customer.phone} · {commande.customer.city}</p>
                </div>

                {/* Montant */}
                <div className="col-span-2">
                  <p className="text-primary font-bold text-sm">{formatFcfa(commande.total)}</p>
                  <p className="text-muted text-xs">
                    {commande.items.length} article{commande.items.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Statut */}
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${statut.classe}`}>
                    <Icone size={11} />
                    {statut.label}
                  </span>
                </div>

                {/* Date */}
                <div className="hidden sm:block col-span-2">
                  <p className="text-muted text-xs">{formatDate(commande.createdAt)}</p>
                </div>

                {/* Action */}
                <div className="col-span-1">
                  <Link
                    href={`/dashboard/commandes/${commande._id}`}
                    className="w-9 h-9 flex items-center justify-center bg-elevated hover:bg-border border border-border rounded-xl text-muted hover:text-white transition-colors"
                  >
                    <Eye size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
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
          <span className="text-muted text-sm">Page {page} / {totalPages}</span>
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