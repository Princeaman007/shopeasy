'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, Crown, Clock, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
interface Abonnement {
  planType:              'basic' | 'premium';
  subscriptionStatus:    'trial' | 'active' | 'expired' | 'suspended';
  subscriptionExpiresAt: string | null;
  trialEndsAt:           string | null;
  isVerified:            boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

const joursRestants = (date: string): number => {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

function BadgeStatut({ statut }: { statut: Abonnement['subscriptionStatus'] }) {
  const config = {
    trial:     { label: 'Essai gratuit', classe: 'bg-blue-500/10 text-blue-400 border-blue-500/30'       },
    active:    { label: 'Actif',         classe: 'bg-primary/10 text-primary border-primary/30'           },
    expired:   { label: 'Expiré',        classe: 'bg-red-500/10 text-red-400 border-red-500/30'           },
    suspended: { label: 'Suspendu',      classe: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  };
  const { label, classe } = config[statut];
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${classe}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
export default function PageAbonnement() {
  const [abo,        setAbo]        = useState<Abonnement | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API}/shops/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setAbo(data.data);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!abo) {
    return null;
  }

  const dateRef    = abo.subscriptionStatus === 'trial'
    ? abo.trialEndsAt
    : abo.subscriptionExpiresAt;
  const jRestants  = dateRef ? joursRestants(dateRef) : null;
  const estPremium = abo.planType === 'premium';
  const estActif   = abo.subscriptionStatus === 'active' || abo.subscriptionStatus === 'trial';

  const lienWaRenouvellement = "https://wa.me/2250000000000?text=Bonjour, je souhaite renouveler mon abonnement ShopEasy CI";
  const lienWaUpgrade        = "https://wa.me/2250000000000?text=Bonjour, je souhaite passer en Premium sur ShopEasy CI";

  return (
    <div className="max-w-2xl space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-white text-2xl font-bold">Abonnement</h1>
        <p className="text-muted text-sm mt-1">
          Gère ton plan et suis l'état de ton abonnement
        </p>
      </div>

      {/* ── Statut actuel ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Plan actuel</h2>
          <BadgeStatut statut={abo.subscriptionStatus} />
        </div>

        {/* Plan */}
        <div className={`flex items-center gap-4 p-4 rounded-xl border
                        ${estPremium
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : 'bg-elevated border-border'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                           ${estPremium ? 'bg-amber-500/20' : 'bg-primary/10'}`}>
            {estPremium
              ? <Crown size={24} className="text-amber-400" />
              : <Zap   size={24} className="text-primary" />
            }
          </div>
          <div>
            <p className="text-white font-bold text-lg">
              {estPremium ? 'Premium' : 'Basic'}
            </p>
            <p className="text-muted text-sm">
              {estPremium ? '30 000 FCFA / mois' : '15 000 FCFA / mois'}
            </p>
          </div>
          {abo.isVerified && (
            <div className="ml-auto flex items-center gap-1.5 text-primary text-sm">
              <Check size={15} />
              <span>Vérifié</span>
            </div>
          )}
        </div>

        {/* Dates */}
        {dateRef && (
          <div className="space-y-3">
            {jRestants !== null && jRestants <= 30 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">
                    {abo.subscriptionStatus === 'trial' ? "Période d'essai" : 'Abonnement'}
                  </span>
                  <span className={jRestants <= 3 ? 'text-red-400' : 'text-muted'}>
                    {jRestants} jour{jRestants > 1 ? 's' : ''} restant{jRestants > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="h-2 bg-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all
                                ${jRestants <= 3 ? 'bg-red-500' : jRestants <= 7 ? 'bg-orange-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, (jRestants / 30) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-elevated rounded-xl border border-border">
              <div className="flex items-center gap-2 text-muted text-sm">
                <Clock size={15} />
                {abo.subscriptionStatus === 'trial' ? "Fin de l'essai gratuit" : "Expiration abonnement"}
              </div>
              <span className="text-white text-sm font-medium">{formatDate(dateRef)}</span>
            </div>
          </div>
        )}

        {/* Alerte expiration proche */}
        {jRestants !== null && jRestants <= 3 && estActif && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium text-sm">Renouvellement urgent</p>
              <p className="text-muted text-xs mt-0.5">
                Ton abonnement expire dans {jRestants} jour{jRestants > 1 ? 's' : ''}.
                Contacte l'admin pour renouveler et éviter la suspension de ta boutique.
              </p>
            </div>
          </div>
        )}

        {/* Alerte expiré / suspendu */}
        {(abo.subscriptionStatus === 'expired' || abo.subscriptionStatus === 'suspended') && (
          <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <AlertTriangle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-400 font-medium text-sm">
                {abo.subscriptionStatus === 'expired' ? 'Abonnement expiré' : 'Boutique suspendue'}
              </p>
              <p className="text-muted text-xs mt-0.5">
                Ta boutique n'est plus accessible par tes clients.
                Renouvelle ton abonnement pour la réactiver.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Comment renouveler ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <RefreshCw size={18} className="text-primary" />
          Comment renouveler ?
        </h2>

        <div className="space-y-3">
          {[
            {
              num:   '1',
              titre: 'Effectue ton paiement',
              desc:  `Envoie ${estPremium ? '30 000' : '15 000'} FCFA par Mobile Money (Orange Money, Wave, MTN) au numéro de ShopEasy CI.`,
            },
            {
              num:   '2',
              titre: 'Envoie la preuve de paiement',
              desc:  "Prends une capture d'écran de la transaction et envoie-la sur WhatsApp ou par email à l'équipe ShopEasy CI.",
            },
            {
              num:   '3',
              titre: 'Confirmation sous 24h',
              desc:  "L'admin valide ton paiement manuellement et ton abonnement est réactivé.",
            },
          ].map(step => (
            <div key={step.num} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30
                              flex items-center justify-center flex-shrink-0 text-primary text-sm font-bold">
                {step.num}
              </div>
              <div className="pt-1">
                <p className="text-white text-sm font-medium">{step.titre}</p>
                <p className="text-muted text-xs mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bouton WhatsApp renouvellement */}
        <Link
          href={lienWaRenouvellement}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                     bg-[#25D366] hover:bg-[#20c05a] text-white font-semibold
                     transition-colors mt-2"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Contacter ShopEasy CI sur WhatsApp
        </Link>
      </div>

      {/* ── Upgrade vers Premium ── */}
      {!estPremium && (
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5
                        border border-amber-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Crown size={22} className="text-amber-400" />
            <h2 className="text-white font-semibold">Passer en Premium</h2>
          </div>

          <div className="space-y-2">
            {[
              'Produits illimités + photos illimitées',
              '1 vidéo par produit',
              '3 thèmes exclusifs supplémentaires',
              'Analytics avancés',
              'Codes promo',
              'SMS client automatique',
              'Multi-admins',
              'Vitrine sur la landing page ShopEasy CI',
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-amber-400 flex-shrink-0" />
                <span className="text-muted">{feat}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-amber-400 font-bold text-xl">30 000 FCFA</p>
              <p className="text-muted text-xs">par mois</p>
            </div>
            <Link
              href={lienWaUpgrade}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold
                         px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Upgrader →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}