import Tarifs from '@/components/landing/Tarifs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* Retour */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Retour à l'accueil
        </Link>
      </div>

      {/* Header */}
      <div className="text-center py-16 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Nos <span className="text-primary">tarifs</span>
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto px-4">
          Des prix transparents adaptés aux vendeurs ivoiriens.
          Commencez gratuitement pendant 7 jours.
        </p>
      </div>

      {/* Section tarifs */}
      <Tarifs />
    </main>
  );
}