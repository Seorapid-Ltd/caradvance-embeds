// Egyszeri import: Mr. Job SK SK/CZ kereskedőlistája (2026-11-26) → Notion "Dealers".
// Minden sor: Introduced by = Mr. Job SK, Introduced on = 2026-11-26, Agent ref = MAIL-xxxx.
// Idempotens: a már meglévő Agent ref-eket kihagyja. Védve egy egyszeri kulccsal (csak a hash van itt).
// POST /api/desk-import  (fejléc: X-Import-Key)  törzs: [ {Company, Dealer ID, …}, … ] legfeljebb 80 sor
// Az adatok NEM kerülnek a (nyilvános) repóba – a hívó küldi őket. Az import után ezt a fájlt töröljük.

const KEY_SHA256 = '86ad3717b3e41df1d76574238b433aba2fa8895c29111de2435e1ed669d6fadb';
const DS = '4231b3fa-181e-81c3-a234-000b272b8bab';
const NV = '2025-09-03';

const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const txt = v => ({ rich_text: [{ type: 'text', text: { content: String(v).slice(0, 1900) } }] });

function props(p) {
  const o = { Company: { title: [{ type: 'text', text: { content: p.Company } }] } };
  for (const k of ['Dealer ID', 'Legal name', 'City', 'Reg. no.', 'Agent ref', 'Sources', 'Score reason', 'Notes']) if (p[k]) o[k] = txt(p[k]);
  for (const k of ['Country', 'Language', 'Status', 'Introduced by', 'Fit']) if (p[k]) o[k] = { select: { name: p[k] } };
  if (p.Score != null) o.Score = { number: p.Score };
  if (p.Website) o.Website = { url: p.Website };
  if (p.Email) o.Email = { email: p.Email };
  if (p.Phone) o.Phone = { phone_number: p.Phone };
  o['Introduced on'] = { date: { start: p['date:Introduced on:start'] || '2026-11-26' } };
  return o;
}

export async function onRequestPost({ request, env }) {
  const k = request.headers.get('X-Import-Key') || '';
  const h = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(k)));
  if (h !== KEY_SHA256) return new Response('Not found', { status: 404 });
  const token = env.DESK_NOTION_TOKEN || env.NOTION_TOKEN;
  if (!token) return Response.json({ error: 'no token' }, { status: 503 });
  const api = async (method, path, body) => {
    for (let i = 0; ; i++) {
      const r = await fetch('https://api.notion.com/v1' + path, { method, headers: { Authorization: `Bearer ${token}`, 'Notion-Version': NV, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      if ((r.status === 429 || r.status >= 500) && i < 4) { await new Promise(s => setTimeout(s, (Number(r.headers.get('Retry-After')) || 1.5) * 1000)); continue; }
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`Notion ${r.status}: ${j.message || ''}`);
      return j;
    }
  };
  const ROWS = await request.json().catch(() => null);
  if (!Array.isArray(ROWS) || ROWS.length > 80) return Response.json({ error: 'send 1–80 rows' }, { status: 400 });
  // meglévő Agent ref-ek
  const have = new Set(); let cursor;
  do {
    const j = await api('POST', `/data_sources/${DS}/query`, { page_size: 100, filter: { property: 'Introduced by', select: { equals: 'Mr. Job SK' } }, ...(cursor ? { start_cursor: cursor } : {}) });
    for (const p of j.results) { const r = p.properties?.['Agent ref']?.rich_text?.map(t => t.plain_text).join(''); if (r) have.add(r); }
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  const slice = ROWS.filter(p => p && p.Company && p['Agent ref'] && p['Introduced by'] === 'Mr. Job SK');
  let created = 0, skipped = 0; const errors = [];
  for (const p of slice) {
    if (have.has(p['Agent ref'])) { skipped++; continue; }
    try { await api('POST', '/pages', { parent: { type: 'data_source_id', data_source_id: DS }, properties: props(p) }); created++; }
    catch (e) {
      // hibás e-mail / URL esetén próbáljuk újra ezek nélkül
      try { const q = { ...p }; delete q.Email; delete q.Website; q.Notes = [p.Notes, p.Email && 'E-mail: ' + p.Email, p.Website && 'Web: ' + p.Website].filter(Boolean).join(' ');
        await api('POST', '/pages', { parent: { type: 'data_source_id', data_source_id: DS }, properties: props(q) }); created++; }
      catch (e2) { errors.push({ ref: p['Agent ref'], error: String(e2.message || e2) }); }
    }
  }
  return Response.json({ sent: ROWS.length, created, skipped, errors, have: have.size });
}
