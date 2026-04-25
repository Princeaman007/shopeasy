import Link  from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';

interface Boutique {
  _id:           string;
  slug:          string;
  name:          string;
  isVerified:    boolean;
  selectedTheme: string;
  heroImage?:    string;
  logo?:         string;
  about?: {
    description?: string;
    location?:    string;
  };
  produits: {
    _id:    string;
    name:   string;
    price:  number;
    images: string[];
  }[];
}

const formatFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

async function fetchBoutiques(): Promise<Boutique[]> {
  try {
    const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(
      `${API}/shops/annuaire?page=1`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.boutiques || [];
  } catch {
    return [];
  }
}