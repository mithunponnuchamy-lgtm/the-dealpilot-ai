import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(): string {
  let backend =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000';

  if (!backend.startsWith('http://') && !backend.startsWith('https://')) {
    backend = `http://${backend}`;
  }
  if (backend.startsWith('http://dealpilot-backend') && !backend.includes(':8000')) {
    backend = `${backend}:8000`;
  }
  return backend.replace(/\/+$/, '');
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendBase = getBackendUrl();
  const subPath = (path || []).join('/');
  const search = req.nextUrl.search;
  const targetUrl = `${backendBase}/${subPath}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value);
    }
  });

  try {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });

    const resHeaders = new Headers();
    response.headers.forEach((value, key) => {
      resHeaders.set(key, value);
    });

    const resBody = await response.arrayBuffer();
    return new NextResponse(resBody, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Proxy error connecting to backend at ${backendBase}: ${err?.message || err}` },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
