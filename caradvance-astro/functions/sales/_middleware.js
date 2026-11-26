// CarAdvance Sales Desk (/sales/).
// Anyone with the link may view the cars (read-only, via /api/desk/public). Editing, dealers and the
// activity log need a signed-in account with Sales Desk access (/api/desk/data, checked in lib/desk-api.js).
// Not for search engines: noindex on every response.
export async function onRequest({ next }) {
  const res = await next();
  const r = new Response(res.body, res);
  r.headers.set('Cache-Control', 'private, no-store');
  r.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return r;
}
