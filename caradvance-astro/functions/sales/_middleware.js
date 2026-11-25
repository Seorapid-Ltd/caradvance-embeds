// CarAdvance Sales Desk (/sales/) — staff only. Not signed in → the staff login (/admin/), then back here.
import { whoAmI } from '../../lib/desk-api.js';
export async function onRequest({ request, env, next }) {
  try { await whoAmI(request, env); } catch (e) {
    const url = new URL(request.url);
    if (/\.(?:jpe?g|webp|png|woff2|json|js)$/i.test(url.pathname)) return new Response('Sign-in required.', { status: 401, headers: { 'Cache-Control': 'no-store' } });
    return Response.redirect(new URL('/admin/?next=' + encodeURIComponent(url.pathname), url.origin).toString(), 302);
  }
  const res = await next();
  const r = new Response(res.body, res);
  r.headers.set('Cache-Control', 'private, no-store');
  r.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return r;
}
