'use client';

import { useState, useEffect } from 'react';
import Link                    from 'next/link';
import Image                   from 'next/image';
import {
  ChevronLeft, CheckCircle, Truck, XCircle,
  ShoppingBag, MapPin, Phone, Loader2,
  AlertTriangle, Clock, Package,
} from 'lucide-react';

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const STATUTS = {
  new:       { label: 'Nouvelle',     icone: <ShoppingBag size={15} />, classe: 'bg-blue-500/10 text-blue-400 border-blue-500/30',      couleur: '#3b82f6' },
  confirmed: { label: 'Confirmée',    icone: <CheckCircle size={15} />, classe: 'bg-amber-500/10 text-amber-400 border-amber-500/30',   couleur: '#f59e0b' },
  shipping:  { label: 'En livraison', icone: <Truck       size={15} />, classe: 'bg-purple-500/10 text-purple-400 border-purple-500/30', couleur: '#8b5cf6' },
  delivered: { label: 'Livrée',       icone: <CheckCircle size={15} />, classe: 'bg-primary/10 text-primary border-primary/30',         couleur: '#06C167' },
  cancelled: { label: 'Annulée',      icone: <XCircle     size={15} />, classe: 'bg-red-500/10 text-red-400 border-red-500/30',         couleur: '#ef4444' },
};

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
export default function PageDetailCommandeAdmin({
  params,
}: {
  params: { id: string };
}) {
  const [commande,   setCommande]   = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [actionLoad, setActionLoad] = useState(false);
  const [succes,     setSucces]     = useState('');
  const [erreur,     setErreur]     = useState('');

  // -- Chargement --
  const charger = async () => {
    setChargement(true);
    try {
      const res  = await authFetch(`${API}/admin/orders/${params.id}`);
      const data = await res.json();
      if (data.success) setCommande(data.data);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [params.id]);

  // -- Changer statut --
  const changerStatut = async (status: string) => {
    setActionLoad(true);
    setSucces('');
    setErreur('');
    try {
      const res  = await authFetch(`${API}/admin/orders/${params.id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSucces('Statut mis à jour');
      charger();
      setTimeout(() => setSucces(''), 3000);
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setActionLoad(false);
    }
  };

  // ---------------------------------------------------------------------------
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="text-center py-20 space-y-3">
        <AlertTriangle size={40} className="text-red-400 mx-auto" />
        <p className="text-white font-semibold">Commande introuvable</p>
        <Link href="/admin/commandes"
              className="text-primary text-sm hover:underline">
          ← Retour aux commandes
        </Link>
      </div>
    );
  }

  const statut  = STATUTS[commande.status as keyof typeof STATUTS] ?? STATUTS['new'];
  const client  = commande.nomClient  ?? commande.customer?.name  ?? '—';
  const tel     = commande.telephone  ?? commande.customer?.phone ?? '—';
  const adresse = commande.adresseLivraison ?? commande.customer?.address ?? null;

  // Étapes du suivi
  const ETAPES = ['new', 'confirmed', 'shipping', 'delivered'];
  const etapeActuelle = ETAPES.indexOf(commande.status);

  return (
    <div className="space-y-6 max-w-4xl">

      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link href="/admin/commandes"
              className="p-2 rounded-xl border border-border text-muted
                         hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-white text-xl font-bold font-mono">
              {commande.orderNumber}
            </h1>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                             px-3 py-1 rounded-full border ${statut.classe}`}>
              {statut.icone}
              {statut.label}
            </span>
          </div>
          <p className="text-muted text-sm mt-1">
            {formatDate(commande.createdAt)}
          </p>
        </div>
      </div>

      {/* Succès / Erreur */}
      {succes && (
        <div className="bg-primary/10 border border-primary/30 text-primary
                        px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle size={15} />
          {succes}
        </div>
      )}
      {erreur && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400
                        px-4 py-3 rounded-xl text-sm">
          {erreur}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Colonne gauche ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Suivi commande */}
          {commande.status !== 'cancelled' && (
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold">Suivi</h2>
              <div className="flex items-center gap-2">
                {ETAPES.map((etape, i) => {
                  const s      = STATUTS[etape as keyof typeof STATUTS];
                  const actif  = i <= etapeActuelle;
                  const courant = i === etapeActuelle;
                  return (
                    <div key={etape} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center
                                      justify-center border-2 transition-all
                                      ${courant
                                        ? 'border-primary bg-primary/20 text-primary'
                                        : actif
                                          ? 'border-primary bg-primary text-white'
                                          : 'border-border bg-elevated text-muted'}`}
                        >
                          {s.icone}
                        </div>
                        <p className={`text-xs mt-1.5 text-center
                                      ${actif ? 'text-white' : 'text-muted'}`}>
                          {s.label}
                        </p>
                      </div>
                      {i < ETAPES.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-1 rounded
                                        ${i < etapeActuelle
                                          ? 'bg-primary'
                                          : 'bg-border'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Articles */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Package size={18} className="text-primary" />
              Articles ({commande.items?.length ?? 0})
            </h2>
            <div className="space-y-3">
              {(commande.items ?? []).map((item: any, i: number) => (
                <div key={i}
                     className="flex items-center gap-3 p-3 bg-elevated
                                rounded-xl border border-border">
                  <div className="w-12 h-12 rounded-xl overflow-hidden
                                  flex-shrink-0 relative bg-surface">
                    {item.image || item.productImage
                      ? <Image
                          src={item.image ?? item.productImage}
                          alt={item.name ?? item.productName}
                          fill className="object-cover"
                        />
                      : <div className="w-full h-full flex items-center
                                        justify-center text-xl">🛍️</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {item.name ?? item.productName}
                    </p>
                    {item.variant && (
                      <p className="text-muted text-xs">{item.variant}</p>
                    )}
                    <p className="text-muted text-xs">
                      Qté : {item.quantity} × {formatFcfa(item.price)}
                    </p>
                  </div>
                  <p className="text-white font-semibold text-sm flex-shrink-0">
                    {formatFcfa(item.quantity * item.price)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-border pt-4 space-y-2">
              {commande.fraisLivraison > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Frais de livraison</span>
                  <span className="text-white">
                    {formatFcfa(commande.fraisLivraison)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-primary font-bold text-lg">
                  {formatFcfa(commande.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Infos client */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold">Client</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-elevated flex items-center
                                justify-center text-lg flex-shrink-0">
                  👤
                </div>
                <div>
                  <p className="text-white font-medium">{client}</p>
                  <p className="text-muted text-xs">{tel}</p>
                </div>
              </div>
              {adresse && (
                <div className="flex items-start gap-2 p-3 bg-elevated
                                rounded-xl border border-border">
                  <MapPin size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-muted text-sm">{adresse}</p>
                </div>
              )}
              {commande.noteClient && (
                <div className="p-3 bg-elevated rounded-xl border border-border">
                  <p className="text-muted text-xs font-medium mb-1">Note client</p>
                  <p className="text-white text-sm">{commande.noteClient}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Colonne droite — Actions ── */}
        <div className="space-y-6">

          {/* Changer le statut */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold">Changer le statut</h2>
            <div className="space-y-2">
              {(Object.entries(STATUTS) as [string, any][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => changerStatut(key)}
                  disabled={actionLoad || commande.status === key}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
                              border text-sm font-medium transition-all
                              disabled:opacity-50
                              ${commande.status === key
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-elevated text-muted hover:text-white hover:border-primary/30'}`}
                >
                  {actionLoad && commande.status !== key
                    ? <Loader2 size={15} className="animate-spin" />
                    : val.icone
                  }
                  {val.label}
                  {commande.status === key && (
                    <span className="ml-auto text-xs">Actuel</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Infos boutique */}
          {commande.shopId && (
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
              <h2 className="text-white font-semibold">Boutique</h2>
              <p className="text-muted text-sm font-mono text-xs">
                {commande.shopId}
              </p>
              <Link
                href={`/admin/marchands`}
                className="flex items-center gap-2 text-primary text-sm hover:underline"
              >
                Voir les marchands →
              </Link>
            </div>
          )}

          {/* Récapitulatif */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
            <h2 className="text-white font-semibold">Récapitulatif</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Articles</span>
                <span className="text-white">{commande.items?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Paiement</span>
                <span className="text-white capitalize">
                  {commande.modePaiement ?? 'À la livraison'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Livraison</span>
                <span className="text-white">
                  {commande.modeLivraison ?? 'Standard'}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2
                              border-t border-border">
                <span className="text-white">Total</span>
                <span className="text-primary">{formatFcfa(commande.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}