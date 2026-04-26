import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://shopeasy-k4rb.onrender.com/api';

async function proxyRequest(req: NextRequest, params: { path: string[] }, method: string) {
  try {
    const path = params.path.join('/');
    const url = `${API_BASE}/${path}${req.nextUrl.search}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;
    
    const options: RequestInit = { method, headers, cache: 'no-store' };
    
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = await req.text();
    }
    
    const res = await fetch(url, options);
    const text = await res.text();
    
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
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