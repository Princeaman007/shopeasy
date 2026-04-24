import { notFound }       from 'next/navigation';
import ThemeProvider      from '../../ThemeProvider';
import ConfirmationClient from './ConfirmationClient';

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function getShop(slug: string) {
  try {
    const res  = await fetch(`${API}/shops/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

async function getCommande(id: string) {
  try {
    const res  = await fetch(`${API}/orders/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch { return null; }
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params:       Promise<{ shopSlug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { shopSlug } = await params;
  const { id }       = await searchParams;

  const shop = await getShop(shopSlug);
  if (!shop) notFound();

  const commande = id ? await getCommande(id) : null;

  return (
    <ThemeProvider themeId={shop.selectedTheme}>
      <ConfirmationClient shop={shop} commande={commande} />
    </ThemeProvider>
  );
}