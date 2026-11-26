// Build lépés (a home-apple.mjs után): főoldal „Kínálat” — klasszikus, nagy fotós autókártyák rácsban (caradvance.de minta).
// Mindhárom fülön (Bérelhető, Eladó, Bizományos):
//  · nagy, lekerekített fotó (4:3, nem vágjuk le az autót), a fotón belül lapozható képek (pöttyök + nyilak), címke balra fent
//  · alatta kategória, név, jobbra az ár (alatta a megjegyzés), egy sor adat pöttyökkel, alul teljes szélességű „Érdeklődöm” sáv
//  · fülenként egy sor (Eladó: legújabb feltöltések, Bérelhető: előbb az azonnal elérhetők), gépen oldalanként 3 autó, két oldali nyíllal
//    (hullámszerű átmenet, parallaxis), a szomszéd oldal autói halványan kilátszanak; telefonon soronként oldalra húzható
//  · Eladó: a legutóbb feltöltött autók elöl (a táblázat „hozzaadva” dátuma szerint), ugyanaz a modell csak egyszer; az új autók „Új” címkét kapnak
// A régi körhinta és a „színpad” rejtve marad (adatforrásként szolgál, az ajánlatkérő ablak az eredeti kártyákról nyílik).
// Az alapértelmezett fül az Eladó. Csak a magyar főoldalt érinti. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');

const S = 'html body #autoink.ca-grid';
const CSS = '<style id="ca-grid-css">'
  + S + ' .autok-panel .cw,' + S + ' #ca-stg,' + S + ' .cf-none,' + S + ' .ca-sh .ca-sh-r{display:none!important}'
  + S + ' .autok-panel.on .autok-more{display:flex!important;justify-content:center;margin:34px 0 6px!important}'
  + S + ' .cg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:44px 32px;margin-top:30px}'
  + S + ' .cg-c{display:flex;flex-direction:column;min-width:0;animation:cgIn .45s cubic-bezier(.2,.7,.2,1) backwards}'
  + '@keyframes cgIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}'
  + S + ' .cg-ph{position:relative;display:block;aspect-ratio:4/3;border-radius:20px;overflow:hidden;background:#ECECEF;text-decoration:none!important;isolation:isolate}'
  + S + ' .cg-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .25s,transform .6s cubic-bezier(.2,.7,.2,1)}'
  + S + ' .cg-ph img.ld{opacity:.45}'
  + S + ' .cg-c:hover .cg-ph img:not(.cg-cut){transform:scale(1.025)}'
  + S + ' .cg-ph.cg-rent{background:radial-gradient(120% 90% at 50% 100%,#E4E5EA 0%,#F3F3F6 55%,#F7F7F9 100%)}'
  + S + ' .cg-ph.cg-white{background:#fff}html.ca-dark body #autoink.ca-grid .cg-ph.cg-white{background:#fff}' + S + ' .cg-ph img.cg-cut{object-fit:contain;padding:9% 7% 6%;box-sizing:border-box;filter:drop-shadow(0 14px 14px rgba(18,19,23,.18))}'
  + S + ' .cg-bd{position:absolute;left:14px;top:14px;z-index:2;display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#121317;background:rgba(255,255,255,.94);padding:6px 11px;border-radius:9px;box-shadow:0 2px 8px rgba(0,0,0,.08)}'
  + S + ' .cg-bd i{width:7px;height:7px;border-radius:50%;background:#16A34A}'
  + S + ' .cg-bd.new{background:#16A34A;color:#fff}' + S + ' .cg-bd.new i{display:none}'
  + S + ' .cg-dots{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:2;display:flex;gap:5px;align-items:center;padding:5px 8px;border-radius:999px;background:rgba(11,11,13,.38);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}'
  + S + ' .cg-dots:empty{display:none}' + S + ' .cg-dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.55);transition:width .25s,background .25s}' + S + ' .cg-dots i.on{width:18px;border-radius:3px;background:#fff}'
  + S + ' .cg-a{position:absolute;top:50%;z-index:3;width:38px;height:38px;margin-top:-19px;border-radius:50%;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;color:#fff;background:rgba(11,11,13,.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);opacity:0;transition:opacity .2s,background .2s}'
  + S + ' .cg-a:hover{background:rgba(11,11,13,.72)}' + S + ' .cg-ap{left:12px}' + S + ' .cg-an{right:12px}'
  + S + ' .cg-ph.cg-multi:hover .cg-a{opacity:1}@media(hover:none){' + S + ' .cg-ph.cg-multi .cg-a{opacity:.9;width:34px;height:34px;margin-top:-17px}}'
  + S + ' .cg-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-top:16px}'
  + S + ' .cg-l{min-width:0}' + S + ' .cg-cat{display:block;font-size:14px;color:#6E6E73;font-weight:500}'
  + S + ' .cg-t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:21px;font-weight:800;letter-spacing:-.02em;line-height:1.2;color:#121317!important;text-decoration:none!important;margin-top:2px}'
  + S + ' .cg-r{flex:none;text-align:right}' + S + ' .cg-p{display:block;font-size:21px;font-weight:800;letter-spacing:-.02em;color:#121317;white-space:nowrap;line-height:1.2;margin-top:19px}'
  + S + ' .cg-pn{display:block;font-size:12.5px;color:#6E6E73;font-weight:500;white-space:nowrap;margin-top:2px}'
  + S + ' .cg-f{display:flex;flex-wrap:wrap;align-items:center;margin-top:10px;font-size:14.5px;color:#6E6E73;font-weight:500}'
  + S + ' .cg-f span:not(:last-child)::after{content:"";display:inline-block;width:4px;height:4px;border-radius:50%;background:#C4C4CA;margin:0 10px;vertical-align:middle}'
  + S + ' .cg-x{font-size:14.5px;font-weight:600;color:#121317;margin-top:6px}'
  + S + ' .cg-cta{margin-top:auto;display:flex;align-items:center;justify-content:space-between;width:100%;height:54px;padding:0 20px;border:0;border-radius:12px;cursor:pointer;font-family:inherit;font-size:15.5px;font-weight:700;color:#121317;background:#F0F0F3;transition:background .2s,color .2s}'
  + S + ' .cg-cw{margin-top:18px;flex:1;display:flex;flex-direction:column;justify-content:flex-end}'
  + S + ' .cg-cta svg{width:18px;height:18px;transition:transform .2s}' + S + ' .cg-cta:hover{background:#121317;color:#fff}' + S + ' .cg-cta:hover svg{transform:translateX(3px)}'
  + S + ' .cg-empty{grid-column:1/-1;text-align:center;padding:40px 16px;font-weight:600;color:#6E6E73}'
  // világos mód: fülek és márkagombok (a színpad nélkül is világosak legyenek)
  + 'html.ca-light body #autoink.ca-grid .autok-tabs{background:#fff!important;border:1px solid #E6E6EA!important;box-shadow:0 1px 2px rgba(18,19,23,.04),0 12px 32px rgba(18,19,23,.06)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'
  + 'html.ca-light body #autoink.ca-grid .autok-tab{color:#6E6E73!important;background:transparent!important}html.ca-light body #autoink.ca-grid .autok-tab:hover{color:#121317!important;background:rgba(18,19,23,.04)!important}html.ca-light body #autoink.ca-grid .autok-tab.on{color:#fff!important;background:#E2001A!important;box-shadow:0 6px 16px rgba(226,0,26,.25)!important}'
  + 'html.ca-light body #autoink.ca-grid .cf-br{background:#fff!important;border:1px solid #E6E6EA!important;box-shadow:none!important;color:#121317!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;opacity:1!important}html.ca-light body #autoink.ca-grid .cf-br:hover{border-color:rgba(18,19,23,.25)!important}'
  + 'html.ca-light body #autoink.ca-grid .cf-br .cf-l{display:none!important}html.ca-light body #autoink.ca-grid .cf-br .cf-d{display:block!important;opacity:.9!important}html.ca-light body #autoink.ca-grid .cf-br.on{background:#E2001A!important;border-color:#E2001A!important;color:#fff!important}html.ca-light body #autoink.ca-grid .cf-br.on .cf-d{display:none!important}html.ca-light body #autoink.ca-grid .cf-br.on .cf-l{display:block!important;opacity:1!important}'
  // sötét mód: semleges sötét (nincs kékes árnyalat)
  + 'html.ca-dark body #autoink.ca-grid .cg-ph{background:#1B1C21}'
  + 'html.ca-dark body #autoink.ca-grid .cg-ph.cg-rent{background:radial-gradient(120% 90% at 50% 100%,#2A2B30 0%,#1D1E22 60%,#18191C 100%)}'
  + 'html.ca-dark body #autoink.ca-grid .cg-ph img.cg-cut{filter:drop-shadow(0 14px 14px rgba(0,0,0,.6))}'
  + 'html.ca-dark body #autoink.ca-grid :is(.cg-t,.cg-p,.cg-x){color:#fff!important}'
  + 'html.ca-dark body #autoink.ca-grid :is(.cg-cat,.cg-pn,.cg-f){color:rgba(255,255,255,.6)}'
  + 'html.ca-dark body #autoink.ca-grid .cg-f span:not(:last-child)::after{background:rgba(255,255,255,.3)}'
  + 'html.ca-dark body #autoink.ca-grid .cg-cta{background:rgba(255,255,255,.07);color:#fff}html.ca-dark body #autoink.ca-grid .cg-cta:hover{background:#fff;color:#121317}'
  // nagy képernyőn ugyanakkora tartalomszélesség, mint a caradvance.de-n (1536 px-es konténer, 24 px belső margó → 1488 px), így a fotók is ugyanakkorák
  + '@media(min-width:1536px){html body #autoink.ca-grid{padding-left:max(24px,calc((100% - 1488px)/2))!important;padding-right:max(24px,calc((100% - 1488px)/2))!important}}'
  // témánként egy-egy sor (pl. Legújabb feltöltések / Sportautók), mindegyik külön lapozható a két oldali nyíllal; a szomszéd oldal autói halványan kilátszanak;
  // lapozáskor az oszlopok hullámszerűen, kicsit egymás után indulnak, a fotók enyhén elúsznak (parallaxis)
  + '@media(min-width:721px){'
  + S + ' .cg-vp{position:relative;margin-top:18px;overflow:hidden;margin-left:calc(0px - var(--cg-sl,0px));margin-right:calc(0px - var(--cg-sr,0px));padding:4px var(--cg-sr,0px) 10px var(--cg-sl,0px);-webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,.25) 0,#000 var(--cg-sl,0px),#000 calc(100% - var(--cg-sr,0px)),rgba(0,0,0,.25) 100%);mask-image:linear-gradient(90deg,rgba(0,0,0,.25) 0,#000 var(--cg-sl,0px),#000 calc(100% - var(--cg-sr,0px)),rgba(0,0,0,.25) 100%)}'
  + S + ' .cg-vp .cg-grid{margin-top:0;grid-template-columns:none;grid-auto-flow:column;grid-template-rows:auto;grid-auto-columns:calc((100% - 64px)/3)}'
  + S + ' .cg-vp.drag .cg-grid{cursor:grabbing}'
  + S + ' .cg-vp .cg-c{transition:transform .9s cubic-bezier(.65,0,.15,1),opacity .55s ease;will-change:transform}'
  + S + ' .cg-vp .cg-c.off{opacity:.62}' + S + ' .cg-vp .cg-c.off *{cursor:pointer}'
  + S + ' .cg-vp.drag .cg-c,' + S + ' .cg-vp.snap .cg-c{transition:opacity .55s ease!important}'
  + S + ' .cg-vp .cg-ph img{transition:opacity .25s,transform 1.1s cubic-bezier(.2,.7,.2,1)}'
  + S + ' .cg-vp.mvr .cg-ph img{transform:scale(1.07) translateX(-3.5%);transition:opacity .25s,transform .35s ease-out}' + S + ' .cg-vp.mvl .cg-ph img{transform:scale(1.07) translateX(3.5%);transition:opacity .25s,transform .35s ease-out}'
  + S + ' .cg-vp img{-webkit-user-drag:none}'
  + S + ' .cg-seg{display:flex;gap:8px}' + S + ' .cg-seg i{position:relative;flex:1;height:4px;border-radius:4px;background:rgba(18,19,23,.12);overflow:hidden;cursor:pointer}'
  + S + ' .cg-seg i::after{content:"";position:absolute;inset:0;background:#E2001A;transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.65,0,.15,1)}' + S + ' .cg-seg i.on::after{transform:scaleX(1)}' + S + ' .cg-seg i.past::after{transform:scaleX(1);background:rgba(18,19,23,.35)}'
  + S + ' .cg-cn{font-size:14px;font-weight:700;color:#6E6E73;font-variant-numeric:tabular-nums;white-space:nowrap}' + S + ' .cg-cn b{font-size:20px;color:#121317;margin-right:2px}'
  + S + ' .cg-row{position:relative}' + S + ' .cg-row + .cg-row{margin-top:46px}' + S + ' .cg-side{position:absolute;z-index:6;width:58px;height:58px;margin:0;padding:0;border-radius:50%;border:1px solid #E1E1E6;background:#fff;color:#121317;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(18,19,23,.14);transition:background .2s,color .2s,border-color .2s,transform .2s,opacity .25s}'
  + S + ' .cg-side svg{width:22px;height:22px}' + S + ' .cg-side.cg-sp svg{transform:scaleX(-1)}' + S + ' .cg-side:hover{transform:scale(1.07)}' + S + ' .cg-side.cg-sn{background:#E2001A;border-color:#E2001A;color:#fff;box-shadow:0 12px 30px rgba(18,19,23,.18)}' + S + ' .cg-side.cg-sn:hover{background:#C70017}'
  + S + ' .cg-side:disabled{opacity:0;pointer-events:none}' + S + ' .cg-side[hidden]{display:none}'
  + 'html.ca-dark body #autoink.ca-grid .cg-side:not(.cg-sn){background:#1B1C21;border-color:rgba(255,255,255,.16);color:#fff}'
  + 'html.ca-dark body #autoink.ca-grid .cg-seg i{background:rgba(255,255,255,.14)}html.ca-dark body #autoink.ca-grid .cg-seg i.past::after{background:rgba(255,255,255,.45)}html.ca-dark body #autoink.ca-grid .cg-cn b{color:#fff}html.ca-dark body #autoink.ca-grid .cg-cn{color:rgba(255,255,255,.6)}'
  + '}'
  + '@media(min-width:721px) and (max-width:1100px){' + S + ' .cg-vp .cg-grid{grid-auto-columns:calc((100% - 32px)/2)}}'
  + '@media(max-width:720px){' + S + ' .cg-side{display:none!important}}'
  // sor fejléce: cím, darabszám, haladásjelző (gépen)
  + S + ' .cg-rows{margin-top:30px}' + S + ' .cg-rh{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}' + S + ' .cg-rc{white-space:nowrap}' + S + ' .cg-rt{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em;color:#121317}' + S + ' .cg-rc{font-size:14px;font-weight:600;color:#6E6E73}'
  + S + ' .cg-rh .cg-seg{margin-left:auto;align-self:center;width:min(220px,26%)}' + S + ' .cg-row.cg-one .cg-seg,' + S + ' .cg-row.cg-one .cg-cn,' + S + ' .cg-row.cg-one .cg-side{display:none}'
  + 'html.ca-dark body #autoink.ca-grid .cg-rt{color:#fff}html.ca-dark body #autoink.ca-grid .cg-rc{color:rgba(255,255,255,.55)}'
  + '@media(max-width:720px){' + S + ' .cg-rh .cg-seg,' + S + ' .cg-rh .cg-cn{display:none}' + S + ' .cg-rt{font-size:19px}' + S + ' .cg-row + .cg-row{margin-top:34px}}'
  // tablet: 2 oszlop
  + '@media(max-width:1100px){' + S + ' .cg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}'
  // telefon: oldalra húzható sor
  + '@media(max-width:720px){' + S + ' .cg-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;margin:14px -16px 0;padding:0 16px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}'
  + S + ' .cg-grid::-webkit-scrollbar{display:none}' + S + ' .cg-c{flex:0 0 86%;scroll-snap-align:center}'
  + S + ' .cg-hd{flex-direction:column;gap:6px}' + S + ' .cg-r{text-align:left;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}' + S + ' .cg-t{font-size:19px}' + S + ' .cg-p{font-size:20px;margin-top:0}' + S + ' .cg-f{font-size:13.5px}' + S + ' .cg-cta{height:50px}'
  + S + ' .cg-sw{display:flex;justify-content:center;gap:6px;margin-top:14px}' + S + ' .cg-sw i{width:18px;height:3px;border-radius:2px;background:rgba(18,19,23,.18);transition:width .3s,background .3s}' + S + ' .cg-sw i.on{width:36px;background:#E2001A}'
  + 'html.ca-dark body #autoink.ca-grid .cg-sw i{background:rgba(255,255,255,.22)}html.ca-dark body #autoink.ca-grid .cg-sw i.on{background:#E2001A}}'
  + '@media(min-width:721px){' + S + ' .cg-sw{display:none}}'
  // bérelhető kártyák: BMW-stílus (fehér kártya, címkék fent, vékony cím, kisebb autókép)
  + S + ' .cg-c.cg-bmw{background:#fff;border:1px solid #E4E4E8;border-radius:6px;padding:22px 22px 20px;transition:box-shadow .25s,border-color .25s}'
  + S + ' .cg-c.cg-bmw:hover{box-shadow:0 14px 34px rgba(18,19,23,.08);border-color:#D6D6DB}'
  + S + ' .cg-bmw .cg-tags{order:1;display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}'
  + S + ' .cg-bmw .cg-tg{font-size:12.5px;font-weight:500;line-height:1.2;padding:4px 8px;border-radius:2px;background:#EFEFF1;color:#3A3A3F}'
  + S + ' .cg-bmw .cg-tg.now{background:#121317;color:#fff}'
  + S + ' .cg-bmw .cg-hd{order:2;display:block;margin-top:0}'
  + S + ' .cg-bmw .cg-cat{display:none}'
  + S + ' .cg-bmw .cg-t{font-size:26px;font-weight:400;letter-spacing:-.015em;line-height:1.15;margin-top:0}'
  + S + ' .cg-bmw .cg-r{text-align:left;margin-top:6px}'
  + S + ' .cg-bmw .cg-p{display:inline;font-size:16px;font-weight:600;letter-spacing:0;margin-top:0;color:#3A3A3F}'
  + S + ' .cg-bmw .cg-pn{display:inline;margin-left:6px;font-size:13px}'
  + S + ' .cg-bmw .cg-ph{order:3;aspect-ratio:auto;height:170px;margin:12px -6px 6px;border-radius:0;background:transparent!important}'
  + S + ' .cg-bmw .cg-ph img.cg-cut{padding:2% 13%;filter:drop-shadow(0 10px 10px rgba(18,19,23,.14))}'
  + S + ' .cg-bmw .cg-bd{display:none}'
  + S + ' .cg-bmw .cg-f{order:4;margin-top:0;padding-top:14px;border-top:1px solid #EDEDF0;font-size:14px}'
  + S + ' .cg-bmw .cg-cw{order:5;margin-top:16px}'
  + S + ' .cg-bmw .cg-cta{height:46px;border-radius:2px;background:transparent;border:1px solid #121317;font-size:15px;font-weight:600}'
  + S + ' .cg-bmw .cg-cta:hover{background:#121317;color:#fff}'
  + 'html.ca-dark body #autoink.ca-grid .cg-c.cg-bmw{background:#17181B;border-color:rgba(255,255,255,.1)}html.ca-dark body #autoink.ca-grid .cg-c.cg-bmw:hover{border-color:rgba(255,255,255,.2);box-shadow:0 14px 34px rgba(0,0,0,.4)}'
  + 'html.ca-dark body #autoink.ca-grid .cg-bmw .cg-tg{background:rgba(255,255,255,.08);color:rgba(255,255,255,.8)}html.ca-dark body #autoink.ca-grid .cg-bmw .cg-tg.now{background:#fff;color:#121317}'
  + 'html.ca-dark body #autoink.ca-grid .cg-bmw .cg-p{color:rgba(255,255,255,.85)!important}html.ca-dark body #autoink.ca-grid .cg-bmw .cg-f{border-top-color:rgba(255,255,255,.1)}'
  + 'html.ca-dark body #autoink.ca-grid .cg-bmw .cg-cta{background:transparent;border-color:rgba(255,255,255,.6);color:#fff}html.ca-dark body #autoink.ca-grid .cg-bmw .cg-cta:hover{background:#fff;color:#121317}'
  + '</style>';

const JS = '<script id="ca-grid-js">window.__caGrid=1;' + String.raw`(function(){
var A,SALE=null,RATE=0,NEWD=21;
var ARR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function tx(k,s){var e=k.querySelector(s);return e?e.textContent.replace(/\s+/g," ").trim():""}
var BAL={vw:"volkswagen",mercedesbenz:"mercedes",amg:"mercedes",mercedesamg:"mercedes",maybach:"mercedes",alpina:"bmw"};
function nq(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[^a-z]/g,"")}
function brOf(t){var w=String(t||"").trim().split(/[\s-]+/),a=nq(w[0]),b=nq(w[0]+(w[1]||""));return BAL[b]||BAL[a]||a}
function km(v){v=String(v||"").trim();if(!v)return"";var n=v.replace(/[^0-9]/g,"");if(!n)return v;return (+n).toLocaleString("hu-HU").replace(/,/g," ")+" km"}
function le(v){v=String(v||"").trim();if(!v)return"";return /^\d+$/.test(v)?v+" LE":v}
function fuel(v){return String(v||"").replace(/\s*\(.*\)\s*$/,"").replace(/^Diesel$/i,"Dízel")}
function title(t){t=String(t||"").split("/")[0].trim();var w=t.split(/\s+/);return w.length>8?w.slice(0,8).join(" "):t}
function isNew(d){if(!d)return false;var t=Date.parse(d);return t&&(Date.now()-t)<NEWD*864e5}
// ---- képlista az autó oldaláról (lustán, egyszer) ----
var PC={};function pics(hr,first,cb){var P=PC[hr];if(P){if(P.l)cb(P.l);else P.q.push(cb);return}P=PC[hr]={q:[cb]};var done=function(l){P.l=l;P.q.forEach(function(g){g(l)});P.q=[]};
fetch(hr,{credentials:"same-origin"}).then(function(r){return r.text()}).then(function(h){var d=new DOMParser().parseFromString(h,"text/html"),u=[].map.call(d.querySelectorAll("#thumbs img,.thumbs img"),function(x){return x.getAttribute("src")||x.getAttribute("data-src")});
/* csak az autó saját galériája (#thumbs) számít — az oldalon lévő „hasonló autók” képei nem */
u=u.filter(Boolean).map(function(x){return /classistatic/.test(x)?x.split("?")[0]+"?rule=mo-1024":x});var seen={},out=[];u.forEach(function(x){var k=x.split("?")[0];if(!seen[k]){seen[k]=1;out.push(x)}});
var f0=String(first||"").split("?")[0];out.sort(function(a,b){return (b.split("?")[0]===f0)-(a.split("?")[0]===f0)});done(out.length?out:[first])}).catch(function(){done([first])})}
// ---- egy kártya ----
function card(o){var c=el("article","cg-c");
var ph=el("a","cg-ph"+(o.cut?" cg-rent":""));ph.href=o.href||"#";ph.setAttribute("aria-label",o.title);
var im=new Image();im.alt=o.title;im.loading="lazy";im.decoding="async";im.referrerPolicy="no-referrer";if(o.cut){im.className="cg-cut";var mc=String(o.img).match(/\/berles\/([^\/?#]+)\.webp/);if(mc){im.onerror=function(){im.onerror=null;ph.classList.add("cg-white");im.src=o.img};im.src="/berles-cut/"+mc[1]+".webp"}else{ph.classList.add("cg-white");im.src=o.img}}else im.src=o.img;ph.appendChild(im);
if(o.badge){var b=el("span","cg-bd"+(o.badgeNew?" new":""),"<i></i>"+esc(o.badge));ph.appendChild(b)}
var dots=el("span","cg-dots");ph.appendChild(dots);
c.appendChild(ph);
var hd=el("div","cg-hd",'<div class="cg-l"><span class="cg-cat">'+esc(o.cat)+'</span><a class="cg-t" href="'+esc(o.href||"#")+'" title="'+esc(o.full||o.title)+'">'+esc(o.title)+'</a></div><div class="cg-r"><b class="cg-p">'+esc(o.price)+'</b><span class="cg-pn">'+esc(o.note)+'</span></div>');c.appendChild(hd);
var f=el("div","cg-f");(o.facts||[]).filter(Boolean).forEach(function(x){f.appendChild(el("span",null,esc(x)))});c.appendChild(f);
if(o.extra)c.appendChild(el("div","cg-x",esc(o.extra)));
if(o.cut){c.classList.add("cg-bmw");var tg=el("div","cg-tags");if(o.badge)tg.appendChild(el("span","cg-tg now",esc(o.badge)));if(o.cat)tg.appendChild(el("span","cg-tg",esc(o.cat)));c.insertBefore(tg,c.firstChild)}
var cw=el("div","cg-cw"),cta=el("button","cg-cta",'<span>'+esc(o.ctaText||"Érdeklődöm")+'</span>'+ARR);cta.type="button";cta.addEventListener("click",function(e){e.preventDefault();o.inq()});cw.appendChild(cta);c.appendChild(cw);
// képlapozás a fotón belül
if(o.gal&&o.href){var L=null,ix=0,p=el("button","cg-a cg-ap","&#8249;"),n=el("button","cg-a cg-an","&#8250;");p.type=n.type="button";p.setAttribute("aria-label","Előző kép");n.setAttribute("aria-label","Következő kép");ph.appendChild(p);ph.appendChild(n);
function draw(){dots.innerHTML="";if(!L||L.length<2)return;var m=Math.min(L.length,5),s=Math.max(0,Math.min(ix-2,L.length-m));for(var k=s;k<s+m;k++)dots.appendChild(el("i",k===ix?"on":""))}
function load(cb){pics(o.href,o.img,function(l){L=l;if(L.length>1)ph.classList.add("cg-multi");draw();cb&&cb()})}
function go(d){load(function(){if(L.length<2)return;ix=(ix+d+L.length)%L.length;var u=L[ix],x=new Image();x.referrerPolicy="no-referrer";im.classList.add("ld");x.onload=x.onerror=function(){im.src=u;im.classList.remove("ld")};x.src=u;draw();var y=new Image();y.referrerPolicy="no-referrer";y.src=L[(ix+1)%L.length]})}
p.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();go(-1)});n.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();go(1)});
ph.addEventListener("pointerenter",function(){load()},{once:true});
var sx=null,sy=0,sw=0;ph.addEventListener("touchstart",function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY;load()},{passive:true});
ph.addEventListener("touchend",function(e){if(sx==null)return;var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;sx=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3&&L&&L.length>1){sw=1;go(dx<0?1:-1);setTimeout(function(){sw=0},350)}},{passive:true});
ph.addEventListener("click",function(e){if(sw){e.preventDefault()}});
if("IntersectionObserver"in window&&matchMedia("(hover:none)").matches){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();load()}},{rootMargin:"100px"});io.observe(ph)}}
return c}
// ---- adatok fülenként ----
function rootOf(id){return document.getElementById(id)}
function itemsOf(id){var r=rootOf(id);if(!r)return[];var a=r.__caAll||[].slice.call(r.querySelectorAll(".cw-track > .cw-item"));return a.map(function(it){return it.querySelector(".sub-card,.card")}).filter(Boolean)}
function clickInq(k,href){var q=k&&k.querySelector(".sub-btn,.ca-inq");if(q){q.click();return}if(href)location.href=href}
function rentList(){return itemsOf("cw-berelheto").map(function(k){var t=tx(k,".sub-title,.title"),sp=tx(k,".sub-specs").split(" · "),pv=tx(k,".ca-pv"),pm=tx(k,".ca-pm"),av=k.querySelector(".sub-avail"),im=k.querySelector(".sub-photo"),a=k.querySelector("a.sub-det,a[href]");
var fu=[].map.call(k.querySelectorAll(".sub-fuel"),function(x){return x.textContent.trim()}).join(" / ");
return{b:brOf(t),title:t,cat:sp[0]||"Tartós bérlet",img:im?(im.getAttribute("src")||""):"",cut:true,href:a?a.getAttribute("href"):"",price:pv,note:(pm?pm.replace(/\s+/g," ")+" · ":"")+"nettó",facts:[sp[1],fu,av?(av.classList.contains("now")?av.textContent.trim():"Elérhető: "+av.textContent.trim()):""],badge:av&&av.classList.contains("now")?"Azonnal elérhető":"",now:!!(av&&av.classList.contains("now")),gal:false,ctaText:"Ajánlatot kérek",inq:function(){clickInq(k,a&&a.getAttribute("href"))}}})}
function bizList(){return itemsOf("cw-bizomanyos").map(function(k){var t=tx(k,".title"),sp=tx(k,".specs").split(" · "),im=k.querySelector(".media img"),a=k.querySelector("a[href]");
return{b:brOf(t),title:title(t),full:t,cat:"Bizományos · "+(tx(k,".year")||"Használt"),img:im?(im.getAttribute("src")||""):"",href:a?a.getAttribute("href"):"",price:tx(k,".price"),note:tx(k,".peur"),facts:sp.map(function(x,i){return i===0?km(x):fuel(x)}),gal:true,inq:function(){clickInq(k,a&&a.getAttribute("href"))}}})}
function saleOrig(href){var r=null;itemsOf("cw-elado").some(function(k){var a=k.matches("a[href]")?k:k.querySelector("a[href]");if(a&&a.getAttribute("href")===href){r=k;return true}});return r}
function saleFromData(){var R=window.RENT;if(!R||!SALE)return null;RATE=(R.getRate&&R.getRate())||RATE||372;
return SALE.filter(function(c){return c.img&&c.eur}).sort(function(a,b){return String(b.hozzaadva||"").localeCompare(String(a.hozzaadva||""))||(b.kiemelt-a.kiemelt)}).map(function(c){var slug=R.slugify(c.modell),net=Math.round(c.eur/1.19),huf=Math.ceil(net*RATE/10000)*10000,href="/auto/"+slug+"/";
var o={b:brOf(c.marka||c.modell),title:title(c.modell),full:c.modell,year:c.evjarat,cat:"Használt"+(c.evjarat?" · "+c.evjarat:""),img:c.img,href:href,price:R.fmtFt(huf),eur:net.toLocaleString("hu-HU").replace(/,/g," ")+" €",facts:[km(c.km),le(c.teljesitmeny),c.valto,fuel(c.uzemanyag)].filter(Boolean),gal:true,badge:isNew(c.hozzaadva)?"Új":"",badgeNew:true};
o.note=o.eur+" · nettó";o.inq=function(){if(window.caInquiry){window.caInquiry({name:c.modell,img:c.img,price:o.price+" · "+o.eur,kind:"sale",isNew:false});return}var k=saleOrig(href);if(k)clickInq(k,href);else location.href=href};return o})}
function saleFromCards(){return itemsOf("cw-elado").map(function(k){var t=tx(k,".title"),sp=tx(k,".specs").split(" · "),im=k.querySelector(".media img"),a=k.matches("a[href]")?k:k.querySelector("a[href]");
return{b:brOf(t),title:title(t),full:t,cat:"Használt"+(tx(k,".year")?" · "+tx(k,".year"):""),img:im?(im.getAttribute("src")||""):"",href:a?a.getAttribute("href"):"",price:tx(k,".price"),note:tx(k,".peur")+" · nettó",facts:sp.map(function(x){return /^\d+$/.test(x.replace(/\s|km/g,""))&&/km/.test(x)?km(x):fuel(x)}),gal:true,inq:function(){clickInq(k,a&&a.getAttribute("href"))}}})}

// ---- sorok: témánként egy-egy sor, mindegyik külön lapozható (gépen oldalanként 3 autó) ----
function colsN(){return innerWidth<=1100?2:3}
function pager(R,vp,G){var seg=R.querySelector(".cg-seg"),cn=R.querySelector(".cg-cn"),C=[].slice.call(G.querySelectorAll(".cg-c")),cols=colsN(),N=Math.max(1,Math.ceil(C.length/cols)),i=0,stride=0,prev=0;
C.forEach(function(c,k){c.__pg=Math.floor(k/cols);c.__g=k;c.style.gridColumn=String(k+1);c.style.gridRow="1"});
seg.innerHTML="";for(var k=0;k<N;k++){(function(k){var d=el("i");d.title=(k+1)+". oldal";d.addEventListener("click",function(){go(k)});seg.appendChild(d)})(k)}
R.classList.toggle("cg-one",N<2);
var sp=R.querySelector(".cg-side.cg-sp"),sn=R.querySelector(".cg-side.cg-sn");
function arrows(){var sl=parseInt(vp.style.getPropertyValue("--cg-sl"))||0,x=Math.max(10,Math.min(86,sl-10)),ph=G.querySelector(".cg-ph"),t=vp.offsetTop+4+(ph?ph.offsetHeight/2:150)-29;sp.style.top=sn.style.top=t+"px";sp.style.left=(-x)+"px";sn.style.right=(-x)+"px"}
function side(){var de=document.documentElement,r=R.getBoundingClientRect();vp.style.setProperty("--cg-sl",Math.max(0,Math.round(r.left))+"px");vp.style.setProperty("--cg-sr",Math.max(0,Math.round(de.clientWidth-r.right))+"px");stride=G.clientWidth+32;arrows()}
function place(dir,inst){var lo=Math.min(prev,i),hi=Math.max(prev,i);C.forEach(function(c){var d=0;if(!inst){var rel=dir>0?c.__g-lo*cols:(hi+1)*cols-1-c.__g;rel=Math.max(0,Math.min(rel,2*cols+1));d=rel*60}c.style.transitionDelay=inst?"0ms":d+"ms, 0ms";c.style.transform="translate3d("+(-i*stride)+"px,0,0)";c.classList.toggle("off",c.__pg!==i)})}
function ui(){[].forEach.call(seg.children,function(d,k){d.classList.toggle("on",k===i);d.classList.toggle("past",k<i)});cn.innerHTML="<b>"+String(i+1).padStart(2,"0")+"</b>/ "+String(N).padStart(2,"0");sp.disabled=i===0;sn.disabled=i===N-1}
function go(n,inst){side();n=Math.max(0,Math.min(N-1,n));var dir=n>i?1:n<i?-1:0;prev=i;i=n;if(dir&&!inst){vp.classList.remove("mvl","mvr");void vp.offsetWidth;vp.classList.add(dir>0?"mvr":"mvl");clearTimeout(vp.__mt);vp.__mt=setTimeout(function(){vp.classList.remove("mvl","mvr")},380)}place(dir||1,!!inst||!dir);ui()}
sp.onclick=function(){go(i-1)};sn.onclick=function(){go(i+1)};
vp.addEventListener("click",function(e){var c=e.target.closest&&e.target.closest(".cg-c.off");if(c){e.preventDefault();e.stopPropagation();go(c.__pg)}},true);
vp.addEventListener("dragstart",function(e){e.preventDefault()});
vp.__relayout=function(){side();place(1,true)};side();go(0,true)}
var RL=0;addEventListener("resize",function(){clearTimeout(RL);RL=setTimeout(function(){[].forEach.call(document.querySelectorAll("#autoink .cg-vp"),function(v){v.__relayout&&v.__relayout()})},80)});
function groups(pid,L,br){var mx=innerWidth<=720?12:18;if(br)return[{t:"Találatok",l:L.slice(0,mx)}];
if(pid==="panel-elado"){var seen={},D=[];L.forEach(function(o){var mk=o.title.split(/\s+/).slice(0,3).join(" ").toLowerCase();if(!seen[mk]){seen[mk]=1;D.push(o)}});return[{t:"Legújabb feltöltések",l:D.slice(0,mx)}]}
if(pid==="panel-berelheto"){var now=L.filter(function(o){return o.now}),soon=L.filter(function(o){return !o.now});return[{t:"Bérelhető autóink",l:now.concat(soon).slice(0,mx)}]}
return[{t:"Bizományos autóink",l:L.slice(0,mx)}]}
function rowEl(){var R=el("section","cg-row",'<div class="cg-rh"><h3 class="cg-rt"></h3><span class="cg-rc"></span><div class="cg-seg"></div><span class="cg-cn"></span></div><div class="cg-vp"><div class="cg-grid"></div></div><div class="cg-sw"></div>');
var sp=el("button","cg-side cg-sp",ARR),sn=el("button","cg-side cg-sn",ARR);sp.type=sn.type="button";sp.setAttribute("aria-label","Előző autók");sn.setAttribute("aria-label","Következő autók");R.appendChild(sp);R.appendChild(sn);
var G=R.querySelector(".cg-grid");G.addEventListener("scroll",function(){var s=R.querySelector(".cg-sw");if(!s||!G.children.length)return;var w=G.children[0].offsetWidth+14,j=Math.round(G.scrollLeft/w);[].forEach.call(s.children,function(d,k){d.classList.toggle("on",k===j)})},{passive:true});return R}
// ---- kirajzolás ----
var SIG={};
function render(){A=document.getElementById("autoink");if(!A)return;var br=window.__caCFBrand||"",narrow=innerWidth<=720;
[["panel-berelheto",rentList],["panel-elado",function(){return saleFromData()||saleFromCards()}],["panel-bizomanyos",bizList]].forEach(function(p){var P=document.getElementById(p[0]);if(!P)return;
var L=(p[1]()||[]).filter(function(o){return o.img});if(br)L=L.filter(function(o){return o.b===br});var GR=groups(p[0],L,br);
var g=GR.map(function(x){return x.t+":"+x.l.map(function(o){return o.href+"|"+o.price+"|"+o.img}).join(",")}).join(";")+"#"+br+narrow+colsN();if(SIG[p[0]]===g&&P.querySelector(".cg-rows"))return;SIG[p[0]]=g;
var W=P.querySelector(".cg-rows");if(!W){W=el("div","cg-rows");var cw=P.querySelector(".cw");P.insertBefore(W,cw?cw.nextSibling:P.firstChild)}W.innerHTML="";
if(!L.length){var none=itemsOf(p[0].replace("panel","cw")).length;W.appendChild(el("div","cg-empty",none?"Ebben a kategóriában most nincs ilyen márkájú autó.":"Betöltés…"));return}
GR.forEach(function(x){if(!x.l.length)return;var R=rowEl();W.appendChild(R);R.querySelector(".cg-rt").textContent=x.t;R.querySelector(".cg-rc").textContent=x.l.length+" autó";var G=R.querySelector(".cg-grid"),VP=R.querySelector(".cg-vp");
x.l.forEach(function(o){G.appendChild(card(o))});if(!narrow)pager(R,VP,G);var s=R.querySelector(".cg-sw");if(x.l.length>1)x.l.forEach(function(_,k){s.appendChild(el("i",k===0?"on":""))})})})}
var to=0;function later(d){clearTimeout(to);to=setTimeout(render,d||120)}
function boot(){A=document.getElementById("autoink");if(!A)return;A.classList.add("ca-grid","ca-stg-on");var te=A.querySelector('.autok-tab[data-tab="elado"]');if(te)te.click();render();
["cw-berelheto","cw-elado","cw-bizomanyos"].forEach(function(id){var r=rootOf(id),t=r&&r.querySelector(".cw-track");if(t)new MutationObserver(function(){later()}).observe(t,{childList:true})});
document.addEventListener("click",function(e){if(e.target.closest&&e.target.closest("#autoink .cf-br,#autoink .autok-tab")){later(60);setTimeout(function(){[].forEach.call(document.querySelectorAll("#autoink .cg-vp"),function(v){v.__relayout&&v.__relayout()})},90)}});
var w=(innerWidth<=720)+"|"+colsN();addEventListener("resize",function(){var n=(innerWidth<=720)+"|"+colsN();if(n!==w){w=n;later()}});
var tries=0;(function sale(){var R=window.RENT;if(R&&R.loadAll){R.loadAll(function(c){if(c&&c.length){SALE=c;later(30)}})}else if(tries++<40)setTimeout(sale,250)})()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot()})();</script>`;

try {
  if (!fs.existsSync(FILE)) console.log('[home-grid] nincs dist/index.html — kihagyva');
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-grid-js"') > -1) console.log('[home-grid] már alkalmazva');
    else if (h.indexOf('id="autoink"') < 0) console.log('[home-grid] nincs #autoink — kihagyva');
    else {
      // alapértelmezett fül: Eladó (színesebb, valódi fotók) — már a HTML-ben is ez az aktív, a szkript pedig rákattint, hogy a fejléc és a lusta betöltés is ehhez igazodjon
      h = h.replace('<button class="autok-tab on" data-tab="berelheto"', '<button class="autok-tab" data-tab="berelheto"')
        .replace('<button class="autok-tab" data-tab="elado"', '<button class="autok-tab on" data-tab="elado"')
        .replace('<div class="autok-panel on" id="panel-berelheto">', '<div class="autok-panel" id="panel-berelheto">')
        .replace('<div class="autok-panel" id="panel-elado">', '<div class="autok-panel on" id="panel-elado">');
      h = h.replace('</head>', '<script>window.__caGrid=1</script>' + CSS + '</head>').replace(/<\/body>(?![\s\S]*<\/body>)/i, JS + '</body>');
      fs.writeFileSync(FILE, h);
      console.log('[home-grid] klasszikus autókártyák a Kínálat részben');
    }
  }
} catch (e) { console.log('[home-grid] hiba:', e.message); }
