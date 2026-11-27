// Build lépés (a ver-assets.mjs előtt): a bérelhető autók kártyáin (.sub-card) a kép BMW-stílusban — fehér háttéren, kisebb autó sok levegővel;
// a kártya többi része (cím, ár, gombok) ugyanolyan, mint az eladó autóknál. Világos és sötét módban is.
// A rent-bmw.css a dist-be kerül tartalom-hash verzióval, és CSAK a magyar oldalakra kerül (amelyeken van bérlési kártya).
// Idempotens; hiba esetén nem állítja meg a buildet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.resolve(process.cwd(), 'dist');
const SRC = path.resolve(process.cwd(), 'rent-bmw.css');

try {
  if (!fs.existsSync(dist) || !fs.existsSync(SRC)) console.log('[rent-bmw] nincs dist vagy forrás — kihagyva');
  else {
    const css = fs.readFileSync(SRC, 'utf8');
    fs.writeFileSync(path.join(dist, 'rent-bmw.css'), css);
    const v = crypto.createHash('sha1').update(css).digest('hex').slice(0, 10);
    const tag = '<link rel="stylesheet" id="ca-rent-bmw" href="/rent-bmw.css?v=' + v + '">';
    const SKIP = new Set(['ch', 'cs', 'cz', 'de', 'en', 'eu', 'fr', 'pl', 'sk', 'uk', 'zh', 'at', 'ro', 'it', 'es', 'i18n', 'l10n', 'admin', '_np']);
    let files = 0;
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (d === dist && SKIP.has(e.name)) continue; walk(p); continue; }
        if (!/\.html$/.test(e.name)) continue;
        if (d === dist && /^404-/.test(e.name)) continue;
        let h = fs.readFileSync(p, 'utf8');
        if (h.indexOf('</head>') < 0 || h.indexOf('sub-card') < 0) continue;
        if (!/<html[^>]*lang="hu"/i.test(h)) continue;
        const h2 = h.indexOf('id="ca-rent-bmw"') > -1
          ? h.replace(/<link rel="stylesheet" id="ca-rent-bmw" href="[^"]*">/, tag)
          : h.replace('</head>', tag + '</head>');
        if (h2 !== h) { fs.writeFileSync(p, h2); files++; }
      }
    })(dist);
    console.log('[rent-bmw] BMW-stílusú bérlési kártyák (csak magyar oldalak): ' + files + ' oldal');
  }
} catch (e) { console.log('[rent-bmw] hiba:', e.message); }
