'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, Loader2, Phone, MapPin,
  Clock, CheckCircle, Truck, XCircle, Package,
} from 'lucide-react';

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const STATUTS = {
  new:       { label: 'Nouvelle',     icone: Clock,        classe: 'bg-blue-500/20 text-blue-400',    next: ['confirmed', 'cancelled'] },
  confirmed: { label: 'Confirmée',    icone: CheckCircle,  classe: 'bg-primary/20 text-primary',      next: ['shipping', 'cancelled']  },
  shipping:  { label: 'En livraison', icone: Truck,        classe: 'bg-orange-500/20 text-orange-400',next: ['delivered', 'cancelled'] },
  delivered: { label: 'Livrée',       icone: CheckCircle,  classe: 'bg-green-500/20 text-green-400',  next: []                         },
  cancelled: { label: 'Annulée',      icone: XCircle,      classe: 'bg-red-500/20 text-red-400',      next: []                         },
};

const STATUT_LABELS: Record<string, string> = {
  confirmed: 'Confirmer',
  shipping:  'Marquer en livraison',
  delivered: 'Marquer comme livrée',
  cancelled: 'Annuler',
};

export default function CommandeDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { token } = useAuth();

  const [commande,   setCommande]   = useState<any>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchCommande = async () => {
      if (!token || !id) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        if (result.success) setCommande(result.data);
      } catch (error) {
        console.error('Erreur chargement commande :', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCommande();
  }, [token, id]);

  const changerStatut = async (nouveauStatut: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}/status`,
        {
          method:  'PATCH',
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: nouveauStatut }),
        }
      );
      const result = await response.json();
      if (result.success) setCommande(result.data);
    } catch (error) {
      console.error('Erreur changement statut :', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="text-primary animate-spin" />
    </div>
  );

  if (!commande) return (
    <div className="text-center py-12">
      <p className="text-muted">Commande introuvable</p>
    </div>
  );

  const statut = STATUTS[commande.status as keyof typeof STATUTS];
  const Icone  = statut.icone;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/commandes"
          className="w-9 h-9 flex items-center justify-center bg-elevated border border-border rounded-xl text-muted hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{commande.orderNumber}</h1>
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${statut.classe}`}>
              <Icone size={11} />
              {statut.label}
            </span>
          </div>
          <p className="text-muted text-sm">{formatDate(commande.createdAt)}</p>
        </div>
      </div>

      {/* Actions statut */}
      {statut.next.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-wrap gap-3">
          <p className="text-muted text-sm w-full mb-1">Mettre à jour le statut :</p>
          {statut.next.map((s) => (
            <button
              key={s}
              onClick={() => changerStatut(s)}
              disabled={isUpdating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                s === 'cancelled'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                  : 'bg-primary hover:bg-primary-hover text-black'
              }`}
            >
              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : null}
              {STATUT_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      {/* Infos client */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Informations client</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-elevated flex items-center justify-center">
              <span className="text-primary font-bold">
                {commande.customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{commande.customer.name}</p>
              <p className="text-muted text-xs">
                {commande.customer.isGuest ? 'Client invité' : 'Client inscrit'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted text-sm">
              <Phone size={14} className="text-primary" />
              {commande.customer.phone}
            </div>
            <div className="flex items-center gap-2 text-muted text-sm">
              <MapPin size={14} className="text-primary" />
              {commande.customer.address}, {commande.customer.city}
            </div>
          </div>
        </div>
      </div>

      {/* Produits commandés */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Produits commandés</h2>
        <div className="space-y-3">
          {commande.items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
              <div className="w-12 h-12 rounded-xl bg-elevated overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={20} className="text-muted" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{item.name}</p>
                {item.variant && (
                  <p className="text-muted text-xs">{item.variant}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-white text-sm">x{item.quantity}</p>
                <p className="text-primary font-bold text-sm">{formatFcfa(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="space-y-2 pt-2">
          {commande.discount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Sous-total</span>
                <span className="text-white">{formatFcfa(commande.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Réduction ({commande.promoCode})</span>
                <span className="text-green-400">-{formatFcfa(commande.discount)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold pt-2 border-t border-border">
            <span className="text-white">Total</span>
            <span className="text-primary text-lg">{formatFcfa(commande.total)}</span>
          </div>
        </div>
      </div>

      {/* Historique statuts */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Historique</h2>
        <div className="space-y-3">
          {commande.statusHistory?.map((h: any, i: number) => {
            const s     = STATUTS[h.status as keyof typeof STATUTS];
            const HIcone = s?.icone ?? Clock;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${s?.classe ?? ''}`}>
                  <HIcone size={13} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{s?.label ?? h.status}</p>
                  {h.note && <p className="text-muted text-xs">{h.note}</p>}
                  <p className="text-muted text-xs">{formatDate(h.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}