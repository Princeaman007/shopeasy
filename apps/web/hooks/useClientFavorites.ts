'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ProduitFavori {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images: string[];
  slug: string;
  shopId: {
    _id: string;
    name: string;
    slug: string;
  };
  status: 'active' | 'draft' | 'out_of_stock';
}

export function useClientFavorites() {
  const [favoris, setFavoris]       = useState<ProduitFavori[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur]         = useState<string | null>(null);

  const fetchFavoris = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/favoris`,
        {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFavoris(data.favoris || []);
    } catch {
      setErreur('Impossible de charger vos favoris');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { fetchFavoris(); }, [fetchFavoris]);

  // Retirer un favori
  const retirerFavori = useCallback(async (productId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/favoris/${productId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFavoris((prev) => prev.filter((p) => p._id !== productId));
    } catch {
      // Ignore
    }
  }, []);

  return { favoris, chargement, erreur, retirerFavori };
}