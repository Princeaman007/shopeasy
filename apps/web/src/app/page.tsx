export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 p-8">

      {/* Titre */}
      <h1 className="text-text text-5xl font-bold">
        Shop<span className="text-primary">Easy</span> CI 🇨🇮
      </h1>

      <p className="text-muted text-lg">
        Vendez en ligne en Côte d'Ivoire
      </p>

      {/* Test des composants */}
      <div className="flex gap-4 flex-wrap justify-center">
        <button className="btn-primary">Commencer gratuitement</button>
        <button className="btn-secondary">Voir les tarifs</button>
        <button className="btn-ghost">En savoir plus</button>
      </div>

      {/* Test card */}
      <div className="card max-w-sm w-full">
        <span className="badge-primary">Basic — 15 000 FCFA</span>
        <h2 className="text-text font-semibold mt-3">Boutique de test</h2>
        <p className="text-muted text-sm mt-1">
          10 produits · 2 thèmes · WhatsApp
        </p>
      </div>

    </main>
  )
}