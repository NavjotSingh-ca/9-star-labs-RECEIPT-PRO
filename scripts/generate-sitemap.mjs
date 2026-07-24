/**
 * Sitemap generation script
 * Runs at build time to generate sitemap.xml
 */

import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://leduc-receipt-pro.vercel.app';

const staticRoutes = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/privacy', changefreq: 'monthly', priority: 0.8 },
  { url: '/terms', changefreq: 'monthly', priority: 0.8 },
  { url: '/auth/callback', changefreq: 'yearly', priority: 0.3 },
  { url: '/notifications', changefreq: 'daily', priority: 0.5 },
];

const protectedRoutes = [
  { url: '/settings/admin', changefreq: 'monthly', priority: 0.4 },
  { url: '/settings/billing', changefreq: 'monthly', priority: 0.4 },
  { url: '/settings/org', changefreq: 'monthly', priority: 0.4 },
  { url: '/settings/security', changefreq: 'monthly', priority: 0.4 },
  { url: '/settings/team', changefreq: 'monthly', priority: 0.4 },
  { url: '/settings/features', changefreq: 'monthly', priority: 0.4 },
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  const allRoutes = [...staticRoutes, ...protectedRoutes];

  const urls = allRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
}

function generateRobots() {
  return `# robots.txt for Leduc Receipt Pro
# Generated automatically at build time

User-agent: *
Allow: /

# Disallow private/admin routes
Disallow: /api/
Disallow: /settings/
Disallow: /auth/
Disallow: /_next/
Disallow: /_vercel/

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml
`;
}

// Generate files
const sitemap = generateSitemap();
const robots = generateRobots();

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);

console.log('✅ sitemap.xml and robots.txt generated successfully');
console.log(`   Base URL: ${BASE_URL}`);
console.log(`   Total URLs: ${staticRoutes.length + protectedRoutes.length}`);