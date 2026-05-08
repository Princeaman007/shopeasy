'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, ShoppingCart,
  MessageCircle, Check, Minus, Plus, Share2,
  MapPin, Clock, Shield, Truck, RotateCcw, Flame, Eye, Video,
} from 'lucide-react';
import { getThemeConfig } from '../../theme.config';
import type { ShopPublic } from '../../types';
import BoutonPanier from '@/components/storefront/BoutonPanier';
import BoutonFavori from '@/components/storefront/BoutonFavori';
import FormulaireAvis from '@/components/storefront/FormulaireAvis';
import ListeAvis from '@/components/storefront/ListeAvis';

interface Props {
  shop: ShopPublic;
  produit: any;
  similaires: any[];
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

// ── Compte à rebours ──────────────────────────────────────────────────────────
function useCompteur() {
  const [temps, setTemps] = useState({ h: 2, m: 0, s: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTemps(prev => {
        const { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: 1, m: 59, s: 59 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return temps;
}

// ── Visiteurs simulés ─────────────────────────────────────────────────────────
function useVisiteurs() {
  const [visiteurs, setVisiteurs] = useState(Math.floor(Math.random() * 8) + 3);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisiteurs(Math.floor(Math.random() * 8) + 3);
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  return visiteurs;
}

// ── Swipe tactile ─────────────────────────────────────────────────────────────
function useSwipe(onGauche: () => void, onDroite: () => void) {
  const startX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? onGauche() : onDroite();
    }
    startX.current = null;
  };

  return { onTouchStart, onTouchEnd };
}

export default function ProduitClient({ shop, produit, similaires }: Props) {
  const t = getThemeConfig(shop.selectedTheme);
  const temps = useCompteur();
  const visiteurs = useVisiteurs();

  const [imageActive, setImageActive] = useState(0);
  const [quantite, setQuantite] = useState(1);
  const [variantesChoisies, setVariantesChoisies] = useState<Record<string, string>>({});
  const [ajoutePanier, setAjoutePanier] = useState(false);
  const [imagesAffichees, setImagesAffichees] = useState<string[]>(produit.images ?? []);
  const [stockVariante, setStockVariante] = useState<number | null>(null);
  const [refreshAvis, setRefreshAvis] = useState(0);

  const swipe = useSwipe(
    () => setImageActive(i => Math.min(imagesAffichees.length - 1, i + 1)),
    () => setImageActive(i => Math.max(0, i - 1)),
  );

  const variantes: { nom: string; valeurs: string[]; images: Record<string, string[]> }[] =
    (produit.variants ?? []).map((v: any) => ({
      nom: v.nom ?? v.name ?? v.label ?? '',
      valeurs: v.valeurs ?? v.values ?? v.options ?? [],
      images: v.images ?? {},
    }));

  const choisirVariante = (nomVariante: string, valeur: string) => {
    const nouvellesVariantes = { ...variantesChoisies, [nomVariante]: valeur };
    setVariantesChoisies(nouvellesVariantes);

    const varianteAvecImages = variantes.find(v => v.nom === nomVariante);
    const imagesVariante = varianteAvecImages?.images?.[valeur];
    if (imagesVariante && imagesVariante.length > 0) {
      setImagesAffichees(imagesVariante);
    } else {
      setImagesAffichees(produit.images ?? []);
    }
    setImageActive(0);

    const toutesChoisies = variantes.every(v =>
      v.nom === nomVariante ? true : !!nouvellesVariantes[v.nom]
    );
    if (toutesChoisies && produit.stock?.length > 0) {
      const cle = variantes.map(v => v.nom === nomVariante ? valeur : nouvellesVariantes[v.nom]).join('-');
      const skuTrouve = produit.stock.find((s: any) => s.sku === cle);
      setStockVariante(skuTrouve?.quantity ?? 0);
    } else {
      setStockVariante(null);
    }
  };

  const toutesVariantesChoisies =
    variantes.length === 0 ||
    variantes.every(v => variantesChoisies[v.nom]);

  const stockDispo = stockVariante !== null ? stockVariante : (produit.totalStock ?? 0);
  const enRupture = stockDispo === 0;
  const stockFaible = stockDispo > 0 && stockDispo <= 5;

  const ajouterAuPanier = () => {
    if (!toutesVariantesChoisies || enRupture) return;
    const panier = JSON.parse(localStorage.getItem(`panier_${shop.slug}`) ?? '[]');
    const cle = `${produit._id}_${JSON.stringify(variantesChoisies)}`;
    const existant = panier.find((i: any) => i.cle === cle);
    if (existant) {
      existant.quantite += quantite;
    } else {
      panier.push({
        cle,
        produitId: produit._id,
        nom: produit.name,
        prix: produit.price,
        image: imagesAffichees[0] ?? produit.images?.[0] ?? null,
        variantes: variantesChoisies,
        quantite,
      });
    }
    localStorage.setItem(`panier_${shop.slug}`, JSON.stringify(panier));
    window.dispatchEvent(new Event('panier-updated'));
    setAjoutePanier(true);
    setTimeout(() => setAjoutePanier(false), 2000);
  };

  const commanderWhatsApp = () => {
    const variantesTexte = Object.entries(variantesChoisies)
      .map(([k, v]) => `${k}: ${v}`).join(', ');
    const message = encodeURIComponent(
      `Bonjour, je souhaite commander :\n\n*${produit.name}*\n` +
      (variantesTexte ? `${variantesTexte}\n` : '') +
      `Quantite : ${quantite}\nPrix : ${formatFcfa(produit.price * quantite)}\n\nMerci !`
    );
    window.open(`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const partager = () => {
    if (navigator.share) {
      navigator.share({
        title: produit.name,
        text: `Decouvrez ${produit.name} sur ${shop.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const couleurCSS: Record<string, string> = {
    noir: '#1a1a1a', black: '#1a1a1a',
    blanc: '#ffffff', white: '#ffffff',
    rouge: '#ef4444', red: '#ef4444',
    bleu: '#3b82f6', blue: '#3b82f6',
    vert: '#22c55e', green: '#22c55e',
    jaune: '#eab308', yellow: '#eab308',
    orange: '#f97316',
    violet: '#a855f7', purple: '#a855f7',
    rose: '#ec4899', pink: '#ec4899',
    marron: '#92400e', brown: '#92400e',
    beige: '#d4b896',
    gris: '#6b7280', grey: '#6b7280', gray: '#6b7280',
    or: '#f59e0b', gold: '#f59e0b',
    argent: '#94a3b8', silver: '#94a3b8',
  };

  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav
        style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
        className="sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/catalogue"
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70"
            style={{ color: t.muted }}
          >
            <ChevronLeft size={18} /> Retour au catalogue
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={partager}
              className="p-2 rounded-xl"
              style={{ backgroundColor: t.elevated }}
            >
              <Share2 size={18} style={{ color: t.muted }} />
            </button>
            <BoutonPanier shopSlug={shop.slug} accent={t.accent} />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── GRILLE PRODUIT ── */}
        <div className="grid md:grid-cols-2 gap-10">

          {/* ── GALERIE + VIDEO ── */}
          <div className="space-y-3">

            {/* Image principale */}
            <div
              className="aspect-square rounded-2xl overflow-hidden relative"
              style={{ backgroundColor: t.surface }}
              {...swipe}
            >
              {imagesAffichees?.[imageActive]
                ? <Image
                  src={imagesAffichees[imageActive]}
                  alt={produit.name}
                  fill
                  className="object-cover"
                />
                : <div className="w-full h-full flex items-center justify-center text-6xl">...</div>
              }

              {/* Badge réduction */}
              {produit.comparePrice > produit.price && (
                <div
                  className="absolute top-4 left-4 text-sm font-bold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#ef4444', color: '#fff' }}
                >
                  -{Math.round((1 - produit.price / produit.comparePrice) * 100)}% OFF
                </div>
              )}

              {/* Flèches */}
              {imagesAffichees?.length > 1 && (
                <>
                  <button
                    onClick={() => setImageActive(i => Math.max(0, i - 1))}
                    disabled={imageActive === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                               flex items-center justify-center disabled:opacity-20 transition-opacity"
                    style={{ backgroundColor: `${t.bg}dd` }}
                  >
                    <ChevronLeft size={20} style={{ color: t.text }} />
                  </button>
                  <button
                    onClick={() => setImageActive(i => Math.min(imagesAffichees.length - 1, i + 1))}
                    disabled={imageActive === imagesAffichees.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                               flex items-center justify-center disabled:opacity-20 transition-opacity"
                    style={{ backgroundColor: `${t.bg}dd` }}
                  >
                    <ChevronRight size={20} style={{ color: t.text }} />
                  </button>

                  <div
                    className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: `${t.bg}cc`, color: t.text }}
                  >
                    {imageActive + 1} / {imagesAffichees.length}
                  </div>
                </>
              )}
            </div>

            {/* Navigation images */}
            {imagesAffichees?.length > 1 && (
              <>
                {/* DOTS — mobile */}
                <div className="flex md:hidden justify-center gap-2 py-1">
                  {imagesAffichees.map((_: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setImageActive(i)}
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: imageActive === i ? '24px' : '8px',
                        height: '8px',
                        backgroundColor: imageActive === i ? t.accent : t.border,
                      }}
                    />
                  ))}
                </div>

                {/* MINIATURES — desktop */}
                <div className="hidden md:flex gap-2 overflow-x-auto pb-1">
                  {imagesAffichees.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setImageActive(i)}
                      className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all relative"
                      style={{ borderColor: imageActive === i ? t.accent : t.border }}
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── VIDEO PRODUIT — affichee si disponible ── */}
            {/* ── VIDEO PRODUIT ── */}
            {produit.video && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Video size={14} style={{ color: t.accent }} />
                  <p className="text-sm font-semibold" style={{ color: t.text }}>
                    Video du produit
                  </p>
                </div>
                <div
                  className="rounded-2xl overflow-hidden border"
                  style={{
                    borderColor: t.border,
                    backgroundColor: '#000',
                    maxHeight: '280px',
                  }}
                >
                  <video
                    src={produit.video}
                    controls
                    playsInline
                    className="w-full h-full"
                    style={{ maxHeight: '280px', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* ── INFOS PRODUIT ── */}
          <div className="space-y-4">

            {/* Titre + favori */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold" style={{ color: t.text }}>
                {produit.name}
              </h1>
              <BoutonFavori
                shopSlug={shop.slug}
                produitId={produit._id}
                nom={produit.name}
                prix={produit.price}
                image={produit.images?.[0] ?? null}
                accent={t.accent}
                className="w-10 h-10 flex-shrink-0"
              />
            </div>

            {/* Visiteurs en live */}
            <div
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl w-fit"
              style={{ backgroundColor: `${t.accent}15`, color: t.accent }}
            >
              <Eye size={13} />
              <span>
                <strong>{visiteurs} personnes</strong> regardent ce produit en ce moment
              </span>
            </div>

            {/* Prix */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold" style={{ color: t.accent }}>
                {formatFcfa(produit.price)}
              </span>
              {produit.comparePrice > produit.price && (
                <div className="space-y-0.5">
                  <span className="text-lg line-through block" style={{ color: t.muted }}>
                    {formatFcfa(produit.comparePrice)}
                  </span>
                  <span className="text-xs font-bold text-red-400">
                    Vous économisez {formatFcfa(produit.comparePrice - produit.price)}
                  </span>
                </div>
              )}
            </div>

            {/* Compte à rebours */}
            <div
              className="p-3 rounded-xl border"
              style={{ backgroundColor: '#ef444415', borderColor: '#ef444430' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Flame size={15} className="text-red-400" />
                <span className="text-xs font-bold text-red-400">
                  Offre limitée — se termine dans
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { val: String(temps.h).padStart(2, '0'), label: 'h' },
                  { val: String(temps.m).padStart(2, '0'), label: 'min' },
                  { val: String(temps.s).padStart(2, '0'), label: 'sec' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div
                      className="px-2 py-1 rounded-lg text-center min-w-[40px]"
                      style={{ backgroundColor: t.elevated }}
                    >
                      <span className="text-lg font-bold font-mono" style={{ color: t.text }}>
                        {item.val}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: t.muted }}>{item.label}</span>
                    {i < 2 && <span className="font-bold text-red-400">:</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: enRupture ? '#ef4444' : stockFaible ? '#f59e0b' : t.accent,
                }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: enRupture ? '#ef4444' : stockFaible ? '#f59e0b' : t.muted }}
              >
                {enRupture
                  ? 'Rupture de stock'
                  : stockFaible
                    ? `Plus que ${stockDispo} en stock — commandez vite !`
                    : stockVariante !== null
                      ? `${stockDispo} disponible${stockDispo > 1 ? 's' : ''} pour cette variante`
                      : 'En stock'
                }
              </span>
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
            {variantes.map(variant => {
              const estCouleur =
                variant.nom.toLowerCase().includes('couleur') ||
                variant.nom.toLowerCase().includes('color');
              return (
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
                      const couleur = couleurCSS[valeur.toLowerCase()];
                      return (
                        <button
                          key={valeur}
                          onClick={() => choisirVariante(variant.nom, valeur)}
                          className="relative flex items-center gap-2 px-3 py-2 rounded-xl border
                                     text-sm font-medium transition-all"
                          style={{
                            backgroundColor: choisi ? t.accent : t.surface,
                            borderColor: choisi ? t.accent : t.border,
                            color: choisi ? '#fff' : t.text,
                            transform: choisi ? 'scale(1.05)' : 'scale(1)',
                          }}
                        >
                          {estCouleur && couleur && (
                            <span
                              className="w-4 h-4 rounded-full flex-shrink-0 border"
                              style={{
                                backgroundColor: couleur,
                                borderColor: couleur === '#ffffff' ? '#ccc' : couleur,
                              }}
                            />
                          )}
                          {valeur}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Quantité */}
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: t.text }}>Quantite</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantite(Math.max(1, quantite - 1))}
                  className="w-10 h-10 rounded-xl border flex items-center justify-center"
                  style={{ backgroundColor: t.surface, borderColor: t.border }}
                >
                  <Minus size={16} style={{ color: t.text }} />
                </button>
                <span className="w-12 text-center font-bold text-lg" style={{ color: t.text }}>
                  {quantite}
                </span>
                <button
                  onClick={() => setQuantite(Math.min(stockDispo, quantite + 1))}
                  disabled={quantite >= stockDispo}
                  className="w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-30"
                  style={{ backgroundColor: t.surface, borderColor: t.border }}
                >
                  <Plus size={16} style={{ color: t.text }} />
                </button>
                <span className="text-sm ml-2" style={{ color: t.muted }}>
                  Total :{' '}
                  <strong style={{ color: t.accent }}>
                    {formatFcfa(produit.price * quantite)}
                  </strong>
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <button
                onClick={ajouterAuPanier}
                disabled={!toutesVariantesChoisies || enRupture}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center
                           justify-center gap-2 transition-all disabled:opacity-40 hover:opacity-90"
                style={{
                  backgroundColor: ajoutePanier ? '#10b981' : t.accent,
                  color: '#fff',
                  boxShadow: `0 4px 20px ${t.accent}50`,
                }}
              >
                {ajoutePanier
                  ? <><Check size={20} /> Ajouté au panier !</>
                  : <><ShoppingCart size={20} /> Ajouter au panier</>
                }
              </button>

              {shop.whatsapp && (
                <button
                  onClick={commanderWhatsApp}
                  disabled={!toutesVariantesChoisies || enRupture}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center
                             justify-center gap-2 transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ backgroundColor: '#25D366', color: '#fff' }}
                >
                  <MessageCircle size={20} /> Commander via WhatsApp
                </button>
              )}

              {variantes.length > 0 && !toutesVariantesChoisies && (
                <p className="text-xs text-center" style={{ color: '#f59e0b' }}>
                  Veuillez sélectionner toutes les options avant de commander
                </p>
              )}
            </div>

            {/* Garanties */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { icone: <Truck size={16} />, titre: 'Livraison', desc: 'Rapide et fiable' },
                { icone: <Shield size={16} />, titre: 'Sécurisé', desc: 'Paiement à la livr.' },
                { icone: <RotateCcw size={16} />, titre: 'Retour', desc: 'Politique flexible' },
              ].map((g, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-3 rounded-xl border gap-1"
                  style={{ backgroundColor: t.surface, borderColor: t.border }}
                >
                  <span style={{ color: t.accent }}>{g.icone}</span>
                  <p className="text-xs font-bold" style={{ color: t.text }}>{g.titre}</p>
                  <p className="text-xs" style={{ color: t.muted }}>{g.desc}</p>
                </div>
              ))}
            </div>

            {/* Infos boutique */}
            <div
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: t.surface, borderColor: t.border }}
            >
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold text-sm hover:opacity-80"
                style={{ color: t.text }}
              >
                {shop.name}
              </Link>
              {shop.about?.location && (
                <div className="flex items-center gap-2 text-xs" style={{ color: t.muted }}>
                  <MapPin size={12} style={{ color: t.accent }} />
                  {shop.about.location}
                </div>
              )}
              {shop.about?.workingHours && (
                <div className="flex items-center gap-2 text-xs" style={{ color: t.muted }}>
                  <Clock size={12} style={{ color: t.accent }} />
                  {shop.about.workingHours}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Politique de retour */}
        {shop.about?.returnPolicy && (
          <div
            className="mt-6 p-4 rounded-2xl border space-y-2"
            style={{ backgroundColor: t.surface, borderColor: t.border }}
          >
            <p className="text-sm font-semibold" style={{ color: t.text }}>
              Politique de retour
            </p>
            <p className="text-xs leading-relaxed" style={{ color: t.muted }}>
              {shop.about.returnPolicy}
            </p>
          </div>
        )}

        {/* Produits similaires */}
        {similaires.length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-xl font-bold" style={{ color: t.text }}>
              Produits similaires
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {similaires.map(p => (
                <Link
                  key={p._id}
                  href={`/produits/${p._id}`}
                  className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
                >
                  <div
                    className="aspect-square relative overflow-hidden"
                    style={{ backgroundColor: t.elevated }}
                  >
                    {p.images?.[0]
                      ? <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">...</div>
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

      {/* Avis clients */}
      <div className="max-w-6xl mx-auto px-4 mt-12 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: t.text }}>Avis clients</h2>
            <ListeAvis
              shopSlug={shop.slug}
              productId={produit._id}
              type="produit"
              accent={t.accent}
              surface={t.surface}
              border={t.border}
              text={t.text}
              muted={t.muted}
              refresh={refreshAvis}
            />
          </div>
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{ backgroundColor: t.surface, borderColor: t.border }}
          >
            <FormulaireAvis
              shopSlug={shop.slug}
              productId={produit._id}
              type="produit"
              accent={t.accent}
              bg={t.bg}
              surface={t.surface}
              border={t.border}
              text={t.text}
              muted={t.muted}
              onSuccess={() => setRefreshAvis(r => r + 1)}
            />
          </div>
        </div>
      </div>

      {/* WhatsApp flottant */}
      {shop.whatsapp && (
        <Link
          href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=Bonjour, je suis interesse par ${produit.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg
                     flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </Link>
      )}

    </div>
  );
}