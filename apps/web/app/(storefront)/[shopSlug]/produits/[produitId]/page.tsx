import { notFound }      from 'next/navigation';
import type { Metadata } from 'next';
import Script            from 'next/script';
import ThemeProvider     from '../../ThemeProvider';
import ProduitClient     from './ProduitClient';

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

// ── Cache 60s — bien plus rapide que no-store ─────────────────────────────────
const FETCH_OPTIONS = { next: { revalidate: 60 } };

async function getShop(slug: string) {
  try {
    const res = await fetch(`${API}/shops/${slug}`, FETCH_OPTIONS);
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

async function getProduit(produitId: string) {
  try {
    const res = await fetch(`${API}/products/${produitId}`, FETCH_OPTIONS);
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

async function getProduitsSimilaires(shopId: string, categoryId: string, produitId: string) {
  try {
    const res = await fetch(
      `${API}/products/shop/${shopId}?limit=4&categoryId=${categoryId}`,
      FETCH_OPTIONS
    );
    const data = await res.json();
    return data.success
      ? data.data.filter((p: any) => p._id !== produitId).slice(0, 3)
      : [];
  } catch { return []; }
}

// ── SEO dynamique par produit ─────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { shopSlug: string; produitId: string };
}): Promise<Metadata> {
  const [shop, produit] = await Promise.all([
    getShop(params.shopSlug),
    getProduit(params.produitId),
  ]);

  if (!shop || !produit) {
    return { title: 'Produit introuvable — ShopEasy CI' };
  }

  const prix        = new Intl.NumberFormat('fr-FR').format(produit.price) + ' FCFA';
  const url         = `https://${shop.slug}.shopeasyci.store/produits/${produit._id}`;
  const imageOg     = produit.images?.[0] ?? shop.logo ?? 'https://shopeasyci.store/og-default.png';

  // Description enrichie avec mention paiement livraison
  const description = produit.description
    ? produit.description.slice(0, 155)
    : `${produit.name} — ${prix} chez ${shop.name}. Commandez en ligne, paiement a la livraison partout en Cote d'Ivoire.`;

  return {
    // Prix dans le titre — augmente le taux de clic sur Google
    title:       `${produit.name} — ${prix} | ${shop.name}`,
    description,

    // URL canonique — evite le contenu duplique
    alternates: { canonical: url },

    openGraph: {
      title:       `${produit.name} — ${prix} | ${shop.name}`,
      description,
      type:        'website',
      url,
      locale:      'fr_CI',
      siteName:    'ShopEasy CI',
      images: [
        {
          url:    imageOg,
          width:  1200,
          height: 630,
          alt:    `${produit.name} — ${shop.name}`,
        },
      ],
    },

    twitter: {
      card:        'summary_large_image',
      title:       `${produit.name} — ${prix} | ${shop.name}`,
      description,
      images:      [imageOg],
    },

    keywords: [
      produit.name,
      shop.name,
      'boutique en ligne',
      "Cote d'Ivoire",
      'Abidjan',
      'ShopEasy CI',
      'paiement livraison',
      'commander en ligne',
    ],
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ProduitPage({
  params,
}: {
  params: { shopSlug: string; produitId: string };
}) {
  const [shop, produit] = await Promise.all([
    getShop(params.shopSlug),
    getProduit(params.produitId),
  ]);

  if (!shop || !produit) notFound();

  const similaires = await getProduitsSimilaires(
    shop._id,
    produit.categoryId,
    produit._id
  );

  // ── JSON-LD — Google Shopping ─────────────────────────────────────────────
  // Permet à Google d'afficher prix + disponibilité dans les résultats
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:        produit.name,
    description: produit.description ?? '',
    image:       produit.images ?? [],
    sku:         produit._id,
    brand: {
      '@type': 'Brand',
      name:    shop.name,
    },
    offers: {
      '@type':         'Offer',
      url:             `https://${shop.slug}.shopeasyci.store/produits/${produit._id}`,
      priceCurrency:   'XOF',
      price:           produit.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0],
      availability:    produit.totalStock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition:   'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name:    shop.name,
      },
    },
  };

  return (
    <>
      {/* JSON-LD injecté dans le head — lu par Google */}
      <Script
        id="produit-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ThemeProvider themeId={shop.selectedTheme}>
        <ProduitClient shop={shop} produit={produit} similaires={similaires} />
      </ThemeProvider>
    </>
  );
}