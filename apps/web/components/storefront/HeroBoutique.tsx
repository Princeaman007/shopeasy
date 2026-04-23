'use client';

import Image from 'next/image';
import Link  from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Props {
  shop: {
    slug:       string;
    name:       string;
    heroImage?: string;
  };
  accent: string;
}

export default function HeroBoutique({ shop, accent }: Props) {
  if (!shop.heroImage) return null;

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/5' }}>

      {/* Image */}
      <Image
        src={shop.heroImage}
        alt={`Hero ${shop.name}`}
        fill
        className="object-cover object-center"
        priority
        sizes="100vw"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenu centré */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-5 px-4 text-center">
        <p className="text-white/80 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase drop-shadow">
          Bienvenue dans notre boutique
        </p>
        <h1 className="text-white font-bold text-xl sm:text-3xl md:text-4xl drop-shadow-lg">
          {shop.name}
        </h1>
        <Link
          href={`/${shop.slug}/catalogue`}
          className="flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3 rounded-full font-semibold text-xs sm:text-sm shadow-xl transition-all hover:scale-105 hover:opacity-90 mt-1"
          style={{ backgroundColor: accent, color: '#fff' }}
        >
          Explorer la boutique
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}