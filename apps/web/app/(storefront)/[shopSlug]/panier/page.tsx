import { notFound } from 'next/navigation';
import ThemeProvider from '../ThemeProvider';
import PanierClient  from './PanierClient';

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function getShop(slug: string) {
  try {
    const res = await fetch(`${API}/shops/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error('Erreur getShop panier:', err);
    return null;
  }
}

export default async function PanierPage({
  params,
}: {
  params: { shopSlug: string };
}) {
  const shop = await getShop(params.shopSlug);

  if (!shop) notFound();

  return (
    <ThemeProvider themeId={shop.selectedTheme}>
      <PanierClient shop={shop} />
    </ThemeProvider>
  );
}