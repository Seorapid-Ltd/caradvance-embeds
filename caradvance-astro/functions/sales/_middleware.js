// CarAdvance Sales Desk (/sales/).
// Anyone with the link may view the cars (read-only, via /api/desk/public). Editing, dealers and the
// activity log need a signed-in account with Sales Desk access (/api/desk/data, checked in lib/desk-api.js).
// Not for search engines: noindex on every response.
// Photos (fixed file names) are cached by the browser for 30 days, so lists and galleries open instantly;
// fonts for a year, versioned scripts/data (…?v=) for a day; the page itself is re-checked on every visit (ETag → 304 when unchanged).
// Link previews (WhatsApp, iMessage, LinkedIn…): the page is one shared file, so its share tags are set per domain here —
// the domain's language, its own address and its own share image (when one is made for that language).
const OG_LANG = { hu: 'hu', sk: 'sk', cz: 'cs', pl: 'pl', ch: 'de', eu: 'en' };
const OG_TXT = { // the blurb of the share poster, in the domain's language
  en: ['Premium cars from Germany', 'New car orders · Import · Long-term rental from 6 months · Turnkey service — since 2003'],
  hu: ['Prémium autók Németországból', 'Új autó rendelés · Import · Tartós bérlet 6 hónaptól · Kulcsrakészen — 2003 óta'],
  sk: ['Prémiové autá z Nemecka', 'Objednávka nového auta · Dovoz · Dlhodobý prenájom od 6 mesiacov · Na kľúč — od roku 2003'],
  cs: ['Prémiové vozy z Německa', 'Objednávka nového vozu · Dovoz · Dlouhodobý pronájem od 6 měsíců · Na klíč — od roku 2003'],
  de: ['Premium-Autos aus Deutschland', 'Neuwagen-Bestellung · Import · Langzeitmiete ab 6 Monaten · Schlüsselfertig — seit 2003'],
  pl: ['Samochody premium z Niemiec', 'Nowe auta na zamówienie · Import · Wynajem od 6 miesięcy · Pod klucz — od 2003 roku']
};
const OG_IMG = new Set(['en', 'hu', 'sk', 'cs', 'de', 'pl']); // languages that have /sales/img/og-sales-<lang>.jpg
const escA = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function shareTags(html, url) {
  const tld = (url.hostname.match(/\.([a-z]{2})$/) || [])[1];
  const lang = OG_LANG[tld]; if (!lang) return html;
  const [title, desc] = OG_TXT[lang], page = `${url.origin}/sales/`;
  const set = (attr, key, val) => { const re = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*\\/?>`, 'i'); const tag = `<meta ${attr}="${key}" content="${escA(val)}">`; html = re.test(html) ? html.replace(re, tag) : html.replace(/<\/head>/i, tag + '</head>'); };
  set('property', 'og:title', 'CarAdvance — ' + title); set('name', 'twitter:title', 'CarAdvance — ' + title);
  set('property', 'og:description', desc); set('name', 'twitter:description', desc); set('name', 'description', desc);
  set('property', 'og:url', page); set('property', 'og:locale', { en: 'en_GB', hu: 'hu_HU', sk: 'sk_SK', cs: 'cs_CZ', de: 'de_CH', pl: 'pl_PL' }[lang]);
  if (OG_IMG.has(lang)) { const img = `${url.origin}/sales/img/og-sales-${lang}.jpg`; set('property', 'og:image', img); set('name', 'twitter:image', img); }
  set('property', 'og:image:alt', 'CarAdvance — ' + title);
  return html;
}
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
  // The page itself: a content hash, so a repeat visit gets "304 Not Modified" (a few hundred bytes) instead of the
  // whole page again; it is still re-checked on every visit, so changes show at once. Cloudflare drops the ETag of
  // HTML it modifies (analytics snippet), so the hash is also sent as a Last-Modified date — a fixed date per content
  // version, compared for equality, so it need not be the real date.
  if (res.status === 200 && (request.method === 'GET' || request.method === 'HEAD') && /text\/html/i.test(res.headers.get('content-type') || '')) {
    const body = new TextEncoder().encode(shareTags(await r.text(), new URL(request.url)));
    const hex = [...new Uint8Array(await crypto.subtle.digest('SHA-1', body))].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
    const tag = '"' + hex + '"', lm = new Date(Date.UTC(2001, 0, 1) + (parseInt(hex.slice(0, 8), 16) % (20 * 365 * 86400)) * 1000).toUTCString();
    const h = new Headers(r.headers); h.set('ETag', tag); h.set('Last-Modified', lm); h.set('X-Desk-Version', hex); h.delete('Content-Length');
    const inm = request.headers.get('If-None-Match') || '', ims = request.headers.get('If-Modified-Since') || '';
    if (inm.split(',').some(t => t.trim().replace(/^W\//, '') === tag) || (!inm && ims === lm)) { h.delete('Content-Type'); return new Response(null, { status: 304, headers: h }); }
    return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers: h });
  }
  return r;
}
