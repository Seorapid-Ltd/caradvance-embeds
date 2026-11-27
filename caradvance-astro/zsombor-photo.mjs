// Build lépés (a ver-assets.mjs előtt): Vadnai Zsombor éles, nagy felbontású fotója mindenhol a régi, kis felbontású képek helyett.
//  · caradvance-emp-vadnai.webp (400×600, Eladom oldal, autó-adatlapok)  → /vadnai-zsombor-hd-2x3.webp (965×1448)
//  · vadnai-zsombor.webp (560×700, Kapcsolat, csapat-listák, chat)        → /vadnai-zsombor-hd.webp (1086×1358)
// A www.caradvance.hu-ra mutató abszolút hivatkozásokat is átírja relatívra (így a dev és az éles oldal is a saját, új képét tölti),
// tartalom-hash verzióval. Minden HTML-ben és a chat-widgetben. Idempotens; hiba esetén nem állítja meg a buildet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.resolve(process.cwd(), 'dist');
const ver = (f) => { try { return crypto.createHash('md5').update(fs.readFileSync(path.join(dist, f))).digest('hex').slice(0, 8); } catch (e) { return ''; } };
const DOM = '(?:https?:(?:\\\\?/){2}(?:www\\.)?caradvance\\.hu)?';
const MAP = [
  [new RegExp(DOM + '(\\\\?/)caradvance-emp-vadnai\\.webp(?:\\?v=[\\w.]+)?', 'g'), 'vadnai-zsombor-hd-2x3.webp'],
  [new RegExp(DOM + '(\\\\?/)vadnai-zsombor\\.webp(?:\\?v=[\\w.]+)?', 'g'), 'vadnai-zsombor-hd.webp'],
];

try {
  if (!fs.existsSync(dist)) console.log('[zsombor-photo] nincs dist — kihagyva');
  else {
    const v = Object.fromEntries(MAP.map(([, f]) => [f, ver(f)]));
    let files = 0, refs = 0;
    const fix = (p) => {
      let h = fs.readFileSync(p, 'utf8'), n = 0;
      for (const [re, f] of MAP) h = h.replace(re, (m, sl) => { n++; return sl + f + (v[f] ? '?v=' + v[f] : ''); });
      if (n) { fs.writeFileSync(p, h); files++; refs += n; }
    };
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (/\.html$/.test(e.name) || e.name === 'caradvance-chat.js') fix(p);
      }
    })(dist);
    console.log('[zsombor-photo] Zsombor nagy felbontású fotója: ' + refs + ' hivatkozás, ' + files + ' fájl');
  }
} catch (e) { console.log('[zsombor-photo] hiba:', e.message); }
