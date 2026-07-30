import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const hopByHopHeaders = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'host',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
]);

function normalizeApiBaseUrl(value: string) {
  let baseUrl = value.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!baseUrl) baseUrl = 'http://localhost:3000';
  if (!/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`;
  return baseUrl;
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || '');
  const url = new URL(request.url);
  const targetUrl = `${apiBaseUrl}/${path.join('/')}${url.search}`;
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const response = await fetch(targetUrl, {
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
    headers,
    method: request.method,
  });

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(response.body, {
    headers: responseHeaders,
    status: response.status,
    statusText: response.statusText,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
