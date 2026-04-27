'use client';

import { useState, useEffect } from 'react';
import Link                    from 'next/link';
import Image                   from 'next/image';
import {
  ChevronLeft, CheckCircle, Crown, Zap, Clock,
  Package, ShoppingBag, MapPin, Phone, Mail,
  Loader2, AlertTriangle, RefreshCw, ExternalLink,
} from 'lucide-react';

// ---------------------------------------------------------------------------
const API = process.env.NEXT_PUBLIC_API_URL;

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

const STATUTS = {
  trial:     { label: 'Essai',    classe: 'bg-blue-500/10 text-blue-400 border-blue-500/30'      },
  active:    { label: 'Actif',    classe: 'bg-primary/10 text-primary border-primary/30'          },
  expired:   { label: 'Expiré',   classe: 'bg-red-500/10 text-red-400 border-red-500/30'          },
  suspended: { label: 'Suspendu', classe: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
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
export default function PageDetailMarchand({
  params,
}: {
  params: { id: string };
}) {
  const [boutique,   setBoutique]   = useState<any>(null);
  const [produits,   setProduits]   = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actionLoad, setActionLoad] = useState(false);
  const [succes,     setSucces]     = useState('');

  // -- Chargement --
  const charger = async () => {
    setChargement(true);
    try {
      // Récupère la boutique directement par ID
      const boutiqueRes  = await authFetch(`${API}/admin/shops/${params.id}`);
      const boutiqueData = await boutiqueRes.json();

      if (boutiqueData.success) {
        setBoutique(boutiqueData.data);

        // Produits de la boutique
        const prodRes  = await authFetch(
          `${API}/products/shop/${boutiqueData.data._id}?limit=5`
        );
        const prodData = await prodRes.json();
        if (prodData.success) setProduits(prodData.data);
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [params.id]);

  // -- Actions --
  const action = async (url: string, body?: object) => {
    setActionLoad(true);
    setSucces('');
    try {
      await authFetch(url, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    body ? JSON.stringify(body) : undefined,
      });
      setSucces('Action effectuée avec succès');
      charger();
      setTimeout(() => setSucces(''), 3000);
    } finally {
      setActionLoad(false);
    }
  };

  const verifier = () =>
    action(`${API}/admin/shops/${params.id}/verify`);

  const modifierAbonnement = (status: string, planType?: string) =>
    action(`${API}/admin/shops/${params.id}/subscription`, {
      status,
      ...(planType && { planType }),
    });

  // ---------------------------------------------------------------------------
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!boutique) {
    return (
      <div className="text-center py-20 space-y-3">
        <AlertTriangle size={40} className="text-red-400 mx-auto" />
        <p className="text-white font-semibold">Boutique introuvable</p>
        <Link href="/admin/marchands" className="text-primary text-sm hover:underline">
          ← Retour aux marchands
        </Link>
      </div>
    );
  }

  const statut = STATUTS[boutique.subscriptionStatus as keyof typeof STATUTS];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link href="/admin/marchands"
              className="p-2 rounded-xl border border-border text-muted
                         hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-white text-xl font-bold">{boutique.name}</h1>
            {boutique.isVerified && (
              <CheckCircle size={18} className="text-primary" />
            )}
          </div>
          <p className="text-muted text-sm">{boutique.slug}.shopeasyci.ci</p>
        </div>
        <Link href={`/${boutique.slug}`} target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border
                         border-border text-muted hover:text-white text-sm
                         transition-colors">
          <ExternalLink size={15} />
          Voir la boutique
        </Link>
      </div>

      {/* Notification succès */}
      {succes && (
        <div className="bg-primary/10 border border-primary/30 text-primary
                        px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle size={15} />
          {succes}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Colonne gauche ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Infos boutique */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-semibold">Informations boutique</h2>

            <div className="flex items-center gap-4">
              {boutique.logo
                ? <Image src={boutique.logo} alt={boutique.name}
                         width={64} height={64}
                         className="rounded-2xl object-cover flex-shrink-0" />
                : <div className="w-16 h-16 rounded-2xl bg-elevated flex items-center
                                  justify-center text-2xl flex-shrink-0">
              
                  </div>
              }
              <div className="space-y-1">
                <p className="text-white font-semibold">{boutique.name}</p>
                <p className="text-muted text-sm">{boutique.slug}</p>
                {boutique.about?.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <MapPin size={11} className="text-primary" />
                    {boutique.about.location}
                  </div>
                )}
                {boutique.whatsapp && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Phone size={11} className="text-primary" />
                    {boutique.whatsapp}
                  </div>
                )}
              </div>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Produits',  valeur: produits.length,                          icone: <Package     size={16} /> },
                { label: 'Commandes', valeur: 0,                                         icone: <ShoppingBag size={16} /> },
                { label: 'Thème',     valeur: boutique.selectedTheme ?? 'vitrine-moderne', icone: <span></span>         },
              ].map(s => (
                <div key={s.label}
                     className="bg-elevated rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-2 text-muted mb-1">
                    {s.icone}
                    <span className="text-xs">{s.label}</span>
                  </div>
                  <p className="text-white font-bold text-sm truncate">{s.valeur}</p>
                </div>
              ))}
            </div>

            {boutique.about?.description && (
              <div className="p-3 bg-elevated rounded-xl border border-border">
                <p className="text-muted text-xs leading-relaxed">
                  {boutique.about.description}
                </p>
              </div>
            )}
          </div>

          {/* Infos propriétaire */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold">Propriétaire</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-elevated flex items-center
                              justify-center text-lg flex-shrink-0">
                👤
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium">{boutique.ownerId?.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Mail size={11} className="text-primary" />
                  {boutique.ownerId?.email}
                </div>
                {boutique.ownerId?.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Phone size={11} className="text-primary" />
                    {boutique.ownerId.phone}
                  </div>
                )}
              </div>
            </div>
            <p className="text-muted text-xs">
              Inscrit le {formatDate(boutique.createdAt)}
            </p>
          </div>

          {/* Derniers produits */}
          {produits.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold">
                Produits ({produits.length})
              </h2>
              <div className="space-y-2">
                {produits.map(p => (
                  <div key={p._id}
                       className="flex items-center gap-3 p-3 bg-elevated
                                  rounded-xl border border-border">
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center
                                    justify-center flex-shrink-0 relative overflow-hidden">
                      {p.images?.[0]
                        ? <Image src={p.images[0]} alt={p.name} fill
                                 className="object-cover" />
                        : <span></span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.name}</p>
                      <p className="text-muted text-xs">{formatFcfa(p.price)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border
                                     ${p.status === 'active'
                                       ? 'text-primary bg-primary/10 border-primary/30'
                                       : 'text-muted bg-elevated border-border'}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Colonne droite — Abonnement ── */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-semibold">Abonnement</h2>

            {/* Plan */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border
                            ${boutique.planType === 'premium'
                              ? 'bg-amber-500/5 border-amber-500/20'
                              : 'bg-elevated border-border'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                              ${boutique.planType === 'premium'
                                ? 'bg-amber-500/20' : 'bg-primary/10'}`}>
                {boutique.planType === 'premium'
                  ? <Crown size={20} className="text-amber-400" />
                  : <Zap   size={20} className="text-primary"  />
                }
              </div>
              <div>
                <p className="text-white font-bold capitalize">{boutique.planType}</p>
                <p className="text-muted text-xs">
                  {boutique.planType === 'premium' ? '30 000 FCFA/mois' : '15 000 FCFA/mois'}
                </p>
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted text-sm">Statut</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                                 border ${statut.classe}`}>
                  {statut.label}
                </span>
              </div>

              {(boutique.subscriptionExpiresAt || boutique.trialEndsAt) && (
                <div className="flex items-center justify-between">
                  <span className="text-muted text-sm flex items-center gap-1">
                    <Clock size={12} />
                    {boutique.subscriptionStatus === 'trial' ? 'Fin essai' : 'Expiration'}
                  </span>
                  <span className="text-white text-sm">
                    {formatDate(boutique.subscriptionExpiresAt ?? boutique.trialEndsAt)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted text-sm flex items-center gap-1">
                  <CheckCircle size={12} />
                  Vérifiée
                </span>
                <span className={`text-sm font-medium
                                 ${boutique.isVerified ? 'text-primary' : 'text-muted'}`}>
                  {boutique.isVerified ? 'Oui ✓' : 'Non'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {!boutique.isVerified && (
                <button onClick={verifier} disabled={actionLoad}
                        className="w-full py-2.5 rounded-xl bg-primary/10 text-primary
                                   hover:bg-primary/20 text-sm font-semibold transition-colors
                                   disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoad
                    ? <Loader2 size={15} className="animate-spin" />
                    : <CheckCircle size={15} />
                  }
                  Vérifier la boutique
                </button>
              )}

              {boutique.subscriptionStatus !== 'active' && (
                <button onClick={() => modifierAbonnement('active')} disabled={actionLoad}
                        className="w-full py-2.5 rounded-xl bg-primary text-white
                                   hover:bg-primary-hover text-sm font-semibold
                                   transition-colors disabled:opacity-50">
                  Activer l'abonnement
                </button>
              )}

              {boutique.planType === 'basic' && (
                <button onClick={() => modifierAbonnement('active', 'premium')}
                        disabled={actionLoad}
                        className="w-full py-2.5 rounded-xl bg-amber-500/10 text-amber-400
                                   hover:bg-amber-500/20 text-sm font-semibold transition-colors
                                   disabled:opacity-50">
                  Passer en Premium
                </button>
              )}

              {boutique.planType === 'premium' && (
                <button onClick={() => modifierAbonnement('active', 'basic')}
                        disabled={actionLoad}
                        className="w-full py-2.5 rounded-xl bg-elevated text-muted
                                   hover:text-white border border-border text-sm
                                   font-semibold transition-colors disabled:opacity-50">
                  Rétrograder en Basic
                </button>
              )}

              {boutique.subscriptionStatus === 'active' && (
                <button onClick={() => modifierAbonnement('suspended')} disabled={actionLoad}
                        className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400
                                   hover:bg-red-500/20 text-sm font-semibold transition-colors
                                   disabled:opacity-50">
                  Suspendre
                </button>
              )}

              {boutique.subscriptionStatus === 'suspended' && (
                <button onClick={() => modifierAbonnement('active')} disabled={actionLoad}
                        className="w-full py-2.5 rounded-xl bg-primary text-white
                                   hover:bg-primary-hover text-sm font-semibold
                                   transition-colors disabled:opacity-50">
                  Réactiver
                </button>
              )}
            </div>
          </div>

          <button onClick={charger}
                  className="w-full flex items-center justify-center gap-2 py-2.5
                             rounded-xl border border-border text-muted hover:text-white
                             text-sm transition-colors">
            <RefreshCw size={15} />
            Actualiser
          </button>
        </div>
      </div>
    </div>
  );
}