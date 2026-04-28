'use client';

import Image from 'next/image';
import Link  from 'next/link';
import {
  CheckCircle, Package, Phone, MapPin,
  ShoppingBag, MessageCircle, Home,
} from 'lucide-react';
import { getThemeConfig } from '../../theme.config';
import type { ShopPublic } from '../../types';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  shop:     ShopPublic;
  commande: any;
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function ConfirmationClient({ shop, commande }: Props) {
  const t = getThemeConfig(shop.selectedTheme);
  const { isConnecte } = useAuth();

  if (!commande) {
    return (
      <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}
           className="flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-xl font-bold" style={{ color: t.text }}>
            Commande introuvable
          </h1>
          <p className="text-sm" style={{ color: t.muted }}>
            Cette commande n'existe pas ou a expire.
          </p>
          <Link  href="https://www.shopeasyci.store"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: t.accent, color: '#fff' }}>
            <Home size={16} />
            Retour a la boutique
          </Link>
        </div>
      </div>
    );
  }

  const STATUTS: Record<string, { label: string; couleur: string }> = {
    new:       { label: 'Commande recue',  couleur: '#3b82f6' },
    confirmed: { label: 'Confirmee',       couleur: '#f59e0b' },
    shipping:  { label: 'En livraison',    couleur: '#8b5cf6' },
    delivered: { label: 'Livree',          couleur: '#10b981' },
    cancelled: { label: 'Annulee',         couleur: '#ef4444' },
  };

  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">

        {/* En-tete succes */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
               style={{ backgroundColor: `${t.accent}20` }}>
            <CheckCircle size={48} style={{ color: t.accent }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: t.text }}>
              Merci pour ta commande !
            </h1>
            <p className="text-sm mt-1" style={{ color: t.muted }}>
              Ta commande a bien ete enregistree chez{' '}
              <span style={{ color: t.accent }}>{shop.name}</span>
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
               style={{ backgroundColor: `${t.accent}10`, borderColor: `${t.accent}30` }}>
            <Package size={14} style={{ color: t.accent }} />
            <span className="font-mono font-bold text-sm" style={{ color: t.accent }}>
              {commande.orderNumber}
            </span>
          </div>
        </div>

        {/* Statut */}
        <div className="rounded-2xl border p-5 space-y-3"
             style={{ backgroundColor: t.surface, borderColor: t.border }}>
          <h2 className="font-semibold" style={{ color: t.text }}>Statut</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['new', 'confirmed', 'shipping', 'delivered'].map((s, i, arr) => {
              const statuts     = ['new', 'confirmed', 'shipping', 'delivered'];
              const indexActuel = statuts.indexOf(commande.status);
              const indexEtape  = statuts.indexOf(s);
              const actif       = indexEtape <= indexActuel;
              const courant     = s === commande.status;
              return (
                <div key={s} className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                         style={{
                           backgroundColor: actif ? t.accent : t.elevated,
                           color:           actif ? '#fff'   : t.muted,
                           transform:       courant ? 'scale(1.2)' : 'scale(1)',
                         }}>
                      {i + 1}
                    </div>
                    <p className="text-xs whitespace-nowrap"
                       style={{ color: actif ? t.text : t.muted }}>
                      {STATUTS[s]?.label}
                    </p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-8 h-0.5 flex-shrink-0 mb-4"
                         style={{ backgroundColor: indexEtape < indexActuel ? t.accent : t.border }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Details commande */}
        <div className="rounded-2xl border p-5 space-y-4"
             style={{ backgroundColor: t.surface, borderColor: t.border }}>
          <h2 className="font-semibold flex items-center gap-2" style={{ color: t.text }}>
            <ShoppingBag size={18} style={{ color: t.accent }} />
            Detail de la commande
          </h2>
          <div className="space-y-3">
            {commande.items?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative"
                     style={{ backgroundColor: t.elevated }}>
                  {item.image
                    ? <Image src={item.image} alt={item.name} fill className="object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Package size={16} style={{ color: t.muted }} />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: t.text }}>
                    {item.name}
                  </p>
                  {item.variant && (
                    <p className="text-xs" style={{ color: t.muted }}>{item.variant}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs" style={{ color: t.muted }}>x{item.quantity}</p>
                  <p className="text-sm font-bold" style={{ color: t.accent }}>
                    {formatFcfa(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold pt-3 border-t"
               style={{ borderColor: t.border }}>
            <span style={{ color: t.text }}>Total</span>
            <span style={{ color: t.accent }}>{formatFcfa(commande.total)}</span>
          </div>
        </div>

        {/* Infos livraison */}
        <div className="rounded-2xl border p-5 space-y-3"
             style={{ backgroundColor: t.surface, borderColor: t.border }}>
          <h2 className="font-semibold" style={{ color: t.text }}>
            Informations de livraison
          </h2>
          <div className="space-y-2">
            {(commande.nomClient || commande.customer?.name) && (
              <div className="flex items-center gap-2 text-sm" style={{ color: t.muted }}>
                <Package size={14} style={{ color: t.accent }} />
                {commande.nomClient ?? commande.customer?.name}
              </div>
            )}
            {(commande.telephone || commande.customer?.phone) && (
              <div className="flex items-center gap-2 text-sm" style={{ color: t.muted }}>
                <Phone size={14} style={{ color: t.accent }} />
                {commande.telephone ?? commande.customer?.phone}
              </div>
            )}
            {(commande.adresse || commande.customer?.address) && (
              <div className="flex items-center gap-2 text-sm" style={{ color: t.muted }}>
                <MapPin size={14} style={{ color: t.accent }} />
                {commande.adresse ?? commande.customer?.address}
                {(commande.ville ?? commande.customer?.city) &&
                  `, ${commande.ville ?? commande.customer?.city}`}
              </div>
            )}
            {commande.modeLivraison && (
              <div className="flex items-center gap-2 text-sm" style={{ color: t.muted }}>
                <span>
                  {commande.modeLivraison === 'retrait'
                    ? 'Retrait en boutique'
                    : 'Livraison a domicile'}
                </span>
              </div>
            )}
            {commande.notes && (
              <div className="mt-2 p-3 rounded-xl text-xs"
                   style={{ backgroundColor: t.elevated, color: t.muted }}>
                {commande.notes}
              </div>
            )}
            <p className="text-xs" style={{ color: t.muted }}>
              Passee le {formatDate(commande.createdAt)}
            </p>
          </div>
        </div>

        {/* ── Bandeau création compte client — uniquement si invité et non connecté ── */}
        {commande?.customer?.isGuest && !isConnecte && (
          <div className="rounded-2xl border p-5 space-y-3"
               style={{ backgroundColor: `${t.accent}10`, borderColor: `${t.accent}30` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: `${t.accent}20` }}>
                <CheckCircle size={20} style={{ color: t.accent }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: t.text }}>
                  Suivez vos commandes facilement !
                </p>
                <p className="text-xs mt-0.5" style={{ color: t.muted }}>
                  Créez un compte gratuit pour accéder à l'historique de vos commandes.
                </p>
              </div>
            </div>
            <Link
              href={`/inscription-client?email=${commande?.customer?.email ?? ''}`}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 text-sm"
              style={{ backgroundColor: t.accent, color: '#fff' }}>
              Créer mon compte client
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {shop.whatsapp && (
            <Link
              href={`https://wa.me/${shop.whatsapp.replace(/\D/g,'')}?text=Bonjour, j'ai passe la commande ${commande.orderNumber}. Pouvez-vous me donner des nouvelles ?`}
              target="_blank" rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ backgroundColor: '#25D366', color: '#fff' }}>
              <MessageCircle size={18} />
              Suivre ma commande sur WhatsApp
            </Link>
          )}
          <Link  href="https://www.shopeasyci.store"
            className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 border transition-colors"
            style={{ borderColor: t.border, color: t.muted }}>
            <Home size={18} />
            Retour a la boutique
          </Link>
        </div>
      </div>
    </div>
  );
}