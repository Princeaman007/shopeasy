import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default:  'ShopEasy CI — Boutique en ligne pour vendeurs ivoiriens',
    template: '%s | ShopEasy CI',
  },
  description:
    "Créez votre boutique en ligne professionnelle en quelques minutes. Solution e-commerce pensée pour les vendeurs Instagram, TikTok et Facebook en Côte d'Ivoire.",
  keywords: [
    "boutique en ligne Côte d'Ivoire",
    'e-commerce Abidjan',
    'vendre en ligne CI',
    'ShopEasy CI',
  ],
  openGraph: {
    title:       'ShopEasy CI — Votre boutique en ligne',
    description: "Transformez votre activité Instagram en boutique professionnelle.",
    locale:      'fr_CI',
    type:        'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-bg text-white antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}