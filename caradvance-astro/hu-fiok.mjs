// Build lépés: az Ügyfélfiók oldalon sötét módban a fejléc lágyan átúszik a háttérbe, semleges grafit tónusokkal.
// A hu-fiok.css tartalom-hash verzióval CSAK a magyar, fiók-oldalakra kerül. Idempotens; hiba esetén nem állítja meg a buildet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.resolve(process.cwd(), 'dist');
const SRC = path.resolve(process.cwd(), 'hu-fiok.css');

try {
  if (!fs.existsSync(dist) || !fs.existsSync(SRC)) console.log('[hu-fiok] nincs dist vagy forrás — kihagyva');
  else {
    const css = fs.readFileSync(SRC, 'utf8');
    fs.writeFileSync(path.join(dist, 'hu-fiok.css'), css);
    const v = crypto.createHash('sha1').update(css).digest('hex').slice(0, 10);
    const tag = '<link rel="stylesheet" id="ca-dark-hu-fiok" href="/hu-fiok.css?v=' + v + '">';
    const SKIP = new Set(['ch', 'cs', 'cz', 'de', 'en', 'eu', 'fr', 'pl', 'sk', 'uk', 'zh', 'at', 'ro', 'it', 'es', 'i18n', 'l10n', 'admin', '_np']);
    let files = 0;
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (d === dist && SKIP.has(e.name)) continue; walk(p); continue; }
        if (!/\.html$/.test(e.name)) continue;
        if (d === dist && /^404-/.test(e.name)) continue;
        let h = fs.readFileSync(p, 'utf8');
        if (h.indexOf('</head>') < 0 || h.indexOf('class="acct') < 0) continue;
        if (!/<html[^>]*lang="hu"/i.test(h)) continue;
        const h2 = h.indexOf('id="ca-dark-hu-fiok"') > -1
          ? h.replace(/<link rel="stylesheet" id="ca-dark-hu-fiok" href="[^"]*">/, tag)
          : h.replace('</head>', tag + '</head>');
        if (h2 !== h) { fs.writeFileSync(p, h2); files++; }
      }
    })(dist);
    console.log('[hu-fiok] ügyfélfiók sötét fade (csak magyar oldalak): ' + files + ' oldal');
  }
} catch (e) { console.log('[hu-fiok] hiba:', e.message); }
