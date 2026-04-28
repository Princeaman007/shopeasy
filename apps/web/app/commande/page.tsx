import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CommandeRedirect() {
  const cookieStore = cookies();
  const shopSlug = cookieStore.get('currentShop')?.value;
  if (shopSlug) redirect(`/${shopSlug}/commande`);
  redirect('/');
}