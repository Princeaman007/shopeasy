'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface Props {
  shopSlug:  string;
  produitId: string;
  nom:       string;
  prix:      number;
  image:     string | null;
  accent:    string;
  className?: string;
}

export default function BoutonFavori({ shopSlug, produitId, nom, prix, image, accent, className = '' }: Props) {
  const [estFavori, setEstFavori] = useState(false);

  const cle = `favoris_${shopSlug}`;

  useEffect(() => {
    const data = localStorage.getItem(cle);
    const liste = data ? JSON.parse(data) : [];
    setEstFavori(liste.some((f: any) => f._id === produitId));
  }, [produitId, cle]);

  const basculer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data  = localStorage.getItem(cle);
    const liste = data ? JSON.parse(data) : [];

    if (estFavori) {
      const nouvelle = liste.filter((f: any) => f._id !== produitId);
      localStorage.setItem(cle, JSON.stringify(nouvelle));
      setEstFavori(false);
    } else {
      liste.push({ _id: produitId, nom, prix, image });
      localStorage.setItem(cle, JSON.stringify(liste));
      setEstFavori(true);
    }
    window.dispatchEvent(new Event('favoris-updated'));
  };

  return (
    <button
      onClick={basculer}
      className={`flex items-center justify-center rounded-full transition-all hover:scale-110 ${className}`}
      title={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart
        size={18}
        fill={estFavori ? accent : 'none'}
        stroke={estFavori ? accent : '#fff'}
        strokeWidth={2}
      />
    </button>
  );
}