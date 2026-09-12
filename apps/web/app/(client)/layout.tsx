// ─── apps/web/app/(client)/layout.tsx ──────────────────────────────────────────
// Fichier complet — remplace le layout minimal existant

import type { Metadata } from 'next';

// ── Metadata specifique a l'espace client ──────────────────────────────────
// Le champ "manifest" ici ecrase celui du layout racine UNIQUEMENT pour
// les pages de ce groupe — c'est ce qui corrige "Ajouter a l'ecran d'accueil"
export const metadata: Metadata = {
  title: {
    default:  'ShopEasy CI — Des milliers de produits livres chez vous',
    template: '%s | ShopEasy CI',
  },
  description:
    "Decouvrez des milliers de produits de boutiques ivoiriennes verifiees. Paiement uniquement a la livraison, partout en Cote d'Ivoire.",
  manifest: '/manifest-client.webmanifest',
  icons: {
    icon:  '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}