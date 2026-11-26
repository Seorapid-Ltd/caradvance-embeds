// Ajánlatmotor: a Pages Functions csak a _routes.json "include" szabályain fut.
// A belső modul (/belso/ajanlatmotor/*), az ügyfél-ajánlat (/ajanlat/auto/*) és az értékesítési pult (/sales, /sales/*; régi cím: /belso/desk/*) útvonalát a lánc legvégén vesszük fel
// (az admin-path.mjs mindegyik mellé felveszi az /admin/… megfelelőjét).
// Az /api/* már benne van (seo-noprice.mjs). Ha nem fér bele a 100 szabályba, a build álljon meg: így nem megy ki néma 404.
import fs from 'node:fs';
import path from 'node:path';

const rp = path.join('dist', '_routes.json');
if (!fs.existsSync(rp)) {
  // develop / egy-ország (dev-xx) build: a _routes.json-t a seo-noprice.mjs írja, de az kimarad
  // (develop: DEV_SKIP; dev-sk/cz/pl/ch/eu: ONLY=hu). _routes.json nélkül a wrangler automatikus
  // szabályai NEM irányítják a Functionshöz az /api/* kéréseket → néma 404, az értékesítési pult
  // adatbázisa (API) nem tölt be, miközben a statikus oldalak (pl. /sales/) betöltenek.
  // Ezért itt létrehozzuk: /* = minden útvonal a Functionshöz; a statikus fájlokat a middleware
  // azonnal továbbengedi (ugyanaz, amit a seo-noprice.mjs ír az éles buildben).
  fs.writeFileSync(rp, JSON.stringify({ version: 1, include: ['/*'], exclude: [] }, null, 2));
  console.log('[am-routes] dist/_routes.json létrehozva: /* (minden útvonal a Functionshöz — dev build)');
  process.exit(0);
}
const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
r.include = r.include || [];
const covered = (w) => r.include.some((x) => x === w || x === '/*' || (x.endsWith('/*') && w.startsWith(x.slice(0, -1))));
const added = [];
for (const w of ['/belso/ajanlatmotor/*', '/ajanlat/auto/*', '/belso/desk/*', '/sales', '/sales/*']) if (!covered(w)) { r.include.push(w); added.push(w); }
const total = r.include.length + (r.exclude || []).length;
if (total > 100) throw new Error(`[am-routes] _routes.json: ${total} szabály (max. 100), az Ajánlatmotor útvonalai nem férnek bele`);
fs.writeFileSync(rp, JSON.stringify(r, null, 2));
console.log(`[am-routes] _routes.json: ${added.length ? added.join(', ') + ' felvéve' : 'már lefedve'} · ${total} szabály`);
