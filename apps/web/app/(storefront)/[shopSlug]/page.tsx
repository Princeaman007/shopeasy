import { notFound }    from 'next/navigation';
import type { Metadata } from 'next';
import ThemeProvider   from './ThemeProvider';
import VitrinModerne   from './themes/VitineModerne';
import MarcheColore    from './themes/MarcheColore';
import LuxeSombre      from './themes/LuxeSombre';
import BoutiquePro     from './themes/BoutiquePro';
import StoriesStyle    from './themes/StoriesStyle';
import TrackVisite     from './TrackVisite';

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function getShop(slug: string) {
  try {
    const res = await fetch(`${API}/shops/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

async function getProduits(shopId: string) {
  try {
    const res  = await fetch(`${API}/products/shop/${shopId}?limit=8`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// SEO dynamique par boutique
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: { shopSlug: string };
}): Promise<Metadata> {
  const shop = await getShop(params.shopSlug);

  if (!shop) {
    return {
      title:       'Boutique introuvable — ShopEasy CI',
      description: 'Cette boutique n existe pas ou n est plus disponible.',
    };
  }

  const description = shop.about?.description
    ? shop.about.description.slice(0, 160)
    : `Découvrez ${shop.name} sur ShopEasy CI — boutique en ligne en Côte d'Ivoire.`;

  const imageOg = shop.logo ?? 'https://shopeasyci.ci/og-default.png';

  return {
    title:       `${shop.name} — Boutique en ligne`,
    description,
    openGraph: {
      title:       `${shop.name} — Boutique en ligne`,
      description,
      type:        'website',
      locale:      'fr_CI',
      url:         `https://${shop.slug}.shopeasyci.ci`,
      siteName:    'ShopEasy CI',
      images: [
        {
          url:    imageOg,
          width:  1200,
          height: 630,
          alt:    `${shop.name} — ShopEasy CI`,
        },
      ],
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${shop.name} — Boutique en ligne`,
      description,
      images:      [imageOg],
    },
    alternates: {
      canonical: `https://${shop.slug}.shopeasyci.ci`,
    },
    keywords: [
      shop.name,
      'boutique en ligne',
      "Côte d'Ivoire",
      'ShopEasy CI',
      shop.about?.location ?? 'Abidjan',
    ],
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function StorefrontPage({
  params,
}: {
  params: { shopSlug: string };
}) {
  const shop = await getShop(params.shopSlug);
  if (!shop) notFound();

  const produits = await getProduits(shop._id);

  const themeMap: Record<string, React.ComponentType<{ shop: any; produits: any[] }>> = {
    'marche-colore': MarcheColore,
    'luxe-sombre':   LuxeSombre,
    'boutique-pro':  BoutiquePro,
    'stories-style': StoriesStyle,
  };

  const ThemeComponent = themeMap[shop.selectedTheme] ?? VitrinModerne;

 return (
    <ThemeProvider themeId={shop.selectedTheme}>
      <TrackVisite shopId={shop._id} />
      <ThemeComponent shop={shop} produits={produits} />
    </ThemeProvider>
  );
}