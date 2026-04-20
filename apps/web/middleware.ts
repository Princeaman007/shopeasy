import { NextRequest, NextResponse } from 'next/server';

// ─── Routes protégées ─────────────────────────────────────────────────────────

/**
 * Routes accessibles uniquement aux marchands connectés
 */
const ROUTES_DASHBOARD = ['/dashboard'];

/**
 * Routes accessibles uniquement aux admins
 */
const ROUTES_ADMIN = ['/admin'];

/**
 * Routes accessibles uniquement aux clients connectés
 */
const ROUTES_CLIENT = ['/mes-commandes', '/mes-favoris', '/mes-adresses', '/profil'];

/**
 * Routes accessibles uniquement aux non-connectés
 */
const ROUTES_AUTH = ['/connexion', '/inscription','/inscription-client', '/mot-de-passe-oublie'];

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Récupère le token depuis les cookies
  const token = req.cookies.get('token')?.value;

  // Décode le payload JWT sans vérifier la signature
  // (la vérification se fait côté API)
  let payload: { userId: string; role: string; shopId?: string } | null = null;

  if (token) {
    try {
      const base64Payload = token.split('.')[1];
      const decoded = Buffer.from(base64Payload, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch {
      // Token malformé — on ignore
    }
  }

  const isConnecte = !!payload;
  const role       = payload?.role;

  // ── Redirection si non connecté sur routes protégées ──

  if (ROUTES_DASHBOARD.some((r) => pathname.startsWith(r))) {
    if (!isConnecte) {
      return NextResponse.redirect(new URL('/connexion', req.url));
    }
    if (role !== 'merchant') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (ROUTES_ADMIN.some((r) => pathname.startsWith(r))) {
    if (!isConnecte) {
      return NextResponse.redirect(new URL('/connexion', req.url));
    }
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (ROUTES_CLIENT.some((r) => pathname.startsWith(r))) {
    if (!isConnecte) {
      return NextResponse.redirect(new URL('/connexion', req.url));
    }
  }

  // ── Redirection si déjà connecté sur routes auth ──

  if (ROUTES_AUTH.some((r) => pathname.startsWith(r))) {
    if (isConnecte) {
      if (role === 'admin')    return NextResponse.redirect(new URL('/admin', req.url));
      if (role === 'merchant') return NextResponse.redirect(new URL('/dashboard', req.url));
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

// ─── Config — routes sur lesquelles le middleware s'applique ─────────────────

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