'use client';

import { useState, useEffect } from 'react';
import Image                   from 'next/image';
import Link                    from 'next/link';
import { useRouter }           from 'next/navigation';
import {
  ChevronLeft, User, Phone, MapPin, Mail,
  Package, Check, Loader2, ShoppingCart, Tag,
  Shield, Truck, RotateCcw, CheckCircle,
} from 'lucide-react';
import { getThemeConfig } from '../theme.config';
import type { ShopPublic } from '../types';

interface ArticlePanier {
  cle:       string;
  produitId: string;
  nom:       string;
  prix:      number;
  image:     string | null;
  variantes: Record<string, string>;
  quantite:  number;
}

interface Props { shop: ShopPublic; }

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const CLE_FORM = 'shopeasy_form_draft';

// ── Barre de progression ──────────────────────────────────────────────────────
function BarreProgression({ etape }: { etape: number }) {
  const etapes = ['Panier', 'Livraison', 'Confirmation'];
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-xs mx-auto">
      {etapes.map((label, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                backgroundColor: i < etape ? '#10b981' : i === etape ? '#06C167' : '#2a2a2a',
                color: i <= etape ? '#fff' : '#888',
              }}>
              {i < etape ? <Check size={13} /> : i + 1}
            </div>
            <span className="text-xs mt-1 whitespace-nowrap"
              style={{ color: i <= etape ? '#06C167' : '#888' }}>
              {label}
            </span>
          </div>
          {i < etapes.length - 1 && (
            <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full"
              style={{ backgroundColor: i < etape ? '#10b981' : '#2a2a2a' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Indicateur de champ valide ────────────────────────────────────────────────
function ChampValide({ valide }: { valide: boolean }) {
  if (!valide) return null;
  return <CheckCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400" />;
}

export default function CommandeClient({ shop }: Props) {
  const t      = getThemeConfig(shop.selectedTheme);
  const router = useRouter();

  const [articles,      setArticles]      = useState<ArticlePanier[]>([]);
  const [promoApplique, setPromoApplique] = useState<{
    code: string; type: string; value: number; discount: number;
  } | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [erreur,        setErreur]        = useState('');
  const [commandeCreee, setCommandeCreee] = useState<{
    _id: string; orderNumber: string;
  } | null>(null);

  // ── Formulaire avec valeurs sauvegardées ──────────────────────────────────
  const [form, setForm] = useState({
    nomClient:     '',
    telephone:     '+225 ',
    email:         '',
    adresse:       '',
    ville:         '',
    modeLivraison: 'livraison' as 'livraison' | 'retrait',
    notes:         '',
  });

  // ── Chargement initial — panier + promo + formulaire sauvegarde ───────────
  useEffect(() => {
    const data = localStorage.getItem(`panier_${shop.slug}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.length === 0) router.push('/panier');
      else setArticles(parsed);
    } else {
      router.push('/panier');
    }

    const promoData = localStorage.getItem(`promo_${shop.slug}`);
    if (promoData) {
      try { setPromoApplique(JSON.parse(promoData)); } catch {}
    }

    // Restaurer le formulaire si l'utilisateur revient en arriere
    const draft = localStorage.getItem(CLE_FORM);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setForm(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, [shop.slug]);

  // ── Sauvegarde automatique du formulaire a chaque modification ────────────
  useEffect(() => {
    localStorage.setItem(CLE_FORM, JSON.stringify(form));
  }, [form]);

  const sousTotal  = articles.reduce((s, a) => s + a.prix * a.quantite, 0);
  const reduction  = promoApplique?.discount ?? 0;
  const total      = Math.max(0, sousTotal - reduction);
  const nbArticles = articles.reduce((s, a) => s + a.quantite, 0);

  // ── Validation en temps réel par champ ───────────────────────────────────
  const champValide = {
    nomClient:  form.nomClient.trim().length >= 2,
    telephone:  form.telephone.replace(/\D/g, '').length >= 8,
    email:      form.email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    adresse:    form.adresse.trim().length >= 5,
    ville:      form.ville.trim().length >= 2,
  };

  const valider = () => {
    if (!champValide.nomClient)  return 'Le nom est obligatoire (minimum 2 caracteres)';
    if (!champValide.telephone)  return 'Le telephone est invalide';
    if (!champValide.email)      return 'L\'adresse email est invalide';
    if (form.modeLivraison === 'livraison' && !champValide.adresse)
      return "L'adresse de livraison est obligatoire";
    return null;
  };

  const soumettre = async () => {
    const err = valider();
    if (err) { setErreur(err); return; }
    setLoading(true);
    setErreur('');
    try {
      const API   = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem('token');
      const items = articles.map(a => ({
        productId: a.produitId,
        name:      a.nom,
        price:     a.prix,
        quantity:  a.quantite,
        variants:  a.variantes,
        image:     a.image,
      }));
      const res = await fetch(`${API}/orders`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          shopId:        shop._id,
          nomClient:     form.nomClient.trim(),
          telephone:     form.telephone.trim(),
          adresse:       form.adresse.trim(),
          ville:         form.ville.trim(),
          modeLivraison: form.modeLivraison,
          notes:         form.notes.trim(),
          items,
          subtotal:      sousTotal,
          discount:      reduction,
          promoCode:     promoApplique?.code,
          total,
          customer: {
            name:    form.nomClient.trim(),
            phone:   form.telephone.trim(),
            email:   form.email.trim() || undefined,
            address: form.adresse.trim(),
            city:    form.ville.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur serveur');

      // Nettoyer panier + promo + brouillon formulaire
      localStorage.removeItem(`panier_${shop.slug}`);
      localStorage.removeItem(`promo_${shop.slug}`);
      localStorage.removeItem(CLE_FORM);
      window.dispatchEvent(new Event('panier-updated'));
      setCommandeCreee({ _id: data.data._id, orderNumber: data.data.orderNumber });
    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── MODAL CONFIRMATION ── */}
      {commandeCreee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.80)' }}>
          <div className="w-full max-w-sm rounded-3xl p-8 space-y-5 text-center"
            style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>

            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: `${t.accent}20` }}>
              <Check size={40} style={{ color: t.accent }} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold" style={{ color: t.text }}>
                Commande confirmee !
              </h2>
              <p className="text-sm" style={{ color: t.muted }}>
                Merci pour votre commande chez{' '}
                <span style={{ color: t.accent }}>{shop.name}</span>.
                Vous serez contacte pour la livraison.
              </p>
            </div>

            <div className="px-4 py-3 rounded-2xl border"
              style={{ backgroundColor: `${t.accent}10`, borderColor: `${t.accent}30` }}>
              <p className="text-xs mb-1" style={{ color: t.muted }}>Numero de commande</p>
              <p className="font-mono font-bold text-lg" style={{ color: t.accent }}>
                {commandeCreee.orderNumber}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium"
              style={{ backgroundColor: '#10b98115', color: '#10b981' }}>
              <Shield size={13} />
              Vous payez uniquement a la livraison
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => router.push(`/commande/confirmation?id=${commandeCreee._id}`)}
                className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: t.accent, color: '#fff' }}>
                Voir le detail de ma commande
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 rounded-2xl font-semibold text-sm border transition-colors"
                style={{ borderColor: t.border, color: t.muted }}>
                Retour a la boutique
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <nav style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/panier"
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70"
            style={{ color: t.muted }}>
            <ChevronLeft size={18} />
            Retour au panier
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        <BarreProgression etape={1} />

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold" style={{ color: t.text }}>Derniere etape</h1>
          <p className="text-sm" style={{ color: t.muted }}>
            Vous y etes presque — {nbArticles} article{nbArticles > 1 ? 's' : ''} — {formatFcfa(total)}
          </p>
        </div>

        {/* Bloc reassurance */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icone: <Shield    size={15} />, label: 'Vous payez a la reception' },
            { icone: <Truck     size={15} />, label: 'Livraison a domicile'       },
            { icone: <RotateCcw size={15} />, label: 'Retour sans questions'      },
          ].map((g, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl border"
              style={{ backgroundColor: t.surface, borderColor: t.border }}>
              <span style={{ color: t.accent }}>{g.icone}</span>
              <p className="text-xs leading-tight" style={{ color: t.muted }}>{g.label}</p>
            </div>
          ))}
        </div>

        {/* Recap articles */}
        <div className="rounded-2xl border p-4 space-y-3"
          style={{ backgroundColor: t.surface, borderColor: t.border }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: t.text }}>
            <ShoppingCart size={16} style={{ color: t.accent }} />
            Votre commande ({nbArticles} article{nbArticles > 1 ? 's' : ''})
          </h2>
          {articles.map(a => (
            <div key={a.cle} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative"
                style={{ backgroundColor: t.elevated }}>
                {a.image
                  ? <Image src={a.image} alt={a.nom} fill className="object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Package size={18} style={{ color: t.muted }} />
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: t.text }}>{a.nom}</p>
                {Object.entries(a.variantes).length > 0 && (
                  <p className="text-xs" style={{ color: t.muted }}>
                    {Object.entries(a.variantes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs" style={{ color: t.muted }}>x{a.quantite}</p>
                <p className="text-sm font-bold" style={{ color: t.accent }}>
                  {formatFcfa(a.prix * a.quantite)}
                </p>
              </div>
            </div>
          ))}

          {reduction > 0 && (
            <div className="flex items-center justify-between pt-2 border-t text-sm"
              style={{ borderColor: t.border }}>
              <span className="flex items-center gap-1.5" style={{ color: t.muted }}>
                <Tag size={13} style={{ color: t.accent }} />
                Reduction ({promoApplique?.code})
              </span>
              <span className="text-green-400 font-semibold">-{formatFcfa(reduction)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold pt-3 border-t text-sm"
            style={{ borderColor: t.border }}>
            <span style={{ color: t.text }}>Total a payer</span>
            <span style={{ color: t.accent }}>{formatFcfa(total)}</span>
          </div>
        </div>

        {/* ── FORMULAIRE ── */}
        <div className="rounded-2xl border p-5 space-y-5"
          style={{ backgroundColor: t.surface, borderColor: t.border }}>
          <h2 className="font-semibold flex items-center gap-2" style={{ color: t.text }}>
            <User size={18} style={{ color: t.accent }} />
            Vos informations de livraison
          </h2>

          {/* Nom */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: t.muted }}>Nom complet *</label>
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
              <input
                value={form.nomClient}
                onChange={e => setForm(p => ({ ...p, nomClient: e.target.value }))}
                placeholder="Aminata Kone"
                autoComplete="name"
                className="w-full border rounded-xl pl-10 pr-10 py-3 text-sm outline-none"
                style={{
                  backgroundColor: t.elevated,
                  borderColor: champValide.nomClient ? '#10b981' : t.border,
                  color: t.text,
                }} />
              <ChampValide valide={champValide.nomClient} />
            </div>
          </div>

          {/* Telephone — pre-rempli avec +225 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: t.muted }}>Telephone *</label>
            <div className="relative">
              <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
              <input
                value={form.telephone}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                onChange={e => {
                  let val = e.target.value;
                  // Toujours garder le prefixe +225
                  if (!val.startsWith('+225')) val = '+225 ';
                  setForm(p => ({ ...p, telephone: val }));
                }}
                placeholder="+225 07 00 00 00 00"
                className="w-full border rounded-xl pl-10 pr-10 py-3 text-sm outline-none"
                style={{
                  backgroundColor: t.elevated,
                  borderColor: champValide.telephone ? '#10b981' : t.border,
                  color: t.text,
                }} />
              <ChampValide valide={champValide.telephone} />
            </div>
            <p className="text-xs" style={{ color: t.muted }}>
              Format : +225 07 XX XX XX XX
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: t.muted }}>
              Email — pour recevoir la confirmation (optionnel)
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
              <input
                value={form.email}
                type="email"
                inputMode="email"
                autoComplete="email"
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="votre@email.com"
                className="w-full border rounded-xl pl-10 pr-10 py-3 text-sm outline-none"
                style={{
                  backgroundColor: t.elevated,
                  borderColor: form.email && champValide.email ? '#10b981' : t.border,
                  color: t.text,
                }} />
              <ChampValide valide={!!form.email && champValide.email} />
            </div>
          </div>

          {/* Mode de recuperation */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: t.muted }}>
              Mode de recuperation *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { val: 'livraison', label: 'Livraison', desc: 'A domicile'  },
                { val: 'retrait',   label: 'Retrait',   desc: 'En boutique' },
              ] as const).map(opt => (
                <button key={opt.val}
                  onClick={() => setForm(p => ({ ...p, modeLivraison: opt.val }))}
                  className="p-3 rounded-xl border text-left transition-all"
                  style={{
                    backgroundColor: form.modeLivraison === opt.val ? `${t.accent}15` : t.elevated,
                    borderColor:     form.modeLivraison === opt.val ? t.accent : t.border,
                  }}>
                  <p className="font-semibold text-sm" style={{ color: t.text }}>{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: t.muted }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Adresse */}
          {form.modeLivraison === 'livraison' && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: t.muted }}>Adresse *</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
                  <input
                    value={form.adresse}
                    autoComplete="street-address"
                    onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))}
                    placeholder="Rue, quartier, immeuble..."
                    className="w-full border rounded-xl pl-10 pr-10 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: t.elevated,
                      borderColor: champValide.adresse ? '#10b981' : t.border,
                      color: t.text,
                    }} />
                  <ChampValide valide={champValide.adresse} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: t.muted }}>Ville</label>
                <div className="relative">
                  <input
                    value={form.ville}
                    autoComplete="address-level2"
                    onChange={e => setForm(p => ({ ...p, ville: e.target.value }))}
                    placeholder="Abidjan, Bouake..."
                    className="w-full border rounded-xl px-4 pr-10 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: t.elevated,
                      borderColor: champValide.ville ? '#10b981' : t.border,
                      color: t.text,
                    }} />
                  <ChampValide valide={champValide.ville} />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: t.muted }}>
              Instructions speciales (optionnel)
            </label>
            <textarea value={form.notes} rows={3}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Couleur preferee, taille exacte, heure de livraison..."
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ backgroundColor: t.elevated, borderColor: t.border, color: t.text }} />
          </div>
        </div>

        {/* Erreur */}
        {erreur && (
          <p className="px-4 py-3 rounded-xl text-sm border"
            style={{ backgroundColor: '#ef444420', borderColor: '#ef4444', color: '#ef4444' }}>
            {erreur}
          </p>
        )}

        {/* ── BOUTON FINAL ── */}
        <div className="space-y-3">
          <button onClick={soumettre} disabled={loading || articles.length === 0}
            className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              backgroundColor: t.accent,
              color:           '#fff',
              boxShadow:       `0 4px 24px ${t.accent}50`,
            }}>
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Envoi en cours...</>
              : <><Check size={18} /> Confirmer ma commande — {formatFcfa(total)}</>
            }
          </button>

          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: t.muted }}>
            <Shield size={12} style={{ color: t.accent }} />
            <span>Paiement uniquement a la livraison — vous ne payez rien maintenant</span>
          </div>

          <p className="text-xs text-center" style={{ color: t.muted }}>
            En confirmant, vous acceptez que vos informations soient transmises a{' '}
            <span style={{ color: t.text }}>{shop.name}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}