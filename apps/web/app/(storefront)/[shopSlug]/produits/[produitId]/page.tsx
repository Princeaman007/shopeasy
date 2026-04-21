import { notFound }      from 'next/navigation';
import type { Metadata } from 'next';
import ThemeProvider     from '../../ThemeProvider';
import ProduitClient     from './ProduitClient';

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function getShop(slug: string) {
  try {
    const res = await fetch(`${API}/shops/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

async function getProduit(produitId: string) {
  try {
    const res = await fetch(`${API}/products/${produitId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

async function getProduitsSimilaires(shopId: string, categoryId: string, produitId: string) {
  try {
    const res = await fetch(
      `${API}/products/shop/${shopId}?limit=4&categoryId=${categoryId}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data.success
      ? data.data.filter((p: any) => p._id !== produitId).slice(0, 3)
      : [];
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// SEO dynamique par produit
// ---------------------------------------------------------------------------
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
  const description = produit.description
    ? produit.description.slice(0, 160)
    : `${produit.name} — ${prix} chez ${shop.name} sur ShopEasy CI.`;

  const imageOg = produit.images?.[0] ?? shop.logo ?? 'https://shopeasyci.ci/og-default.png';

  return {
    title:       `${produit.name} — ${shop.name}`,
    description,
    openGraph: {
      title:       `${produit.name} — ${shop.name}`,
      description,
      type:        'website',
      locale:      'fr_CI',
      siteName:    'ShopEasy CI',
      images: [
        {
          url:    imageOg,
          width:  1200,
          height: 630,
          alt:    produit.name,
        },
      ],
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${produit.name} — ${shop.name}`,
      description,
      images:      [imageOg],
    },
    keywords: [
      produit.name,
      shop.name,
      'boutique en ligne',
      "Côte d'Ivoire",
      'ShopEasy CI',
    ],
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
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

  return (
    <ThemeProvider themeId={shop.selectedTheme}>
      <ProduitClient shop={shop} produit={produit} similaires={similaires} />
    </ThemeProvider>
  );
}