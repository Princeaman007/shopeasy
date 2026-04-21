import { NextRequest, NextResponse } from 'next/server';

const ROUTES_DASHBOARD = ['/dashboard'];
const ROUTES_ADMIN     = ['/admin'];
const ROUTES_CLIENT    = ['/mes-commandes', '/mes-favoris', '/mes-adresses', '/profil'];
const ROUTES_AUTH      = ['/connexion', '/inscription', '/inscription-client', '/mot-de-passe-oublie'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get('token')?.value;

  let payload: { userId: string; role: string; exp?: number; shopId?: string } | null = null;

  if (token) {
    try {
      const base64Payload = token.split('.')[1];
      const decoded       = Buffer.from(base64Payload, 'base64').toString('utf-8');
      const parsed        = JSON.parse(decoded);

      // ⚠️ Vérifie l'expiration
      if (parsed.exp && parsed.exp * 1000 > Date.now()) {
        payload = parsed;
      }
      // Si expiré → payload reste null
    } catch {
      // Token malformé
    }
  }

  const isConnecte = !!payload;
  const role       = payload?.role;

  if (ROUTES_DASHBOARD.some(r => pathname.startsWith(r))) {
    if (!isConnecte) return NextResponse.redirect(new URL('/connexion', req.url));
    if (role !== 'merchant') return NextResponse.redirect(new URL('/', req.url));
  }

  if (ROUTES_ADMIN.some(r => pathname.startsWith(r))) {
    if (!isConnecte) return NextResponse.redirect(new URL('/connexion', req.url));
    if (role !== 'admin') return NextResponse.redirect(new URL('/', req.url));
  }

  if (ROUTES_CLIENT.some(r => pathname.startsWith(r))) {
    if (!isConnecte) return NextResponse.redirect(new URL('/connexion', req.url));
  }

  if (ROUTES_AUTH.some(r => pathname.startsWith(r))) {
    if (isConnecte) {
      if (role === 'admin')    return NextResponse.redirect(new URL('/admin',     req.url));
      if (role === 'merchant') return NextResponse.redirect(new URL('/dashboard', req.url));
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/mes-commandes/:path*',
    '/mes-favoris/:path*',
    '/mes-adresses/:path*',
    '/profil/:path*',
    '/connexion',
    '/inscription',
    '/inscription-client',
    '/mot-de-passe-oublie',
  ],
};