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
    'vendre en ligne Côte d\'Ivoire',
    'ShopEasy CI',
    'boutique Instagram Abidjan',
    'vendre sur internet Côte d\'Ivoire',
    'e-commerce ivoirien',
    'boutique en ligne Abidjan',
  ],
  authors: [{ name: 'ShopEasy CI' }],
  creator: 'ShopEasy CI',
  publisher: 'ShopEasy CI',
  metadataBase: new URL('https://www.shopeasyci.store'),
  alternates: {
    canonical: 'https://www.shopeasyci.store',
  },
  openGraph: {
    title:       'ShopEasy CI — Votre boutique en ligne',
    description: "Transformez votre activité Instagram, TikTok ou Facebook en boutique professionnelle. Créez votre boutique en ligne en quelques minutes en Côte d'Ivoire.",
    url:         'https://www.shopeasyci.store',
    siteName:    'ShopEasy CI',
    locale:      'fr_CI',
    type:        'website',
    images: [
      {
        url:    '/Design_sans_titre__2_.png',
        width:  800,
        height: 800,
        alt:    'ShopEasy CI — Boutique en ligne Côte d\'Ivoire',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'ShopEasy CI — Boutique en ligne Côte d\'Ivoire',
    description: "Créez votre boutique en ligne professionnelle en quelques minutes.",
    images:      ['/Design_sans_titre__2_.png'],
  },
  robots: {
    index:          true,
    follow:         true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  icons: {
    icon:  '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: '<meta name="google-site-verification" content="ItxQUaN0VClmrBRIR8Ek-qM4V17EhskLBKRTGCSw_Sc" />',
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