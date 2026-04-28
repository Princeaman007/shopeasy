import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://shopeasy-k4rb.onrender.com/api';

// ✅ Désactive le body parser Next.js pour permettre les uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Headers CORS pour autoriser tous les sous-domaines shopeasyci.store
function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowed =
    origin.endsWith('.shopeasyci.store') ||
    origin === 'https://www.shopeasyci.store' ||
    origin === 'https://shopeasyci.store' ||
    origin === 'https://shopeasy-web.vercel.app' ||
    origin.includes('localhost');

  return {
    'Access-Control-Allow-Origin':      allowed ? origin : 'https://www.shopeasyci.store',
    'Access-Control-Allow-Methods':     'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':     'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

async function proxyRequest(req: NextRequest, params: { path: string[] }, method: string) {
  try {
    const path = params.path.join('/');
    const url  = `${API_BASE}/${path}${req.nextUrl.search}`;

    const headers: Record<string, string> = {};

    // ✅ Transfère Authorization
    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;

    const contentType = req.headers.get('content-type') || '';

    let body: BodyInit | null = null;

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      // ✅ Si c'est un upload (multipart/form-data), passe le FormData directement
      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        body = formData;
        // Ne pas forcer Content-Type — le browser le génère avec le boundary
      } else {
        // JSON normal
        headers['Content-Type'] = 'application/json';
        body = await req.text();
      }
    }

    const options: RequestInit = { method, headers, cache: 'no-store' };
    if (body) options.body = body;

    const res  = await fetch(url, options);
    const text = await res.text();

    return new NextResponse(text, {
      status:  res.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(req),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ✅ Gestion des requêtes OPTIONS (preflight CORS)
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status:  204,
    headers: corsHeaders(req),
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params, 'GET');
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params, 'POST');
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params, 'PUT');
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params, 'PATCH');
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params, 'DELETE');
}