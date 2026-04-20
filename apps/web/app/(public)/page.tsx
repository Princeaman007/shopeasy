import Hero        from '@/components/landing/Hero';
import HowItWorks  from '@/components/landing/HowItWorks';
import Boutiques   from '@/components/landing/Boutiques';
import Themes      from '@/components/landing/Themes';
import Tarifs      from '@/components/landing/Tarifs';
import Faq         from '@/components/landing/Faq';

export default function HomePage() {
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