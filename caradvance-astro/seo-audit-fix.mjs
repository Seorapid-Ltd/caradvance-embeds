// Build lépés (a mirror-car-photos.mjs után, a ver-assets.mjs előtt fut) — 2026-11-06, Ahrefs Site Audit javítások.
// Minden domain (hu / sk / cz / pl / ch / eu) és minden nyelv kész HTML-jén, a dist/ mappában:
//  1. JSON-LD: az árral rendelkező Car elemek típusa ["Car","Product"] (Google termék-/járműtalálat),
//     a saját oldalakra mutató url / item értékek perjellel zárulnak (a canonical címmel egyezően).
//  2. Eltűnt hirdetésfotók: a mobile.de / hasznaltauto képek közül, amelyeket a mirror-car-photos nem tudott
//     letölteni ÉS a forrás 404/410-zel végleg megszűntnek jelez, a JSON-LD-ből kikerülnek, minden más helyen
//     (galéria, kártya, og:image) semleges helyettesítő képre cserélődnek. Ideiglenes hiba esetén nem nyúl hozzájuk.
//  3. hreflang: csak kölcsönös (oda-vissza) párok maradnak; noindex oldalra nem mutat és noindex oldalon nincs hreflang.
//  4. Sitemap: kikerülnek a noindex és a máshová canonicalizáló (nem kanonikus) címek.
//  5. Belső linkek: href="/utvonal" → href="/utvonal/", ha az oldal perjeles címen létezik (nincs 308-as átirányítás).
//  6. A "CarAdvance a régióban" lábléc-linkek (más országos oldalak) csak a kezdőoldalakon maradnak — a többi oldalon
//     a fejléc ország-/nyelvváltója elég; így nem keletkezik oldalanként több száz domainközi link.
// Biztonság: minden lépés külön try/catch-ben; hiba esetén a fájl változatlan marad, a build sosem áll le.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

const DIST = 'dist';
const HOSTS = { '': 'www.caradvance.hu', sk: 'www.caradvance.sk', cs: 'www.caradvance.cz', pl: 'www.caradvance.pl', ch: 'www.caradvance.ch', eu: 'www.caradvance.eu' };
const DIR_OF_HOST = Object.fromEntries(Object.entries(HOSTS).map(([d, h]) => [h, d]));
const SKIP = new Set(['auto-foto', '_astro', 'i18n', 'node_modules', 'belso-api']);
// Belső / technikai oldalak (admin, ajánlat-válasz, aláírás, partner, adatlap, fiók, teszt): sosem indexelhetők,
// nem kerülnek sitemapbe, nem kapnak hreflangot. Minden nyelvi előtaggal.
export const INTERNAL = /^\/(?:(?:en|de|fr|uk|zh|sk|cs|hu|pl|it|es)\/)?(?:belso|ajanlat|alairas|adatok|partner|teszt-mega-menu|fiok|account|konto|compte|kabinet|ucet)(?:\/|$)/;
const PLACEHOLDER = '/auto-foto-nincs.webp';
const LANG_ROOTS = new Set(['en', 'de', 'fr', 'uk', 'zh', 'hu', 'it', 'es', 'pl', 'cs', 'sk']);
const DEADLINE = Date.now() + 4 * 60 * 1000;

/* ---------- tiszta segédfüggvények (böngészőben is tesztelhetők) ---------- */
export function normUrl(u) {
  try {
    const x = new URL(u);
    let host = x.host.toLowerCase();
    if (/^caradvance\.(hu|sk|cz|pl|ch|eu)$/.test(host)) host = 'www.' + host;
    let p = x.pathname;
    try { p = decodeURI(p); } catch (e) { /* marad */ }
    if (!/\.[a-z0-9]{2,5}$/i.test(p) && !p.endsWith('/')) p += '/';
    return 'https://' + host + p;
  } catch (e) { return null; }
}
export function attr(tag, name) {
  const m = tag.match(new RegExp('\\s' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i'));
  return m ? (m[2] !== undefined ? m[2] : m[3]) : null;
}
export function altLinks(h) {
  const out = [];
  const re = /[ \t]*<link\b[^>]*\brel\s*=\s*["']alternate["'][^>]*>[ \t]*\n?/gi;
  let m;
  while ((m = re.exec(h))) {
    const hl = attr(m[0], 'hreflang'); const href = attr(m[0], 'href');
    if (hl && href) out.push({ raw: m[0], hl, href });
  }
  return out;
}
export function isNoindex(h) { return /<meta\s+name=["']robots["'][^>]*noindex/i.test(h); }
export function canonicalOf(h) {
  const m = h.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i);
  return m ? attr(m[0], 'href') : null;
}
// JSON-LD fa bejárása: Car+ár → ["Car","Product"]; url/item perjelezés; eltűnt képek kiszűrése
export function fixLd(obj, ctx) {
  let changed = false;
  const hasPrice = (o) => {
    const offs = [].concat(o.offers || []);
    return offs.some((f) => f && typeof f === 'object' && (f.price != null || f.lowPrice != null || f.priceSpecification));
  };
  const walk = (o) => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!o || typeof o !== 'object') return;
    if (o['@type'] === 'Car' && hasPrice(o)) { o['@type'] = ['Car', 'Product']; changed = true; }
    for (const k of ['url', 'item']) {
      if (typeof o[k] === 'string') { const n = ctx.slashUrl(o[k]); if (n !== o[k]) { o[k] = n; changed = true; } }
    }
    if (ctx.dead && ctx.dead.size && o.image) {
      if (Array.isArray(o.image)) {
        const f = o.image.filter((x) => !(typeof x === 'string' && ctx.dead.has(x)));
        if (f.length !== o.image.length) { o.image = f.length ? f : undefined; changed = true; }
      } else if (typeof o.image === 'string' && ctx.dead.has(o.image)) { delete o.image; changed = true; }
    }
    for (const k of Object.keys(o)) if (o[k] && typeof o[k] === 'object') walk(o[k]);
  };
  walk(obj);
  return changed;
}
// href="/utvonal" → "/utvonal/" (ha létezik); abszolút saját címekre is
export function slashHrefs(h, exists, siteDir) {
  return h.replace(/(\shref\s*=\s*["'])((?:https:\/\/(?:www\.)?caradvance\.(?:hu|sk|cz|pl|ch|eu))?\/[^"'?#\s<>]*)([?#][^"']*)?(["'])/gi, (m, a, p, q, b) => {
    if (p.endsWith('/') || /\.[a-z0-9]{2,5}$/i.test(p)) return m;
    let dir = siteDir, rel = p;
    const ab = p.match(/^https:\/\/(?:www\.)?(caradvance\.(?:hu|sk|cz|pl|ch|eu))(\/.*)$/i);
    if (ab) { const d = DIR_OF_HOST['www.' + ab[1].toLowerCase()]; if (d === undefined) return m; dir = d; rel = ab[2]; }
    return exists(dir, rel) ? a + p + '/' + (q || '') + b : m;
  });
}
// "más országok" lábléc-blokk eltávolítása
export function dropOtherMarkets(h) {
  return h.replace(/<h4 data-ca-other[^>]*>[^<]*<\/h4>(?:\s*<a\b[^>]*href="https:\/\/www\.caradvance\.(?:hu|sk|cz|pl|ch|eu)\/[^"]*"[^>]*>[^<]*<\/a>)*/g, '');
}

/* ---------- fájlrendszer ---------- */
function walk(d, out) {
  let list;
  try { list = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return out; }
  for (const e of list) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p, out); }
    else out.push(p);
  }
  return out;
}
// dist-beli fájl → { siteDir, url (pl. https://www.caradvance.sk/prenajom/), np }
function locate(file) {
  let rel = path.relative(DIST, file).split(path.sep);
  let np = false;
  if (rel[0] === '_np') { np = true; rel = rel.slice(1); }
  let siteDir = '';
  if (rel.length > 1 && HOSTS[rel[0]] && rel[0] !== '') { siteDir = rel[0]; rel = rel.slice(1); }
  if (rel[rel.length - 1] !== 'index.html') return null;
  const p = '/' + rel.slice(0, -1).join('/') + (rel.length > 1 ? '/' : '');
  return { siteDir, path: p, url: 'https://' + HOSTS[siteDir] + p, np };
}

const stat = { ld: 0, img: 0, dead: 0, hl: 0, hlPages: 0, sm: 0, href: 0, other: 0, errors: 0 };

/* ---------- párhuzamos futtatás: a fájlok szétosztva a processzormagok között (worker_threads) ----------
 * Az A) és B) fázis csak olvas (az eredményt a fő szál fájlsorrendben rakja össze, így ugyanaz, mint egy
 * szálon); a C) fázis fájlonként független (minden oldal csak a saját fájlját írja, a közös adat — oldaltérkép,
 * eltűnt fotók — csak olvasott). CA_AUDIT_WORKERS=1: a régi, egyszálú futás. */
const NW = Math.max(1, Math.min(8, +(process.env.CA_AUDIT_WORKERS || 0) || (os.availableParallelism ? os.availableParallelism() : os.cpus().length)));
async function inWorkers(phase, files, extra) {
  const idx = files.map((f, i) => i);
  if (NW < 2 || files.length < 200) return [runPhase(phase, files, idx, extra)];
  const parts = Array.from({ length: NW }, () => ({ files: [], idx: [] }));
  files.forEach((f, i) => { const p = parts[i % NW]; p.files.push(f); p.idx.push(i); });
  return Promise.all(parts.map((p) => new Promise((resolve) => {
    let done = false;
    const w = new Worker(new URL(import.meta.url), { workerData: { phase, files: p.files, idx: p.idx, extra } });
    w.once('message', (r) => { done = true; resolve(r); });
    w.once('error', (e) => { if (!done) { done = true; console.log('seo-audit-fix: szál hiba (' + phase + '), egy szálon folytatja: ' + e.message); resolve(runPhase(phase, p.files, p.idx, extra)); } });
    w.once('exit', (c) => { if (!done) { done = true; resolve(runPhase(phase, p.files, p.idx, extra)); } });
  })));
}
function makeExists() {
  const existsCache = new Map();
  return (siteDir, rel) => {
    let p = rel.split(/[?#]/)[0];
    try { p = decodeURI(p); } catch (e) { /* marad */ }
    const key = siteDir + '|' + p;
    if (existsCache.has(key)) return existsCache.get(key);
    const f = path.join(DIST, siteDir, p.replace(/^\/+/, ''), 'index.html');
    const r = fs.existsSync(f);
    existsCache.set(key, r);
    return r;
  };
}
function makeSlashUrl(exists) {
  return (u) => {
    const m = String(u).match(/^(https:\/\/(?:www\.)?(caradvance\.(?:hu|sk|cz|pl|ch|eu)))(\/[^?#]*)$/i);
    if (!m || m[3].endsWith('/') || /\.[a-z0-9]{2,5}$/i.test(m[3])) return u;
    const d = DIR_OF_HOST['www.' + m[2].toLowerCase()];
    return d !== undefined && exists(d, m[3]) ? u + '/' : u;
  };
}
const PHOTO_RE = /https:\/\/img\.(?:classistatic\.de|hasznaltautocdn\.com)\/[^"'\s)<>&\\]+/g;

// egy fázis a kapott fájlokon (a fő szálon vagy egy worker szálon)
function runPhase(phase, files, idx, extra) {
  if (phase === 'A') { // külső hirdetésfotók címei, fájlonként
    const out = [];
    files.forEach((f, k) => {
      let s; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
      if (!/img\.(?:classistatic|hasznaltautocdn)/.test(s)) return;
      const u = []; for (const m of s.replace(/\\\//g, '/').matchAll(PHOTO_RE)) u.push(m[0]);
      if (u.length) out.push([idx[k], u]);
    });
    return { out };
  }
  if (phase === 'B') { // oldaltérkép-bejegyzések
    const out = []; let errors = 0;
    files.forEach((f, k) => {
      const loc = locate(f); if (!loc) return;
      try {
        const h = fs.readFileSync(f, 'utf8');
        const alts = altLinks(h);
        out.push([idx[k], loc.url, loc.np, isNoindex(h) || INTERNAL.test(loc.path), normUrl(canonicalOf(h) || loc.url), alts.map((a) => normUrl(a.href)).filter(Boolean)]);
      } catch (e) { errors++; }
    });
    return { out, errors };
  }
  // C) HTML-fájlok javítása
  const pages = extra.pages, dead = new Set(extra.dead);
  const st = { ld: 0, img: 0, hl: 0, hlPages: 0, href: 0, other: 0, errors: 0, internal: 0 };
  const exists = makeExists(), slashUrl = makeSlashUrl(exists);
  const dropAlts = (loc, alts, me) => {
    const self = normUrl(loc.url);
    const selfC = me ? me.canonical : self;
    const drop = new Set();
    for (const a of alts) {
      const t = normUrl(a.href); if (!t) continue;
      if (me && me.noindex) { drop.add(a.raw); continue; }
      if (t === self || t === selfC) continue;
      const tp = pages.get(t);
      if (!tp) continue; // nem ismert cél: nem nyúlunk hozzá
      if (tp.noindex) { drop.add(a.raw); continue; }
      if (a.hl.toLowerCase() === 'x-default') continue;
      if (!tp.alts.has(self) && !tp.alts.has(selfC)) drop.add(a.raw);
    }
    return drop;
  };
  for (const f of files) {
    let h0, h;
    try { h0 = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
    h = h0;
    const loc = locate(f);
    const siteDir = loc ? loc.siteDir : (() => { const r = path.relative(DIST, f).split(path.sep); const i = r[0] === '_np' ? 1 : 0; return HOSTS[r[i]] && r.length > i + 1 ? r[i] : ''; })();

    // 0. belső oldalak: csak noindex,nofollow + hreflang nélkül, más átalakítás nincs
    if (loc && INTERNAL.test(loc.path)) {
      try {
        if (!isNoindex(h)) { h = /<\/head>/i.test(h) ? h.replace(/<\/head>/i, '<meta name="robots" content="noindex,nofollow">\n</head>') : h; st.internal++; }
        for (const a of altLinks(h)) h = h.split(a.raw).join('');
        if (h !== h0) fs.writeFileSync(f, h);
      } catch (e) { st.errors++; }
      continue;
    }

    // 1. JSON-LD
    try {
      h = h.replace(/(<script[^>]*application\/ld\+json[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, body, c) => {
        let j; try { j = JSON.parse(body); } catch (e) { return m; }
        if (!fixLd(j, { slashUrl, dead })) return m;
        st.ld++;
        return a + JSON.stringify(j) + c;
      });
    } catch (e) { st.errors++; }

    // 2. eltűnt fotók → helyettesítő kép (og:image: az oldal első saját fotója)
    try {
      if (dead.size && /img\.(?:classistatic|hasznaltautocdn)/.test(h)) {
        const firstOwn = (h.match(/\/auto-foto\/[a-f0-9]+\.(?:webp|jpg|png|avif)/) || [])[0];
        const origin = 'https://' + HOSTS[siteDir];
        for (const u of dead) {
          if (!h.includes(u) && !h.includes(u.replace(/\//g, '\\/'))) continue;
          h = h.replace(new RegExp('(<meta\\s+(?:property|name)=["\'](?:og:image|twitter:image)["\']\\s+content=["\'])' + u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '$1' + origin + (firstOwn || PLACEHOLDER));
          h = h.split(u).join(PLACEHOLDER).split(u.replace(/\//g, '\\/')).join(PLACEHOLDER.replace(/\//g, '\\/'));
          st.img++;
        }
      }
    } catch (e) { st.errors++; }

    // 3. hreflang
    try {
      if (loc) {
        const alts = altLinks(h);
        if (alts.length) {
          const drop = dropAlts(loc, alts, pages.get(loc.url));
          if (drop.size) {
            for (const raw of drop) h = h.split(raw).join('');
            st.hl += drop.size; st.hlPages++;
          }
        }
      }
    } catch (e) { st.errors++; }

    // 4. perjel nélküli belső linkek
    try {
      const n = slashHrefs(h, exists, siteDir);
      if (n !== h) { st.href++; h = n; }
    } catch (e) { st.errors++; }

    // 5. más országok lábléc-blokkja csak a kezdőoldalakon
    try {
      if (loc && /data-ca-other/.test(h)) {
        const segs = loc.path.split('/').filter(Boolean);
        const isHome = segs.length === 0 || (segs.length === 1 && LANG_ROOTS.has(segs[0]));
        if (!isHome) { const n = dropOtherMarkets(h); if (n !== h) { st.other++; h = n; } }
      }
    } catch (e) { st.errors++; }

    if (h !== h0) { try { fs.writeFileSync(f, h); } catch (e) { st.errors++; } }
  }
  return { st };
}

async function main() {
  if (!fs.existsSync(DIST)) { console.log('seo-audit-fix: nincs dist/ - kihagyva'); return; }
  const all = walk(DIST, []);
  const htmlFiles = all.filter((f) => f.endsWith('.html'));
  const textFiles = all.filter((f) => /\.(html|js|json)$/i.test(f));

  /* ---- A) eltűnt hirdetésfotók felderítése ---- */
  const dead = new Set();
  try {
    const found = new Set();
    const byFile = (await inWorkers('A', textFiles)).flatMap((r) => r.out).sort((a, b) => a[0] - b[0]);
    for (const [, u] of byFile) for (const x of u) found.add(x);
    // a mirror-car-photos ugyanebben a buildben már lekérdezte ezeket: amit ott 404/410-nek látott, nem kérdezzük újra
    let known = new Set();
    try { const j = JSON.parse(fs.readFileSync('.gen/photo-dead.json', 'utf8')); if (Date.now() - j.t < 3600e3) known = new Set(j.urls); } catch (e) { /* nincs */ }
    const list = [];
    for (const u of found) { if (known.has(u)) dead.add(u); else list.push(u); }
    const check = async (u) => {
      const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 20000);
      try {
        const r = await fetch(u, { signal: ac.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CaradvanceBuild/1.0)' } });
        if (r.status === 404 || r.status === 410) dead.add(u);
        try { if (r.body) await r.body.cancel(); } catch (e) { /* mindegy — csak az állapotkód kell, a képet nem töltjük le */ }
      } catch (e) { /* ideiglenes hiba: nem nyúlunk hozzá */ } finally { clearTimeout(t); }
    };
    for (let i = 0; i < list.length && Date.now() < DEADLINE; i += 12) await Promise.all(list.slice(i, i + 12).map(check));
    stat.dead = dead.size;
    console.log('seo-audit-fix: külső hirdetésfotó ' + found.size + ' (' + (found.size - list.length) + ' már ellenőrizve), végleg megszűnt ' + dead.size);
  } catch (e) { stat.errors++; console.log('seo-audit-fix: fotóellenőrzés hiba: ' + e.message); }

  /* ---- B) oldaltérkép (URL → oldal adatai) a hreflang- és sitemap-döntésekhez ---- */
  const pages = new Map();
  {
    const rs = await inWorkers('B', htmlFiles);
    const ent = rs.flatMap((r) => { stat.errors += r.errors || 0; return r.out; }).sort((a, b) => a[0] - b[0]);
    for (const [, url, np, noindex, canonical, alts] of ent) {
      if (np && pages.has(url)) continue;
      pages.set(url, { noindex, canonical, alts: new Set(alts) });
    }
  }

  /* ---- C) HTML-fájlok javítása ---- */
  for (const r of await inWorkers('C', htmlFiles, { pages, dead: [...dead] })) {
    for (const [k, v] of Object.entries(r.st)) if (k === 'internal') { if (v) stat.internal = (stat.internal || 0) + v; } else stat[k] += v;
  }

  /* ---- D) JS/JSON adatfájlok: eltűnt fotók ---- */
  try {
    if (dead.size) {
      for (const f of textFiles) {
        if (f.endsWith('.html')) continue;
        const s0 = fs.readFileSync(f, 'utf8');
        if (!/img\.(?:classistatic|hasznaltautocdn)/.test(s0)) continue;
        let s = s0;
        for (const u of dead) s = s.split(u).join(PLACEHOLDER).split(u.replace(/\//g, '\\/')).join(PLACEHOLDER.replace(/\//g, '\\/'));
        if (s !== s0) { fs.writeFileSync(f, s); stat.img++; }
      }
    }
  } catch (e) { stat.errors++; }

  /* ---- E) sitemapek: noindex és nem kanonikus címek ki ---- */
  try {
    for (const f of all.filter((x) => /(^|[\\/])sitemap[^\\/]*\.xml$/i.test(x) && !x.split(path.sep).includes('_np'))) {
      const s0 = fs.readFileSync(f, 'utf8');
      if (!/<urlset/i.test(s0)) continue;
      const s = s0.replace(/\s*<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g, (m, u) => {
        const n = normUrl(u.trim().replace(/&amp;/g, '&'));
        if (n && INTERNAL.test(new URL(n).pathname)) { stat.sm++; return ''; }
        const pg = n && pages.get(n);
        if (!pg) return m;
        if (pg.noindex || (pg.canonical && pg.canonical !== n)) { stat.sm++; return ''; }
        return m;
      });
      if (s !== s0) fs.writeFileSync(f, s);
    }
  } catch (e) { stat.errors++; }

  console.log('seo-audit-fix: ' + JSON.stringify(stat) + (NW > 1 ? ' [' + NW + ' szálon]' : ''));
}

if (!isMainThread && workerData && workerData.phase) {
  parentPort.postMessage(runPhase(workerData.phase, workerData.files, workerData.idx, workerData.extra));
} else if (process.argv[1] && process.argv[1].endsWith('seo-audit-fix.mjs')) {
  main().catch((e) => console.log('seo-audit-fix: FIGYELEM - ' + (e && e.message) + ' (a build megy tovabb)')).finally(() => process.exit(0));
}
