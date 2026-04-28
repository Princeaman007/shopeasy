import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CatalogueRedirect() {
  const cookieStore = cookies();
  const shopSlug = cookieStore.get('currentShop')?.value;
  if (shopSlug) redirect(`/${shopSlug}/catalogue`);
  redirect('/');
}