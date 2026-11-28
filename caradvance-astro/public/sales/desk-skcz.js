/* Sales Desk – SK/CZ piac (dev/live .sk és .cz host).
   Mr. Job SK kérései (2026-11-26):
   1) adatok (kategória, állapot, felszereltség, színek, PS) szlovákul/csehül – csak megjelenítés, az adat nem változik
   2) SK/CZ elérhetőségek a láblécben, HU közösségi linkek nélkül
   3) "új közlekedési eszköz" (≤ 6 hónap vagy ≤ 6 000 km): B2C ár német ÁFA nélkül + SK 23 % / CZ 21 % megjegyzés;
      B2B: 138. cikk szerinti adómentes Közösségen belüli értékesítés megjegyzés
   5) SK/CZ e-mail / WhatsApp sablon küldő-azonosítással és leiratkozási mondattal
   2026-11-27: az adatfordítás (1) minden hoston fut, minden választható nyelven (sk, cs, hu, de, pl, en);
   a 2), 3), 5) üzleti rész továbbra is csak .sk/.cz hoston. */
(()=>{
  const H=location.hostname;
  const MK=/\.sk$/.test(H)?'sk':/\.cz$/.test(H)?'cz':((new URLSearchParams(location.search).get('skcz')||'').match(/^(sk|cz)$/)||[])[0];
  const LI={sk:0,cs:1,hu:2,de:3,pl:4,en:5};
  const curLang=()=>{const s=document.getElementById('lang');return (s&&s.value)||document.documentElement.lang||'en';};
  let foot=()=>{};
  if(MK){
  const SK=MK==='sk';
  const VAT=SK?23:21;
  const CT=SK?{mail:'info@caradvance.sk',tel:'+421 915 410 555',web:'www.caradvance.sk'}:{mail:'info@caradvance.cz',tel:'+420 604 313 136',web:'www.caradvance.cz'};
  const lang=()=>{const l=curLang();return l==='sk'||l==='cs'||l==='de'?l:'en';};

  /* ---- csevegő / hívás gomb: SK/CZ telefon ---- */
  try{if(window.CA_CFG){const d=CT.tel.replace(/\D/g,'');Object.assign(window.CA_CFG,{PHONE:CT.tel,WHATSAPP:'https://wa.me/'+d,
    ERROR_TEXT:SK?`Vašu žiadosť sa nepodarilo odoslať. Zavolajte nám alebo napíšte na ${CT.mail}.`:`Vaši žádost se nepodařilo odeslat. Zavolejte nám nebo napište na ${CT.mail}.`});}}catch(e){}

  /* ---- 3) új közlekedési eszköz (NMT) ---- */
  function nmt(c){
    if(!c||c.dealer_net==null||c.dealer_net==='')return false;
    const km=Number(c.mileage);
    if(c.mileage!=null&&c.mileage!==''&&!isNaN(km)&&km<=6000)return true;
    const fr=String(c.first_reg||'').trim();
    if(!fr)return true; // még nincs forgalomba helyezve = új
    let m=fr.match(/(\d{1,2})\s*[\/.\-]\s*(\d{4})/);
    if(!m){const y=fr.match(/(\d{4})\s*[\/.\-]\s*(\d{1,2})/);if(y)m=[0,y[2],y[1]];}
    if(!m)return false;
    // óvatos: a hónap 1. napjától számolunk (a pontos nap nem ismert)
    const lim=new Date(+m[2],+m[1]-1+6,1);
    return Date.now()<lim.getTime();
  }
  const TX={
    sk:{tag:`bez DPH · +${VAT} % DPH v SR`,ttl:'Nový dopravný prostriedok (≤ 6 mesiacov od 1. registrácie alebo ≤ 6 000 km): kupujúci platí DPH v SR.',
        note:`bez nemeckej DPH – nový dopravný prostriedok, kupujúci platí ${VAT} % DPH v SR`,
        b2b:'Dodanie platiteľovi DPH v SR je oslobodené od DPH (čl. 138 smernice 2006/112/ES).',
        foot:`Nový dopravný prostriedok (najviac 6 mesiacov od prvej registrácie alebo najviac 6 000 km): cena B2C je bez nemeckej DPH, DPH ${VAT} % platí kupujúci na Slovensku. Ostatné ceny B2C obsahujú 19 % nemeckú DPH.`},
    cs:{tag:`bez DPH · +${VAT} % DPH v ČR`,ttl:'Nový dopravní prostředek (≤ 6 měsíců od 1. registrace nebo ≤ 6 000 km): kupující platí DPH v ČR.',
        note:`bez německé DPH – nový dopravní prostředek, kupující platí ${VAT} % DPH v ČR`,
        b2b:'Dodání plátci DPH v ČR je osvobozeno od DPH (čl. 138 směrnice 2006/112/ES).',
        foot:`Nový dopravní prostředek (nejvýše 6 měsíců od první registrace nebo nejvýše 6 000 km): cena B2C je bez německé DPH, DPH ${VAT} % platí kupující v České republice. Ostatní ceny B2C obsahují 19% německou DPH.`},
    de:{tag:`ohne MwSt. · +${VAT} % MwSt. in ${SK?'SK':'CZ'}`,ttl:`Neues Fahrzeug (≤ 6 Monate ab Erstzulassung oder ≤ 6.000 km): der Käufer zahlt die MwSt. in ${SK?'der Slowakei':'Tschechien'}.`,
        note:`ohne deutsche MwSt. – neues Fahrzeug, der Käufer zahlt ${VAT} % MwSt. in ${SK?'der Slowakei':'Tschechien'}`,
        b2b:`Lieferung an einen Steuerpflichtigen in ${SK?'der Slowakei':'Tschechien'} ist umsatzsteuerfrei (Art. 138 MwSt-Richtlinie 2006/112/EG).`,
        foot:`Neues Fahrzeug (höchstens 6 Monate ab Erstzulassung oder höchstens 6.000 km): der B2C-Preis ist ohne deutsche MwSt.; der Käufer zahlt ${VAT} % MwSt. in ${SK?'der Slowakei':'Tschechien'}. Andere B2C-Preise enthalten 19 % deutsche MwSt.`},
    en:{tag:`excl. VAT · +${VAT}% VAT in ${SK?'SK':'CZ'}`,ttl:`New means of transport (≤ 6 months from first registration or ≤ 6,000 km): the buyer pays VAT in ${SK?'Slovakia':'the Czech Republic'}.`,
        note:`excl. German VAT – new means of transport, buyer pays ${VAT}% VAT in ${SK?'Slovakia':'the Czech Republic'}`,
        b2b:`Supply to a VAT payer in ${SK?'Slovakia':'the Czech Republic'} is VAT-exempt (Art. 138 VAT Directive 2006/112/EC).`,
        foot:`New means of transport (max. 6 months from first registration or max. 6,000 km): the B2C price excludes German VAT; the buyer pays ${VAT}% VAT in ${SK?'Slovakia':'the Czech Republic'}. Other B2C prices include 19% German VAT.`}};
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  window.__skczNMT=nmt;
  window.__skczB2C=c=>nmt(c)?c.dealer_net:c.dealer_gross;
  window.__skczTag=c=>{if(!nmt(c))return '';const T=TX[lang()];return `<span class="skcz-nmt" title="${esc(T.ttl)}">${esc(T.tag)}</span>`;};
  window.__skczNote=c=>nmt(c)?TX[lang()].note:'';
  window.__skczB2B=c=>c&&c.dealer_net?`<span class="skcz-b2b">${esc(TX[lang()].b2b)}</span>`:'';

  /* ---- 5) sablonok ---- */
  const SIG={
    sk:`\n\nS pozdravom\n{from}\nMr. Job SK s.r.o., Cesta na Senec 2/A, 821 04 Bratislava, IČO 52 005 445\nobchodný sprostredkovateľ Caradvance GmbH pre Slovensko\ninfo@caradvance.sk · +421 915 410 555 · www.caradvance.sk\n\n—\nTento e-mail sme poslali na kontakt, ktorý vaša firma zverejnila na svojom webe alebo v inzercii. Ak si ďalšie ponuky neželáte, odpovedzte prosím slovom „ODHLÁSIŤ“ – vašu adresu okamžite vyradíme. Informácie o spracúvaní údajov: www.caradvance.sk/ochrana-osobnych-udajov.`,
    cs:`\n\nS pozdravem\n{from}\nMr. Job SK s.r.o., Cesta na Senec 2/A, 821 04 Bratislava, IČO 52 005 445\nobchodní zprostředkovatel Caradvance GmbH pro Českou republiku\ninfo@caradvance.cz · +420 604 313 136 · www.caradvance.cz\n\n—\nTento e-mail jsme zaslali na kontakt, který vaše firma zveřejnila na svém webu nebo v inzerci. Pokud si další nabídky nepřejete, odpovězte prosím slovem „ODHLÁSIT“ – vaši adresu okamžitě vyřadíme. Informace o zpracování údajů: www.caradvance.cz.`};
  const AG={sk:SK?'pre Slovensko':'pre Českú republiku',cs:SK?'pro Slovensko':'pro Českou republiku'};
  const MSGX={
    sk:{s:'Takmer nové autá z Nemecka pre váš autobazár – ponuka Caradvance',
        b:`Dobrý deň{hi2},\n\nsme obchodný sprostredkovateľ nemeckej spoločnosti Caradvance GmbH ${AG.sk}. Caradvance má teraz k dispozícii {offer} – {count}. Autá sú ihneď k dispozícii v Nemecku, kúpiť sa dajú všetky spolu alebo jednotlivo.\n\nPre platiteľa DPH so slovenským IČ DPH je dodanie z Nemecka oslobodené od DPH, DPH odvediete na Slovensku. Prepravu vieme zorganizovať.\n\nAk máte záujem, stačí odpovedať na tento e-mail – pošleme vám podrobnú ponuku s fotkami, kartou vozidla BMW a cenami, prípadne vám zavoláme.`+SIG.sk},
    cs:{s:'Téměř nové vozy z Německa pro váš autobazar – nabídka Caradvance',
        b:`Dobrý den{hi2},\n\njsme obchodní zprostředkovatel německé společnosti Caradvance GmbH ${AG.cs}. Caradvance má nyní k dispozici {offer} – {count}. Vozy jsou ihned k dispozici v Německu, koupit je lze všechny společně i jednotlivě.\n\nPro plátce DPH s českým DIČ je dodání z Německa osvobozeno od DPH, DPH odvedete v Česku. Přepravu umíme zorganizovat.\n\nPokud máte zájem, stačí odpovědět na tento e-mail – pošleme vám podrobnou nabídku s fotkami, kartou vozidla BMW a cenami, případně vám zavoláme.`+SIG.cs}};
  // a szlovák szöveg szlovák IČ DPH-t említ; CZ hoston szlovákul írt levélnél ezt cseréljük
  if(!SK){MSGX.sk.b=MSGX.sk.b.replace('so slovenským IČ DPH','s českým DIČ').replace('DPH odvediete na Slovensku','DPH odvediete v Česku').replace(SIG.sk,SIG.sk.replace('info@caradvance.sk · +421 915 410 555 · www.caradvance.sk','info@caradvance.cz · +420 604 313 136 · www.caradvance.cz'));}
  if(SK){MSGX.cs.b=MSGX.cs.b.replace('s českým DIČ','se slovenským IČ DPH').replace('DPH odvedete v Česku','DPH odvedete na Slovensku').replace('info@caradvance.cz · +420 604 313 136 · www.caradvance.cz','info@caradvance.sk · +421 915 410 555 · www.caradvance.sk');}
  window.__skczMsg=L=>MSGX[L]||null;
  window.__skczFoot=()=>{const l=lang();
    if(l==='cs')return `Mr. Job SK s.r.o. – obchodní zprostředkovatel Caradvance GmbH ${AG.cs}\n${CT.mail} · ${CT.tel}\nPokud si další nabídky nepřejete, odpovězte „ODHLÁSIT“.`;
    if(l==='sk')return `Mr. Job SK s.r.o. – obchodný sprostredkovateľ Caradvance GmbH ${AG.sk}\n${CT.mail} · ${CT.tel}\nAk si ďalšie ponuky neželáte, odpíšte „ODHLÁSIŤ“.`;
    return `Mr. Job SK s.r.o. – sales agent of Caradvance GmbH for ${SK?'Slovakia':'the Czech Republic'}\n${CT.mail} · ${CT.tel}\nReply "STOP" if you don't want further offers.`;};

  /* ---- stílus ---- */
  const st=document.createElement('style');st.id='skcz-desk-css';
  st.textContent='.skcz-nmt{display:block;font-size:11px;font-weight:600;line-height:1.25;color:var(--accent,#0b63ce);white-space:normal;margin-top:2px}'+
    '.skcz-b2b{display:block;font-size:11px;font-weight:500;line-height:1.3;color:var(--muted,#667);white-space:normal;margin-top:3px}'+
    'p.foot.skcz-foot{margin-top:4px}';
  (document.head||document.documentElement).appendChild(st);

  /* ---- lábjegyzet ---- */
  function footNote(){
    document.querySelectorAll('#v-stock p.foot:not(.skcz-foot)').forEach(f=>{
      let x=f.nextElementSibling;if(!x||!x.classList.contains('skcz-foot')){x=document.createElement('p');x.className='foot skcz-foot skcz-off';f.after(x);}
      const T=TX[lang()];const v=T.foot+' '+T.b2b;if(x.textContent!==v)x.textContent=v;});
  }

  /* ---- 2) lábléc: a piaci (SK/CZ) lábléc a főoldalról ---- */
  function swapFooter(){
    const f=document.querySelector('footer.cafoot');if(!f||f.dataset.skcz)return;
    fetch('/',{credentials:'same-origin'}).then(r=>r.text()).then(h=>{
      const m=h.match(/<footer class="cafoot"[\s\S]*?<\/footer>/);
      if(m&&/caradvance\.(sk|cz)/.test(m[0])){const t=document.createElement('template');t.innerHTML=m[0];const nf=t.content.firstElementChild;nf.dataset.skcz='1';f.replaceWith(nf);}
      else fixFooter(f);
    }).catch(()=>fixFooter(f));
  }
  function fixFooter(f){ // tartalék: csak a kontaktok cseréje, HU közösségi linkek ki
    f.dataset.skcz='1';f.removeAttribute('lang');
    f.querySelectorAll('a[href^="tel:+36"]').forEach(a=>{a.href='tel:'+CT.tel.replace(/\s/g,'');a.textContent=CT.tel;});
    f.querySelectorAll('a[href^="mailto:"][href*="caradvance.hu"]').forEach(a=>{a.href='mailto:'+CT.mail;a.textContent=CT.mail;});
    f.querySelectorAll('a[href*="facebook.com"],a[href*="instagram.com"],a[href*="tiktok.com"],a[href*="linkedin.com"]').forEach(a=>a.remove());
  }
  foot=()=>footNote();
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',swapFooter);else swapFooter();
  }


  /* ---- 2026-11-27: /sales lábléc a .pl / .eu / .ch oldalon – a saját piac, nem "Hungary" ---- */
  (()=>{
    const tld=(H.match(/\.(pl|eu|ch)$/)||[])[1];if(!tld)return;
    const M={pl:{where:'Poland',tel:'+49 151 70571578'},eu:{where:'Europe',tel:'+49 151 70571578'},ch:{where:'Switzerland',tel:'+41 79 715 85 80',mail:'info@caradvance.ch'}}[tld];
    const fix=()=>{const f=document.querySelector('footer.cafoot');if(!f)return;
      /* a bemutatkozó mondat: angol forrásszöveget teszünk be, a lap fordítója ebből fordít a választott nyelvre
         (ha a fordító már előbb lefordította a "Hungary" változatot, azt is lecseréljük) */
      const pe=[...f.querySelectorAll('p')].find(x=>/Germany|Németország|Nemecka|Německa|Deutschland|Niemiec/.test(x.textContent));
      const en='Premium cars from Germany for people living in '+M.where+' — long-term rental, import and registration, in English.';
      if(pe){const n=[...pe.childNodes].find(x=>x.nodeType===3&&x.data.trim());if(n&&n.data.trim()!==en)n.data=en;}
      f.querySelectorAll('a[href^="tel:+36"]').forEach(a=>{a.href='tel:'+M.tel.replace(/\s/g,'');a.textContent=M.tel;});
      if(M.mail)f.querySelectorAll('a[href^="mailto:"][href*="caradvance.hu"]').forEach(a=>{a.href='mailto:'+M.mail;a.textContent=M.mail;});};
    if(document.readyState==='loading')addEventListener('DOMContentLoaded',fix);else fix();
  })();

  /* ---- 1) adatok fordítása (csak megjelenítés) – minden hoston ---- */
  let D=null,L2=null;
  const COL={grau:'Grey',blau:'Blue',rot:'Red',grün:'Green',weiss:'White',weiß:'White',gelb:'Yellow',schwarz:'Black',silber:'Silver'};
  const MET=['metalíza','metalíza','metál','metallic','metalik','metallic'];
  const HP=['k','k','LE','PS','KM','hp'],SYS=['systém','systém','rendszer','System','systemowa','system'];
  function one(s,i){
    const t=s.trim();if(!t)return null;
    const hit=D[t]||L2[t.toLowerCase()];
    if(hit){let v=hit[i];if(!v||v.toLowerCase()===t.toLowerCase())return null;
      /* kis-/nagybetűs változat: a megjelenített szöveg írásmódját követjük */
      if(!D[t]&&t!==t.toUpperCase()&&v===v.toUpperCase())v=v.charAt(0)+v.slice(1).toLowerCase();return v;}
    let m=t.match(/^(\d+)\s*kW\s*\/\s*(\d+)\s*(PS|hp|HP|LE|KM|k)(\s*\(system\))?$/);
    if(m)return `${m[1]} kW / ${m[2]} ${HP[i]}`+(m[4]?` (${SYS[i]})`:'');
    m=t.match(/^(\d+)\s*(PS|hp|HP|LE|KM)$/);if(m)return m[1]+' '+HP[i];
    m=t.match(/^(.*?)\s+(metallic|met\.)(\s*\(.*\))?$/i);
    if(m&&m[1].length<40){let b=m[1];if(i!==3)b=b.replace(/\b(Grau|Blau|Rot|Grün|Weiss|Weiß|Gelb|Schwarz|Silber)\b/gi,w=>COL[w.toLowerCase()]||w);
      if(b===b.toUpperCase())b=b.toLowerCase().replace(/(^|[\s\-])(\S)/g,(a,p,c)=>p+c.toUpperCase());
      b=b.replace(/\bIii\b/g,'III').replace(/\bIi\b/g,'II');return b+' '+MET[i]+(m[3]||'');}
    return null;
  }
  function tr(s,l){
    const i=LI[l];if(i==null)return null;const r=one(s,i);if(r!=null)return r;
    for(const sep of [' · ',', ','; ']){if(s.includes(sep)){let ch=false;const o=s.split(sep).map(p=>{const x=one(p,i);if(x!=null&&x!==p.trim()){ch=true;return p.replace(p.trim(),x)}return p});if(ch)return o.join(sep);}}
    return null;
  }
  const SKIP='script,style,textarea,input,code,pre,[contenteditable],#lang,.skcz-off,footer.cafoot';
  const ORIG=new WeakMap();
  function node(n){
    const p=n.parentElement;if(!p||p.closest(SKIP))return;
    // <option> érték nélkül: a szöveg az érték – rögzítjük az eredetit, hogy a fordítás ne írjon vissza más értéket
    if(p.tagName==='OPTION'&&!p.hasAttribute('value')){if(ORIG.has(n))return;p.setAttribute('value',p.textContent);}
    const l=curLang();
    const o=ORIG.has(n)?ORIG.get(n):n.nodeValue;
    if(!o||o.length>400||!/[A-Za-zÄÖÜäöüß]/.test(o))return;
    const r=tr(o,l);
    if(r!=null){ORIG.set(n,o);const v=o.replace(o.trim(),r);if(n.nodeValue!==v)n.nodeValue=v;}
    else if(ORIG.has(n)&&n.nodeValue!==o)n.nodeValue=o;
  }
  function walk(root){
    if(!D||!root)return;
    if(root.nodeType===3){node(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))node(n);
  }
  let q=new Set(),sch=false;
  const flush=()=>{sch=false;const a=[...q];q.clear();for(const r of a)if(r.isConnected!==false)walk(r);foot();};
  const obs=new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')q.add(m.target);else m.addedNodes.forEach(x=>q.add(x));}if(!sch){sch=true;requestAnimationFrame(flush);}});
  function start(){walk(document.body);foot();obs.observe(document.body,{childList:true,subtree:true,characterData:true});
    const re=()=>setTimeout(()=>{walk(document.body);foot();},0);
    const ls=document.getElementById('lang');if(ls)ls.addEventListener('change',re);
    /* a nyelvválasztó menü a <html lang> attribútumot állítja – erre is újrafordítunk */
    new MutationObserver(re).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});}
  fetch('desk-skcz-dict.json?v=1128c',{credentials:'same-origin'}).then(r=>r.ok?r.json():{}).then(j=>{D=j;L2={};for(const k in D)L2[k.toLowerCase()]=D[k];
    if(document.body)start();else addEventListener('DOMContentLoaded',start);}).catch(()=>{});

})();
