'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft, Trash2, Plus, Minus,
  ShoppingCart, MessageCircle, Tag, X, Check,
  Shield, Truck, RotateCcw, Zap,
} from 'lucide-react';
import { getThemeConfig } from '../theme.config';
import type { ShopPublic } from '../types';

interface ArticlePanier {
  cle:      string;
  produitId: string;
  nom:      string;
  prix:     number;
  image:    string | null;
  variantes: Record<string, string>;
  quantite: number;
}

interface Props { shop: ShopPublic; }

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function PanierClient({ shop }: Props) {
  const t = getThemeConfig(shop.selectedTheme);

  const [articles,        setArticles]        = useState<ArticlePanier[]>([]);
  const [codePromo,       setCodePromo]       = useState('');
  const [promoApplique,   setPromoApplique]   = useState<{
    code: string; type: string; value: number; discount: number;
  } | null>(null);
  const [promoLoading,    setPromoLoading]    = useState(false);
  const [promoErreur,     setPromoErreur]     = useState('');
  const [commandeEnvoyee, setCommandeEnvoyee] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem(`panier_${shop.slug}`);
    if (data) setArticles(JSON.parse(data));
  }, [shop.slug]);

  const sauvegarder = (liste: ArticlePanier[]) => {
    setArticles(liste);
    localStorage.setItem(`panier_${shop.slug}`, JSON.stringify(liste));
  };

  const modifierQuantite = (cle: string, delta: number) => {
    sauvegarder(articles.map(a =>
      a.cle !== cle ? a : { ...a, quantite: Math.max(1, a.quantite + delta) }
    ));
  };

  const supprimer = (cle: string) => {
    sauvegarder(articles.filter(a => a.cle !== cle));
    if (promoApplique) setPromoApplique(null);
  };

  const vider = () => { sauvegarder([]); setPromoApplique(null); };

  const sousTotal  = articles.reduce((s, a) => s + a.prix * a.quantite, 0);
  const reduction  = promoApplique?.discount ?? 0;
  const total      = Math.max(0, sousTotal - reduction);
  const nbArticles = articles.reduce((s, a) => s + a.quantite, 0);

  const allerALaCommande = () => {
    if (promoApplique) {
      localStorage.setItem(`promo_${shop.slug}`, JSON.stringify(promoApplique));
    } else {
      localStorage.removeItem(`promo_${shop.slug}`);
    }
  };

  const appliquerPromo = async () => {
    if (!codePromo.trim()) return;
    setPromoLoading(true);
    setPromoErreur('');
    try {
      const API = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API}/promos/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          code:     codePromo.trim().toUpperCase(),
          shopId:   shop._id,
          subtotal: sousTotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPromoApplique(data.data);
      setCodePromo('');
    } catch (err: any) {
      setPromoErreur(err.message);
    } finally {
      setPromoLoading(false);
    }
  };

  const commanderWhatsApp = () => {
    if (articles.length === 0) return;
    const lignes = articles.map(a => {
      const variantesTexte = Object.entries(a.variantes).map(([k, v]) => `${k}: ${v}`).join(', ');
      return `- *${a.nom}*${variantesTexte ? ` (${variantesTexte})` : ''} x${a.quantite} - ${formatFcfa(a.prix * a.quantite)}`;
    }).join('\n');
    const message = encodeURIComponent(
      `Bonjour, voici ma commande :\n\n${lignes}\n\n` +
      (promoApplique ? `Code promo : ${promoApplique.code} (-${formatFcfa(reduction)})\n` : '') +
      `*Total : ${formatFcfa(total)}*\n\nMerci !`
    );
    window.open(`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
    setCommandeEnvoyee(true);
    setTimeout(() => setCommandeEnvoyee(false), 5000);
  };

  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/catalogue"
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70"
            style={{ color: t.muted }}>
            <ChevronLeft size={18} />
            Ajouter d'autres produits
          </Link>
          {articles.length > 0 && (
            <button onClick={vider} className="text-xs hover:underline" style={{ color: t.muted }}>
              Vider le panier
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* En-tete */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: t.text }}>Votre commande</h1>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>
            {nbArticles} article{nbArticles > 1 ? 's' : ''} —{' '}
            <span style={{ color: t.accent }}>{shop.name}</span>
          </p>
        </div>

        {/* ── PANIER VIDE ── */}
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: t.elevated }}>
              <ShoppingCart size={36} style={{ color: t.muted }} />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-lg" style={{ color: t.text }}>
                Votre panier est vide
              </p>
              <p className="text-sm" style={{ color: t.muted }}>
                Parcourez notre catalogue et ajoutez vos produits preferes
              </p>
            </div>
            <Link href="/catalogue"
              className="px-6 py-3 rounded-xl font-semibold text-sm transition-colors hover:opacity-90"
              style={{ backgroundColor: t.accent, color: '#fff' }}>
              Decouvrir notre selection
            </Link>
          </div>
        ) : (
          <>
            {/* ── LISTE ARTICLES ── */}
            <div className="space-y-3">
              {articles.map(article => (
                <div key={article.cle} className="flex gap-3 p-3 sm:p-4 rounded-2xl border"
                  style={{ backgroundColor: t.surface, borderColor: t.border }}>

                  {/* Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 relative"
                    style={{ backgroundColor: t.elevated }}>
                    {article.image
                      ? <Image src={article.image} alt={article.nom} fill className="object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">...</div>
                    }
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-sm leading-tight" style={{ color: t.text }}>
                      {article.nom}
                    </p>

                    {/* Variantes */}
                    {Object.entries(article.variantes).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(article.variantes).map(([k, v]) => (
                          <span key={k} className="text-xs px-2 py-0.5 rounded-full border"
                            style={{ borderColor: t.border, color: t.muted }}>
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs" style={{ color: t.muted }}>
                      {formatFcfa(article.prix)} / unite
                    </p>

                    {/* Quantite + prix + supprimer */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => modifierQuantite(article.cle, -1)}
                          className="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: t.elevated, borderColor: t.border }}>
                          <Minus size={12} style={{ color: t.text }} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold" style={{ color: t.text }}>
                          {article.quantite}
                        </span>
                        <button onClick={() => modifierQuantite(article.cle, +1)}
                          className="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: t.elevated, borderColor: t.border }}>
                          <Plus size={12} style={{ color: t.text }} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-sm whitespace-nowrap" style={{ color: t.accent }}>
                          {formatFcfa(article.prix * article.quantite)}
                        </span>
                        <button onClick={() => supprimer(article.cle)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors flex-shrink-0">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── CODE PROMO ── */}
            {shop.planType === 'premium' && (
              <div className="rounded-2xl border p-4 space-y-3"
                style={{ backgroundColor: t.surface, borderColor: t.border }}>
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: t.text }}>
                  <Tag size={16} style={{ color: t.accent }} />
                  Vous avez un code promo ?
                </p>

                {promoApplique ? (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl border"
                    style={{ backgroundColor: `${t.accent}10`, borderColor: `${t.accent}30` }}>
                    <div className="flex items-center gap-2">
                      <Check size={16} style={{ color: t.accent }} />
                      <span className="font-mono font-bold text-sm" style={{ color: t.accent }}>
                        {promoApplique.code}
                      </span>
                      <span className="text-xs" style={{ color: t.muted }}>
                        -{formatFcfa(reduction)} economises
                      </span>
                    </div>
                    <button onClick={() => setPromoApplique(null)}>
                      <X size={16} style={{ color: t.muted }} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={codePromo}
                      onChange={e => { setCodePromo(e.target.value.toUpperCase()); setPromoErreur(''); }}
                      placeholder="Entrez votre code"
                      className="flex-1 min-w-0 bg-transparent border rounded-xl px-3 py-2.5 text-sm outline-none font-mono tracking-widest uppercase"
                      style={{ borderColor: t.border, color: t.text }}
                      onKeyDown={e => e.key === 'Enter' && appliquerPromo()} />
                    <button onClick={appliquerPromo}
                      disabled={promoLoading || !codePromo.trim()}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
                      style={{ backgroundColor: t.accent, color: '#fff' }}>
                      {promoLoading ? '...' : 'Appliquer'}
                    </button>
                  </div>
                )}

                {promoErreur && <p className="text-xs text-red-400">{promoErreur}</p>}
              </div>
            )}

            {/* ── RECAPITULATIF ── */}
            <div className="rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <h2 className="font-semibold" style={{ color: t.text }}>Recapitulatif</h2>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: t.muted }}>
                    Sous-total ({nbArticles} article{nbArticles > 1 ? 's' : ''})
                  </span>
                  <span className="whitespace-nowrap" style={{ color: t.text }}>
                    {formatFcfa(sousTotal)}
                  </span>
                </div>

                {reduction > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: t.muted }}>Code promo ({promoApplique?.code})</span>
                    <span className="text-green-400 font-medium whitespace-nowrap">
                      -{formatFcfa(reduction)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg pt-3 border-t"
                  style={{ borderColor: t.border }}>
                  <span style={{ color: t.text }}>Total a payer</span>
                  <span className="whitespace-nowrap" style={{ color: t.accent }}>
                    {formatFcfa(total)}
                  </span>
                </div>

                {/* Economie totale si promo */}
                {reduction > 0 && (
                  <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium"
                    style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
                    <Zap size={12} />
                    Vous economisez {formatFcfa(reduction)} sur cette commande
                  </div>
                )}
              </div>

              {/* ── BLOC REASSURANCE ── */}
              <div className="grid grid-cols-3 gap-2 py-2">
                {[
                  { icone: <Shield    size={14} />, label: 'Vous payez a la reception' },
                  { icone: <Truck     size={14} />, label: 'Livraison a domicile'      },
                  { icone: <RotateCcw size={14} />, label: 'Retour sans questions'     },
                ].map((g, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl"
                    style={{ backgroundColor: t.elevated }}>
                    <span style={{ color: t.accent }}>{g.icone}</span>
                    <p className="text-xs leading-tight" style={{ color: t.muted }}>{g.label}</p>
                  </div>
                ))}
              </div>

              {/* Bouton confirmer commande */}
              <Link href="/commande"
                onClick={allerALaCommande}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 text-sm sm:text-base"
                style={{
                  backgroundColor: t.accent,
                  color:           '#fff',
                  boxShadow:       `0 4px 20px ${t.accent}50`,
                }}>
                <ShoppingCart size={18} />
                <span className="whitespace-nowrap">
                  Confirmer ma commande — {formatFcfa(total)}
                </span>
              </Link>

              {/* Bouton WhatsApp */}
              {shop.whatsapp && (
                <button onClick={commanderWhatsApp}
                  className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 text-sm sm:text-base"
                  style={{ backgroundColor: '#25D366', color: '#fff' }}>
                  {commandeEnvoyee
                    ? <><Check size={18} /> Commande envoyee avec succes !</>
                    : <><MessageCircle size={18} /><span className="whitespace-nowrap">Commander maintenant via WhatsApp</span></>
                  }
                </button>
              )}

              {/* Message reassurance final */}
              <p className="text-xs text-center" style={{ color: t.muted }}>
                Paiement uniquement a la livraison — vous ne payez rien maintenant
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}