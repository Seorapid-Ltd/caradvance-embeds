// CarAdvance Sales Desk (/sales/).
// Anyone with the link may view the cars (read-only, via /api/desk/public). Editing, dealers and the
// activity log need a signed-in account with Sales Desk access (/api/desk/data, checked in lib/desk-api.js).
// Not for search engines: noindex on every response.
// Photos (fixed file names) are cached by the browser for 30 days, so lists and galleries open instantly;
// fonts for a year, versioned scripts/data (…?v=) for a day; the page itself is re-checked on every visit (ETag → 304 when unchanged).
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
  // The page itself: an ETag from its content, so a repeat visit gets "304 Not Modified" (a few hundred bytes)
  // instead of downloading the whole page again; it is still re-checked on every visit, so changes show at once.
  if (res.status === 200 && (request.method === 'GET' || request.method === 'HEAD') && /text\/html/i.test(res.headers.get('content-type') || '')) {
    const body = await r.arrayBuffer();
    const tag = '"' + [...new Uint8Array(await crypto.subtle.digest('SHA-1', body))].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('') + '"';
    const h = new Headers(r.headers); h.set('ETag', tag); h.set('X-Desk-Version', tag.replace(/"/g, '')); // same value, kept even where a proxy drops ETag h.delete('Content-Length');
    const inm = request.headers.get('If-None-Match') || '';
    if (inm.split(',').some(t => t.trim().replace(/^W\//, '') === tag)) { h.delete('Content-Type'); return new Response(null, { status: 304, headers: h }); }
    return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers: h });
  }
  return r;
}
