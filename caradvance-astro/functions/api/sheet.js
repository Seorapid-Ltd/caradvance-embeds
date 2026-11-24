/**
 * CarAdvance — a készlet-tábla nyilvános, szűrt változata a weboldal böngészős szkriptjeinek.
 * GET /api/sheet?s=rent | biz
 *
 * - A táblát szerveroldalon tölti le (lib/sheet-src.js: GOOGLE_SHEETS_SA titokkal hitelesítve, ha be van állítva).
 * - CSAK a nyilvános oszlopokat adja tovább (PUBLIC_COLS) — mobile_id, forras, sajat, kulcs, utolso_latas …
 *   soha nem jut el a böngészőig (Mr. Job SK lista 2026-11-24, 15. pont). A forras/sajat helyett egy
 *   származtatott „berles_ok” oszlop jelzi, ha egy autó nem a saját flottából van (nem bérelhető).
 * - s=rent: az „autok” lap gviz-JSON-ból (mint a régi böngészős gvizJsonShim: a vegyes típusú oszlopok
 *   értékei sem vesznek el), CSV-ként.
 * - Ár nélküli nézet: külföldi látogatónál (lib/geo.js priceAllowed) az ár-oszlopok üresek — kivéve a
 *   saját piaci domaineket (.sk, .cz, .pl, .ch, .eu), ahol az árakat eddig is mutattuk.
 */
import { priceAllowed } from '../../lib/geo.js';
import { fetchGviz, parseCsvRows, gvizJsonRows, publicRows, toCsv } from '../../lib/sheet-src.js';

const SOURCES = {
  rent: { q: 'tqx=out:json&sheet=autok&headers=1', json: true },
  biz: { q: 'tqx=out:csv&sheet=bizomanyos', json: false },
};
const PRICE_COLS = new Set(['berlet_eur', 'vetel_eur', 'vetel_eur_netto', 'vetel_huf', 'vetel_ft', 'ar_ft', 'eur', 'kaucio_eur',
  'berlet_2000_eur', 'berlet_3000_eur', 'ar', 'ar_eur', 'ar_huf', 'price']);
const MARKET_HOST = /(^|\.)caradvance\.(sk|cz|pl|ch|eu)$/i;
const TTL = 120; // mp — a szűrt tábla edge-gyorsítótárban

async function loadPublic(env, key, ctx) {
  const src = SOURCES[key];
  const cacheKey = new Request('https://cache.caradvance.internal/api/sheet/v2/' + key);
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  if (cache) { const hit = await cache.match(cacheKey); if (hit) return hit.text(); }
  const r = await fetchGviz(env, src.q);
  if (!r.ok) throw new Error('upstream ' + r.status);
  const t = await r.text();
  const rows = publicRows(src.json ? gvizJsonRows(t) : parseCsvRows(t));
  const csv = toCsv(rows);
  if (cache) {
    const put = cache.put(cacheKey, new Response(csv, { headers: { 'Cache-Control': 'public, max-age=' + TTL } }));
    if (ctx && ctx.waitUntil) ctx.waitUntil(put); else await put;
  }
  return csv;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const key = new URL(request.url).searchParams.get('s');
  if (!SOURCES[key]) return new Response('bad source', { status: 400 });
  let body;
  try { body = await loadPublic(env, key, context); }
  catch (e) { return new Response('upstream error', { status: 502 }); }
  const host = new URL(request.url).hostname;
  if (!MARKET_HOST.test(host) && !(await priceAllowed(request))) {
    const rows = parseCsvRows(body);
    if (rows.length) {
      const idx = rows[0].map((h, i) => (PRICE_COLS.has(String(h).trim().toLowerCase()) ? i : -1)).filter((i) => i >= 0);
      for (let n = 1; n < rows.length; n++) for (const i of idx) if (i < rows[n].length) rows[n][i] = '';
      body = toCsv(rows);
    }
  }
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'private, max-age=60' } });
}
