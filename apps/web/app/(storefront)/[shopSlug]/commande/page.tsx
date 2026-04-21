import { notFound } from 'next/navigation';
import ThemeProvider  from '../ThemeProvider';
import CommandeClient from './CommandeClient';

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function getShop(slug: string) {
  try {
    const res = await fetch(`${API}/shops/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

export default async function CommandePage({
  params,
}: {
  params: { shopSlug: string };
}) {
  const shop = await getShop(params.shopSlug);
  if (!shop) notFound();

  return (
    <ThemeProvider themeId={shop.selectedTheme}>
      <CommandeClient shop={shop} />
    </ThemeProvider>
  );
}