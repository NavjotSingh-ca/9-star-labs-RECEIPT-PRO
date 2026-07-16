import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

// Generate UUID without relying on crypto.randomUUID() (not available in Edge runtime)
function generateUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Version 4 (random) UUID
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes].map((b, i) => (i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') + b.toString(16).padStart(2, '0')).join('');
}

// CSRF token generation and validation
function generateCSRFToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

function getOrCreateCSRFToken(request: NextRequest, response: NextResponse): string {
  const cookieName = 'csrf-token';
  let token = request.cookies.get(cookieName)?.value;
  if (!token) {
    token = generateCSRFToken();
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  return token;
}

function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get('csrf-token')?.value;
  const headerToken = request.headers.get('x-csrf-token') || request.headers.get('csrf-token');
  if (!cookieToken || !headerToken) return false;
  // Constant-time comparison
  if (cookieToken.length !== headerToken.length) return false;
  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return result === 0;
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Page routes accessible without a session. Everything else requires auth.
const publicPaths = ['/', '/privacy', '/terms', '/auth/callback'];

// Static asset paths that should never trigger middleware auth checks.
const staticPaths = ['/sw.js', '/manifest.json', '/favicon.ico'];

// API routes that are intentionally public. Each self-authenticates:
//   - /api/health, /api/docs   → informational only (docs is static spec)
//   - /api/stripe/webhook      → verifies Stripe signature in-handler
//   - /api/email/inbound       → verifies Resend HMAC in-handler
//   - /api/digest/*            → verifies CRON_SECRET in-handler
//   - /api/integrations/*      → stubs returning 503 'coming soon'
// All other /api routes must enforce their own session/org check.
const publicApiPrefixes = [
  '/api/health',
  '/api/docs',
  '/api/stripe/webhook',
  '/api/email/inbound',
  '/api/digest/',
  '/api/integrations/',
];

function buildCSP(): string {
  // NOTE: Nonce-based CSP with strict-dynamic was attempted but is incompatible with
  // this Next.js version's chunk loading. The x-nonce header is not consumed by Next.js
  // to add nonce attributes to <script src="..."> tags for chunk files, so all chunks
  // are blocked. Using 'unsafe-inline' + 'self' as a practical alternative.
  // Revisit when Next.js improves nonce propagation for dynamically loaded chunks.
  // 
  // Security tradeoff: without a nonce, any injected inline script can execute. However,
  // external scripts from unknown origins are still blocked by the lack of their URLs.
  // XSS protection relies on React's built-in escaping + HttpOnly cookies + CSRF tokens.
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",   // needed because nonce mechanism doesn't propagate to chunk files
    "'unsafe-eval'",     // needed for Recharts / Framer Motion
    "https://js.stripe.com",
    "https://*.posthog.com",
  ].join(' ');

  const styleSrc = [
    "'self'",
    "'unsafe-inline'",
  ].join(' ');

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
    "media-src 'self' blob:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in https://generativelanguage.googleapis.com https://api.resend.com https://*.posthog.com https://js.stripe.com wss://*.supabase.co",
    "font-src 'self' data:",
    "frame-src https://js.stripe.com",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Placeholder mode: skip auth checks to avoid hanging on fake Supabase URL
  // (CI tests with real mock URLs will pass through to the mocked createServerClient)
  if (SUPABASE_URL.includes('placeholder') || SUPABASE_ANON_KEY.includes('placeholder')) {
    const resp = NextResponse.next({ request });
    resp.headers.set('x-request-id', generateUUID());
    return resp;
  }

  const isPublic =
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') ||
    staticPaths.includes(pathname) ||
    publicApiPrefixes.some((p) => pathname === p || pathname.startsWith(p));

  // Generate request ID for tracing
  const requestId = generateUUID();
  
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          return fetch(url, { ...init, signal: controller.signal }).finally(() =>
            clearTimeout(timeoutId)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    // API callers expect JSON, not an HTML redirect to the login page.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Validate CSRF for mutating requests (non-GET, non-HEAD)
  if (user && !isPublic && !['GET', 'HEAD'].includes(request.method)) {
    if (!validateCSRFToken(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }
  }

  // Re-set CSRF cookie + headers AFTER getUser() to fix setAll() reassignment bug:
  // The setAll callback in createServerClient reassigns supabaseResponse on cookie
  // refresh, discarding any cookies/headers set before getUser(). Re-create them here
  // on the final response since no more Supabase cookie ops occur after this point.
  const csrfToken = getOrCreateCSRFToken(request, supabaseResponse);
  supabaseResponse.headers.set('x-csrf-token', csrfToken);
  supabaseResponse.headers.set('x-request-id', requestId);

  const csp = buildCSP();
  supabaseResponse.headers.set('Content-Security-Policy', csp);

  // Security headers
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    supabaseResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
