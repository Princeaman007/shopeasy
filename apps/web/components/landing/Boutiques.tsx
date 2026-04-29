
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

function CarteBoutique({ boutique }: { boutique: Boutique }) {
  return (
    <Link href={`https://${boutique.slug}.shopeasyci.store`}
      className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300">
      <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ aspectRatio: '16/6' }}>
        {boutique.heroImage ? (
          <Image src={boutique.heroImage} alt={boutique.name} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="100vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-elevated" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-bold text-sm">{boutique.name}</p>
        </div>
      </div>

      {/* ── Aperçu produits ── */}
      {boutique.produits?.length > 0 && (
        <div className="p-4 space-y-2">
          <p className="text-muted text-xs font-medium uppercase tracking-wide">Quelques produits</p>
          <div className="grid grid-cols-3 gap-2">
            {boutique.produits.slice(0, 3).map((produit) => (
              <div key={produit._id}
                className="aspect-square rounded-xl overflow-hidden bg-elevated border border-border relative">
                {produit.images?.[0] ? (
                  <Image src={produit.images[0]} alt={produit.name} fill
                    className="object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={16} className="text-muted" />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-1">
                  <p className="text-primary text-xs font-bold truncate">{formatFcfa(produit.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-4 pt-3 flex items-center justify-between">
        <span className="text-muted text-xs">
          {boutique.produits?.length > 0 ? `${boutique.produits.length}+ produits` : 'Boutique premium'}
        </span>
        <span className="text-primary text-xs font-semibold">Visiter</span>
      </div>
    </Link>
  );
}

export default async function Boutiques() {
  const boutiques = await fetchBoutiques();

  return (
    <section id="boutiques" className="py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
            <span className="text-primary text-sm font-medium">Boutiques du moment</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Rejoignez des centaines de vendeurs
          </h2>
        </div>
        {boutiques.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {boutiques.slice(0, 6).map((b) => <CarteBoutique key={b._id} boutique={b} />)}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag size={28} className="text-muted mx-auto mb-4" />
            <p className="text-muted">Les premieres boutiques premium apparaitront ici.</p>
          </div>
        )}
        <div className="mt-12 text-center">
          <Link href="/inscription"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold px-6 py-3 rounded-xl">
            Creer ma boutique
          </Link>
        </div>
      </div>
    </section>
  );
}
