// Build lépés: Bajzáth Balázs már nem dolgozik a cégnél — a csapat-dobozai kikerülnek a MAGYAR oldalakról
// (eladó autók adatlapjai: .tmem kártya; beágyazott, escape-elt csapatlisták: xs-tmem). A többi nyelvhez nem nyúl.
// Idempotens; hiba esetén nem állítja meg a buildet. Futtatás: node hu-team-clean.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.cwd(), 'dist');
const DRY = process.argv.includes('--dry');
const NAMES = ['Bajzáth Balázs', 'Bajz\\u00e1th Bal\\u00e1zs'];
const SKIP = new Set(['ch', 'cs', 'cz', 'de', 'en', 'eu', 'fr', 'pl', 'sk', 'uk', 'zh', 'at', 'ro', 'it', 'es', 'i18n', 'l10n', 'admin', '_np', 'belso']);
// kártya-kezdetek (nyers HTML és escape-elt, JS-stringbe ágyazott HTML)
const STARTS = [
  { open: '<div class="tmem"', o: '<div', c: '</div>' },
  { open: '\\u003cdiv class=\\"xs-tmem\\"', o: '\\u003cdiv', c: '\\u003c/div>' },
  { open: '<div class="xs-tmem"', o: '<div', c: '</div>' },
];

function cut(h) {
  let n = 0;
  for (const nm of NAMES) {
    let i;
    while ((i = h.indexOf(nm)) > -1) {
      let best = null;
      for (const s of STARTS) { const j = h.lastIndexOf(s.open, i); if (j > -1 && (!best || j > best.j)) best = { j, s }; }
      if (!best || i - best.j > 4000) return { h, n, left: true };
      const { j, s } = best;
      let k = j + s.o.length, depth = 1;
      while (depth > 0) {
        const a = h.indexOf(s.o, k), b = h.indexOf(s.c, k);
        if (b < 0) return { h, n, left: true };
        if (a > -1 && a < b) { depth++; k = a + s.o.length; } else { depth--; k = b + s.c.length; }
      }
      if (k < i) return { h, n, left: true };
      h = h.slice(0, j) + h.slice(k); n++;
    }
  }
  return { h, n, left: false };
}

try {
  if (!fs.existsSync(dist)) console.log('[hu-team-clean] nincs dist — kihagyva');
  else {
    let pages = 0, cards = 0; const left = [];
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (d === dist && SKIP.has(e.name)) continue; walk(p); continue; }
        if (!/\.html$/.test(e.name) || (d === dist && /^404-/.test(e.name))) continue;
        const h = fs.readFileSync(p, 'utf8');
        if (!NAMES.some((nm) => h.includes(nm))) continue;
        const r = cut(h);
        if (r.n) { pages++; cards += r.n; if (!DRY) fs.writeFileSync(p, r.h); }
        if (r.left || NAMES.some((nm) => r.h.includes(nm))) left.push(path.relative(dist, p));
      }
    })(dist);
    console.log('[hu-team-clean] ' + (DRY ? '(próba) ' : '') + cards + ' csapat-kártya kivéve ' + pages + ' magyar oldalról' + (left.length ? '; még szerepel: ' + left.slice(0, 8).join(', ') + (left.length > 8 ? ' …(' + left.length + ')' : '') : ''));
  }
} catch (e) { console.log('[hu-team-clean] hiba:', e.message); }
