import { notFound } from 'next/navigation';
import ThemeProvider from '../ThemeProvider';
import AboutClient  from './AboutClient';

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/api';

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
    const res  = await fetch(`${API}/products/shop/${shopId}?limit=3`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch { return []; }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;
  const shop         = await getShop(shopSlug);
  if (!shop) notFound();

  const produits = await getProduits(shop._id);

  return (
    <ThemeProvider themeId={shop.selectedTheme}>
      <AboutClient shop={shop} produits={produits} />
    </ThemeProvider>
  );
}