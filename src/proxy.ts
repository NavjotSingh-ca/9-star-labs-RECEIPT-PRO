import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const requestHeaders = new Headers(request.headers);

  if (!isDev) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const cspParts = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.googleapis.com https://generativelanguage.googleapis.com https://js.stripe.com https://api.stripe.com https://api.resend.com",
      "frame-ancestors 'none'",
    ];
    const cspHeader = cspParts.join('; ');
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
