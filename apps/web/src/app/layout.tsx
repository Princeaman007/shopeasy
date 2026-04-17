import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'ShopEasy CI — Vendez en ligne en Côte d\'Ivoire',
  description: 'Créez votre boutique en ligne en quelques minutes. Idéal pour les vendeurs Instagram, TikTok et Facebook en Côte d\'Ivoire.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}