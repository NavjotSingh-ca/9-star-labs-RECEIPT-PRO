import { NextResponse } from 'next/server';
import spec from './openapi.json';
import { logError } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';

/**
 * GET /api/docs
 *
 * Serves OpenAPI documentation via content negotiation:
 *   - Accept: text/html → Swagger UI HTML page
 *   - Otherwise → raw openapi.json
 *
 * Public endpoint (no auth required). Rate limited: 30 requests per 60s.
 */
async function handler(request: Request) {
  try {
    const accept = request.headers.get('Accept') ?? '';

    if (accept.includes('text/html')) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API Docs — Leduc Receipt Pro</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
    });
  </script>
</body>
</html>`;

      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    logError(err, { action: 'fetch_api_docs' });
    return NextResponse.json({ error: 'Failed to load API documentation' }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, { maxTokens: 30, windowMs: 60_000, keyPrefix: 'api:docs' });
