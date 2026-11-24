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
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const full = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url))).scripts['build:full'];
const name = (s) => (s.split(/\s+/)[1] || s).replace(/\.mjs$/, '');
const BRANCH = (process.env.CF_PAGES_BRANCH || '').trim().toLowerCase();

/* ---- egy-ország build ---- */
const MARKETS = ['hu', 'sk', 'cz', 'pl', 'ch', 'eu'];
const SKCHAIN = ['sk', 'cz', 'pl', 'ch', 'eu'];
const ONLY = {
  'seo-noprice': ['hu'], // ár nélküli (_np) változat: csak a caradvance.hu-n van
  'skcz-local': SKCHAIN, 'skcz-langs': SKCHAIN,
  'skcz-seo1124': ['sk', 'cz'], 'skcz-onpage1124': ['sk', 'cz'], 'skcz-trust1124': ['sk', 'cz'], // SEO 1. lépés (2026-11-24): csak a .sk és a .cz oldal
  'pl-site': ['pl'], 'cz-phone': ['cz'], 'cz-final': ['cz'], 'ch-site': ['ch'], 'eu-site': ['eu'], 'hu-seo1124': ['hu'], 'xlang-sk1124': ['ch', 'eu'], 'trust1124': ['hu', 'ch', 'eu'], 'skcz-fix1124': ['sk', 'cz'],
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

/* ---- fordítási gyorsítótár (tcache.mjs): a környezet ujjlenyomata a build ELEJÉN, a forrásfájlokból ----
 * (a gyökér .mjs/.json/.js fájlai, lib/ és src/i18n/ — szkriptek, szótárak, adatok). Ha CA_TCACHE_DIR nincs
 * megadva (pl. helyi build), a gyorsítótár ki van kapcsolva. */
function tcacheCtx() {
  const h = crypto.createHash('sha1'); const list = [];
  for (const f of fs.readdirSync('.')) if (/\.(mjs|cjs|js|json)$/.test(f) && fs.statSync(f).isFile()) list.push(f);
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else list.push(p); } };
  walk('lib'); walk(path.join('src', 'i18n'));
  for (const f of list.sort()) h.update(f).update('\0').update(fs.readFileSync(f)).update('\0');
  return h.digest('hex');
}
const TC = process.env.CA_TCACHE_DIR ? { CA_TCACHE_CTX: tcacheCtx() } : {};
if (TC.CA_TCACHE_CTX) console.log(`[build-run] fordítási gyorsítótár: ${process.env.CA_TCACHE_DIR} (környezet ${TC.CA_TCACHE_CTX.slice(0, 10)}, előző: ${process.env.CA_TCACHE_OLD && fs.existsSync(process.env.CA_TCACHE_OLD) ? 'van' : 'nincs'})`);
const ENV = { ...process.env, PATH, ...TC, ...(market ? { CA_MIRROR_LANGS: MIRROR[market] } : {}) };
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

/* ---- párhuzamos lépések (a build-gépnek 4 CPU-ja van, a lépések egyenként csak egyet használnak) ----
 * Egy csoport sávjai egyszerre futnak; egy sávon belül a lépések sorban. A csoport tagjai a
 * "build:full" láncban egymás után állnak; a csoport ott indul, ahol az első tagja állna.
 * .pl / .cz / .ch / .eu: mind a kész szlovák (ill. cseh) oldalból dolgozik, és csak a saját mappáját
 * írja; az egyetlen közös fájl (_routes.json) módosítását a routes-apply.mjs utána, sorrendben végzi. */
const GROUPS = [
  { lanes: [['pl-site'], ['cz-phone', 'cz-final'], ['ch-site'], ['eu-site']], env: { CA_ROUTES_DEFER: '1' }, after: 'node routes-apply.mjs' },
];
const SERIAL = process.env.CA_SERIAL === '1'; // összehasonlításhoz: CA_SERIAL=1 = minden lépés egymás után
const groupOf = (n) => GROUPS.find((g) => g.lanes.some((l) => l.includes(n)));

function runOne(s) {
  const t = Date.now();
  try { execSync(s, { stdio: 'inherit', env: ENV }); } catch (e) { console.error(`[build-run] HIBA: ${s}`); process.exit(e.status || 1); }
  times.push([s, (Date.now() - t) / 1000]);
}

function runLane(cmds, env) {
  // a sáv kimenetét összegyűjtjük, és a sáv végén egyben írjuk ki (olvasható napló)
  return new Promise((resolve) => {
    const t = Date.now(); let out = '';
    const script = cmds.map((c) => c).join(' && ');
    const ch = spawn(script, { shell: true, env: { ...ENV, ...env } });
    ch.stdout.on('data', (d) => { out += d; }); ch.stderr.on('data', (d) => { out += d; });
    ch.on('close', (code) => { process.stdout.write(out); resolve({ code, script, sec: (Date.now() - t) / 1000 }); });
  });
}

const skip = (n) => market && ONLY[n] && !ONLY[n].includes(market);
const done = new Set();
for (const s of steps) {
  const n = name(s);
  if (done.has(s)) { if (market && n === PRUNE_AFTER) prune(); continue; }
  const g = !SERIAL && groupOf(n);
  if (g) {
    const lanes = g.lanes.map((l) => l.map((ln) => steps.find((x) => name(x) === ln)).filter((x) => x && !skip(name(x))));
    for (const l of g.lanes) for (const ln of l) { const x = steps.find((y) => name(y) === ln); if (x) { done.add(x); if (skip(ln)) console.log(`[build-run] kihagyva (${market}): ${x}`); } }
    const run = lanes.filter((l) => l.length);
    if (run.length) {
      const t = Date.now();
      console.log(`[build-run] párhuzamosan: ${run.map((l) => l.map(name).join(' → ')).join('  |  ')}`);
      const res = (await Promise.all(run.map((l) => runLane(l, g.env))));
      for (const r of res) { if (r.code !== 0) { console.error(`[build-run] HIBA: ${r.script}`); process.exit(r.code || 1); } }
      times.push([`párhuzamos csoport (${run.map((l) => l.map(name).join('→')).join(', ')})`, (Date.now() - t) / 1000]);
      runOne(g.after);
    }
    if (market && n === PRUNE_AFTER) prune();
    continue;
  }
  if (skip(n)) { console.log(`[build-run] kihagyva (${market}): ${s}`); }
  else runOne(s);
  if (market && n === PRUNE_AFTER) prune();
}

console.log(`[build-run] kész ${((Date.now() - t0) / 1000).toFixed(0)} mp alatt${market ? ' (' + market + ')' : ''}. Leglassabb lépések:`);
for (const [r, sec] of [...times].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${sec.toFixed(1).padStart(6)} mp  ${r}`);
