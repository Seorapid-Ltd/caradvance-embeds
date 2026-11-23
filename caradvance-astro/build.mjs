#!/usr/bin/env node
/**
 * build.mjs — a teljes build futtatója (a `npm run build` ezt hívja)
 *
 * TELJES BUILD (main ág, élő oldal): minden lépés lefut, pontosan a régi sorrendben.
 *
 * EGY ORSZÁG (dev-ágak előnézete): a Cloudflare Pages a CF_PAGES_BRANCH változóban adja
 * az ág nevét. dev-hu / dev-sk / dev-cz / dev-pl / dev-ch / dev-eu ágon csak az az ország
 * készül el, ezért az előnézet sokkal gyorsabb. Helyben: CA_MARKET=sk npm run build
 *
 *   hu  = caradvance.hu (+ /en /de /fr /uk /zh és az ár nélküli _np változat)
 *   sk  = caradvance.sk      cz = caradvance.cz      pl = caradvance.pl
 *   ch  = caradvance.ch      eu = caradvance.eu
 *
 * A .pl, .ch és .eu oldal a kész szlovák oldalból készül, ezért ezeknél a szlovák lépések is lefutnak.
 *
 * ÚJ LÉPÉS: a STEPS listába, a megfelelő helyre. Ha csak bizonyos országokat érint,
 * add meg az `only` mezőt (pl. only: ['pl']), különben minden buildben lefut.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SKCHAIN = ['sk', 'cz', 'pl', 'ch', 'eu']; // ezek a szlovák/cseh tükörből készülnek

const STEPS = [
  { run: 'node km-pricing.mjs' },
  { run: 'node prebuild.mjs' },
  { run: 'node fix-pages.mjs' },
  { run: 'astro build' },
  { run: 'node fix-home.mjs' },
  { run: 'node golive.mjs' },
  { run: 'node seo-copy.mjs' },
  { run: 'node seo-cars.mjs' },
  { run: 'node seo-meta.mjs' },
  { run: 'node seo-hreflang.mjs' },
  { run: 'node seo-h1.mjs' },
  { run: 'node seo-egyedi.mjs' },
  { run: 'node seo-hero.mjs' },
  { run: 'node fix-auto-photos.mjs' },
  { run: 'node seo-kalkulator.mjs' },
  { run: 'node seo-atiras.mjs' },
  { run: 'node seo-canonical.mjs' },
  { run: 'node seo-faq.mjs' },
  { run: 'node seo-video.mjs' },
  { run: 'node seo-langsoon.mjs' },
  { run: 'node seo-i18n.mjs' },
  { run: 'node seo-refmenu.mjs' },
  { run: 'node seo-abo.mjs' },
  { run: 'node stock-rent.mjs' },
  { run: 'node seo-legal.mjs' },
  { run: 'node seo-fix.mjs pre' },
  { run: 'node i18n-mirror.mjs' },
  { run: 'node seo-fix.mjs post' },
  { run: 'node seo-noprice.mjs', only: ['hu'] }, // ár nélküli (_np) változat: csak a caradvance.hu-n van
  { run: 'node seo-desc.mjs' },
  { run: 'node seo-search.mjs' },
  { run: 'node seo-fiok.mjs' },
  { run: 'node seo-ujberles.mjs' },
  { run: 'node seo-ahrefs.mjs' },
  { run: 'node seo-perf.mjs' },
  { run: 'node inject-megamenu.mjs' },
  { run: 'node skcz-local.mjs', only: SKCHAIN },
  { run: 'node skcz-langs.mjs', only: SKCHAIN },
  { run: 'node pl-site.mjs', only: ['pl'] },
  { run: 'node cz-phone.mjs', only: ['cz'] },
  { run: 'node cz-final.mjs', only: ['cz'] },
  { run: 'node ch-site.mjs', only: ['ch'] },
  { run: 'node eu-site.mjs', only: ['eu'] },
  { prune: true }, // egy-ország buildben: a többi ország kész oldalait innen már nem kell tovább feldolgozni
  { run: 'node km-note.mjs' },
  { run: 'node share-meta.mjs' },
  { run: 'node seo-final.mjs' },
  { run: 'node seo-landing.mjs' },
  { run: 'node market-404.mjs' },
  { run: 'node skcz-fix1104.mjs' },
  { run: 'node skcz-fix1109.mjs' },
  { run: 'node skcz-fix1110.mjs' },
  { run: 'node pdf-photos.mjs' },
  { run: 'node home-carousel.mjs' },
  { run: 'node mirror-car-photos.mjs' },
  { run: 'node seo-audit-fix.mjs' },
  { run: 'node skcz-hufix.mjs' },
  { run: 'node skcz-review1121.mjs' },
  { run: 'node xlang-hufix.mjs' },
  { run: 'node ver-assets.mjs' },
  { run: 'node am-routes.mjs' },
  { run: 'node admin-path.mjs' },
];

const MARKETS = ['hu', 'sk', 'cz', 'pl', 'ch', 'eu'];
// a dist/ mappák, amelyeket az egyes országok használnak (a cseh oldal mappája: cs)
const DIRS = { hu: ['_np', 'en', 'de', 'fr', 'uk', 'zh'], sk: ['sk'], cz: ['cs'], pl: ['pl'], ch: ['ch'], eu: ['eu'] };

function pickMarket() {
  const env = (process.env.CA_MARKET || '').trim().toLowerCase();
  if (env) return env === 'all' ? null : env;
  const br = (process.env.CF_PAGES_BRANCH || '').trim().toLowerCase();
  const m = /^dev-([a-z]{2})(?:$|[-/])/.exec(br);
  return m ? m[1] : null;
}

const market = pickMarket();
if (market && !MARKETS.includes(market)) {
  console.error(`[build] ismeretlen ország: "${market}" (lehet: ${MARKETS.join(', ')})`);
  process.exit(1);
}
console.log(market ? `[build] EGY ORSZÁG: ${market} (előnézet)` : '[build] TELJES BUILD (minden ország)');

const PATH = path.resolve('node_modules/.bin') + path.delimiter + process.env.PATH;
// i18n-mirror.mjs: egy-ország buildben csak a szükséges nyelvi tükör készül el (a .pl/.ch/.eu a szlovákból épül)
const MIRROR = { hu: 'en,de,fr,uk,zh', sk: 'sk', cz: 'cs', pl: 'sk', ch: 'sk', eu: 'sk' };
const ENV = { ...process.env, PATH, ...(market ? { CA_MIRROR_LANGS: MIRROR[market] } : {}) };
const t0 = Date.now();
const times = [];

function prune() {
  // A választott ország mappáin kívül a többi ország kész mappáit törli, így a további lépések
  // kevesebb oldalt dolgoznak fel. A magyar gyökéroldalak maradnak (közös képek, szkriptek, linkek).
  const keep = new Set(DIRS[market]);
  let n = 0;
  for (const m of MARKETS) for (const d of DIRS[m]) {
    if (keep.has(d)) continue;
    const p = path.join('dist', d);
    if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true, force: true }); n++; }
  }
  console.log(`[build] ${n} másik ország / nyelv mappája kihagyva a további lépésekből`);
}

for (const s of STEPS) {
  if (s.prune) { if (market) prune(); continue; }
  if (market && s.only && !s.only.includes(market)) { console.log(`[build] kihagyva (${market}): ${s.run}`); continue; }
  const t = Date.now();
  try {
    execSync(s.run, { stdio: 'inherit', env: ENV });
  } catch (e) {
    console.error(`[build] HIBA: ${s.run}`);
    process.exit(e.status || 1);
  }
  times.push([s.run, (Date.now() - t) / 1000]);
}

const tot = (Date.now() - t0) / 1000;
console.log(`[build] kész ${tot.toFixed(0)} mp alatt${market ? ' (' + market + ')' : ''}. Leglassabb lépések:`);
for (const [r, s] of [...times].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${s.toFixed(1).padStart(6)} mp  ${r}`);
