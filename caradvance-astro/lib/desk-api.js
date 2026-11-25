// CarAdvance Sales Desk — API between the desk page and Notion (the master copy).
// Runs as a Cloudflare Pages Function: functions/api/desk/[[path]].js. The page is /sales/ (functions/sales/_middleware.js).
// Sign-in: the existing staff login (/admin/, ca_session cookie, D1 "DB" sessions + users) — any staff role.
//
// Environment:
//   DESK_NOTION_TOKEN   secret  — Notion internal integration token, connected to the "CarAdvance Sales Desk" page
//                                 (falls back to NOTION_TOKEN if that integration is in the same workspace)
//   DB                  D1      — already bound (staff accounts)
//   DESK_DEV_NO_ACCESS  var     — "1" only for local testing; never set in Cloudflare
//
// Routes:
//   GET  /api/desk/data   → { vehicles, dealers, outreach, me }
//   POST /api/desk/write  { op: "set"|"update"|"delete", path: "dealers/HU-abn", data: {...}, prev: {...} }
//        prev = the values the user saw for each field being changed. If Notion now holds something
//        different for any of those fields, nothing is written and 409 returns the current record.

const NOTION = 'https://api.notion.com/v1';
const NOTION_VERSION = '2025-09-03';
export const DS = {
  vehicles: '4231b3fa-181e-81d1-a613-000bedd39111',
  dealers: '4231b3fa-181e-81c3-a234-000b272b8bab',
  outreach: '4231b3fa-181e-8101-a561-000b28a6a538',
};
const CACHE_SECONDS = 15;

/* ---------------- field maps: desk field → [Notion property, type] ---------------- */
export const MAP = {
  vehicles: {
    id: ['Stock ID', 'text'], model: ['Car', 'title'], category: ['Category', 'select'], make: ['Make', 'select'],
    status: ['Status', 'select'], status_changed: ['Status changed', 'date'], vin: ['VIN', 'text'], plate: ['Plate', 'text'],
    first_reg: ['First reg', 'text'], mileage: ['Mileage km', 'number'], km_text: ['Mileage note', 'text'],
    colour: ['Colour', 'text'], interior: ['Interior', 'text'], power: ['Power', 'text'], fuel: ['Fuel', 'text'],
    transmission: ['Transmission', 'text'], drive: ['Drive', 'text'], dealer_net: ['B2B', 'number'],
    dealer_gross: ['B2C', 'number'], msrp_gross: ['List price new', 'number'], asking_price: ['Asking price', 'number'],
    min_price: ['Minimum price', 'number'], available_until: ['Available until', 'date'], highlights: ['Highlights', 'list'],
    source: ['Source', 'text'], data_gaps: ['Data gaps', 'text'], reserved_for: ['Reserved for', 'text'], notes: ['Notes', 'text'],
    updated: ['Updated', 'readonly_edited'],
  },
  dealers: {
    id: ['Dealer ID', 'text'], name: ['Company', 'title'], legal_name: ['Legal name', 'text'], reg_no: ['Reg. no.', 'text'],
    country: ['Country', 'select'], city: ['City', 'text'], address: ['Address', 'text'], website: ['Website', 'url'],
    tier: ['Type', 'tier'], brands: ['Brands', 'text'], premium_stock: ['Premium stock', 'number'], fit: ['Fit', 'select'],
    email: ['Email', 'email'], phone: ['Phone', 'phone'], contact_name: ['Contact person', 'text'],
    contact_title: ['Contact title', 'text'], contact_email: ['Contact email', 'email'], contact_phone: ['Contact phone', 'phone'],
    language: ['Language', 'select'], score: ['Score', 'number'], score_reason: ['Score reason', 'text'],
    status: ['Status', 'select'], owner: ['Owner', 'text'], last_contact: ['Last contact', 'date'], sources: ['Sources', 'text'],
    notes: ['Notes', 'text'], updated: ['Updated', 'readonly_edited'],
  },
  outreach: {
    date: ['Date', 'date'], dealer: ['Dealer', 'dealer_rel'], cars: ['Cars (as typed)', 'text'], channel: ['Channel', 'select'],
    direction: ['Direction', 'select'], member: ['Team member', 'text'], outcome: ['Outcome', 'select'],
    next_step: ['Next step', 'text'], follow_up: ['Follow-up', 'date'], notes: ['Notes', 'text'],
    log_no: ['Log ID', 'readonly_uid'], logged: ['Logged', 'readonly_created'],
  },
};
export const VAT = 0.19;
export const b2c = net => Math.round(Number(net) * (1 + VAT) * 100) / 100;
const TIERS = { 1: '1 BMW/MINI dealer', 2: '2 Premium used', 3: '3 Trader/importer' };

/* ---------------- Notion value ⇄ desk value ---------------- */
const plain = arr => (arr || []).map(t => t.plain_text ?? t.text?.content ?? '').join('');
function readProp(p, type) {
  if (!p) return undefined;
  switch (type) {
    case 'title': return plain(p.title) || undefined;
    case 'text': case 'list': {
      const s = plain(p.rich_text); if (!s) return undefined;
      return type === 'list' ? s.split(/;\s*/).map(x => x.trim()).filter(x => x && x !== '…') : s;
    }
    case 'number': return p.number ?? undefined;
    case 'select': return p.select?.name ?? undefined;
    case 'tier': { const n = parseInt(p.select?.name, 10); return isNaN(n) ? undefined : n; }
    case 'date': return p.date?.start ?? undefined;
    case 'email': return p.email ?? undefined;
    case 'phone': return p.phone_number ?? undefined;
    case 'url': return p.url ?? undefined;
    case 'readonly_edited': return p.last_edited_time?.slice(0, 10);
    case 'readonly_created': return p.created_time;
    case 'readonly_uid': return p.unique_id?.number ?? undefined;
    case 'dealer_rel': return p.relation?.[0]?.id; // page id — translated to Dealer ID by the caller
  }
}
const chunks = s => { const out = []; for (let i = 0; i < s.length; i += 1900) out.push({ type: 'text', text: { content: s.slice(i, i + 1900) } }); return out; };
function writeProp(type, v) {
  const empty = v === null || v === undefined || v === '';
  switch (type) {
    case 'title': return { title: empty ? [] : chunks(String(v)) };
    case 'text': return { rich_text: empty ? [] : chunks(String(v)) };
    case 'list': return { rich_text: empty ? [] : chunks(Array.isArray(v) ? v.join('; ') : String(v)) };
    case 'number': { if (empty) return { number: null }; const n = Number(v); if (isNaN(n)) throw bad(`"${v}" is not a number`); return { number: n }; }
    case 'select': return { select: empty ? null : { name: String(v) } };
    case 'tier': return { select: empty ? null : { name: TIERS[v] || String(v) } };
    case 'date': return { date: empty ? null : { start: String(v).slice(0, 10) } };
    case 'email': return { email: empty ? null : String(v) };
    case 'phone': return { phone_number: empty ? null : String(v) };
    case 'url': return { url: empty ? null : String(v) };
  }
  return undefined; // read-only and unknown types are skipped
}

export function pageToDoc(col, page, idx) {
  const d = { _pid: page.id };
  for (const [k, [prop, type]] of Object.entries(MAP[col])) {
    const v = readProp(page.properties?.[prop], type);
    if (v !== undefined) d[k] = v;
  }
  if (col === 'vehicles') {
    if (d.source) d.price_source = d.source;
    // Rule: B2B is the dealer price without VAT. If B2C is missing, it is B2B + 19% VAT.
    if (d.dealer_net != null && d.dealer_gross == null) { d.dealer_gross = b2c(d.dealer_net); d.b2c_generated = true; }
    if (d.dealer_gross && d.msrp_gross) d.pct_vs_list = Math.round((d.dealer_gross / d.msrp_gross - 1) * 1000) / 10;
  }
  if (col === 'outreach') {
    d.id = page.id;
    if (d.dealer && idx) d.dealer = idx.dealerByPid[d.dealer] || d.dealer;
    if (!d.cars && idx) {
      const ids = (page.properties?.Cars?.relation || []).map(r => idx.vehicleByPid[r.id]).filter(Boolean);
      if (ids.length) d.cars = ids.join(', ');
    }
  }
  return d;
}

/* ---------------- Notion HTTP ---------------- */
function bad(msg, status = 400) { const e = new Error(msg); e.status = status; return e; }
async function notion(env, method, path, body) {
  const token = env.DESK_NOTION_TOKEN || env.NOTION_TOKEN;
  if (!token) throw bad('The desk is not connected to Notion yet (DESK_NOTION_TOKEN is missing).', 503);
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(NOTION + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 429 && attempt < 3) { await new Promise(res => setTimeout(res, (Number(r.headers.get('Retry-After')) || 1) * 1000)); continue; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw bad(`Notion: ${j.message || r.status}`, r.status === 404 ? 404 : 502);
    return j;
  }
}
async function queryAll(env, ds) {
  const out = []; let cursor;
  do {
    const j = await notion(env, 'POST', `/data_sources/${ds}/query`, { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) });
    out.push(...j.results.filter(p => !p.in_trash && !p.archived)); cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}

/* ---------------- data snapshot (shared cache, short TTL) ---------------- */
let memo = null; // per-isolate
async function loadAll(env, ctx, fresh) {
  if (!fresh && memo && Date.now() - memo.t < CACHE_SECONDS * 1000) return memo.data;
  const [vp, dp, op] = await Promise.all([queryAll(env, DS.vehicles), queryAll(env, DS.dealers), queryAll(env, DS.outreach)]);
  const idx = { dealerByPid: {}, vehicleByPid: {}, dealerPid: {}, vehiclePid: {}, vehicleCat: {} };
  const vehicles = vp.map(p => pageToDoc('vehicles', p)).filter(d => d.id);
  const dealers = dp.map(p => pageToDoc('dealers', p)).filter(d => d.id);
  vehicles.forEach(d => { idx.vehicleByPid[d._pid] = d.id; idx.vehiclePid[d.id] = d._pid; (idx.vehicleCat[d.category] ||= []).push(d._pid); });
  dealers.forEach(d => { idx.dealerByPid[d._pid] = d.id; idx.dealerPid[d.id] = d._pid; });
  const outreach = op.map(p => pageToDoc('outreach', p, idx));
  const data = { vehicles, dealers, outreach, idx };
  memo = { t: Date.now(), data };
  return data;
}

/* ---------------- who is signed in (staff login: /admin/, ca_session cookie) ---------------- */
function cookie(request, name) {
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const k = part.indexOf('='); if (k > 0 && part.slice(0, k).trim() === name) return decodeURIComponent(part.slice(k + 1).trim());
  }
  return null;
}
/** users.desk_access (0/1): who may open the Sales Desk. Added on first use, so no separate migration is needed. */
let DESK_COL = false;
export async function ensureDeskColumn(env) {
  if (DESK_COL || !env.DB) return;
  try { await env.DB.prepare('ALTER TABLE users ADD COLUMN desk_access INTEGER DEFAULT 0').run(); } catch (e) { /* already there */ }
  DESK_COL = true;
}

export async function whoAmI(request, env) {
  if (env.DESK_DEV_NO_ACCESS === '1') return { email: request.headers.get('x-dev-email') || 'dev@localhost', name: 'Dev' };
  const token = cookie(request, 'ca_session');
  if (!token || !env.DB) throw bad('Sign-in required.', 401);
  await ensureDeskColumn(env);
  const row = await env.DB.prepare('SELECT u.email, u.name, u.role, u.desk_access, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').bind(token).first();
  if (!row || new Date(row.expires_at + 'Z').getTime() < Date.now()) throw bad('Sign-in required.', 401);
  // Only the people given Sales Desk access (Admin → Felhasználók → "Sales Desk"), and every "Csak Sales Desk" account.
  if (!(row.role === 'sales_desk' || Number(row.desk_access) === 1)) throw bad('This account has no access to the Sales Desk.', 403);
  return { email: row.email, name: row.name, role: row.role };
}

/* ---------------- writes ---------------- */
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null) || String(a ?? '') === String(b ?? '');
function toProps(col, data, idx) {
  const props = {};
  for (const [k, v] of Object.entries(data)) {
    const m = MAP[col][k]; if (!m) continue;
    const [prop, type] = m;
    if (type === 'dealer_rel') { const pid = idx.dealerPid[v]; if (v && !pid) throw bad(`Unknown dealer "${v}"`); props[prop] = { relation: pid ? [{ id: pid }] : [] }; continue; }
    const w = writeProp(type, v); if (w) props[prop] = w;
  }
  if (col === 'outreach' && 'cars' in data) props.Cars = { relation: carsToRelation(data.cars, idx) };
  return props;
}
function carsToRelation(text, idx) {
  const pids = new Set(); const s = String(text || '');
  for (const id of s.match(/\b(?:P1|P2|S26|V)-\d{1,2}\b/gi) || []) { const pid = idx.vehiclePid[id.toUpperCase()]; if (pid) pids.add(pid); }
  for (const [cat, list] of Object.entries(idx.vehicleCat)) if (cat && s.toLowerCase().includes(cat.toLowerCase())) list.forEach(p => pids.add(p));
  return [...pids].slice(0, 100).map(id => ({ id }));
}

async function write(env, ctx, me, body) {
  const { op, path, data = {}, prev = {} } = body || {};
  const [col, docId] = String(path || '').split('/');
  if (!MAP[col] || !docId) throw bad('Unknown record.');
  const all = await loadAll(env, ctx, true); // always check against fresh data before writing
  const list = all[col];
  const cur = col === 'outreach' ? list.find(d => d.id === docId) : list.find(d => d.id === docId);

  if (op === 'delete') {
    if (!cur) return { ok: true };
    if (col !== 'outreach') throw bad('Cars and dealers can only be removed in Notion.', 403);
    await notion(env, 'PATCH', `/pages/${cur._pid}`, { in_trash: true });
    memo = null; return { ok: true };
  }

  if (cur && (op === 'update' || op === 'set')) {
    const changed = Object.keys(data).filter(k => k in prev && !same(cur[k], prev[k]));
    if (changed.length) { const e = bad('Someone else changed this while you were editing. The latest version is now shown — check it and save again.', 409); e.current = cur; e.fields = changed; throw e; }
    if (col === 'vehicles' && 'dealer_net' in data && !('dealer_gross' in data) && (cur.dealer_gross == null || cur.b2c_generated || Math.abs(Number(cur.dealer_gross) - b2c(cur.dealer_net)) <= 1))
      data.dealer_gross = data.dealer_net == null || data.dealer_net === '' ? null : b2c(data.dealer_net);
    if (col === 'vehicles' && cur.b2c_generated && !('dealer_gross' in data)) data.dealer_gross = cur.dealer_gross; // write the generated B2C into Notion
    const props = toProps(col, data, all.idx);
    if (col === 'outreach' && !data.member && !cur.member) props['Team member'] = writeProp('text', me.name || nameOf(me.email));
    if (!Object.keys(props).length) return { ok: true, doc: cur };
    const page = await notion(env, 'PATCH', `/pages/${cur._pid}`, { properties: props });
    memo = null; return { ok: true, doc: pageToDoc(col, page, all.idx) };
  }

  // create
  if (col === 'vehicles') throw bad('New cars are added in Notion.', 403);
  if (col === 'dealers' && all.dealers.some(d => d.id === docId)) throw bad('A dealer with this ID already exists.', 409);
  const full = col === 'dealers' ? { ...data, id: docId, status: data.status || 'New' } : { ...data };
  if (col === 'outreach' && !full.member) full.member = me.name || nameOf(me.email);
  const props = toProps(col, full, all.idx);
  if (col === 'outreach') {
    const dn = all.dealers.find(d => d.id === full.dealer)?.name || full.dealer || 'dealer';
    props.Summary = writeProp('title', `${full.outcome || full.channel || 'Contact'} — ${dn}`);
    props.Direction ||= writeProp('select', 'Outgoing');
  }
  const page = await notion(env, 'POST', '/pages', { parent: { type: 'data_source_id', data_source_id: DS[col] }, properties: props });
  memo = null; return { ok: true, doc: pageToDoc(col, page, all.idx) };
}
const nameOf = email => { const n = (email || '').split('@')[0].split(/[._-]/)[0]; return n ? n[0].toUpperCase() + n.slice(1) : ''; };

/* ---------------- entry ---------------- */
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
/** Fields anyone may see without signing in (both prices included, by decision of 25 Nov 2026).
 *  Never public: plate, data gaps, price source, notes, minimum/asking price, reserved-for, edit history. Sold cars are left out. */
export const PUBLIC_FIELDS = ['id', 'make', 'model', 'category', 'colour', 'interior', 'first_reg', 'mileage', 'km_text', 'power', 'fuel', 'transmission', 'drive',
  'highlights', 'msrp_gross', 'dealer_net', 'dealer_gross', 'pct_vs_list', 'status', 'available_until', 'vin'];
export function publicCar(v) {
  const o = {};
  for (const k of PUBLIC_FIELDS) if (v[k] != null && v[k] !== '') o[k] = v[k];
  return o;
}

export async function handle(request, env, ctx) {
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/desk\/?/, '');
  if (request.method === 'GET' && route === 'public') {
    try {
      const { vehicles } = await loadAll(env, ctx, false);
      return json({ vehicles: vehicles.filter(v => (v.status || 'Available') !== 'Sold').map(publicCar), public: true, at: new Date().toISOString() });
    } catch (e) { return json({ error: 'Could not load the cars.' }, 503); }
  }
  try {
    const me = await whoAmI(request, env);
    if (request.method === 'GET' && route === 'data') {
      const { vehicles, dealers, outreach } = await loadAll(env, ctx, url.searchParams.has('fresh'));
      return json({ vehicles, dealers, outreach, me: { email: me.email, name: me.name || nameOf(me.email) }, at: new Date().toISOString() });
    }
    if (request.method === 'POST' && route === 'write') {
      if (request.headers.get('Origin') && new URL(request.headers.get('Origin')).host !== url.host) throw bad('Cross-site request refused.', 403);
      return json(await write(env, ctx, me, await request.json()));
    }
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: e.message || 'Error', current: e.current, fields: e.fields }, e.status || 500);
  }
}
