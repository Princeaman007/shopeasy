import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Hero        from '@/components/landing/Hero';
import HowItWorks  from '@/components/landing/HowItWorks';
import Boutiques   from '@/components/landing/Boutiques';
import Themes      from '@/components/landing/Themes';
import Tarifs      from '@/components/landing/Tarifs';
import Faq         from '@/components/landing/Faq';

// ── Recupere le role de l'utilisateur connecte, si token present ─────────────
async function getUserRole(): Promise<string | null> {
  const token = cookies().get('token')?.value;
  if (!token) return null;

  try {
    const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.user?.role ?? null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const role = await getUserRole();

  // Un client connecte n'a rien a faire sur la landing marketing —
  // il est envoye directement vers l'espace boutiques/produits
  if (role === 'client') {
    redirect('/boutiques');
  }

  return (
    <main>
      <Hero />
      <HowItWorks />
      <Boutiques />
      <Themes />
      <Tarifs />
      <Faq />
    </main>
  );
}