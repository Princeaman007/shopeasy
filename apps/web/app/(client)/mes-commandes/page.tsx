'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useClientOrders, StatutCommande } from '@/hooks/useClientOrders';
import StatutBadge from '@/components/client/StatutBadge';

const ETAPES: StatutCommande[] = ['new', 'confirmed', 'shipping', 'delivered'];
const LABELS_ETAPES = ['Reçue', 'Confirmée', 'En route', 'Livrée'];
const INDEX_ETAPE: Record<StatutCommande, number> = {
  new: 0, confirmed: 1, shipping: 2, delivered: 3, cancelled: -1,
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

export default function MesCommandesPage() {
  const { commandes, chargement, erreur } = useClientOrders();
  const [ouvert, setOuvert] = useState<string | null>(null);

  if (chargement) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Accueil
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShoppingBag size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Mes commandes</h1>
              <p className="text-muted text-sm">{commandes.length} commande{commandes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Erreur */}
        {erreur && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">{erreur}</div>
        )}

        {/* Vide */}
        {!erreur && commandes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} className="text-muted" />
            </div>
            <h2 className="text-white font-semibold mb-2">Aucune commande</h2>
            <p className="text-muted text-sm mb-6">Vos prochaines commandes apparaîtront ici</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              Découvrir les boutiques
            </Link>
          </div>
        )}

        {/* Liste */}
        <div className="space-y-4">
          {commandes.map((cmd) => {
            const isOuvert = ouvert === cmd._id;
            const indexActuel = INDEX_ETAPE[cmd.status];
            const annulee = cmd.status === 'cancelled';

            return (
              <div key={cmd._id} className="bg-surface border border-border rounded-2xl overflow-hidden">
                {/* En-tête accordéon */}
                <button
                  onClick={() => setOuvert(isOuvert ? null : cmd._id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-elevated/50 transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    {cmd.items[0]?.image ? (
                      <img src={cmd.items[0].image} alt={cmd.items[0].name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                        <ShoppingBag size={18} className="text-muted" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold text-sm">{cmd.orderNumber}</p>
                      <p className="text-muted text-xs mt-0.5">
                        {fmtDate(cmd.createdAt)}
                        {cmd.items.length > 1 && ` · ${cmd.items.length} articles`}
                      </p>
                      <div className="mt-2">
                        <StatutBadge statut={cmd.status} taille="sm" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-white font-bold text-sm">{fmt(cmd.total)}</span>
                    {isOuvert ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </div>
                </button>

                {/* Détail */}
                {isOuvert && (
                  <div className="border-t border-border p-5 space-y-5">
                    {/* Barre progression */}
                    {!annulee && (
                      <div>
                        <p className="text-muted text-xs uppercase tracking-wide font-medium mb-3">Suivi</p>
                        <div className="flex items-center">
                          {ETAPES.map((etape, i) => {
                            const fait = i <= indexActuel;
                            const enCours = i === indexActuel;
                            const derniere = i === ETAPES.length - 1;
                            return (
                              <div key={etape} className="flex-1 flex flex-col items-center">
                                <div className="w-full flex items-center">
                                  {i > 0 && <div className={`flex-1 h-0.5 ${i <= indexActuel ? 'bg-primary' : 'bg-border'}`} />}
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${fait ? 'bg-primary border-primary' : 'bg-surface border-border'} ${enCours ? 'ring-2 ring-primary/30' : ''}`}>
                                    {fait && (
                                      <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  {!derniere && <div className={`flex-1 h-0.5 ${i < indexActuel ? 'bg-primary' : 'bg-border'}`} />}
                                </div>
                                <p className={`text-xs mt-1.5 text-center ${fait ? 'text-primary font-medium' : 'text-muted'}`}>
                                  {LABELS_ETAPES[i]}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Articles */}
                    <div>
                      <p className="text-muted text-xs uppercase tracking-wide font-medium mb-3">Articles</p>
                      <div className="space-y-3">
                        {cmd.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            {item.image
                              ? <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                              : <div className="w-10 h-10 rounded-lg bg-elevated border border-border flex-shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{item.name}</p>
                              {item.variant && <p className="text-muted text-xs">{item.variant}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-white text-sm font-semibold">{fmt(item.price * item.quantity)}</p>
                              <p className="text-muted text-xs">×{item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Récap prix */}
                    <div className="bg-elevated rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Sous-total</span>
                        <span className="text-white">{fmt(cmd.subtotal)}</span>
                      </div>
                      {cmd.discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">Réduction {cmd.promoCode && `(${cmd.promoCode})`}</span>
                          <span className="text-primary">−{fmt(cmd.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
                        <span className="text-white">Total</span>
                        <span className="text-white">{fmt(cmd.total)}</span>
                      </div>
                    </div>

                    {/* Livraison */}
                    <div>
                      <p className="text-muted text-xs uppercase tracking-wide font-medium mb-2">Livraison</p>
                      <div className="bg-elevated rounded-xl p-4">
                        <p className="text-white text-sm font-medium">{cmd.customer.name}</p>
                        <p className="text-muted text-sm">{cmd.customer.address}, {cmd.customer.city}</p>
                        <p className="text-muted text-sm">{cmd.customer.phone}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}