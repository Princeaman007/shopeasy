'use client';

import { useState, useEffect } from 'react';
import Image                   from 'next/image';
import Link                    from 'next/link';
import { useRouter }           from 'next/navigation';
import {
  ChevronLeft, User, Phone, MapPin,
  Package, Check, Loader2, ShoppingCart,
} from 'lucide-react';
import { getThemeConfig } from '../theme.config';
import type { ShopPublic } from '../types';

// ---------------------------------------------------------------------------
interface ArticlePanier {
  cle:       string;
  produitId: string;
  nom:       string;
  prix:      number;
  image:     string | null;
  variantes: Record<string, string>;
  quantite:  number;
}

interface Props {
  shop: ShopPublic;
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

// ---------------------------------------------------------------------------
export default function CommandeClient({ shop }: Props) {
  const t      = getThemeConfig(shop.selectedTheme);
  const router = useRouter();

  const [articles,   setArticles]   = useState<ArticlePanier[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [succes,     setSucces]     = useState(false);
  const [erreur,     setErreur]     = useState('');

  const [form, setForm] = useState({
    nomClient:    '',
    telephone:    '',
    adresse:      '',
    ville:        '',
    modeLivraison: 'livraison' as 'livraison' | 'retrait',
    notes:        '',
  });

  // -- Chargement panier --
  useEffect(() => {
    const data = localStorage.getItem(`panier_${shop.slug}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.length === 0) router.push(`/${shop.slug}/panier`);
      else setArticles(parsed);
    } else {
      router.push(`/${shop.slug}/panier`);
    }
  }, [shop.slug]);

  // -- Calculs --
  const sousTotal  = articles.reduce((s, a) => s + a.prix * a.quantite, 0);
  const nbArticles = articles.reduce((s, a) => s + a.quantite, 0);

  // -- Validation --
  const valider = () => {
    if (!form.nomClient.trim())  return 'Le nom est obligatoire';
    if (!form.telephone.trim())  return 'Le téléphone est obligatoire';
    if (form.modeLivraison === 'livraison' && !form.adresse.trim())
      return "L'adresse de livraison est obligatoire";
    return null;
  };

  // -- Soumettre la commande --
  const soumettre = async () => {
    const err = valider();
    if (err) { setErreur(err); return; }

    setLoading(true);
    setErreur('');

    try {
      const API = process.env.NEXT_PUBLIC_API_URL;

      const items = articles.map(a => ({
        productId: a.produitId,
        name:      a.nom,
        price:     a.prix,
        quantity:  a.quantite,
        variants:  a.variantes,
        image:     a.image,
      }));

      const res  = await fetch(`${API}/orders`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          shopId:        shop._id,
          nomClient:     form.nomClient.trim(),
          telephone:     form.telephone.trim(),
          adresse:       form.adresse.trim(),
          ville:         form.ville.trim(),
          modeLivraison: form.modeLivraison,
          notes:         form.notes.trim(),
          items,
          subtotal:      sousTotal,
          total:         sousTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur serveur');

      // Vide le panier
      localStorage.removeItem(`panier_${shop.slug}`);
      setSucces(true);

      // Redirige vers la confirmation après 3s
      setTimeout(() => {
        router.push(`/${shop.slug}/commande/confirmation?id=${data.data._id}`);
      }, 2000);

    } catch (err: any) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Page succès
  if (succes) {
    return (
      <div
        style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}
        className="flex items-center justify-center px-4"
      >
        <div className="text-center space-y-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: `${t.accent}20` }}
          >
            <Check size={40} style={{ color: t.accent }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: t.text }}>
            Commande enregistrée !
          </h1>
          <p style={{ color: t.muted }}>
            Tu vas recevoir une confirmation sous peu.
          </p>
          <Loader2 size={20} className="animate-spin mx-auto" style={{ color: t.accent }} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav
        style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40"
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href={`/${shop.slug}/panier`}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70"
            style={{ color: t.muted }}
          >
            <ChevronLeft size={18} />
            Retour au panier
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: t.text }}>
            Finaliser la commande
          </h1>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>
            {nbArticles} article{nbArticles > 1 ? 's' : ''} — {formatFcfa(sousTotal)}
          </p>
        </div>

        {/* ── RÉCAP ARTICLES ── */}
        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{ backgroundColor: t.surface, borderColor: t.border }}
        >
          <h2 className="text-sm font-semibold flex items-center gap-2"
              style={{ color: t.text }}>
            <ShoppingCart size={16} style={{ color: t.accent }} />
            Articles ({nbArticles})
          </h2>
          {articles.map(a => (
            <div key={a.cle} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative"
                style={{ backgroundColor: t.elevated }}
              >
                {a.image
                  ? <Image src={a.image} alt={a.nom} fill className="object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-lg">
                      🛍️
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: t.text }}>
                  {a.nom}
                </p>
                {Object.entries(a.variantes).length > 0 && (
                  <p className="text-xs" style={{ color: t.muted }}>
                    {Object.entries(a.variantes).map(([k,v]) => `${k}: ${v}`).join(', ')}
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
          <div
            className="flex justify-between font-bold pt-3 border-t text-sm"
            style={{ borderColor: t.border }}
          >
            <span style={{ color: t.text }}>Total</span>
            <span style={{ color: t.accent }}>{formatFcfa(sousTotal)}</span>
          </div>
        </div>

        {/* ── FORMULAIRE ── */}
        <div
          className="rounded-2xl border p-5 space-y-5"
          style={{ backgroundColor: t.surface, borderColor: t.border }}
        >
          <h2 className="font-semibold flex items-center gap-2"
              style={{ color: t.text }}>
            <User size={18} style={{ color: t.accent }} />
            Tes coordonnées
          </h2>

          {/* Nom */}
          <div className="space-y-1.5">
            <label className="text-sm" style={{ color: t.muted }}>
              Nom complet *
            </label>
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: t.muted }} />
              <input
                value={form.nomClient}
                onChange={e => setForm(p => ({ ...p, nomClient: e.target.value }))}
                placeholder="Aminata Koné"
                className="w-full bg-elevated border rounded-xl pl-10 pr-4 py-3
                           text-sm outline-none"
                style={{
                  backgroundColor: t.elevated,
                  borderColor:     t.border,
                  color:           t.text,
                }}
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <label className="text-sm" style={{ color: t.muted }}>
              Téléphone *
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2"
                     style={{ color: t.muted }} />
              <input
                value={form.telephone}
                onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                placeholder="+225 07 00 00 00 00"
                type="tel"
                className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: t.elevated,
                  borderColor:     t.border,
                  color:           t.text,
                }}
              />
            </div>
          </div>

          {/* Mode livraison */}
          <div className="space-y-2">
            <label className="text-sm" style={{ color: t.muted }}>
              Mode de récupération *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { val: 'livraison', label: '🚚 Livraison', desc: 'À domicile' },
                { val: 'retrait',   label: '🏪 Retrait',   desc: 'En boutique' },
              ] as const).map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setForm(p => ({ ...p, modeLivraison: opt.val }))}
                  className="p-3 rounded-xl border text-left transition-all"
                  style={{
                    backgroundColor: form.modeLivraison === opt.val
                      ? `${t.accent}15` : t.elevated,
                    borderColor: form.modeLivraison === opt.val
                      ? t.accent : t.border,
                  }}
                >
                  <p className="font-semibold text-sm" style={{ color: t.text }}>
                    {opt.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: t.muted }}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Adresse (si livraison) */}
          {form.modeLivraison === 'livraison' && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm" style={{ color: t.muted }}>
                  Adresse de livraison *
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2"
                          style={{ color: t.muted }} />
                  <input
                    value={form.adresse}
                    onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))}
                    placeholder="Rue, quartier, immeuble..."
                    className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: t.elevated,
                      borderColor:     t.border,
                      color:           t.text,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm" style={{ color: t.muted }}>
                  Ville
                </label>
                <input
                  value={form.ville}
                  onChange={e => setForm(p => ({ ...p, ville: e.target.value }))}
                  placeholder="Abidjan, Bouaké..."
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: t.elevated,
                    borderColor:     t.border,
                    color:           t.text,
                  }}
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm" style={{ color: t.muted }}>
              <Package size={13} className="inline mr-1" />
              Instructions spéciales (optionnel)
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Couleur préférée, taille exacte, heure de livraison..."
              rows={3}
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{
                backgroundColor: t.elevated,
                borderColor:     t.border,
                color:           t.text,
              }}
            />
          </div>
        </div>

        {/* Erreur */}
        {erreur && (
          <p
            className="px-4 py-3 rounded-xl text-sm border"
            style={{
              backgroundColor: '#ef444420',
              borderColor:     '#ef4444',
              color:           '#ef4444',
            }}
          >
            {erreur}
          </p>
        )}

        {/* ── BOUTON CONFIRMER ── */}
        <button
          onClick={soumettre}
          disabled={loading || articles.length === 0}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center
                     justify-center gap-2 transition-all disabled:opacity-50"
          style={{ backgroundColor: t.accent, color: '#fff' }}
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Envoi en cours...</>
            : <><Check size={18} /> Confirmer la commande — {formatFcfa(sousTotal)}</>
          }
        </button>

        <p className="text-xs text-center" style={{ color: t.muted }}>
          En confirmant, tu acceptes que tes informations soient transmises
          à {shop.name} pour traiter ta commande.
        </p>
      </div>
    </div>
  );
}