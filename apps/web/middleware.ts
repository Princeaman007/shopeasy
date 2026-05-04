import { NextRequest, NextResponse } from 'next/server';

const ROUTES_DASHBOARD = ['/dashboard'];
const ROUTES_ADMIN     = ['/admin'];
const ROUTES_CLIENT    = ['/mes-commandes', '/mes-favoris', '/mes-adresses', '/profil'];
const ROUTES_AUTH      = ['/connexion', '/inscription', '/inscription-client', '/mot-de-passe-oublie'];

const ROOT_DOMAIN = 'shopeasyci.store';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  const isMainDomain =
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}` ||
    hostname === 'shopeasy-web.vercel.app' ||
    hostname.includes('localhost');

  const isSubdomain = !isMainDomain && hostname.endsWith(`.${ROOT_DOMAIN}`);

  // ✅ Sous-domaine → rewrite + stocke cookie currentShop
  if (isSubdomain) {
    const shopSlug = hostname.replace(`.${ROOT_DOMAIN}`, '').toLowerCase().trim();
    const url = req.nextUrl.clone();

    // ✅ Évite le double slug
    const cleanPath = pathname.startsWith(`/${shopSlug}`)
      ? pathname.slice(shopSlug.length + 1) || '/'
      : pathname;

    url.pathname = cleanPath === '/' ? `/${shopSlug}` : `/${shopSlug}${cleanPath}`;

    const response = NextResponse.rewrite(url);
    response.cookies.set('currentShop', shopSlug, {
      path:     '/',
      maxAge:   60 * 60 * 24,
      sameSite: 'lax',
      secure:   true,
    });
    return response;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  const token = req.cookies.get('token')?.value;
  let payload: { userId: string; role: string; exp?: number; shopId?: string } | null = null;

  if (token) {
    try {
      const base64Payload = token.split('.')[1];
      const decoded       = Buffer.from(base64Payload, 'base64').toString('utf-8');
      const parsed        = JSON.parse(decoded);
      if (parsed.exp && parsed.exp * 1000 > Date.now()) payload = parsed;
    } catch { }
  }

  const isConnecte = !!payload;
  const role       = payload?.role;

  if (ROUTES_DASHBOARD.some(r => pathname.startsWith(r))) {
    if (!isConnecte) return NextResponse.redirect(new URL('/connexion', req.url));
    // ✅ Autorise marchands ET équipiers (client avec shopId)
    if (role !== 'merchant' && !(role === 'client' && payload?.shopId)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
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