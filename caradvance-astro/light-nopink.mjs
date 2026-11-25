// Build lépés (a ver-assets.mjs előtt): világos módban nincs rózsaszín/piros árnyalatú kiemelés.
// A light-nopink.css (a dev oldal CSS-éből generált felülírások) a dist-be kerül tartalom-hash verzióval,
// és minden HTML <head>-jébe bekerül egy <link>. A szabályok csak világos módban hatnak (html:not(.ca-dark)):
//  · rózsaszín háttér-árnyalatok, pirosas ragyogások/árnyékok, hover-keretek, rózsaszín átmenetek → semleges szürke
//  · az egyszínű piros gombok, aktív (kijelölt) állapotok és a piros szövegek maradnak
// Idempotens; hiba esetén nem állítja meg a buildet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.resolve(process.cwd(), 'dist');
const SRC = path.resolve(process.cwd(), 'light-nopink.css');

try {
  if (!fs.existsSync(dist) || !fs.existsSync(SRC)) console.log('[light-nopink] nincs dist vagy forrás — kihagyva');
  else {
    const css = fs.readFileSync(SRC, 'utf8');
    fs.writeFileSync(path.join(dist, 'light-nopink.css'), css);
    const v = crypto.createHash('sha1').update(css).digest('hex').slice(0, 10);
    const tag = '<link rel="stylesheet" id="ca-nopink" href="/light-nopink.css?v=' + v + '">';
    let files = 0;
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!/\.html$/.test(e.name)) continue;
        let h = fs.readFileSync(p, 'utf8');
        if (h.indexOf('</head>') < 0) continue;
        const h2 = h.indexOf('id="ca-nopink"') > -1
          ? h.replace(/<link rel="stylesheet" id="ca-nopink" href="[^"]*">/, tag)
          : h.replace('</head>', tag + '</head>');
        if (h2 !== h) { fs.writeFileSync(p, h2); files++; }
      }
    })(dist);
    console.log('[light-nopink] világos mód rózsaszín-mentesítés: ' + files + ' oldal');
  }
} catch (e) { console.log('[light-nopink] hiba:', e.message); }
