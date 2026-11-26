// Build lépés (a ver-assets.mjs előtt): az oldalak első (hero) képe nem tölti ki a teljes képernyőt —
// gépen ~84% (főoldal) / ~72% (aloldalak), telefonon a főoldal ~76%, így alul kilátszik a következő rész, és látszik, hogy van még tartalom.
// A „Görgess” felirat ezért kimarad. A hero-peek.css tartalom-hash verzióval CSAK a magyar oldalakra kerül. Idempotens; hiba esetén nem állítja meg a buildet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.resolve(process.cwd(), 'dist');
const SRC = path.resolve(process.cwd(), 'hero-peek.css');

try {
  if (!fs.existsSync(dist) || !fs.existsSync(SRC)) console.log('[hero-peek] nincs dist vagy forrás — kihagyva');
  else {
    const css = fs.readFileSync(SRC, 'utf8');
    fs.writeFileSync(path.join(dist, 'hero-peek.css'), css);
    const v = crypto.createHash('sha1').update(css).digest('hex').slice(0, 10);
    const tag = '<link rel="stylesheet" id="ca-hero-peek" href="/hero-peek.css?v=' + v + '">';
    const SKIP = new Set(['ch', 'cs', 'cz', 'de', 'en', 'eu', 'fr', 'pl', 'sk', 'uk', 'zh', 'at', 'ro', 'it', 'es', 'i18n', 'l10n', 'admin', '_np']);
    let files = 0;
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (d === dist && SKIP.has(e.name)) continue; walk(p); continue; }
        if (!/\.html$/.test(e.name)) continue;
        if (d === dist && /^404-/.test(e.name)) continue;
        let h = fs.readFileSync(p, 'utf8');
        if (h.indexOf('</head>') < 0 || h.indexOf('hero') < 0) continue;
        if (!/<html[^>]*lang="hu"/i.test(h)) continue;
        const h2 = h.indexOf('id="ca-hero-peek"') > -1
          ? h.replace(/<link rel="stylesheet" id="ca-hero-peek" href="[^"]*">/, tag)
          : h.replace('</head>', tag + '</head>');
        if (h2 !== h) { fs.writeFileSync(p, h2); files++; }
      }
    })(dist);
    console.log('[hero-peek] alacsonyabb első kép (csak magyar oldalak): ' + files + ' oldal');
  }
} catch (e) { console.log('[hero-peek] hiba:', e.message); }
