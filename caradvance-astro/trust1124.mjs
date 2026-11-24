#!/usr/bin/env node
/**
 * trust1124.mjs — SEO 4. lépés (bizalom / E-E-A-T), caradvance.hu + .ch + .eu, 2026-11-24 (az skcz-trust1124 mintájára)
 *
 *  E2  Blog: látható szerzősor („Szerző: a CarAdvance csapata” → Rólunk oldal) + BlogPosting.author, ha hiányzik
 *  E3  AutoDealer schema: munkatársak (employee) a kapcsolat-oldal csapatkártyáiból; a német anyacég hivatalos adatai
 *      (legalName, vatID, cégjegyzékszám, alapítás éve) — csak az impresszumban már szereplő adatok; a meglévő mezőket nem írja felül
 * Idempotens; hibára exit 0.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const MK = (process.env.CA_MARKET || '').trim().toLowerCase();
const PARENT = { legalName: 'Caradvance GmbH', vatID: 'DE232664616', foundingDate: '2003',
  identifier: { '@type': 'PropertyValue', propertyID: 'Handelsregister Amtsgericht München', value: 'HRB 151009' } };
const SKIPHU = /^(_np|en|de|fr|uk|zh|sk|cs|pl|ch|eu|admin|belso|icons|_astro)(\/|$)/;

/* [piac, gyökér a dist-ben, nyelvi almappa ('' = gyökér), host, Rólunk, kapcsolat-oldal, „Szerző”, csapat] */
const SITES = [
  ['hu', '', '', 'https://www.caradvance.hu', '/miert-mi/', 'kapcsolat', 'Szerző', 'a CarAdvance csapata'],
  ['ch', 'ch', '', 'https://www.caradvance.ch', '/ch/ueber-uns/', 'kontakt', 'Autor', 'Team CarAdvance'],
  ['ch', 'ch', 'en', 'https://www.caradvance.ch', '/ch/en/ueber-uns/', 'en/kontakt', 'Author', 'the CarAdvance team'],
  ['ch', 'ch', 'fr', 'https://www.caradvance.ch', '/ch/fr/ueber-uns/', 'fr/kontakt', 'Auteur', 'l’équipe CarAdvance'],
  ['ch', 'ch', 'it', 'https://www.caradvance.ch', '/ch/it/ueber-uns/', 'it/kontakt', 'Autore', 'il team CarAdvance'],
  ['eu', 'eu', 'de', 'https://www.caradvance.eu', '/eu/de/ueber-uns/', 'de/kontakt', 'Autor', 'Team CarAdvance'],
  ['eu', 'eu', 'fr', 'https://www.caradvance.eu', '/eu/fr/a-propos/', 'fr/contact', 'Auteur', 'l’équipe CarAdvance'],
  ['eu', 'eu', 'it', 'https://www.caradvance.eu', '/eu/it/chi-siamo/', 'it/contatti', 'Autore', 'il team CarAdvance'],
  ['eu', 'eu', 'es', 'https://www.caradvance.eu', '/eu/es/sobre-nosotros/', 'es/contacto', 'Autor', 'equipo CarAdvance'],
];
const LANGDIRS = { ch: ['en', 'fr', 'it'], eu: ['de', 'fr', 'it', 'es'] };

function walk(d, rel, skip, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (!skip(r)) walk(path.join(d, e.name), r, skip, out); }
    else if (e.name === 'index.html') out.push([rel, path.join(d, e.name)]);
  }
  return out;
}

try {
  const n = { byline: 0, author: 0, dealer: 0 };
  for (const [mk, base, lang, host, about, kpath, by, teamName] of SITES) {
    if (MK && MK !== 'all' && MK !== mk) continue;
    const mroot = path.join(DIST, base);
    const root = path.join(mroot, lang);
    if (!fs.existsSync(root)) continue;
    const skip = mk === 'hu' ? (r) => SKIPHU.test(r) : lang ? () => false : (r) => LANGDIRS[mk].includes(r.split('/')[0]);
    const team = [];
    const kf = path.join(mroot, kpath, 'index.html');
    if (fs.existsSync(kf)) {
      const k = fs.readFileSync(kf, 'utf8');
      for (const m of k.matchAll(/<div class="kap-card"><div class="kap-photo"><img src="([^"]+)" alt="[^"]*"[^>]*><\/div><div class="body"><div class="nm">([^<]+)<span[\s\S]*?<div class="rl">([^<]+)<\/div>/g)) {
        const src = m[1].replace(/^\/(ch|eu)(?=\/)/, '');
        team.push({ '@type': 'Person', name: m[2].trim(), jobTitle: m[3].trim(), image: /^https?:/.test(src) ? src : host + src });
      }
      /* a kártyákat JS rajzolja ki: name:"…",role:"…",…,img:"…" */
      for (const m of k.matchAll(/name:"([^"]+)",role:"([^"]+)"[^}]*?img:"([^"]+)"/g)) {
        if (team.some((t) => t.name === m[1])) continue;
        const src = m[3].replace(/^\/(ch|eu)(?=\/)/, '').replace(/\?v=\d+$/, '');
        team.push({ '@type': 'Person', name: m[1], jobTitle: m[2], image: /^https?:/.test(src) ? src : host + src });
      }
    }
    for (const [, f] of walk(root, '', skip)) {
      let h = fs.readFileSync(f, 'utf8'); const before = h;
      if (h.includes('class="bp-meta"') && !h.includes('class="bp-author"')) {
        h = h.replace(/(<div class="bp-meta"([^>]*)>[\s\S]*?<span\2>[^<]*<\/span>)( <\/div>)/, (all, a, cid, z) => {
          n.byline++;
          return `${a} <span class="bp-dot"${cid}>•</span> <span class="bp-author"${cid}>${by}: <a href="${about}" style="color:inherit;text-decoration:underline">${teamName}</a></span>${z}`;
        });
      }
      h = h.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (all, j) => {
        let d; try { d = JSON.parse(j); } catch { return all; }
        let ch = false;
        const fix = (o) => {
          if (!o || typeof o !== 'object') return;
          if (Array.isArray(o)) { o.forEach(fix); return; }
          if (o['@type'] === 'BlogPosting' && !o.author) { o.author = { '@type': 'Organization', name: 'CarAdvance', url: host + '/' }; ch = true; n.author++; }
          if (o['@type'] === 'AutoDealer') {
            if (team.length && !o.employee) { o.employee = team; ch = true; }
            const p = o.parentOrganization;
            if (p && typeof p === 'object') { for (const [k, v] of Object.entries(PARENT)) if (!p[k]) { p[k] = v; ch = true; } }
            n.dealer++;
          }
          for (const [k, v] of Object.entries(o)) if (k !== 'employee' && k !== 'parentOrganization' && v && typeof v === 'object') fix(v);
        };
        fix(d);
        return ch ? `<script type="application/ld+json">${JSON.stringify(d)}</script>` : all;
      });
      if (h !== before) fs.writeFileSync(f, h);
    }
  }
  console.log(`[trust1124] szerzősor ${n.byline}, BlogPosting.author ${n.author}, AutoDealer bővítve ${n.dealer}`);
} catch (e) { console.error('[trust1124] hiba:', e.message); }
process.exit(0);
