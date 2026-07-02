import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';


// Page routes accessible without a session. Everything else requires auth.
const publicPaths = ['/', '/privacy', '/terms', '/auth/callback'];

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

function buildCSP(nonce: string): string {
  if (process.env.NODE_ENV === 'development') return '';
  // Note: 'unsafe-inline' needed for script-src and style-src because Turbopack (Next.js 16)
  // has a known nonce-propagation bug — inline <script>/<style> blocks lack nonce attributes.
  // Without 'unsafe-inline', CSP blocks essential Next.js hydration scripts, RSC payloads,
  // inline styles, and service worker registration. Remove 'unsafe-inline' once upstream is fixed.
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' 'nonce-${nonce}' https://js.stripe.com https://*.posthog.com`,
    `style-src 'self' 'unsafe-inline' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
    "media-src 'self' blob:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in https://generativelanguage.googleapis.com https://api.resend.com https://*.posthog.com https://js.stripe.com wss://*.supabase.co",
    "font-src 'self' data:",
    'frame-src https://js.stripe.com',
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') ||
    publicApiPrefixes.some((p) => pathname === p || pathname.startsWith(p));

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Production CSP — nonce-based, applied as response header
  const nonce = crypto.randomUUID();
  // Propagate nonce to Next.js so it adds nonce attributes to inline <script>/<style> tags
  supabaseResponse.headers.set('x-nonce', nonce);
  const csp = buildCSP(nonce);
  if (csp) {
    supabaseResponse.headers.set('Content-Security-Policy', csp);
  }

  return supabaseResponse;
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
