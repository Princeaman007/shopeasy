import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProduitRedirect({
  params,
}: {
  params: { produitId: string };
}) {
  const cookieStore = cookies();
  const shopSlug = cookieStore.get('currentShop')?.value;
  if (shopSlug) {
    redirect(`/${shopSlug}/produits/${params.produitId}`);
  }
  redirect('/');
}