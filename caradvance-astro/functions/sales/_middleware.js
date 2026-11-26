// CarAdvance Sales Desk (/sales/).
// Anyone with the link may view the cars (read-only, via /api/desk/public). Editing, dealers and the
// activity log need a signed-in account with Sales Desk access (/api/desk/data, checked in lib/desk-api.js).
// Not for search engines: noindex on every response.
// Photos (fixed file names) are cached by the browser for 30 days, so lists and galleries open instantly;
// the page itself and its data files are re-checked on every visit.
export async function onRequest({ request, next }) {
  const res = await next();
  const r = new Response(res.body, res);
  const p = new URL(request.url).pathname;
  r.headers.set('Cache-Control', /^\/sales\/img\/.+\.(jpe?g|png|webp)$/i.test(p) && res.ok ? 'public, max-age=2592000, stale-while-revalidate=86400'
    : /\.json$/i.test(p) ? 'private, max-age=60, stale-while-revalidate=600' : 'private, no-cache');
  r.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return r;
}
