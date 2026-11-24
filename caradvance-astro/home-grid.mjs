// Build lépés (a home-apple.mjs után): főoldal „Kínálat” — klasszikus, nagy fotós autókártyák rácsban (caradvance.de minta).
// Mindhárom fülön (Bérelhető, Eladó, Bizományos):
//  · nagy, lekerekített fotó (4:3, nem vágjuk le az autót), a fotón belül lapozható képek (pöttyök + nyilak), címke balra fent
//  · alatta kategória, név, jobbra az ár (alatta a megjegyzés), egy sor adat pöttyökkel, alul teljes szélességű „Érdeklődöm” sáv
//  · gépen 3 oszlop × 2 sor, telefonon oldalra húzható sor (nem lesz hosszú az oldal)
//  · Eladó: a legutóbb feltöltött autók elöl (a táblázat „hozzaadva” dátuma szerint), ugyanaz a modell csak egyszer; az új autók „Új” címkét kapnak
// A régi körhinta és a „színpad” rejtve marad (adatforrásként szolgál, az ajánlatkérő ablak az eredeti kártyákról nyílik).
// Csak a magyar főoldalt érinti. Idempotens.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');

const S = 'html body #autoink.ca-grid';
const CSS = '<style id="ca-grid-css">'
  + S + ' .autok-panel .cw,' + S + ' #ca-stg,' + S + ' .cf-none,' + S + ' .ca-sh .ca-sh-r{display:none!important}'
  + S + ' .autok-panel.on .autok-more{display:flex!important;justify-content:center;margin:34px 0 6px!important}'
  + S + ' .cg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:44px 32px;margin-top:30px}'
  + S + ' .cg-c{display:flex;flex-direction:column;min-width:0;animation:cgIn .45s cubic-bezier(.2,.7,.2,1) both}'
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
  // tablet: 2 oszlop
  + '@media(max-width:1100px){' + S + ' .cg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}'
  // telefon: oldalra húzható sor
  + '@media(max-width:720px){' + S + ' .cg-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;margin:20px -16px 0;padding:0 16px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}'
  + S + ' .cg-grid::-webkit-scrollbar{display:none}' + S + ' .cg-c{flex:0 0 86%;scroll-snap-align:center}'
  + S + ' .cg-hd{flex-direction:column;gap:6px}' + S + ' .cg-r{text-align:left;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}' + S + ' .cg-t{font-size:19px}' + S + ' .cg-p{font-size:20px;margin-top:0}' + S + ' .cg-f{font-size:13.5px}' + S + ' .cg-cta{height:50px}'
  + S + ' .cg-sw{display:flex;justify-content:center;gap:6px;margin-top:14px}' + S + ' .cg-sw i{width:18px;height:3px;border-radius:2px;background:rgba(18,19,23,.18);transition:width .3s,background .3s}' + S + ' .cg-sw i.on{width:36px;background:#E2001A}'
  + 'html.ca-dark body #autoink.ca-grid .cg-sw i{background:rgba(255,255,255,.22)}html.ca-dark body #autoink.ca-grid .cg-sw i.on{background:#E2001A}}'
  + '@media(min-width:721px){' + S + ' .cg-sw{display:none}}'
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
if(!u.length)u=h.match(/https:\/\/(img\.classistatic\.de\/api\/v1\/mo-prod\/images\/[0-9a-f]{2}\/[0-9a-f-]{36}(\?rule=mo-\d+)?|img\.hasznaltautocdn\.com\/2048x1536\/\d+\/\d+\.jpg)/g)||[];
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
return{b:brOf(t),title:t,cat:sp[0]||"Tartós bérlet",img:im?(im.getAttribute("src")||""):"",cut:true,href:a?a.getAttribute("href"):"",price:pv,note:(pm?pm.replace(/\s+/g," ")+" · ":"")+"nettó",facts:[sp[1],fu,av?(av.classList.contains("now")?av.textContent.trim():"Elérhető: "+av.textContent.trim()):""],badge:av&&av.classList.contains("now")?"Azonnal elérhető":"",gal:false,ctaText:"Ajánlatot kérek",inq:function(){clickInq(k,a&&a.getAttribute("href"))}}})}
function bizList(){return itemsOf("cw-bizomanyos").map(function(k){var t=tx(k,".title"),sp=tx(k,".specs").split(" · "),im=k.querySelector(".media img"),a=k.querySelector("a[href]");
return{b:brOf(t),title:title(t),full:t,cat:"Bizományos · "+(tx(k,".year")||"Használt"),img:im?(im.getAttribute("src")||""):"",href:a?a.getAttribute("href"):"",price:tx(k,".price"),note:tx(k,".peur"),facts:sp.map(function(x,i){return i===0?km(x):fuel(x)}),gal:true,inq:function(){clickInq(k,a&&a.getAttribute("href"))}}})}
function saleOrig(href){var r=null;itemsOf("cw-elado").some(function(k){var a=k.matches("a[href]")?k:k.querySelector("a[href]");if(a&&a.getAttribute("href")===href){r=k;return true}});return r}
function saleFromData(){var R=window.RENT;if(!R||!SALE)return null;RATE=(R.getRate&&R.getRate())||RATE||372;
return SALE.filter(function(c){return c.img&&c.eur}).sort(function(a,b){return String(b.hozzaadva||"").localeCompare(String(a.hozzaadva||""))||(b.kiemelt-a.kiemelt)}).map(function(c){var slug=R.slugify(c.modell),net=Math.round(c.eur/1.19),huf=Math.ceil(net*RATE/10000)*10000,href="/auto/"+slug+"/";
var o={b:brOf(c.marka||c.modell),title:title(c.modell),full:c.modell,year:c.evjarat,cat:"Használt"+(c.evjarat?" · "+c.evjarat:""),img:c.img,href:href,price:R.fmtFt(huf),eur:net.toLocaleString("hu-HU").replace(/,/g," ")+" €",facts:[km(c.km),le(c.teljesitmeny),c.valto,fuel(c.uzemanyag)].filter(Boolean),gal:true,badge:isNew(c.hozzaadva)?"Új":"",badgeNew:true};
o.note=o.eur+" · nettó";o.inq=function(){if(window.caInquiry){window.caInquiry({name:c.modell,img:c.img,price:o.price+" · "+o.eur,kind:"sale",isNew:false});return}var k=saleOrig(href);if(k)clickInq(k,href);else location.href=href};return o})}
function saleFromCards(){return itemsOf("cw-elado").map(function(k){var t=tx(k,".title"),sp=tx(k,".specs").split(" · "),im=k.querySelector(".media img"),a=k.matches("a[href]")?k:k.querySelector("a[href]");
return{b:brOf(t),title:title(t),full:t,cat:"Használt"+(tx(k,".year")?" · "+tx(k,".year"):""),img:im?(im.getAttribute("src")||""):"",href:a?a.getAttribute("href"):"",price:tx(k,".price"),note:tx(k,".peur")+" · nettó",facts:sp.map(function(x){return /^\d+$/.test(x.replace(/\s|km/g,""))&&/km/.test(x)?km(x):fuel(x)}),gal:true,inq:function(){clickInq(k,a&&a.getAttribute("href"))}}})}
// ---- kirajzolás ----
var SIG={};
function render(){A=document.getElementById("autoink");if(!A)return;var br=window.__caCFBrand||"",narrow=innerWidth<=720,max=narrow?12:6;
[["panel-berelheto",rentList],["panel-elado",function(){return saleFromData()||saleFromCards()}],["panel-bizomanyos",bizList]].forEach(function(p){var P=document.getElementById(p[0]);if(!P)return;
var L=p[1]()||[];if(br)L=L.filter(function(o){return o.b===br});else if(p[0]==="panel-elado"){var per={},seen={},out=[],rest=[];L.forEach(function(o){var mk=o.title.split(/\s+/).slice(0,3).join(" ").toLowerCase();if(seen[mk]){rest.push(o);return}seen[mk]=1;out.push(o)});L=out.concat(rest)}L=L.filter(function(o){return o.img}).slice(0,max);
var g=L.map(function(o){return o.href+"|"+o.price+"|"+o.img}).join(",")+"#"+br+narrow;if(SIG[p[0]]===g&&P.querySelector(".cg-grid"))return;SIG[p[0]]=g;
var G=P.querySelector(".cg-grid");if(!G){G=el("div","cg-grid");var cw=P.querySelector(".cw");P.insertBefore(G,cw?cw.nextSibling:P.firstChild);var sw=el("div","cg-sw");P.insertBefore(sw,G.nextSibling);
G.addEventListener("scroll",function(){var s=P.querySelector(".cg-sw");if(!s||!G.children.length)return;var w=G.children[0].offsetWidth+14,j=Math.round(G.scrollLeft/w);[].forEach.call(s.children,function(d,k){d.classList.toggle("on",k===j)})},{passive:true})}
G.innerHTML="";if(!L.length){var none=itemsOf(p[0].replace("panel","cw")).length;G.appendChild(el("div","cg-empty",none?"Ebben a kategóriában most nincs ilyen márkájú autó.":"Betöltés…"));}
L.forEach(function(o){G.appendChild(card(o))});G.scrollLeft=0;
var s=P.querySelector(".cg-sw");s.innerHTML="";if(L.length>1)L.forEach(function(_,k){s.appendChild(el("i",k===0?"on":""))})})}
var to=0;function later(d){clearTimeout(to);to=setTimeout(render,d||120)}
function boot(){A=document.getElementById("autoink");if(!A)return;A.classList.add("ca-grid","ca-stg-on");render();
["cw-berelheto","cw-elado","cw-bizomanyos"].forEach(function(id){var r=rootOf(id),t=r&&r.querySelector(".cw-track");if(t)new MutationObserver(function(){later()}).observe(t,{childList:true})});
document.addEventListener("click",function(e){if(e.target.closest&&e.target.closest("#autoink .cf-br,#autoink .autok-tab"))later(60)});
var w=innerWidth<=720;addEventListener("resize",function(){var n=innerWidth<=720;if(n!==w){w=n;later()}});
var tries=0;(function sale(){var R=window.RENT;if(R&&R.loadAll){R.loadAll(function(c){if(c&&c.length){SALE=c;later(30)}})}else if(tries++<40)setTimeout(sale,250)})()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot()})();</script>`;

try {
  if (!fs.existsSync(FILE)) console.log('[home-grid] nincs dist/index.html — kihagyva');
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-grid-js"') > -1) console.log('[home-grid] már alkalmazva');
    else if (h.indexOf('id="autoink"') < 0) console.log('[home-grid] nincs #autoink — kihagyva');
    else {
      h = h.replace('</head>', '<script>window.__caGrid=1</script>' + CSS + '</head>').replace(/<\/body>(?![\s\S]*<\/body>)/i, JS + '</body>');
      fs.writeFileSync(FILE, h);
      console.log('[home-grid] klasszikus autókártyák a Kínálat részben');
    }
  }
} catch (e) { console.log('[home-grid] hiba:', e.message); }
