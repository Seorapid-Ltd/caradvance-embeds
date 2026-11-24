/**
 * filecache.mjs — buildek közt megőrzött fájlok (autófotók, PDF-hez konvertált JPEG-ek).
 *
 * A mirror-car-photos.mjs eddig minden buildben újra letöltötte az összes autófotót a mobile.de-ről,
 * a pdf-photos.mjs pedig minden buildben újra JPEG-be konvertálta a bérelhető autók képeit.
 * A letöltött / konvertált fájl a kulcsa (URL vagy forrásfájl-tartalom hash) alapján itt marad,
 * és a következő build innen veszi. A GitHub Actions cache viszi buildről buildre (pages-build.yml).
 *
 *  - CA_FCACHE_DIR: ide kerül a mostani build összes felhasznált fájlja (ezt menti el a cache)
 *  - CA_FCACHE_OLD: az előző build fájljai (csak olvas; a felhasználtakat átmásolja a DIR-be,
 *    így a gyorsítótár csak a ténylegesen használt fájlokat tartja meg)
 * Ha nincs beállítva (pl. helyi build), minden a régi módon fut.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = process.env.CA_FCACHE_DIR || '';
const OLD = process.env.CA_FCACHE_OLD || '';
export const FCACHE_ON = !!DIR;
const idx = {}; // `${root}|${sub}` → Map(kulcs → fájlnév)
const stat = { hit: 0, miss: 0 };

function index(root, sub) {
  const k = root + '|' + sub;
  if (!idx[k]) {
    const m = new Map();
    try { for (const f of fs.readdirSync(path.join(root, sub))) { if (f.endsWith('.tmp')) continue; const dot = f.indexOf('.'); m.set(dot < 0 ? f : f.slice(0, dot), f); } } catch (e) { /* még nincs */ }
    idx[k] = m;
  }
  return idx[k];
}

/** a kulcshoz tartozó fájl a gyorsítótárban: { file, name } vagy null */
export function fcGet(sub, key) {
  if (!FCACHE_ON) return null;
  const n = index(DIR, sub).get(key);
  if (n) { stat.hit++; return { file: path.join(DIR, sub, n), name: n }; }
  if (OLD) {
    const o = index(OLD, sub).get(key);
    if (o) {
      const src = path.join(OLD, sub, o), dst = path.join(DIR, sub, o);
      try { fs.mkdirSync(path.dirname(dst), { recursive: true }); try { fs.linkSync(src, dst); } catch (e) { fs.copyFileSync(src, dst); } index(DIR, sub).set(key, o); stat.hit++; return { file: dst, name: o }; } catch (e) { /* nem baj */ }
    }
  }
  return null;
}

/** fájl (tartalom vagy meglévő fájl útvonala) elmentése a kulcs + kiterjesztés néven */
export function fcPut(sub, key, ext, data) {
  if (!FCACHE_ON) return;
  try {
    const dst = path.join(DIR, sub, key + ext); fs.mkdirSync(path.dirname(dst), { recursive: true });
    const tmp = dst + '.' + process.pid + '.tmp';
    if (Buffer.isBuffer(data)) fs.writeFileSync(tmp, data); else fs.copyFileSync(data, tmp);
    fs.renameSync(tmp, dst); index(DIR, sub).set(key, key + ext); stat.miss++;
  } catch (e) { /* a gyorsítótár hibája sosem állítja meg a buildet */ }
}

export function fcReport(label) { if (FCACHE_ON && stat.hit + stat.miss) console.log(`[fcache] ${label}: ${stat.hit} a gyorsítótárból, ${stat.miss} új`); }
