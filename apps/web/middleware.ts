import { NextRequest, NextResponse } from 'next/server';

const ROUTES_DASHBOARD = ['/dashboard'];
const ROUTES_ADMIN     = ['/admin'];
const ROUTES_CLIENT    = ['/mes-commandes', '/mes-favoris', '/mes-adresses', '/profil'];
const ROUTES_AUTH      = ['/connexion', '/inscription', '/inscription-client', '/mot-de-passe-oublie'];

const MAIN_DOMAINS = [
  'shopeasyci.store',
  'www.shopeasyci.store',
  'shopeasy-web.vercel.app',
  'localhost:3000',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname     = req.headers.get('host') || '';

  // ✅ Détection sous-domaine boutique
  const isMainDomain = MAIN_DOMAINS.some(d => hostname === d || hostname.endsWith(d));
  const isSubdomain  = !isMainDomain && (
    hostname.endsWith('.shopeasyci.store') ||
    hostname.endsWith('.shopeasyci.ci')
  );

  // ✅ Rewrite sous-domaine → /[shopSlug]/...
  if (isSubdomain) {
    const shopSlug = hostname.split('.')[0];
    const url      = req.nextUrl.clone();

    const cleanPath = pathname.startsWith(`/${shopSlug}`)
      ? pathname.slice(shopSlug.length + 1) || '/'
      : pathname;

    url.pathname = cleanPath === '/'
      ? `/${shopSlug}`
      : `/${shopSlug}${cleanPath}`;

    return NextResponse.rewrite(url);
  }

  // ── Auth (domaine principal uniquement) ───────────────────────────────────
  const token = req.cookies.get('token')?.value;
  let payload: { userId: string; role: string; exp?: number; shopId?: string } | null = null;

  if (token) {
    try {
      const base64Payload = token.split('.')[1];
      const decoded       = Buffer.from(base64Payload, 'base64').toString('utf-8');
      const parsed        = JSON.parse(decoded);
      if (parsed.exp && parsed.exp * 1000 > Date.now()) {
        payload = parsed;
      }
    } catch { }
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};