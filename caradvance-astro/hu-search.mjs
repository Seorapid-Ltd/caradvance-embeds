// Build lépés (a ver-assets.mjs előtt): az okos kereső ablak prémium megjelenése (világos + semleges grafit sötét mód).
// A hu-search.css tartalom-hash verzióval CSAK a magyar oldalakra kerül. Idempotens; hiba esetén nem állítja meg a buildet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.resolve(process.cwd(), 'dist');
const SRC = path.resolve(process.cwd(), 'hu-search.css');

try {
  if (!fs.existsSync(dist) || !fs.existsSync(SRC)) console.log('[hu-search] nincs dist vagy forrás — kihagyva');
  else {
    const css = fs.readFileSync(SRC, 'utf8');
    fs.writeFileSync(path.join(dist, 'hu-search.css'), css);
    const v = crypto.createHash('sha1').update(css).digest('hex').slice(0, 10);
    const tag = '<link rel="stylesheet" id="ca-dark-hu-search" href="/hu-search.css?v=' + v + '">';
    const SKIP = new Set(['ch', 'cs', 'cz', 'de', 'en', 'eu', 'fr', 'pl', 'sk', 'uk', 'zh', 'at', 'ro', 'it', 'es', 'i18n', 'l10n', 'admin', '_np']);
    let files = 0;
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (d === dist && SKIP.has(e.name)) continue; walk(p); continue; }
        if (!/\.html$/.test(e.name)) continue;
        if (d === dist && /^404-/.test(e.name)) continue;
        let h = fs.readFileSync(p, 'utf8');
        if (h.indexOf('</head>') < 0) continue;
        if (!/<html[^>]*lang="hu"/i.test(h)) continue;
        const h2 = h.indexOf('id="ca-dark-hu-search"') > -1
          ? h.replace(/<link rel="stylesheet" id="ca-dark-hu-search" href="[^"]*">/, tag)
          : h.replace('</head>', tag + '</head>');
        if (h2 !== h) { fs.writeFileSync(p, h2); files++; }
      }
    })(dist);
    console.log('[hu-search] prémium kereső ablak (csak magyar oldalak): ' + files + ' oldal');
  }
} catch (e) { console.log('[hu-search] hiba:', e.message); }
