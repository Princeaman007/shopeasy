import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:       'ShopEasy CI — Votre boutique en ligne',
  description: 'Créez votre boutique en ligne en quelques minutes. Solution e-commerce pour les vendeurs ivoiriens.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-bg text-white`}>
        {children}
      </body>
    </html>
  );
}