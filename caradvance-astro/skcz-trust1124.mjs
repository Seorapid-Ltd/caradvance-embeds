#!/usr/bin/env node
/**
 * skcz-trust1124.mjs — SEO 4. lépés (bizalom / E-E-A-T), caradvance.sk + caradvance.cz, 2026-11-24
 * Csak dist/sk/** és dist/cs/**, idempotens.
 *
 *  E1  Blog: dátum magyar sorrendben („2026. augusta 22”) → „22. augusta 2026” / „22. srpna 2026” (csak SK/CZ hónapnevekkel)
 *  E2  Blog: látható szerzősor („Autor: tím CarAdvance” → /o-nas/) + BlogPosting.author (Organization), ha hiányzik
 *  E3  AutoDealer schema: munkatársak (employee) a kapcsolat-oldal csapatkártyáiból; a német anyacég hivatalos adatai
 *      (legalName, vatID, cégjegyzékszám, alapítás éve) az impresszumból — csak az oldalon már szereplő adatok
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] || 'dist';
const MKT = {
  sk: { host: 'https://www.caradvance.sk', about: '/sk/o-nas/', by: 'Autor', team: 'tím CarAdvance',
        months: ['januára','februára','marca','apríla','mája','júna','júla','augusta','septembra','októbra','novembra','decembra'] },
  cs: { host: 'https://www.caradvance.cz', about: '/cs/o-nas/', by: 'Autor', team: 'tým CarAdvance',
        months: ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'] },
};
const PARENT = { legalName: 'Caradvance GmbH', vatID: 'DE232664616', foundingDate: '2003',
  identifier: { '@type': 'PropertyValue', propertyID: 'Handelsregister Amtsgericht München', value: 'HRB 151009' } };

const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (e.name === 'index.html') out.push(p); } return out; };
let n = { date: 0, byline: 0, author: 0, dealer: 0, wa: 0 };
// E4  Ahrefs Web Analytics: a .hu projekt kulcsa a .sk/.cz oldalon nem rögzít adatot (2026-11-24: 0 esemény 56 nap alatt).
//     Saját projekt kulcsa ide kerül; üresen hagyva nem változtat semmit. BEÉPÍTÉSRE VÁR: kulcs a megrendelőtől / Ahrefs-projektből.
const WA_KEY = { sk: '', cs: '' };
const HU_WA_KEY = 'hc0fbnlxNtmpnGbelDApVQ';

for (const [L, M] of Object.entries(MKT)) {
  const root = path.join(DIST, L); if (!fs.existsSync(root)) continue;
  // csapat a kapcsolat-oldalról (név, szerep, fotó)
  const kf = path.join(root, 'kontakt', 'index.html');
  const team = [];
  if (fs.existsSync(kf)) {
    const k = fs.readFileSync(kf, 'utf8');
    for (const m of k.matchAll(/<div class="kap-card"><div class="kap-photo"><img src="([^"]+)" alt="[^"]*"[^>]*><\/div><div class="body"><div class="nm">([^<]+)<span[\s\S]*?<div class="rl">([^<]+)<\/div>/g))
      team.push({ '@type': 'Person', name: m[2].trim(), jobTitle: m[3].trim(), image: M.host + m[1] });
  }
  const monthRe = new RegExp(`(<time datetime="\\d{4}-\\d{2}-\\d{2}"[^>]*>)(\\d{4})\\. (${M.months.join('|')}) (\\d{1,2})(</time>)`, 'g');

  for (const f of walk(root)) {
    const rel = path.relative(root, f);
    if (/^(en|de|hu|pl|uk|fr|zh)\//.test(rel)) continue;          // más nyelvű tükörlapok: nem érintjük
    let h = fs.readFileSync(f, 'utf8'); const before = h;

    // E1
    h = h.replace(monthRe, (_, a, y, mo, d, z) => { n.date++; return `${a}${d}. ${mo} ${y}${z}`; });

    // E2 látható szerzősor
    if (h.includes('class="bp-meta"') && !h.includes('class="bp-author"')) {
      h = h.replace(/(<div class="bp-meta"([^>]*)>[\s\S]*?<span\2>[^<]*<\/span>)( <\/div>)/, (all, a, cid, z) => {
        n.byline++;
        return `${a} <span class="bp-dot"${cid}>•</span> <span class="bp-author"${cid}>${M.by}: <a href="${M.about}" style="color:inherit;text-decoration:underline">${M.team}</a></span>${z}`;
      });
    }

    // JSON-LD: E2 author, E3 AutoDealer
    h = h.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (all, j) => {
      let d; try { d = JSON.parse(j); } catch { return all; }
      let ch = false;
      const fix = (o) => {
        if (!o || typeof o !== 'object') return;
        if (o['@type'] === 'BlogPosting' && !o.author) { o.author = { '@type': 'Organization', name: 'CarAdvance', url: M.host + M.about.replace(`/${L}`, '') }; ch = true; n.author++; }
        if (o['@type'] === 'AutoDealer') {
          if (team.length && !o.employee) { o.employee = team; ch = true; }
          const p = o.parentOrganization;
          if (p && p.name === 'Caradvance GmbH' && !p.vatID) { Object.assign(p, PARENT); ch = true; }
          if (ch) n.dealer++;
        }
        if (Array.isArray(o['@graph'])) o['@graph'].forEach(fix);
      };
      Array.isArray(d) ? d.forEach(fix) : fix(d);
      return ch ? `<script type="application/ld+json">${JSON.stringify(d)}</script>` : all;
    });

    if (WA_KEY[L] && h.includes(HU_WA_KEY)) { h = h.split(`data-key="${HU_WA_KEY}"`).join(`data-key="${WA_KEY[L]}"`); n.wa++; }

    if (h !== before) fs.writeFileSync(f, h);
  }
  console.log(`[skcz-trust] ${L}: csapat ${team.length} fő`);
}
console.log(`[skcz-trust] kész: dátum ${n.date}, szerzősor ${n.byline}, BlogPosting.author ${n.author}, AutoDealer ${n.dealer}, WA-kulcs ${n.wa}`);
