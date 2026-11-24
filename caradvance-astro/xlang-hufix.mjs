/**
 * xlang-hufix.mjs — magyar szövegmaradványok fordítása a NEM magyar nyelvi változatokon (2026-11-23).
 *
 * Változatok: caradvance.hu /en /de /fr /uk /zh · .sk és .cz /en /de · .pl (+/en /de) · .ch (de, /fr /it /en)
 *             · .eu /de /fr /it /es. (A .sk és .cz alapnyelvét a skcz-hufix.mjs kezeli.)
 *
 * Mit csinál:
 *   1. dist/<változat>/**​/index.html — a szövegcsomópontokban, az alt/title/placeholder/aria-label/content/label
 *      attribútumokban és a JSON-LD szövegekben a pontos (szóközre normalizált) magyar szöveget lefordítja
 *      az xlang-hufix-data.mjs ROWS táblája és mintái (fotó-alt, havidíj-megjegyzés, készlet-mondat,
 *      eladó/elkelt autó leírás, kaució-mondat stb.) alapján. Így a Google és a JS nélküli látogató is a
 *      helyi nyelvet látja.
 *   2. dist/i18n/rt-<változat>.js — ugyanaz a fordító (XL) a futásidejű tr() elejére kerül, így a JS-sel
 *      később kirajzolt szövegek (chat, fülek, szűrők, galéria) is fordítva jelennek meg.
 * Idempotens (/*ca-xlang*​/ jelölő), hiba esetén naplóz és 0-val lép ki — a buildet soha nem állítja meg.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { LANGS, ROWS, MONTHS, WORDS, TPL, NM } from './xlang-hufix-data.mjs';
import { LANGS2, ROWS2, TPL2, DESC, SUB, ARTICLE_DROP } from './xlang-hufix-data2.mjs';
import { ROWS3 } from './xlang-hufix-data3.mjs';

const DIST = path.resolve('dist');
// változat mappa → [nyelv, futásidejű fordító fájl, kihagyandó almappák]
const VARIANTS = [
  ['en', 'en', 'rt-en.js', []], ['de', 'de', 'rt-de.js', []], ['fr', 'fr', 'rt-fr.js', []], ['uk', 'uk', 'rt-uk.js', []], ['zh', 'zh', 'rt-zh.js', []],
  ['sk/en', 'en', 'rt-sk-en.js', []], ['sk/de', 'de', 'rt-sk-de.js', []], ['cs/en', 'en', 'rt-cs-en.js', []], ['cs/de', 'de', 'rt-cs-de.js', []],
  ['pl', 'pl', 'rt-pl.js', ['en', 'de']], ['pl/en', 'en', 'rt-pl-en.js', []], ['pl/de', 'de', 'rt-pl-de.js', []],
  ['ch', 'de', 'rt-ch-de.js', ['fr', 'it', 'en']], ['ch/fr', 'fr', 'rt-ch-fr.js', []], ['ch/it', 'it', 'rt-ch-it.js', []], ['ch/en', 'en', 'rt-ch-en.js', []],
  ['eu/de', 'de', 'rt-eu-de.js', []], ['eu/fr', 'fr', 'rt-eu-fr.js', []], ['eu/it', 'it', 'rt-eu-it.js', []], ['eu/es', 'es', 'rt-eu-es.js', []],
];
const SKIP = /^(_np|admin|belso|ajanlat|api|icons|_astro|auto-foto|berles-press|i18n)$/;

/* ── A fordító: önálló függvény-forrás, a node-ban és a böngészőben is ugyanez fut ── */
const XL_SRC = String.raw`function(k,D){
  var r=D.R[k]; if(r!=null) return r;
  var m, T=D.T, ch=D.CH;
  function nm(x){for(var i=0;i<D.NM.length;i++)x=x.replace(new RegExp(D.NM[i][0],'g'),D.NM[i][1]);return x}
  function w(x){var t=D.W[x];return t!=null?t:x}
  function cs(x){x=x.replace(/([^.])\.\.(?!\.)/g,'$1.');return ch?x.replace(/ß/g,'ss'):x}
  // fotó-alt: "<modell> – fotó N"
  if((m=k.match(/^(.+) – fotó (\d+)$/))){var a=D.R[m[1]]!=null?D.R[m[1]]:nm(m[1]);return a+' – '+T.photo+' '+m[2];}
  // havidíj-megjegyzés
  if((m=k.match(/^A havi díj 2000 km\/\S+ futáskerettel értendő\. 3000 km\/\S+ esetén ([\d  .,]+) € \/ \S+ \(([\d  .,]+) Ft\)\. Egyszeri, visszatérítendő kaució: ([\d  .,]+) € \(([\d  .,]+) Ft\)\. Az árak tájékoztató jellegűek, élő árfolyammal \(1 € = ([\d  .,]+) Ft\)\.$/)))
    return cs(T.fee.replace('{A}',m[1]).replace('{B}',m[2]).replace('{C}',m[3]).replace('{D}',m[4]).replace('{E}',m[5]));
  // készlet-mondat
  if((m=k.match(/^(?:(\d+) db (?:(.+?) )?azonnal elérhető|(Jelenleg nincs azonnal elérhető darab)|(Hamarosan elérhető))(?:; további autók(?::| —) (.+?))?\. Vadonatúj, 0 km-es (?:autót adunk át|autók)\.$/))){
    var S=T.stock, h;
    if(m[3]) h=S[2]; else if(m[4]) h=S[3]; else if(m[2]) h=S[0].replace('{N}',m[1]).replace('{M}',D.R[m[2]]!=null?D.R[m[2]]:nm(m[2])); else h=S[1].replace('{N}',m[1]);
    if(m[5]){var parts=m[5].split(/, /),out=[];for(var i=0;i<parts.length;i++){var q=parts[i].match(/^(\S+): (\d+) db$/);if(!q)return null;out.push(S[5].replace('{MO}',D.MO[q[1]]||q[1]).replace('{N}',q[2]));}h+=S[4].replace('{L}',out.join(D.L==='zh'?'，':', '));}
    return cs(h+S[7]+S[6]);
  }
  // eladó / elkelt autó (meta leírás)
  if((m=k.match(/^(Eladó|Elkelt:) (.+?), (?:(\d{4}), )?(?:([\d  ]+) km, )?(\d+) LE, ([^,.]+(?:\([^)]*\))?)(?:, (Automata|Manuális))?\.(?: Ára ([\d  ]+) Ft\.)?(?: (Ellenőrzött előéletű német import a CarAdvance-től\.|Hasonlót keresel\? Nézd meg az aktuális készletet\.))?$/))){
    var C=T.car, sold=m[1]==='Elkelt:', p=[m[2]];
    if(m[3])p.push(m[3]); if(m[4])p.push(m[4]+' km'); p.push(m[5]+' '+C[5]); p.push(w(m[6])); if(m[7])p.push(w(m[7]));
    var z=D.L==='zh'?'，':', ', t=(sold?C[3]:C[0])+p.join(z)+(D.L==='zh'?'。':'.');
    var sp=D.L==='zh'?'':' ';
    if(m[8]) t+=sp+C[1].replace('{P}',m[8]);
    if(m[9]) t+=sp+(/^Hasonl/.test(m[9])?C[4]:C[2]);
    return cs(t);
  }
  // A(z) <autó> <km> futott, <üzemanyag> üzemű <karosszéria>. <LE> LE, <váltó>, <hajtás>. Nettó ár…
  if((m=k.match(/^A\(z\) (.+?) ([\d  ]+) futott, (\S+) üzemű ([^.]+)\. (\d+) LE, (Automata|Manuális), ([^.]+)\. Nettó ár \(áfa nélkül\) garanciával, CarAdvance import\.$/))){
    var zz=D.L==='zh'?'，':', ';
    return cs(m[1]+zz+m[2]+' km'+zz+w(m[3])+zz+w(m[4])+(D.L==='zh'?'。':'. ')+m[5]+' '+T.car[5]+zz+w(m[6])+zz+w(m[7])+(D.L==='zh'?'。':'. ')+T.net);
  }
  // havidíj nettó-tól (+ kaució)
  if((m=k.match(/^([\d  ]+) Ft\/hó nettó-tól(?: · kaució ([\d  ]+ €))?$/))) return cs(T.monthly.replace('{P}',m[1])+(m[2]?' · '+T.deposit+' '+m[2]:''));
  // meta-leírás + már lefordított „ajánlatkérés: telefon” utótag
  if((m=k.match(/^(.+?[.!?]) ([^.:]{3,40} ?: ?\+36[\d ]+\.)$/))&&D.R[m[1]]!=null) return D.R[m[1]]+' '+m[2];
  var T2=D.T2;
  if(T2){
    if((m=k.match(/^([\d.]+) € -tól$/))) return T2.fromEur.replace('{P}',m[1].replace(/\./g,T2.th));
    if((m=k.match(/^([\d  ]+) Ft\/hó-tól$/))) return T2.fromHuf.replace('{P}',m[1]);
    if((m=k.match(/^(\d+) hónap$/))) return T2.months.replace('{N}',m[1]);
    if((m=k.match(/^(\d+) perc olvasás$/))) return T2.readMin.replace('{N}',m[1]);
    if((m=k.match(/^(\d+) perc$/))) return T2.min.replace('{N}',m[1]);
    if((m=k.match(/^(\d{4})\. ([a-zá-ű]+) (\d{1,2})\.$/))&&D.MN&&D.MN[m[2]]){var mm=D.MN[m[2]],p2=function(x){return (x<10?'0':'')+x};return T2.date.replace('{Y}',m[1]).replace('{M}',D.MO[m[2]]).replace('{D}',m[3]).replace('{DD}',p2(+m[3])).replace('{MM}',p2(mm));}
    if((m=k.match(/^Jelenleg (\d+) változat közül választhatsz:$/))) return T2.variants.replace('{N}',m[1]);
    if((m=k.match(/^Új (.+) ára: nettó ([\d,]+) M Ft-tól, Németországból$/))) return T2.newPrice.replace('{M}',m[1]).replace('{P}',m[2]);
    if((m=k.match(/^Nettó havi díj · (\d+) km\/hó$/))) return T2.netFee.replace('{K}',m[1]);
    if((m=k.match(/^([\d  ]+) €\/hó · nettó$/))) return m[1]+' €'+T.perMonth+' · '+T2.net;
    if((m=k.match(/^(.+) — ([\d  ]+) Ft\/hó$/))) return nm(m[1])+' — '+m[2]+' '+T2.huf+T.perMonth;
    if((m=k.match(/^— (.+), ([\d  ]+) €\/hó-tól([;.])$/))&&D.DS[m[1]]!=null) return '— '+D.DS[m[1]]+(D.L==='zh'?'，':', ')+T2.fromEurPm.replace('{P}',m[2])+(D.L==='zh'?(m[3]===';'?'；':'。'):m[3]);
    if((m=k.match(/^Elkelt: (\d{4})\. (\d\d)\. (\d\d)\.$/))) return T.car[3]+m[1]+'-'+m[2]+'-'+m[3];
    if((/^(?:BMW|MINI|Mercedes(?:-Benz|-AMG)?) /.test(k)||/^[A-Z]{1,3}-osztály$/.test(k))&&/-(?:es|as|ös|os)\b|osztály|Limuzin|ajtós/.test(k)&&!/(?:^|\s)[a-záéíóöőúüű]{3,}/.test(k.replace(/\d-(?:es|as|ös|os)\b|osztály|Limuzin|\d ajtós/g,''))){var z=nm(k);if(z!==k)return cs(z);}
  }
  // BMW X3 változatlista (magyar és szlovák–magyar keverék alak)
  var X=T.x3, pm=function(P){return P.replace(/\/(?:mes\.?|měs\.?|hó)/,T.perMonth).replace(/-tól$/,'')};
  if((m=k.match(/^(?:od )?(.+?) vezetheted, 2 000–4 000 km\/hó futáskerettel és 6 hónapos futamidővel\. Jelenleg (\d+) db BMW X3 közül választhatsz \((\d+) db azonnal elérhető\), (.+?) kivitelben\. Egyszeri, visszajáró ?$/))) return cs(T.x3s.replace('{P}',pm(m[1])).replace('{N}',m[2]).replace('{M}',m[3]).replace('{V}',m[4])).trim();
  if((m=k.match(/^— kulturált, (?:erős benzines|výkonný benzínový) belépő, (?:od )?(.+?)(?:-tól)?;$/))) return cs(X[0].replace('{P}',pm(m[1])));
  if((m=k.match(/^— a sokat autózók kedvence, (?:od )?(.+?)(?:-tól)?;$/))) return cs(X[1].replace('{P}',pm(m[1])));
  if((m=k.match(/^— (?:hathengeres dízel|šesťvalcový diesel|šestiválcový naftový), a (?:legerősebb|legvýkonnýebb) bérelhető X3, (?:od )?(.+?)(?:-tól)?\.\.? (?:Mindegyik xDrive összkerékhajtással és 8 fokozatú automatával érkezik\.|(.+))$/))) return cs((X[2].replace('{P}',pm(m[1]))+(D.L==='zh'?'':' ')+(m[2]||X[3])).replace(/ ?Mindegyik xDrive összkerékhajtással és 8 fokozatú automatával érkezik\./,(D.L==='zh'?'':' ')+X[3]));
  // mondatrészek (szövegen belül)
  var o=k, ch2=0;
  o=o.replace(/A kaució \((.+?)-tól\) a bérlés végén hiánytalanul visszajár, amennyiben nincs sérülés, közlekedési bírság vagy egyéb, a bérlőnek felróható levonás\./g,function(_,x){ch2=1;return T.kaucio.replace('{X}',x)});
  o=o.replace(/^(.+?)-tól; a szervizt, az adót és a nyári-téli gumit mi álljuk\. Nem kell tulajdonolnod: a bérlet végén egyszerűen visszaadod, vagy új modellre váltasz\.$/,function(_,x){ch2=1;return T.szerviz.replace('{X}',x)});
  o=o.replace(/ ?Mindegyik xDrive összkerékhajtással és 8 fokozatú automatával érkezik\./g,function(){ch2=1;return ' '+X[3]});
  if(D.SUB)for(var si=0;si<D.SUB.length;si++){if(o.indexOf(D.SUB[si][0])>=0){o=o.split(D.SUB[si][0]).join(D.SUB[si][1]);ch2=1;}}
  if(ch2) return cs(o.replace(/^ /,''));
  return null;
}`;
const XL = new Function('return ' + XL_SRC)();

function dataFor(lang, ch, hu) {
  const i = LANGS.indexOf(lang);
  const pick = (a) => (Array.isArray(a) ? a[i] : a);
  const R = {};
  for (const row of ROWS) { const t = row[1 + i]; if (t != null && t !== row[0]) R[row[0]] = ch ? t.replace(/ß/g, 'ss') : t; }
  const MO = {}; for (const [k, v] of Object.entries(MONTHS)) MO[k] = v[i];
  const W = {}; for (const [k, v] of Object.entries(WORDS)) W[k] = v[i];
  const T = {}; for (const [k, v] of Object.entries(TPL)) T[k] = pick(v);
  const j = LANGS2.indexOf(lang);
  if (hu && j >= 0) for (const row of [...ROWS2, ...ROWS3]) { const t = row[1 + j]; if (t != null && t !== row[0]) R[row[0]] = t; }
  const MN = {}; Object.keys(MONTHS).forEach((k, n) => { MN[k] = n + 1; });
  const T2 = {}; for (const [k, v] of Object.entries(TPL2)) T2[k] = v[i];
  const DS = {}; for (const [k, v] of Object.entries(DESC)) DS[k] = v[i];
  return { L: lang, CH: !!ch, R, MO, MN, W, T, T2, DS, SUB: SUB.map((r) => [r[0], r[1][i]]), NM: NM.map((r) => [r[0], r[1 + i]]) };
}

/* ── HTML ── */
const DEC = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const ENC_T = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ENC_A = (s) => ENC_T(s).replace(/"/g, '&quot;');
function trText(raw, D, st) {
  const dec = DEC(raw);
  const k = dec.replace(/\s+/g, ' ').trim();
  if (!k || !/[A-Za-zÀ-ž]/.test(k)) return null;
  let t;
  try { t = XL(k, D); } catch { t = null; }
  if (t == null || t === k) return null;
  st.n++;
  return dec.match(/^\s*/)[0] + t + dec.match(/\s*$/)[0];
}
function fixHtml(h, D, st) {
  const parts = h.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i);
  for (let p = 0; p < parts.length; p++) {
    const seg = parts[p];
    if (!seg) continue;
    if (/^<script\b[^>]*application\/ld\+json/i.test(seg)) {
      const m = seg.match(/^(<script\b[^>]*>)([\s\S]*?)(<\/script>)$/i);
      try {
        const j = JSON.parse(m[2]);
        let ch = 0;
        const walk = (o) => { if (Array.isArray(o)) return o.map(walk); if (o && typeof o === 'object') { for (const k of Object.keys(o)) o[k] = walk(o[k]); return o; } if (typeof o === 'string' && !/^https?:|^\//.test(o)) { const t = trText(o, D, st); if (t != null) { ch = 1; return t.trim(); } } return o; };
        walk(j);
        if (ch) parts[p] = m[1] + JSON.stringify(j).replace(/</g, '\\u003c') + m[3];
      } catch { /* hibás JSON-LD: érintetlen */ }
      continue;
    }
    if (/^<(script|style)\b/i.test(seg)) continue;
    // <option> value nélkül: a böngésző a feliratot küldené el — megtartjuk az eredeti (magyar) értéket,
    // hogy az űrlap ugyanazt az adatot küldje és a JS-logika se sérüljön (ahogy a futásidejű fordító is teszi).
    let s0 = seg.replace(/<option\b([^>]*)>([^<]*)<\/option>/g, (all, at, v) => {
      if (/\svalue=/.test(at)) return all;
      const t = trText(v, D, st);
      return t == null ? all : '<option' + at + ' value="' + ENC_A(DEC(v).trim()) + '">' + ENC_T(t) + '</option>';
    });
    let s = s0.replace(/(\s(?:alt|title|placeholder|aria-label|content|label)=")([^"]*)(")/g, (all, a, v, b) => { const t = trText(v, D, st); return t == null ? all : a + ENC_A(t) + b; });
    s = s.replace(/>([^<>]+)</g, (all, v) => { const t = trText(v, D, st); return t == null ? all : '>' + ENC_T(t) + '<'; });
    parts[p] = s;
  }
  return parts.join('');
}
// A magyar névelő („A ”, „Az ”) bekezdés/listaelem elején, közvetlenül egy kiemelés vagy link előtt: elhagyjuk,
// és fordítás után a kiemelés első betűjét naggyá tesszük (így mondatkezdő lesz).
function dropArticle(h) {
  return h.replace(/(<(?:p|li)\b[^>]*>)\s*(?:A|Az) (<(?:strong|a)\b[^>]*>)/g, '$1<!--xa-->$2');
}
// a névelő után álló kiemelés a sor nagybetűs alakjával is kereshető (pl. „A <strong>hibrid autó</strong>” → „Hibrid autó”)
function preArticle(h, D, st) {
  return h.replace(/<!--xa-->(<(?:strong|a)\b[^>]*>)([^<]+)/g, (all, tag, v) => {
    const c = v.replace(/^(\s*)(\S)/, (m, sp, ch) => sp + ch.toLocaleUpperCase());
    if (c === v) return all;
    const t = trText(c, D, st);
    return t == null ? all : '<!--xa-->' + tag + ENC_T(t);
  });
}
function capArticle(h) {
  return h.replace(/<!--xa-->(<(?:strong|a)\b[^>]*>)([^<])/g, (all, b, c) => b + c.toLocaleUpperCase()).replace(/<!--xa-->/g, '');
}
function walkDir(d, root, skip, out = []) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (d === root && (skip.includes(e.name) || SKIP.test(e.name))) continue; walkDir(p, root, skip, out); }
    else if (e.name === 'index.html' || (d === root && /\.html$/.test(e.name))) out.push(p);
  }
  return out;
}

/* ── futásidejű fordító ── */
function patchRuntime(file, D) {
  const f = path.join(DIST, 'i18n', file);
  if (!fs.existsSync(f)) return 'nincs fájl';
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('/*ca-xlang*/')) return 'már javítva';
  const anchor = "function tr(s){var k=s.replace(/\\s+/g,' ').trim();";
  if (!s.includes(anchor)) return 'tr() horgony hiányzik';
  const inject = '/*ca-xlang*/var XLD=' + JSON.stringify(D) + ',XLF=' + XL_SRC + ';';
  const patched = "function tr(s){var k=s.replace(/\\s+/g,' ').trim();var _x=null;try{_x=k&&M[k]==null?XLF(k,XLD):null}catch(e){}if(_x!=null&&_x!==k){return s.match(/^\\s*/)[0]+_x+s.match(/\\s*$/)[0];}";
  s = s.replace(anchor, inject + patched);
  fs.writeFileSync(f, s);
  return 'ok (+' + Object.keys(D.R).length + ' szöveg)';
}

// egy változat egy oldalának javítása (a fő szálon vagy worker szálon)
const DCACHE = new Map();
function dOf(vi) {
  if (!DCACHE.has(vi)) { const [v, lang] = VARIANTS[vi]; DCACHE.set(vi, dataFor(lang, v === 'ch' || v.startsWith('ch/'), ARTICLE_DROP.includes(v))); }
  return DCACHE.get(vi);
}
function fixFiles(items) { // items: [vi, file] → változatonként { n, changed }
  const res = {};
  for (const [vi, f] of items) {
    const r = res[vi] || (res[vi] = { n: 0, changed: 0 });
    const D = dOf(vi), st = { n: 0 };
    const h = fs.readFileSync(f, 'utf8');
    const o = ARTICLE_DROP.includes(VARIANTS[vi][0]) ? capArticle(fixHtml(preArticle(dropArticle(h), D, st), D, st)) : fixHtml(h, D, st);
    if (o !== h) { fs.writeFileSync(f, o); r.changed++; }
    r.n += st.n;
  }
  return res;
}
const XNW = Math.max(1, Math.min(8, +(process.env.CA_XLANG_WORKERS || 0) || (os.availableParallelism ? os.availableParallelism() : os.cpus().length)));

if (!isMainThread && workerData && workerData.xlang) {
  let r; try { r = { ok: fixFiles(workerData.xlang) }; } catch (e) { r = { err: (e && e.stack) || String(e) }; }
  parentPort.postMessage(r);
} else {
  try {
    // fájllista változatonként; az oldalak a magok között szétosztva (minden oldal csak a saját fájlját írja)
    const per = VARIANTS.map(([v, lang, rt, skip]) => { const root = path.join(DIST, v); return fs.existsSync(root) ? walkDir(root, root, skip) : null; });
    const items = []; per.forEach((fl, vi) => { if (fl) for (const f of fl) items.push([vi, f]); });
    let parts;
    if (XNW < 2 || items.length < 200) parts = [fixFiles(items)];
    else {
      const chunks = Array.from({ length: XNW }, () => []);
      items.forEach((it, i) => chunks[i % XNW].push(it));
      parts = await Promise.all(chunks.map((ch) => new Promise((resolve, reject) => {
        let done = false;
        const w = new Worker(new URL(import.meta.url), { workerData: { xlang: ch } });
        w.once('message', (m) => { done = true; if (m.err) reject(new Error(m.err)); else resolve(m.ok); });
        const fb = (e) => { if (done) return; done = true; console.log('[xlang-hufix] szál hiba, egy szálon folytatja: ' + (e && e.message)); try { resolve(fixFiles(ch)); } catch (x) { reject(x); } };
        w.once('error', fb); w.once('exit', () => fb(new Error('kilépett')));
      })));
    }
    VARIANTS.forEach(([v, lang, rt], vi) => {
      if (!per[vi]) { console.log(`[xlang-hufix] ${v}: nincs mappa — kihagyva`); return; }
      let n = 0, changed = 0; for (const p of parts) if (p[vi]) { n += p[vi].n; changed += p[vi].changed; }
      console.log(`[xlang-hufix] ${v} (${lang}): ${per[vi].length} oldal, ${changed} módosítva, ${n} szöveg fordítva · runtime ${rt}: ${patchRuntime(rt, dOf(vi))}`);
    });
  } catch (e) {
    console.log('[xlang-hufix] hiba:', (e && e.stack) || e);
  }
  process.exit(0);
}
