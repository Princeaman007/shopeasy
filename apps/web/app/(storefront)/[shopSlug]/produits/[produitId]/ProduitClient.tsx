'use client';

import { useState }      from 'react';
import Image             from 'next/image';
import Link              from 'next/link';
import {
  ChevronLeft, ChevronRight, ShoppingCart,
  MessageCircle, Check, Minus, Plus, Share2,
  MapPin, Clock,
} from 'lucide-react';
import { getThemeConfig } from '../../theme.config';
import type { ShopPublic } from '../../types';

// ---------------------------------------------------------------------------
interface Props {
  shop:      ShopPublic;
  produit:   any;
  similaires: any[];
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

// ---------------------------------------------------------------------------
export default function ProduitClient({ shop, produit, similaires }: Props) {
  const t = getThemeConfig(shop.selectedTheme);

  const [imageActive,   setImageActive]   = useState(0);
  const [quantite,      setQuantite]      = useState(1);
  const [variantesChoisies, setVariantesChoisies] = useState<Record<string, string>>({});
  const [ajoutePanier,  setAjoutePanier]  = useState(false);

  // -- Variantes --
  const variantes: { nom: string; valeurs: string[] }[] =
    produit.variants ?? [];

  const toutesVariantesChoisies =
    variantes.length === 0 ||
    variantes.every(v => variantesChoisies[v.nom]);

  // -- Calcul stock selon variante --
  const stockDispo = produit.totalStock ?? 0;
  const enRupture  = stockDispo === 0;

  // -- Ajouter au panier (localStorage) --
  const ajouterAuPanier = () => {
    if (!toutesVariantesChoisies || enRupture) return;

    const panier = JSON.parse(
      localStorage.getItem(`panier_${shop.slug}`) ?? '[]'
    );

    const cle = `${produit._id}_${JSON.stringify(variantesChoisies)}`;
    const existant = panier.find((i: any) => i.cle === cle);

    if (existant) {
      existant.quantite += quantite;
    } else {
      panier.push({
        cle,
        produitId:  produit._id,
        nom:        produit.name,
        prix:       produit.price,
        image:      produit.images?.[0] ?? null,
        variantes:  variantesChoisies,
        quantite,
      });
    }

    localStorage.setItem(`panier_${shop.slug}`, JSON.stringify(panier));
    setAjoutePanier(true);
    setTimeout(() => setAjoutePanier(false), 2000);
  };

  // -- Commander via WhatsApp --
  const commanderWhatsApp = () => {
    const variantesTexte = Object.entries(variantesChoisies)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const message = encodeURIComponent(
      `Bonjour, je souhaite commander :\n\n` +
      `🛍️ *${produit.name}*\n` +
      (variantesTexte ? `📋 ${variantesTexte}\n` : '') +
      `🔢 Quantité : ${quantite}\n` +
      `💰 Prix : ${formatFcfa(produit.price * quantite)}\n\n` +
      `Merci !`
    );

    window.open(
      `https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${message}`,
      '_blank'
    );
  };

  // -- Partager --
  const partager = () => {
    if (navigator.share) {
      navigator.share({
        title: produit.name,
        text:  `Découvrez ${produit.name} sur ${shop.name}`,
        url:   window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // ---------------------------------------------------------------------------
  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav
        style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/${shop.slug}/catalogue`}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70"
            style={{ color: t.muted }}
          >
            <ChevronLeft size={18} />
            Retour au catalogue
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={partager}
              className="p-2 rounded-xl"
              style={{ backgroundColor: t.elevated }}
            >
              <Share2 size={18} style={{ color: t.muted }} />
            </button>
            <Link
              href={`/${shop.slug}/panier`}
              className="p-2 rounded-xl"
              style={{ backgroundColor: t.elevated }}
            >
              <ShoppingCart size={18} style={{ color: t.text }} />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-10">

          {/* ── GALERIE IMAGES ── */}
          <div className="space-y-3">
            {/* Image principale */}
            <div
              className="aspect-square rounded-2xl overflow-hidden relative"
              style={{ backgroundColor: t.surface }}
            >
              {produit.images?.[imageActive]
                ? <Image
                    src={produit.images[imageActive]}
                    alt={produit.name}
                    fill
                    className="object-cover"
                  />
                : <div className="w-full h-full flex items-center justify-center text-6xl">
                    🛍️
                  </div>
              }

              {/* Badge promo */}
              {produit.comparePrice > produit.price && (
                <div
                  className="absolute top-4 left-4 text-sm font-bold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: t.accent, color: '#fff' }}
                >
                  -{Math.round((1 - produit.price / produit.comparePrice) * 100)}%
                </div>
              )}

              {/* Navigation images */}
              {produit.images?.length > 1 && (
                <>
                  <button
                    onClick={() => setImageActive(Math.max(0, imageActive - 1))}
                    disabled={imageActive === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9
                               rounded-full flex items-center justify-center
                               disabled:opacity-30 transition-opacity"
                    style={{ backgroundColor: `${t.bg}cc` }}
                  >
                    <ChevronLeft size={18} style={{ color: t.text }} />
                  </button>
                  <button
                    onClick={() => setImageActive(
                      Math.min(produit.images.length - 1, imageActive + 1)
                    )}
                    disabled={imageActive === produit.images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9
                               rounded-full flex items-center justify-center
                               disabled:opacity-30 transition-opacity"
                    style={{ backgroundColor: `${t.bg}cc` }}
                  >
                    <ChevronRight size={18} style={{ color: t.text }} />
                  </button>
                </>
              )}
            </div>

            {/* Miniatures */}
            {produit.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {produit.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImageActive(i)}
                    className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden
                               border-2 transition-all relative"
                    style={{
                      borderColor: imageActive === i ? t.accent : t.border,
                    }}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── INFOS PRODUIT ── */}
          <div className="space-y-6">

            {/* Nom + prix */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold" style={{ color: t.text }}>
                {produit.name}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold" style={{ color: t.accent }}>
                  {formatFcfa(produit.price)}
                </span>
                {produit.comparePrice > produit.price && (
                  <span className="text-lg line-through" style={{ color: t.muted }}>
                    {formatFcfa(produit.comparePrice)}
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: enRupture ? '#ef4444' : t.accent }}
                />
                <span className="text-sm" style={{ color: enRupture ? '#ef4444' : t.muted }}>
                  {enRupture
                    ? 'Rupture de stock'
                    : `${stockDispo} en stock`
                  }
                </span>
              </div>
            </div>

            {/* Description */}
            {produit.description && (
              <div
                className="p-4 rounded-xl border text-sm leading-relaxed"
                style={{ backgroundColor: t.surface, borderColor: t.border, color: t.muted }}
              >
                {produit.description}
              </div>
            )}

            {/* Variantes */}
            {variantes.map(variant => (
              <div key={variant.nom} className="space-y-2">
                <p className="text-sm font-semibold" style={{ color: t.text }}>
                  {variant.nom}
                  {variantesChoisies[variant.nom] && (
                    <span className="font-normal ml-2" style={{ color: t.accent }}>
                      — {variantesChoisies[variant.nom]}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variant.valeurs.map(valeur => {
                    const choisi = variantesChoisies[variant.nom] === valeur;
                    return (
                      <button
                        key={valeur}
                        onClick={() => setVariantesChoisies(prev => ({
                          ...prev,
                          [variant.nom]: valeur,
                        }))}
                        className="px-4 py-2 rounded-xl border text-sm font-medium
                                   transition-all"
                        style={{
                          backgroundColor: choisi ? t.accent    : t.surface,
                          borderColor:     choisi ? t.accent    : t.border,
                          color:           choisi ? '#fff'      : t.text,
                          transform:       choisi ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        {valeur}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantité */}
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: t.text }}>
                Quantité
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantite(Math.max(1, quantite - 1))}
                  className="w-10 h-10 rounded-xl border flex items-center
                             justify-center transition-colors"
                  style={{ backgroundColor: t.surface, borderColor: t.border }}
                >
                  <Minus size={16} style={{ color: t.text }} />
                </button>
                <span
                  className="w-12 text-center font-bold text-lg"
                  style={{ color: t.text }}
                >
                  {quantite}
                </span>
                <button
                  onClick={() => setQuantite(Math.min(stockDispo, quantite + 1))}
                  disabled={quantite >= stockDispo}
                  className="w-10 h-10 rounded-xl border flex items-center
                             justify-center transition-colors disabled:opacity-30"
                  style={{ backgroundColor: t.surface, borderColor: t.border }}
                >
                  <Plus size={16} style={{ color: t.text }} />
                </button>
                <span className="text-sm ml-2" style={{ color: t.muted }}>
                  Total : {formatFcfa(produit.price * quantite)}
                </span>
              </div>
            </div>

            {/* Boutons CTA */}
            <div className="space-y-3 pt-2">

              {/* Ajouter au panier */}
              <button
                onClick={ajouterAuPanier}
                disabled={!toutesVariantesChoisies || enRupture}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center
                           justify-center gap-2 transition-all disabled:opacity-40"
                style={{
                  backgroundColor: ajoutePanier ? '#10b981' : t.accent,
                  color: '#fff',
                }}
              >
                {ajoutePanier
                  ? <><Check size={18} /> Ajouté au panier !</>
                  : <><ShoppingCart size={18} /> Ajouter au panier</>
                }
              </button>

              {/* Commander via WhatsApp */}
              {shop.whatsapp && (
                <button
                  onClick={commanderWhatsApp}
                  disabled={!toutesVariantesChoisies || enRupture}
                  className="w-full py-4 rounded-2xl font-bold text-sm flex items-center
                             justify-center gap-2 transition-all disabled:opacity-40"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#fff',
                  }}
                >
                  <MessageCircle size={18} />
                  Commander via WhatsApp
                </button>
              )}

              {/* Message si variante non choisie */}
              {variantes.length > 0 && !toutesVariantesChoisies && (
                <p className="text-xs text-center" style={{ color: t.muted }}>
                  Veuillez sélectionner toutes les options avant de commander
                </p>
              )}
            </div>

            {/* Infos boutique */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: t.surface, borderColor: t.border }}
            >
              <Link
                href={`/${shop.slug}`}
                className="flex items-center gap-2 font-semibold text-sm
                           hover:opacity-80 transition-opacity"
                style={{ color: t.text }}
              >
                🛍️ {shop.name}
              </Link>
              {shop.about?.location && (
                <div className="flex items-center gap-2 text-xs"
                     style={{ color: t.muted }}>
                  <MapPin size={12} style={{ color: t.accent }} />
                  {shop.about.location}
                </div>
              )}
              {shop.about?.workingHours && (
                <div className="flex items-center gap-2 text-xs"
                     style={{ color: t.muted }}>
                  <Clock size={12} style={{ color: t.accent }} />
                  {shop.about.workingHours}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── PRODUITS SIMILAIRES ── */}
        {similaires.length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-xl font-bold" style={{ color: t.text }}>
              Produits similaires
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {similaires.map(p => (
                <Link
                  key={p._id}
                  href={`/${shop.slug}/produits/${p._id}`}
                  className="group rounded-2xl overflow-hidden transition-all
                             hover:scale-[1.02]"
                  style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
                >
                  <div className="aspect-square relative overflow-hidden"
                       style={{ backgroundColor: t.elevated }}>
                    {p.images?.[0]
                      ? <Image src={p.images[0]} alt={p.name} fill
                               className="object-cover group-hover:scale-105 transition-transform" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">
                          🛍️
                        </div>
                    }
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium line-clamp-2" style={{ color: t.text }}>
                      {p.name}
                    </p>
                    <p className="text-sm font-bold" style={{ color: t.accent }}>
                      {formatFcfa(p.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── BOUTON WHATSAPP FLOTTANT ── */}
      {shop.whatsapp && (
        <Link
          href={`https://wa.me/${shop.whatsapp.replace(/\D/g,'')}?text=Bonjour, je suis intéressé par ${produit.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg
                     flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </Link>
      )}
    </div>
  );
}