// CarAdvance Sales Desk (/sales/).
// Anyone with the link may view the cars (read-only, via /api/desk/public). Editing, dealers and the
// activity log need a signed-in account with Sales Desk access (/api/desk/data, checked in lib/desk-api.js).
// Not for search engines: noindex on every response.
// Photos (fixed file names) are cached by the browser for 30 days, so lists and galleries open instantly;
// fonts for a year, versioned scripts/data (…?v=) for a day; the page itself is re-checked on every visit.
export async function onRequest({ request, next }) {
  const res = await next();
  const r = new Response(res.body, res);
  const p = new URL(request.url).pathname;
  const versioned = new URL(request.url).searchParams.has('v'); // desk-shim.js?v=…, desk-skcz-dict.json?v=… — the name changes when the file does
  r.headers.set('Cache-Control', !res.ok ? 'private, no-cache'
    : /^\/sales\/img\/.+\.(jpe?g|png|webp)$/i.test(p) ? 'public, max-age=2592000, stale-while-revalidate=86400'
    : /\.woff2$/i.test(p) ? 'public, max-age=31536000, immutable' // fonts never change
    : versioned && /\.(js|json|css)$/i.test(p) ? 'public, max-age=86400, stale-while-revalidate=604800'
    : /\.json$/i.test(p) ? 'private, max-age=60, stale-while-revalidate=600' : 'private, no-cache');
  r.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return r;
}
