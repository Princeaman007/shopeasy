import Link from 'next/link';
export default function BoutiqueNotFound() {
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <div className="text-center space-y-4">
                <p className="text-6xl"></p>
                <h1 className="text-white text-2xl font-bold">Boutique introuvable</h1>
                <p className="text-muted">
                    Cette boutique n'existe pas ou n'est plus disponible.
                </p>
                <Link
                    href="https://www.shopeasyci.store"
                    className="inline-block mt-4 bg-primary hover:bg-primary-hover
             text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                    Retour à ShopEasy CI
                </Link>
            </div>
        </div>
    );
}