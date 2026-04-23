'use client';

import Image from 'next/image';
import Link  from 'next/link';
import { ChevronRight, BadgeCheck } from 'lucide-react';

interface Props {
  shop: {
    slug:       string;
    name:       string;
    logo?:      string;
    heroImage?: string;
    isVerified: boolean;
    whatsapp:   string;
    about?: {
      description?: string;
      location?:    string;
    };
  };
  accent: string;
}

export default function HeroBoutique({ shop, accent }: Props) {
  if (!shop.heroImage) return null;

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
      {/* Image hero */}
      <Image
        src={shop.heroImage}
        alt={`Hero ${shop.name}`}
        fill
        className="object-cover"
        priority
      />

      {/* Overlay dégradé */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Contenu hero */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between gap-4">
          <div className="space-y-2">
            {/* Logo + nom */}
            <div className="flex items-center gap-3">
              {shop.logo && (
                <Image
                  src={shop.logo}
                  alt={shop.name}
                  width={48}
                  height={48}
                  className="rounded-xl object-cover border-2 border-white/20 shadow-lg"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-bold text-2xl sm:text-3xl drop-shadow-lg">
                    {shop.name}
                  </h1>
                  {shop.isVerified && (
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: accent, color: '#000' }}
                    >
                      <BadgeCheck size={11} />
                      Vérifié
                    </div>
                  )}
                </div>
                {shop.about?.location && (
                  <p className="text-white/70 text-sm"> {shop.about.location}</p>
                )}
              </div>
            </div>

            {/* Description courte */}
            {shop.about?.description && (
              <p className="text-white/80 text-sm max-w-md line-clamp-2 drop-shadow">
                {shop.about.description}
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="flex-shrink-0 hidden sm:flex gap-2">
            <Link
              href={`/${shop.slug}/catalogue`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all hover:opacity-90"
              style={{ backgroundColor: accent, color: '#fff' }}
            >
              Explorer <ChevronRight size={14} />
            </Link>
            {shop.whatsapp && (
              <Link
                href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-white/10 backdrop-blur border border-white/20 text-white transition-all hover:bg-white/20"
              >
                WhatsApp
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}