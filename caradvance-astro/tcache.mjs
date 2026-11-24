/**
 * tcache.mjs — fordítási gyorsítótár a build-lépéseknek (i18n-mirror, skcz-langs, pl/ch/eu-site).
 *
 * Egy oldal lefordítása (parse → szótáras fordítás → serialize) csak a forrásoldaltól és a
 * fordítás „környezetétől" (szótárak, adatfájlok, a szkriptek kódja) függ. Ha egyik sem változott,
 * az előző build eredménye változatlanul újrahasználható — ez a lassú lépések nagy része.
 *
 *  - CA_TCACHE_CTX: a környezet ujjlenyomata (a build-run.mjs számolja a build elején a forrásfájlokból);
 *    ha bármelyik szótár / adatfájl / szkript változik, minden bejegyzés érvénytelen → teljes fordítás.
 *  - CA_TCACHE_DIR: ide írja a mostani build bejegyzéseit (ezt menti el a GitHub Actions cache).
 *  - CA_TCACHE_OLD: az előző build bejegyzései (csak olvas belőle; a felhasználtakat átmásolja a DIR-be,
 *    így a gyorsítótár mindig csak a ténylegesen használt bejegyzéseket tartalmazza).
 * Ha nincs beállítva (pl. helyi build), minden a régi módon, gyorsítótár nélkül fut.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const DIR = process.env.CA_TCACHE_DIR || '';
const OLD = process.env.CA_TCACHE_OLD || '';
const CTX = process.env.CA_TCACHE_CTX || '';
export const TCACHE_ON = !!(DIR && CTX);
const stat = { hit: 0, miss: 0 };

function put(file, json) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, json); fs.renameSync(tmp, file);
}

/** fn() eredménye (JSON-ba írható érték), a scope + id + forrás + környezet kulcs alapján gyorsítótárazva */
export function memo(scope, id, src, fn) {
  if (!TCACHE_ON) return fn();
  const key = crypto.createHash('sha1').update(CTX).update('\0').update(scope).update('\0').update(id).update('\0').update(src).digest('hex');
  // tömörítve tároljuk (kb. tizedakkora), hogy a GitHub-gyorsítótár le- és feltöltése gyors maradjon
  const rel = path.join(scope, key.slice(0, 2), key + '.json.gz');
  const nf = path.join(DIR, rel);
  const load = (f) => JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString('utf8'));
  try { const v = load(nf); stat.hit++; return v; } catch (e) { /* nincs még */ }
  if (OLD) {
    try { const of = path.join(OLD, rel); const v = load(of); put(nf, fs.readFileSync(of)); stat.hit++; return v; } catch (e) { /* nincs */ }
  }
  const v = fn(); stat.miss++;
  try { put(nf, zlib.gzipSync(JSON.stringify(v), { level: 6 })); } catch (e) { /* a gyorsítótár hibája sosem állítja meg a buildet */ }
  return v;
}

export function tcacheStats() { return { ...stat }; }
export function tcacheReport(label, extra) {
  const h = stat.hit + (extra ? extra.hit : 0), m = stat.miss + (extra ? extra.miss : 0);
  if (TCACHE_ON && h + m) console.log(`[tcache] ${label}: ${h} újrahasznált, ${m} újonnan fordított oldal`);
}
