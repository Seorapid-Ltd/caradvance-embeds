// CarAdvance Sales Desk (/sales/) — staff only. Not signed in → the staff login (/admin/), then back here.
import { whoAmI } from '../../lib/desk-api.js';
export async function onRequest({ request, env, next }) {
  try { await whoAmI(request, env); } catch (e) {
    const url = new URL(request.url);
    if (e && e.status === 403) {
      if (/\.(?:jpe?g|webp|png|woff2|json|js)$/i.test(url.pathname)) return new Response('No access.', { status: 403, headers: { 'Cache-Control': 'no-store' } });
      return new Response(`<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Sales Desk · CarAdvance</title></head>
<body style="margin:0;min-height:100vh;background:#101216;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;color:#fff">
<div style="background:#17181c;border:1px solid #2a2c33;border-radius:14px;padding:28px;width:340px;max-width:calc(100vw - 32px);text-align:center">
<div style="font-weight:800;font-size:17px">CarAdvance Sales Desk</div>
<p style="color:#c9ced8;font-size:14px;line-height:1.5;margin:14px 0 0">Ehhez a fiókhoz nincs Sales Desk hozzáférés.<br><span style="color:#8b93a7;font-size:12.5px">This account has no access to the Sales Desk.</span></p>
<a href="/admin/" style="display:block;margin-top:18px;padding:12px;border-radius:9px;background:#E2001A;color:#fff;font-weight:800;text-decoration:none">Vissza / Back</a></div></body></html>`,
        { status: 403, headers: { 'content-type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    }
    if (/\.(?:jpe?g|webp|png|woff2|json|js)$/i.test(url.pathname)) return new Response('Sign-in required.', { status: 401, headers: { 'Cache-Control': 'no-store' } });
    return Response.redirect(new URL('/admin/?next=' + encodeURIComponent(url.pathname), url.origin).toString(), 302);
  }
  const res = await next();
  const r = new Response(res.body, res);
  r.headers.set('Cache-Control', 'private, no-store');
  r.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return r;
}
