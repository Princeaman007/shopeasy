import Link  from 'next/link';
import Image from 'next/image';
import { ShoppingBag, BadgeCheck, MapPin } from 'lucide-react';

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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/annuaire?page=1`,
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
    <Link href={`/${boutique.slug}`}
      className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">

      {/* Hero */}
      <div className="relative h-40 overflow-hidden">
        {boutique.heroImage ? (
          <Image src={boutique.heroImage} alt={boutique.name} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-elevated" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {boutique.isVerified && (
          <div className="absolute top-3 right-3 bg-primary rounded-lg px-2 py-1 flex items-center gap-1">
            <BadgeCheck size={12} className="text-black" />
            <span className="text-black text-xs font-bold">Verifie</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {boutique.logo ? (
            <Image src={boutique.logo} alt={boutique.name} width={36} height={36}
              className="rounded-xl object-cover border-2 border-white/20 shadow-lg" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg border-2 border-white/20">
              <span className="text-black font-bold text-base">
                {boutique.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-white font-bold text-sm drop-shadow-lg">{boutique.name}</p>
            {boutique.about?.location && (
              <p className="text-white/70 text-xs flex items-center gap-1">
                <MapPin size={9} /> {boutique.about.location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {boutique.about?.description && (
        <div className="px-4 pt-3">
          <p className="text-muted text-xs line-clamp-2">{boutique.about.description}</p>
        </div>
      )}

      {/* Apercu produits */}
      {boutique.produits?.length > 0 && (
        <div className="p-4 space-y-2">
          <p className="text-muted text-xs font-medium uppercase tracking-wide">Quelques produits</p>
          <div className="grid grid-cols-3 gap-2">
            {boutique.produits.map((produit) => (
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

      {/* Footer carte */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <span className="text-muted text-xs">
          {boutique.produits?.length > 0 ? `${boutique.produits.length}+ produits` : 'Boutique premium'}
        </span>
        <span className="text-primary text-xs font-semibold group-hover:underline">Visiter</span>
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
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Ces boutiques ont ete creees avec ShopEasy CI. La votre pourrait etre
            la prochaine a apparaitre ici.
          </p>
        </div>

        {boutiques.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {boutiques.slice(0, 6).map((boutique) => (
              <CarteBoutique key={boutique._id} boutique={boutique} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} className="text-muted" />
            </div>
            <p className="text-muted">Les premieres boutiques premium apparaitront ici.</p>
          </div>
        )}

        <div className="mt-12 text-center space-y-4">
          <p className="text-muted">Les boutiques Premium apparaissent automatiquement sur cette vitrine.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/boutiques"
              className="inline-flex items-center gap-2 bg-elevated hover:bg-border border border-border text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Voir toutes les boutiques
            </Link>
            <Link href="/inscription"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105">
              Creer ma boutique
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}