// Build lépés (a ver-assets.mjs előtt): a magyar oldalak apró, szemmel látható hibáinak javítása (hu-fix.css).
// Tartalom-hash verzióval CSAK a magyar oldalakra kerül. Idempotens; hiba esetén nem állítja meg a buildet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const TABKEEP = '<script id="ca-tabkeep">(function(){var K="ca-tab:"+location.pathname,nav=(performance.getEntriesByType&&performance.getEntriesByType("navigation")[0])||{},again=nav.type==="reload"||nav.type==="back_forward";'
  + 'document.addEventListener("click",function(e){var t=e.target&&e.target.closest&&e.target.closest(".autok-tab");if(!t||!t.dataset.tab)return;try{sessionStorage.setItem(K,t.dataset.tab)}catch(_){}},true);'
  + 'if(!again)return;var v;try{v=sessionStorage.getItem(K)}catch(_){}if(!v)return;'
  + 'var n=0;function go(){var t=document.querySelector(".autok-tab[data-tab=\\""+v+"\\"]");if(!t){if(++n<60)setTimeout(go,100);return}'
  + 'if(t.classList.contains("on"))return;'
  // az Autóink bérlési alfülei (Prémium, Bérbeadva) csak a Bérelhető csoportban látszanak: előbb azt nyitjuk meg
  + 'if(t.hidden||!t.offsetParent){var g=document.querySelector(".autok-tab[data-tab=\\"berelheto\\"]");if(g&&t.getAttribute("data-group")==="berles"&&!g.classList.contains("on")){g.click();setTimeout(function(){t.click()},250);return}}'
  + 't.click()}'
  + 'if(document.readyState==="complete")setTimeout(go,150);else addEventListener("load",function(){setTimeout(go,150)})})();</script>';

const TITLECLEAN = '<script id="ca-titleclean">(function(){'
  // csak a megjelenített szöveg változik (az adat és a keresés érintetlen): a csupa nagybetűs szavak normál írásmódot kapnak,
  // a „*”, „/”, „!” zaj eltűnik, a márkák és rövidítések (BMW, AMG, HUD, H&K, TFSI, MINI …) maradnak
  + 'var KEEP={MINI:1,CUPRA:1,BOSE:1,TFSI:1,PASM:1,IONIQ:1,TDI:1,TSI:1,PHEV:1,BEV:1,LED:1,HUD:1,AHK:1,AMG:1,BMW:1,GTS:1,GTI:1,ABT:1,JCW:1,SUV:1,XL:1,AR:1,TV:1,UVP:1,ACC:1,DAB:1,NEU:1};'
  + 'function cap(w){return w.charAt(0)+w.slice(1).toLowerCase()}'
  + 'function word(w){return w.replace(/[A-ZÄÖÜ]{4,}/g,function(m){return KEEP[m]?m:cap(m)})}'
  + 'function clean(t){var o=t;t=t.replace(/km\\/h/gi,"km\\u2044h").replace(/\\*(\\d+)\\*/g," $1 ").replace(/!+/g," ").replace(/\\bFULL[- ]?FULL\\b/gi,"FULL").replace(/\\s*[*|]\\s*/g," · ").replace(/\\s*\\/\\s*/g," · ").replace(/"(\\d{2})"/g,"$1\\u2033").replace(/(\\d{2})"/g,"$1\\u2033").replace(/(\\d{2})\\x27/g,"$1\\u2033");'
  + 't=t.split(/(\\s+)/).map(function(x){return (/[A-ZÄÖÜ]{4,}/.test(x)&&!/[a-zäöüß]/.test(x))?x.split(/([&\\-])/).map(word).join(""):x}).join("");'
  + 't=t.replace(/(\\s·\\s)+/g," · ").replace(/^\\s*·\\s*|\\s*·\\s*$/g,"").replace(/\\s{2,}/g," ").replace(/\\s+([,.])/g,"$1").replace(/"/g,"").replace(/km\\u2044h/g,"km/h").replace(/(\\d)(km\\/h)/g,"$1 $2").trim();return t===o.trim()?null:t}'
  + 'var SEL=".card .title, .ptitle, .cd-title"+(/^\\/(auto|egyedi-auto-rendeles)\\//.test(location.pathname)?", main h1":"");'
  + 'function run(){[].forEach.call(document.querySelectorAll(SEL),function(el){var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),n;while(n=w.nextNode()){if(n.__ct===n.nodeValue)continue;var c=clean(n.nodeValue);if(c!==null)n.nodeValue=c;n.__ct=n.nodeValue}})}'
  + 'var tm;function later(){clearTimeout(tm);tm=setTimeout(run,120)}'
  + 'if(document.readyState!=="loading")run();else document.addEventListener("DOMContentLoaded",run);addEventListener("load",run);'
  + 'try{new MutationObserver(later).observe(document.documentElement,{childList:true,subtree:true})}catch(_){}})();</script>';

const CARDS = '<script id="ca-cards">(function(){if(!/^\\/(referenciak|auto)\\//.test(location.pathname))return;'
  // 17. a Referenciák és az adatlap „Hasonló autók” kártyái ugyanolyanok, mint az Autóink kártyái: chipes adatsor, fekete „Részletek”, chat ikon
  + 'var IC={cal:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>\',km:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/></svg>\',gb:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v8M12 8v8M18 8v4H6"/></svg>\',fu:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M4 20h12M15 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/></svg>\'};'
  + 'function go(){document.documentElement.classList.add("ca-cards");[].forEach.call(document.querySelectorAll("a.card"),function(c){if(c.__cx||c.closest("#grid,#autoink"))return;var b=c.querySelector(".body");if(!b)return;c.__cx=1;c.classList.add("ca-cx");'
  + 'var y=(c.querySelector(".year")||{}).textContent||"",sp=(c.querySelector(".specs")||{}).textContent||"",parts=sp.split("·").map(function(x){return x.trim()}).filter(Boolean),out="";'
  + 'if(!y){var m=(c.querySelector(".meta")||{}).textContent||"";var mm=m.match(/\\d{2}\\/\\d{4}/);if(mm)y=mm[0]}'
  + 'if(y)out+="<span>"+IC.cal+y.trim()+"</span>";parts.forEach(function(p){if(/^\\d[\\d\\s\u00a0]*$/.test(p))p=p+" km";var k=/km/.test(p)?"km":/automat|manu|kézi|váltó/i.test(p)?"gb":"fu";out+="<span>"+IC[k]+p+"</span>"});'
  + 'if(out){var d=document.createElement("div");d.className="ca-sp";d.innerHTML=out;var t=c.querySelector(".title");if(t)t.parentNode.insertBefore(d,t.nextSibling)}'
  + 'var cb=c.querySelector(".cbtn"),iq=c.querySelector(".ca-inq");[cb,iq].forEach(function(x){if(!x)return;x.setAttribute("data-dm-skip","1");["background","background-color","color","-webkit-text-fill-color","border-color"].forEach(function(k){x.style.removeProperty(k)})});'
  + 'if(cb&&!cb.parentNode.classList.contains("ca-act")){var a=document.createElement("div");a.className="ca-act";cb.parentNode.insertBefore(a,cb);a.appendChild(cb);if(iq){iq.title="Érdeklődöm";iq.setAttribute("aria-label","Érdeklődöm");a.appendChild(iq)}}})}'
  + 'var tm;function later(){clearTimeout(tm);tm=setTimeout(go,150)}if(document.readyState!=="loading")go();else document.addEventListener("DOMContentLoaded",go);addEventListener("load",go);try{new MutationObserver(later).observe(document.body||document.documentElement,{childList:true,subtree:true})}catch(_){}})();</script>';

const CORP_LI = '<li class="navitem"><button class="navlink" type="button">Cégeknek<span class="chev">⌄</span></button><div class="dropdown"><div class="dd-inner"><a class="ddi" href="/cegeknek/#benchmark">Benchmark</a><a class="ddi" href="/cegeknek/#rendezvenyek">Rendezvények</a><a class="ddi" href="/tartos-berlet/#cegeknek">Céges tartós bérlet</a><a class="ddi" href="/operativ-lizing/">Operatív lízing</a></div></div></li>';
const CORP_M = '<div class="m-acc"><button class="m-accbtn" type="button">Cégeknek<span class="m-plus">+</span></button><div class="m-sub"><a href="/cegeknek/#benchmark">Benchmark</a><a href="/cegeknek/#rendezvenyek">Rendezvények</a><a href="/tartos-berlet/#cegeknek">Céges tartós bérlet</a><a href="/operativ-lizing/">Operatív lízing</a></div></div>';
const VIP_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>';
const VIP_BTN = '<a class="ca-vip" href="/vip/" aria-label="VIP luxusautó-bérlés">' + VIP_SVG + '<span>VIP</span></a>';
const VIP_M = '<a class="ca-vip ca-vip-m" href="/vip/">' + VIP_SVG + '<span>VIP luxusautó-bérlés</span></a>';

const dist = path.resolve(process.cwd(), 'dist');
const SRC = path.resolve(process.cwd(), 'hu-fix.css');

try {
  if (!fs.existsSync(dist) || !fs.existsSync(SRC)) console.log('[hu-fix] nincs dist vagy forrás — kihagyva');
  else {
    const css = fs.readFileSync(SRC, 'utf8');
    fs.writeFileSync(path.join(dist, 'hu-fix.css'), css);
    const v = crypto.createHash('sha1').update(css).digest('hex').slice(0, 10);
    const tag = '<link rel="stylesheet" id="ca-dark-hu-fix" href="/hu-fix.css?v=' + v + '">';
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
        const h2 = h.indexOf('id="ca-dark-hu-fix"') > -1
          ? h.replace(/<link rel="stylesheet" id="ca-dark-hu-fix" href="[^"]*">/, tag)
          : h.replace('</head>', tag + '</head>');
        // Autóink-szerű oldalak (nem a főoldal): az „Eladó autók / Eladva” váltót a dark-mode.js ne színezze át (saját sötét stílusa van a hu-fix.css-ben)
        let h3 = h2;
        const rel = path.relative(dist, p).split(path.sep).join('/');
        if (p !== path.join(dist, 'index.html')) h3 = h3.replace(/<div class="autok-tabs" role="tablist">/g, '<div class="autok-tabs" role="tablist" data-dm-skip="1">');
        // 24. Bizományos: a fejléc alcíme szó szerint megismétlődött közvetlenül alatta — a bevezető az új információval indul
        if (/\/bizomanyos\/index\.html$/.test(p.split(path.sep).join('/'))) h3 = h3.replace('<p class="biz-lead">Bizományban értékesített prémium autók — és minden eladással egy magyar jótékony szervezetet is támogatunk. A jutalékunk', '<p class="biz-lead">A jutalékunk');
        // Fülválasztás megtartása újratöltéskor (főoldal: Bérelhető / Eladó / Bizományos; Autóink: Prémium, Bérbeadva …):
        // kattintáskor a böngésző munkamenetébe menti a fület, újratöltéskor (vagy Vissza gombnál) ugyanazt a fület nyitja meg
        if (h3.indexOf('autok-tab') > -1 && h3.indexOf('id="ca-tabkeep"') < 0) h3 = h3.replace('</body>', TABKEEP + '</body>');
        // 17. egységes autókártyák a Referenciák és az adatlap „Hasonló autók” részén
        if ((rel === 'referenciak/index.html' || rel.startsWith('auto/')) && h3.indexOf('id="ca-cards"') < 0) h3 = h3.replace('</body>', CARDS + '</body>');
        // 27. Autócímek kitisztítása megjelenítéskor (csupa nagybetűs német hirdetéscímek)
        if ((rel === 'referenciak/index.html' || rel === 'bizomanyos/index.html' || h3.indexOf('class="card') > -1 || h3.indexOf('class="ptitle') > -1 || /data-hupath="\/auto\//.test(h3) || rel.startsWith('auto/')) && h3.indexOf('id="ca-titleclean"') < 0) h3 = h3.replace('</body>', TITLECLEAN + '</body>');
        // Főmenü rövid, egységes nevei (csak magyar oldalak): Bérlés · Vásárlás · Eladás · Import · Rólunk
        for (const [a, b] of [['Tartós bérlet', 'Bérlés'], ['Megvásárolható autóink', 'Vásárlás'], ['Bizományos értékesítés', 'Eladás']]) {
          h3 = h3.split('<button class="navlink" type="button">' + a + '<span class="chev">').join('<button class="navlink" type="button">' + b + '<span class="chev">')
                 .split('<button class="m-accbtn" type="button">' + a + '<span class="m-plus">').join('<button class="m-accbtn" type="button">' + b + '<span class="m-plus">');
        }
        // Főmenü: új „Cégeknek” menüpont a Rólunk elé (asztali + mobil), arany VIP gomb a Kapcsolat mellé
        if (h3.indexOf('>Cégeknek<span class="chev">') < 0) h3 = h3.replace('<li class="navitem"><button class="navlink" type="button">Rólunk', CORP_LI + '<li class="navitem"><button class="navlink" type="button">Rólunk');
        if (h3.indexOf('>Cégeknek<span class="m-plus">') < 0) h3 = h3.replace('<div class="m-acc"><button class="m-accbtn" type="button">Rólunk', CORP_M + '<div class="m-acc"><button class="m-accbtn" type="button">Rólunk');
        if (h3.indexOf('class="ca-vip"') < 0) h3 = h3.replace('<a class="kapcsolat" href="/kapcsolat/">', VIP_BTN + '<a class="kapcsolat" href="/kapcsolat/">');
        if (h3.indexOf('ca-vip-m') < 0) h3 = h3.replace('<a class="m-kapcsolat" href="/kapcsolat/">', VIP_M + '<a class="m-kapcsolat" href="/kapcsolat/">');
        // oldal-azonosító a <html>-en, hogy a hu-fix.css egy-egy oldalra célzottan is tudjon javítani
        const hp = rel === 'index.html' ? '/' : (rel.endsWith('/index.html') ? '/' + rel.slice(0, -10) : '/' + rel);
        if (!/<html[^>]*data-hupath=/.test(h3)) h3 = h3.replace(/<html\b/, '<html data-hupath="' + hp.replace(/"/g, '') + '"');
        if (h3 !== h) { fs.writeFileSync(p, h3); files++; }
      }
    })(dist);
    console.log('[hu-fix] apró javítások (csak magyar oldalak): ' + files + ' oldal');
  }
} catch (e) { console.log('[hu-fix] hiba:', e.message); }
