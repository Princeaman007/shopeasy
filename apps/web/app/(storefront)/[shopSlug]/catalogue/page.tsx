import { notFound }  from 'next/navigation';
import CatalogueClient from './CatalogueClient';

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function getShop(slug: string) {
  try {
    const res = await fetch(`${API}/shops/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

async function getCategories(shopId: string) {
  try {
    const res  = await fetch(`${API}/categories/shop/${shopId}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch { return []; }
}

async function getProduits(shopId: string) {
  try {
    const res  = await fetch(`${API}/products/shop/${shopId}?limit=100`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch { return []; }
}

export default async function CataloguePage({
  params,
}: {
  params: { shopSlug: string };
}) {
  const shop = await getShop(params.shopSlug);
  if (!shop) notFound();

  const [categories, produits] = await Promise.all([
    getCategories(shop._id),
    getProduits(shop._id),
  ]);

  return (
    <CatalogueClient
      shop={shop}
      categories={categories}
      produits={produits}
    />
  );
}