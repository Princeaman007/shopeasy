import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ShoppingBag size={18} className="text-black" />
              </div>
              <span className="text-white font-bold text-lg">
                Shop<span className="text-primary">Easy</span> CI
              </span>
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              La plateforme e-commerce pensee pour les vendeurs ivoiriens.
              Transformez votre activite en boutique professionnelle.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Produit</h3>
            <ul className="space-y-2">
              <li><Link href="/tarifs"      className="text-muted hover:text-white transition-colors text-sm">Tarifs</Link></li>
              <li><Link href="/themes"      className="text-muted hover:text-white transition-colors text-sm">Themes</Link></li>
              <li><Link href="/boutiques"   className="text-muted hover:text-white transition-colors text-sm">Boutiques</Link></li>
              <li><Link href="/inscription" className="text-muted hover:text-white transition-colors text-sm">Creer une boutique</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="#faq" className="text-muted hover:text-white transition-colors text-sm">FAQ</Link></li>
              <li><a href="https://wa.me/32467620878" target="_blank" rel="noopener noreferrer"
                className="text-muted hover:text-white transition-colors text-sm">WhatsApp</a></li>
              <li><a href="mailto:contact@shopeasyci.store"
                className="text-muted hover:text-white transition-colors text-sm">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/cgu" className="text-muted hover:text-white transition-colors text-sm">CGU</Link></li>
              <li><Link href="/cgv" className="text-muted hover:text-white transition-colors text-sm">CGV</Link></li>
            </ul>
          </div>
        </div>

       <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted text-sm">
            &copy; {new Date().getFullYear()} ShopEasy CI — Tous droits reserves
          </p>
          <div className="flex items-center gap-4">
            <Link href="/cgu" className="text-muted hover:text-white text-xs transition-colors">CGU</Link>
            <Link href="/cgv" className="text-muted hover:text-white text-xs transition-colors">CGV</Link>
            <p className="text-muted text-sm">
              Développé par <span className="text-primary font-semibold">PrinceDev</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}