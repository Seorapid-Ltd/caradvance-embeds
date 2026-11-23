#!/usr/bin/env node
/**
 * skcz-hufix.mjs — a caradvance.sk és caradvance.cz oldalakon maradt MAGYAR szövegek javítása (2026-11-22)
 *
 * A teljes átvizsgálás (statikus HTML, böngészőben kirajzolt oldal, felugró ablakok, űrlapok, PDF-adatlap) szerint
 * ezek maradtak magyarul: bérlési modelloldalak bekezdései (BMW X5, X3, X7, IONIQ 6, Polo, MAN TGE), képaláírások,
 * JSON-LD jármű-adatok (Dízel, Limuzin, Összkerékhajtás …), a blogok kulcsszólistái, az autókereső és az
 * összehasonlító feliratai, a „/ 12 hó” kalkulátor-eredmény, a galéria „– fotó N” képaláírásai, az adatbekérő
 * (/adatok/), az aláíró (/alairas/) és a partner (/partner/) oldal szövegei, valamint az autó-oldalak PDF-adatlapja.
 *
 * Mit csinál (csak dist/sk/** és dist/cs/** — a /en/, /de/, /hu/ alváltozatokhoz és a magyar oldalhoz nem nyúl):
 *   1. szövegcsomópont, alt/title/placeholder/aria-label/content/label és JSON-LD: pontos, teljes szöveg-csere
 *      (skcz-hufix-data.mjs FULL / FULL_LG), majd mondaton belüli részszöveg-csere (SUB);
 *   2. inline szkriptek: pontos kódrészlet-csere (CODE) — „– fotó”, „/ N hó”, PDF-adatlap, autókereső e-mail;
 *   3. i18n/rt-sk.js és rt-cs.js: a futásidejű szótár bővítése (RT, RT_LG), minták (HX) a tr() elején, és
 *      window.__caTr kiajánlása;
 *   4. a PDF-adatlapos oldalakra window.__caPdfLoc: a felugró adatlapot a futásidejű szótárral lefordítja,
 *      a forint-árat kiveszi (a piacon € az ár), a <html lang>-ot és a domaint beállítja.
 * Szabályonként logol. Idempotens. Hibára exit 0 — a buildet sosem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { FULL, FULL_LG, SUB, CODE, RT, RT_LG, HX, NM } from './skcz-hufix-data.mjs';

const DIST = process.argv[2] || 'dist';
const LANGS = ['sk', 'cs'];
const SUBLANG = /^(en|de|hu)$/;
const LD_ONLY = new Set(['Benzin']); // ezt csak a JSON-LD-ben cseréljük (látható szövegben a szűrők használhatják)
const DOMAIN = { sk: 'www.caradvance.sk', cs: 'www.caradvance.cz' };
const PNOTE = { sk: 'Cena bez DPH', cs: 'Cena bez DPH' };

function walk(d, root, out = []) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (d === root && SUBLANG.test(e.name)) continue; walk(p, root, out); }
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => escHtml(s).replace(/"/g, '&quot;');

function buildMaps(lg) {
  const i = lg === 'sk' ? 1 : 2;
  const full = new Map();
  for (const row of FULL) { const t = row[i] ?? row[1]; if (t != null && t !== row[0]) full.set(row[0], t); }
  for (const [a, b] of FULL_LG[lg] || []) full.set(a, b);
  return { full, sub: SUB[lg] || [], code: CODE[lg] || [] };
}

const stat = {};
const bump = (lg, k, n = 1) => { stat[lg] ||= {}; stat[lg][k] = (stat[lg][k] || 0) + n; };

function fixText(t, M, lg, ldOnlyOk) {
  // teljes egyezés (nyers, majd a szélső szóközök nélkül), utána részszöveg-csere
  if (M.full.has(t) && (ldOnlyOk || !LD_ONLY.has(t))) { bump(lg, 'teljes'); return M.full.get(t); }
  const tr = t.trim();
  if (tr && tr !== t && M.full.has(tr) && (ldOnlyOk || !LD_ONLY.has(tr))) { bump(lg, 'teljes'); return t.replace(tr, M.full.get(tr)); }
  let o = t;
  for (const [a, b] of M.sub) if (o.includes(a)) { o = o.split(a).join(b); bump(lg, 'rész'); }
  return o;
}

function fixHtml(h, lg, M) {
  // szkriptek / stílusok külön; a többi: szöveg + attribútum
  const parts = h.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i);
  for (let k = 0; k < parts.length; k++) {
    const p = parts[k];
    if (!p) continue;
    if (/^<script\b[^>]*application\/ld\+json/i.test(p)) {
      // JSON-LD: a JSON-sztringek pontos cseréje (a formázás érintetlen)
      parts[k] = p.replace(/"((?:\\.|[^"\\])*)"/g, (m, inner) => {
        let v; try { v = JSON.parse('"' + inner + '"'); } catch { return m; }
        const nv = fixText(v, M, lg, true);
        if (nv === v) return m;
        bump(lg, 'json-ld');
        return JSON.stringify(nv).replace(/</g, '\\u003c');
      });
    } else if (/^<script\b/i.test(p)) {
      let s = p;
      for (const [a, b] of M.code) if (s.includes(a)) { s = s.split(a).join(b); bump(lg, 'kód'); }
      parts[k] = s;
    } else if (/^<style\b/i.test(p)) {
      continue;
    } else {
      let s = p.replace(/(\s(?:alt|title|placeholder|aria-label|content|label)=")([^"]*)(")/g, (m, a, v, z) => {
        const raw = v.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const nv = fixText(raw, M, lg, false);
        if (nv === raw) return m;
        bump(lg, 'attribútum');
        return a + escAttr(nv) + z;
      });
      s = s.replace(/>([^<>]+)</g, (m, t) => {
        if (!/\p{L}/u.test(t)) return m;
        const raw = t.replace(/&amp;/g, '&');
        const nv = fixText(raw, M, lg, false);
        return nv === raw ? m : '>' + escHtml(nv) + '<';
      });
      parts[k] = s;
    }
  }
  return parts.join('');
}

const PDFLOC = (lg) => '<script id="ca-pdf-loc">window.__caPdfLoc=function(h){try{var d=new DOMParser().parseFromString(h,"text/html"),T=window.__caTr||function(x){return x};' +
  'd.documentElement.setAttribute("lang",' + JSON.stringify(lg) + ');' +
  '[].forEach.call(d.querySelectorAll(".xs-huf"),function(e){e.parentNode.removeChild(e)});' +
  'var pn=d.querySelector(".xs-pnote");if(pn)pn.textContent=' + JSON.stringify(PNOTE[lg]) + ';' +
  'var w=d.createTreeWalker(d.body,4,null),n,L=[];while((n=w.nextNode()))L.push(n);' +
  'L.forEach(function(n){var p=n.parentNode&&n.parentNode.nodeName;if(p==="SCRIPT"||p==="STYLE")return;var v=n.nodeValue;if(!/[A-Za-z\\u00c0-\\u017f]/.test(v))return;' +
  'v=v.replace(/www\\.caradvance\\.hu/g,' + JSON.stringify(DOMAIN[lg]) + ');var t=T(v);n.nodeValue=t==null?v:t;});' +
  'if(d.title){var tt=T(d.title);if(tt)d.title=tt;}' +
  'return "<!doctype html>"+d.documentElement.outerHTML;}catch(e){return h}};</script>';

function patchRuntime(lg) {
  const f = path.join(DIST, 'i18n', `rt-${lg}.js`);
  if (!fs.existsSync(f)) { console.log(`[skcz-hufix] ${lg}: ${f} hiányzik — runtime kimarad`); return; }
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('/*ca-hufix*/')) { console.log(`[skcz-hufix] ${lg}: runtime már javítva`); return; }
  const i = lg === 'sk' ? 1 : 2;
  const add = {};
  for (const row of RT) { const t = row[i] ?? row[1]; if (t != null) add[row[0]] = t; }
  for (const [a, b] of RT_LG[lg] || []) add[a] = b;
  const fb = {}; // a statikus táblából csak ott, ahol a futásidejű szótárban még nincs fordítás (pl. PDF-adatlap jármű-adatai)
  for (const row of FULL) { const t = row[i] ?? row[1]; if (t != null && t !== row[0] && !(row[0] in add) && row[0].length < 120) fb[row[0]] = t; }
  const hx = HX.map((r) => [r[0], r[i] ?? r[1]]);
  const nm = NM[lg] || [];
  const anchor = "function tr(s){var k=s.replace(/\\s+/g,' ').trim();";
  if (!s.includes(anchor)) { console.log(`[skcz-hufix] ${lg}: tr() horgony nem található — runtime kimarad`); return; }
  const inject = '/*ca-hufix*/Object.assign(M,' + JSON.stringify(add) + ');(function(F){for(var k in F)if(M[k]==null)M[k]=F[k]})(' + JSON.stringify(fb) + ');' +
    'var HXL=' + JSON.stringify(hx) + '.map(function(r){return[new RegExp(r[0]),r[1]]}),NML=' + JSON.stringify(nm) + '.map(function(r){return[new RegExp(r[0],"g"),r[1]]});' +
    'function NMF(x){for(var i=0;i<NML.length;i++)x=x.replace(NML[i][0],NML[i][1]);return x}' +
    'function HXF(k){if(M[k]!=null)return null;for(var i=0;i<HXL.length;i++){var m=k.match(HXL[i][0]);if(m){return HXL[i][1].replace(/\\$(\\d)/g,function(_,j){var g=m[+j]||"";if(+j===1&&/\\D/.test(g)){var t=M[g]!=null?M[g]:null;g=t!=null?t:NMF(g);}return g;});}}' +
    'if(/\\bLimuzin\\b|\\b\\d-(?:es|as|ös)\\b|\\b\\d ajtós\\b/.test(k)){var y=NMF(k);if(y!==k)return y;}return null}' +
    'window.__caTr=function(x){try{var r=tr(String(x));return r==null?x:r}catch(e){return x}};';
  const patched = "function tr(s){var k=s.replace(/\\s+/g,' ').trim();var _h=k?HXF(k):null;if(_h!=null){return s.match(/^\\s*/)[0]+_h+s.match(/\\s*$/)[0];}";
  s = s.replace(anchor, inject + patched);
  fs.writeFileSync(f, s);
  console.log(`[skcz-hufix] ${lg}: runtime szótár +${Object.keys(add).length} bejegyzés (+${Object.keys(fb).length} tartalék), ${hx.length} minta, __caTr kiajánlva`);
}

try {
  for (const lg of LANGS) {
    const root = path.join(DIST, lg);
    if (!fs.existsSync(root)) { console.log(`[skcz-hufix] ${lg}: ${root} hiányzik — kihagyva`); continue; }
    const M = buildMaps(lg);
    let files = 0, changed = 0, pdf = 0;
    for (const f of walk(root, root)) {
      files++;
      const h = fs.readFileSync(f, 'utf8');
      let o = fixHtml(h, lg, M);
      if (o.includes('__caPdfLoc(PDF_DOC)') && !o.includes('id="ca-pdf-loc"')) {
        const bi = o.lastIndexOf('</body>');
        if (bi > 0) { o = o.slice(0, bi) + PDFLOC(lg) + o.slice(bi); pdf++; }
      }
      if (o !== h) { fs.writeFileSync(f, o); changed++; }
    }
    console.log(`[skcz-hufix] ${lg}: ${files} oldal, ${changed} módosítva · ${JSON.stringify(stat[lg] || {})} · PDF-adatlap fordító: ${pdf} oldal`);
    patchRuntime(lg);
  }
} catch (e) {
  console.log('[skcz-hufix] hiba:', e && e.stack || e);
}
process.exit(0);
