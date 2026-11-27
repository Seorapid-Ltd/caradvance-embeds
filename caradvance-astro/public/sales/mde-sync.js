/* CarAdvance Sales Desk — mobile.de check (runs in a browser tab on suchen.mobile.de, morning and evening).
   mobile.de does not allow server-side downloads, so the scheduled check opens mobile.de in the team's browser
   and runs this script there:
     const K = '<key>'; const run = (0, eval)(await (await fetch('https://dev.caradvance.hu/api/desk/mde-script?key=' + K)).text());
     let r; do { r = await run(K); } while (!r.done && !r.blocked);   // each call works for ~35 s, then saves
   For every car it reads our own ad (price, net price, km) and the 3 competitors we follow; a competitor that is gone
   is replaced from the car's mobile.de search. Results go to /api/desk/mde-sync, which stores them with the date. */
(() => {
  const BASE = 'https://dev.caradvance.hu';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const num = s => (s == null ? null : Number(String(s).replace(/\./g, '').replace(',', '.')));
  async function ad(id) {
    let r;
    try { r = await fetch('/fahrzeuge/details.html?id=' + encodeURIComponent(id), { credentials: 'include' }); } catch (e) { return { id, ok: false, why: 'network' }; }
    if (!r.ok) return { id, ok: false, status: r.status };
    const h = await r.text();
    const doc = new DOMParser().parseFromString(h, 'text/html');
    const title = doc.title || '';
    const t = (doc.body ? doc.body.textContent : '').replace(/ /g, ' ');
    const price = num((title.match(/für ([\d.]+)\s*€/) || [])[1]);
    if (!price) return { id, ok: false, status: r.status, why: /captcha|Zugriff verweigert|access denied/i.test(h) ? 'blocked' : 'gone' };
    const pw = t.match(/(\d+)\s*kW\s*\((\d+)\s*PS\)/);
    return {
      id: String(id), ok: true, price, gross: price,
      net: num((t.match(/([\d.]+)\s*€\s*Netto/) || [])[1]),
      km: num((t.match(/Kilometerstand\s*([\d.]+)\s*km/) || [])[1]),
      fr: (t.match(/Erstzulassung\s*(\d{2}\/\d{4})/) || [])[1] || null,
      pw: pw ? `${pw[1]} kW (${pw[2]} PS)` : null,
      title: title.replace(/\s*\|\s*mobile\.de\s*$/, '').replace(/ in [^|]*? für [\d.]+\s*€$/, '').slice(0, 90),
      own: /Caradvance GmbH/i.test(t),
    };
  }
  async function searchIds(url) {
    try {
      const h = await (await fetch(url, { credentials: 'include' })).text();
      return [...new Set((h.match(/details\.html\?id=(\d+)/g) || []).map(x => x.split('=')[1]))];
    } catch (e) { return []; }
  }
  return async function run(K) {
    const st = (window.__mdeState ||= {});
    if (!st.plan) {
      const r = await fetch(BASE + '/api/desk/mde-plan?key=' + encodeURIComponent(K));
      if (!r.ok) throw new Error('plan ' + r.status);
      const j = await r.json();
      Object.assign(st, { plan: j.plan, i: 0, changed: [], blocked: 0, read: 0, gone: 0 });
    }
    const t0 = Date.now(), batch = [];
    while (st.i < st.plan.length && Date.now() - t0 < 35000) {
      const p = st.plan[st.i++], out = { id: p.id, ad: null, comps: [], extra: [] };
      if (p.ad) { out.ad = await ad(p.ad); await sleep(500); }
      for (const cid of p.comps) { const x = await ad(cid); out.comps.push(x); if (x.why === 'blocked') st.blocked++; else if (!x.ok) st.gone++; await sleep(500); }
      st.read += (p.ad ? 1 : 0) + p.comps.length;
      const okN = out.comps.filter(x => x.ok && !x.own).length;
      if (okN < 3 && p.comp_url) {
        const skip = new Set([...(p.comps || []), p.ad].filter(Boolean).map(String));
        for (const id of await searchIds(p.comp_url)) {
          if (out.extra.filter(x => x.ok && !x.own).length + okN >= 3) break;
          if (skip.has(id)) continue;
          const x = await ad(id); out.extra.push(x); await sleep(500);
        }
      }
      batch.push(out);
      if (st.blocked >= 5) break; // mobile.de shows a bot check — stop and report
    }
    if (batch.length) {
      const r = await fetch(BASE + '/api/desk/mde-sync?key=' + encodeURIComponent(K), { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ cars: batch }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error('sync ' + r.status + ' ' + (j.error || ''));
      (j.changed || []).forEach(c => st.changed.push(c));
    }
    const res = { done: st.i >= st.plan.length, processed: st.i, total: st.plan.length, read: st.read, gone: st.gone, blocked: st.blocked >= 5, changed: st.changed };
    if (res.done || res.blocked) delete window.__mdeState;
    return res;
  };
})();
