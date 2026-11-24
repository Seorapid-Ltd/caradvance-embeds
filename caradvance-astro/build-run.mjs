#!/usr/bin/env node
/**
 * build-run.mjs — a build futtatója (`npm run build`). A lépések listája: package.json → scripts["build:full"].
 *
 * main ág (élő oldal) és minden más ág: a teljes lánc, változatlan sorrendben.
 *
 * dev-<ország> ág (Cloudflare: CF_PAGES_BRANCH): csak az az ország készül el → gyors előnézet
 * a dev-<ország>.caradvance-astro-5kc.pages.dev címen (a middleware ott azt az országot mutatja).
 *   dev-hu = caradvance.hu (+ /en /de /fr /uk /zh és az ár nélküli _np)
 *   dev-sk = .sk   dev-cz = .cz   dev-pl = .pl   dev-ch = .ch   dev-eu = .eu
 *   A .pl, .ch és .eu a kész szlovák oldalból épül, ezért ott a szlovák lépések is lefutnak.
 *   Helyben: CA_MARKET=sk npm run build   (CA_MARKET=all = teljes build)
 *
 * develop ág (dev.caradvance.hu): gyors build a SEO- és idegen nyelvű lépések nélkül (DEV_SKIP).
 *
 * Új build-lépés: a package.json "build:full" láncába. Ha csak bizonyos országokat érint,
 * vedd fel az ONLY listába is (különben az egy-ország buildekben is lefut).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const full = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url))).scripts['build:full'];
const name = (s) => (s.split(/\s+/)[1] || s).replace(/\.mjs$/, '');
const BRANCH = (process.env.CF_PAGES_BRANCH || '').trim().toLowerCase();

/* ---- egy-ország build ---- */
const MARKETS = ['hu', 'sk', 'cz', 'pl', 'ch', 'eu'];
const SKCHAIN = ['sk', 'cz', 'pl', 'ch', 'eu'];
const ONLY = {
  'seo-noprice': ['hu'], // ár nélküli (_np) változat: csak a caradvance.hu-n van
  'skcz-local': SKCHAIN, 'skcz-langs': SKCHAIN,
  'skcz-seo1124': ['sk', 'cz'], // SEO 1. lépés (2026-11-24): csak a .sk és a .cz oldal
  'pl-site': ['pl'], 'cz-phone': ['cz'], 'cz-final': ['cz'], 'ch-site': ['ch'], 'eu-site': ['eu'],
};
const PRUNE_AFTER = 'eu-site'; // utána a többi ország kész mappái törölhetők, a további lépések kevesebb oldalon futnak
const DIRS = { hu: ['_np', 'en', 'de', 'fr', 'uk', 'zh'], sk: ['sk'], cz: ['cs'], pl: ['pl'], ch: ['ch'], eu: ['eu'] };
const MIRROR = { hu: 'en,de,fr,uk,zh', sk: 'sk', cz: 'cs', pl: 'sk', ch: 'sk', eu: 'sk' }; // i18n-mirror.mjs: CA_MIRROR_LANGS

/* ---- develop ág: gyors build (SEO és idegen nyelvek nélkül) ---- */
const DEV_SKIP = new Set(['seo-noprice', 'seo-desc', 'seo-ujberles', 'skcz-local', 'pl-site', 'cz-phone', 'cz-final', 'ch-site', 'eu-site', 'km-note', 'share-meta', 'skcz-fix1104', 'skcz-fix1109', 'pdf-photos', 'mirror-car-photos', 'seo-audit-fix', 'market-404', 'seo-landing', 'skcz-langs', 'skcz-fix1110']);

function pickMarket() {
  const env = (process.env.CA_MARKET || '').trim().toLowerCase();
  if (env) return env === 'all' ? null : env;
  const m = /^dev-([a-z]{2})(?:$|[-/])/.exec(BRANCH);
  return m ? m[1] : null;
}
const market = pickMarket();
if (market && !MARKETS.includes(market)) { console.error(`[build-run] ismeretlen ország: "${market}" (lehet: ${MARKETS.join(', ')})`); process.exit(1); }
const develop = !market && BRANCH === 'develop';

let steps = full.split('&&').map((s) => s.trim()).filter(Boolean);
if (develop) steps = steps.filter((s) => !DEV_SKIP.has(name(s)));
console.log(market ? `[build-run] EGY ORSZÁG: ${market} (előnézet)` : develop ? `[build-run] develop: gyors build, ${steps.length} lépés` : '[build-run] teljes build');

const PATH = path.resolve('node_modules/.bin') + path.delimiter + process.env.PATH;
const ENV = { ...process.env, PATH, ...(market ? { CA_MIRROR_LANGS: MIRROR[market] } : {}) };
const t0 = Date.now(); const times = [];

function prune() {
  const keep = new Set(DIRS[market]); let n = 0;
  for (const m of MARKETS) for (const d of DIRS[m]) {
    if (keep.has(d)) continue;
    const p = path.join('dist', d);
    if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true, force: true }); n++; }
  }
  console.log(`[build-run] ${n} másik ország / nyelv mappája kihagyva a további lépésekből`);
}

for (const s of steps) {
  const n = name(s);
  if (market && ONLY[n] && !ONLY[n].includes(market)) { console.log(`[build-run] kihagyva (${market}): ${s}`); }
  else {
    const t = Date.now();
    try { execSync(s, { stdio: 'inherit', env: ENV }); } catch (e) { console.error(`[build-run] HIBA: ${s}`); process.exit(e.status || 1); }
    times.push([s, (Date.now() - t) / 1000]);
  }
  if (market && n === PRUNE_AFTER) prune();
}

console.log(`[build-run] kész ${((Date.now() - t0) / 1000).toFixed(0)} mp alatt${market ? ' (' + market + ')' : ''}. Leglassabb lépések:`);
for (const [r, sec] of [...times].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${sec.toFixed(1).padStart(6)} mp  ${r}`);
