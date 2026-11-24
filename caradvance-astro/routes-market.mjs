/**
 * routes-market.mjs — a _routes.json kiegészítése a .pl / .ch / .eu útvonalaival.
 * A pl-site / ch-site / eu-site hívja (a kód onnan került ide, változatlanul).
 * A build-run.mjs ezt a három lépést párhuzamosan futtatja (CA_ROUTES_DEFER=1): ilyenkor a lépések
 * csak elmentik a bemenetet (dist/.routes-<piac>.json), és a routes-apply.mjs utána, a régi
 * sorrendben (pl → ch → eu) alkalmazza — így az eredmény ugyanaz, mint egymás után futtatva.
 */
import fs from 'node:fs';
import path from 'node:path';

export function deferOrApply(DIST, market, args) {
  if (process.env.CA_ROUTES_DEFER) { fs.writeFileSync(path.join(DIST, `.routes-${market}.json`), JSON.stringify(args)); return; }
  APPLY[market](DIST, args);
}

export const APPLY = {
  pl(DIST, { mapValues }) {
    const map = { values: () => mapValues };
  // _routes.json: a lengyel útvonalak is a middleware-en menjenek
  try {
    const rp = path.join(DIST, '_routes.json'); const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    const tops = new Set(['/pl/*']); for (const p of map.values()) { const t = p.split('/')[0]; if (t) tops.add('/' + t + '/*'); }
    for (const x of tops) if (!r.include.includes(x) && !r.include.includes('/' + x.split('/')[1] + '/*')) r.include.push(x);
    if (r.include.length + (r.exclude || []).length <= 100) fs.writeFileSync(rp, JSON.stringify(r, null, 2));
    else console.log('[pl-site] _routes.json: több mint 100 szabály, nem írtam át');
  } catch (e) {}
  },
  ch(DIST, { mapValues, LANGS, BASE }) {
    const map = { values: () => mapValues };
  // _routes.json: a svájci útvonalak is a middleware-en menjenek
  try {
    const rp = path.join(DIST, '_routes.json'); const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    // a /ch/ előnézet a caradvance.hu-n statikus (noindex + canonical), nem kell rá szabály
    const tops = new Set(LANGS.filter((x) => x !== BASE).map((x) => '/' + x + '/*')); for (const p of map.values()) { const t = p.split('/')[0]; if (t) tops.add('/' + t + '/*'); }
    for (const x of tops) if (!r.include.includes(x) && !r.include.includes('/' + x.split('/')[1] + '/*')) r.include.push(x);
    // 2 helyet meghagyunk az am-routes.mjs-nek (/belso/ajanlatmotor/*, /ajanlat/auto/*), különben a build megállna
    const res = ['/belso/ajanlatmotor/*', '/ajanlat/auto/*'].filter((w) => !r.include.includes(w) && !r.include.includes('/' + w.split('/')[1] + '/*')).length;
    // ha nem fér bele a 100 szabályba: a teszt- és ikonoldalak szabálya elhagyható (ezeken a middleware-nek nincs dolga)
    for (const x of ['/teszt-mega-menu/*', '/icons/*']) if (r.include.length + (r.exclude || []).length + res > 100 && r.include.includes(x)) r.include.splice(r.include.indexOf(x), 1);
    if (r.include.length + (r.exclude || []).length + res <= 100) { fs.writeFileSync(rp, JSON.stringify(r, null, 2)); console.log('[ch-site] _routes.json: ' + (r.include.length + (r.exclude || []).length) + ' szabály (+' + res + ' am-routes)'); }
    else console.log('[ch-site] _routes.json: több mint 100 szabály, nem írtam át');
  } catch (e) {}
  },
  eu(DIST, { LANGS }) {
  // _routes.json: /es/* kell; hely a 100-as korláton belül (összevonás: /berles*, /vasarlas*)
  try {
    const rp = path.join(DIST, '_routes.json'); const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
    const res = ['/belso/ajanlatmotor/*', '/ajanlat/auto/*'].filter((w) => !r.include.includes(w)).length;
    const want = LANGS.map((x) => '/' + x + '/*').filter((x) => !r.include.includes(x));
    const MERGE = [['/berles*', ['/berles-elonyei/*', '/berles-gyakori-kerdesek/*', '/berlesi-folyamat/*', '/berlesi-feltetelek/*']], ['/vasarlas*', ['/vasarlas-elonyei/*', '/vasarlas-gyakori-kerdesek/*']]];
    for (const [to, from] of MERGE) {
      if (r.include.length + (r.exclude || []).length + res + want.length <= 100) break;
      if (from.filter((x) => r.include.includes(x)).length < 2) continue;
      r.include = r.include.filter((x) => !from.includes(x)); r.include.push(to);
    }
    r.include.push(...want);
    if (r.include.length + (r.exclude || []).length + res <= 100) { fs.writeFileSync(rp, JSON.stringify(r, null, 2)); console.log('[eu-site] _routes.json: ' + (r.include.length + (r.exclude || []).length) + ' szabály (+' + res + ' am-routes)'); }
    else console.log('[eu-site] _routes.json: több mint 100 szabály, nem írtam át');
  } catch (e) {}
  },
};
