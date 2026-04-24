import { notFound }    from 'next/navigation';
import ThemeProvider   from '../ThemeProvider';
import FavorisClient   from './FavorisClient';

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/api';

async function getShop(slug: string) {
  try {
    const res  = await fetch(`${API}/shops/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

export default async function FavorisPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;
  const shop = await getShop(shopSlug);
  if (!shop) notFound();

  return (
    <ThemeProvider themeId={shop.selectedTheme}>
      <FavorisClient shop={shop} />
    </ThemeProvider>
  );
}