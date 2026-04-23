'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

interface Props {
  shopSlug: string;
  accent: string;
}

export default function BoutonPanier({ shopSlug, accent }: Props) {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const calculerCount = () => {
      try {
        const data = localStorage.getItem(`panier_${shopSlug}`);
        if (!data) { setCount(0); return; }
        const items = JSON.parse(data);
        const total = items.reduce(
          (acc: number, item: { quantite: number }) => acc + item.quantite, 0
        );
        setCount(total);
      } catch {
        setCount(0);
      }
    };

    calculerCount();
    window.addEventListener('storage', calculerCount);
    window.addEventListener('panier-updated', calculerCount);

    return () => {
      window.removeEventListener('storage', calculerCount);
      window.removeEventListener('panier-updated', calculerCount);
    };
  }, [shopSlug]);

  return (
    <Link
      href={`/${shopSlug}/panier`}
      className="relative flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition-all hover:opacity-90"
      style={{ backgroundColor: accent, color: '#fff' }}
    >
      <ShoppingCart size={16} />
      <span className="hidden sm:inline">Panier</span>

      {/* Badge compteur  affiché seulement après montage */}
      {mounted && count > 0 && (
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}