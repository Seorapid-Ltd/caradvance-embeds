/**
 * CarAdvance /belso — belépés e-mail kóddal (jelszó nélkül), meglévő munkatársaknak.
 * Útvonal: /api/belso-kod/*     D1: DB (users + sessions táblák, ugyanaz mint a /belso-é)
 *
 *   POST /api/belso-kod/kod      {email}          → 6 jegyű kód e-mailben, ha a cím a Felhasználók között van
 *   POST /api/belso-kod/belepes  {email, code}    → ugyanaz a ca_session süti, mint jelszavas belépésnél
 *
 * A válasz mindig ugyanaz (nem árulja el, hogy egy cím munkatársi fiók-e). Kód: 10 perc, max. 5 próbálkozás.
 */
import { rateOk, sha256hex, randomHex, randomCode, normEmail, emailShell, sendMail } from '../../../lib/fiok.js';

const SESSION_DAYS = 30;
const CODE_MIN = 10;
let READY = false;

export async function onRequest(context) {
  const { request, env, params } = context;
  if (!env.DB) return json({ error: 'not_configured' }, 501);
  const route = [].concat(params.path || []).join('/');
  if (request.method !== 'POST' || !/application\/json/i.test(request.headers.get('content-type') || '')) return json({ error: 'not_found' }, 404);
  try {
    if (!READY) {
      await env.DB.batch([
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS staff_codes (email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER DEFAULT 0)`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS cust_rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, win INTEGER NOT NULL)`)
      ]);
      READY = true;
    }
    const b = await body(request);
    const email = normEmail(b.email);
    if (!email) return json({ error: 'Adj meg egy érvényes e-mail címet.' }, 400);
    const ip = request.headers.get('cf-connecting-ip') || 'x';

    if (route === 'kod') {
      if (!(await rateOk(env, 'sip:' + ip, 15, 3600)) || !(await rateOk(env, 'sem:' + email, 5, 3600))) return json({ error: 'Túl sok kérés. Próbáld újra később.' }, 429);
      const user = await env.DB.prepare(`SELECT id, name FROM users WHERE lower(email) = ?`).bind(email).first();
      if (user && env.RESEND_API_KEY) {
        const code = randomCode();
        await env.DB.prepare(`INSERT INTO staff_codes (email, code_hash, expires_at, attempts) VALUES (?, ?, ?, 0) ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0`)
          .bind(email, await sha256hex('staff|' + email + '|' + code), Math.floor(Date.now() / 1000) + CODE_MIN * 60).run();
        const host = new URL(request.url).hostname, L = /caradvance\.sk$/.test(host) ? 'sk' : /caradvance\.cz$/.test(host) ? 'cs' : 'hu';
        const T = {
          hu: ['Belépés a CarAdvance belső felületre', 'A belső felületre ezzel a kóddal léphetsz be:', `A kód ${CODE_MIN} percig érvényes. Ha nem te kérted, hagyd figyelmen kívül ezt az e-mailt.`, 'Belépési kód: '],
          sk: ['Prihlásenie do internej zóny CarAdvance', 'Do internej zóny sa prihlásite týmto kódom:', `Kód platí ${CODE_MIN} minút. Ak ste oň nežiadali, tento e-mail ignorujte.`, 'Prihlasovací kód: '],
          cs: ['Přihlášení do interní zóny CarAdvance', 'Do interní zóny se přihlásíte tímto kódem:', `Kód platí ${CODE_MIN} minut. Pokud jste o něj nežádali, tento e-mail ignorujte.`, 'Přihlašovací kód: ']
        }[L];
        const html = emailShell(`<p style="margin:0 0 6px;font-size:18px;font-weight:bold">${T[0]}</p>
          <p style="margin:0 0 18px;color:#4b5563">${T[1]}</p>
          <div style="font:bold 34px/1 'Courier New',monospace;letter-spacing:10px;background:#f4f7fb;border:1px solid #e6eaf1;border-radius:12px;padding:18px 0;text-align:center;color:#0b2a4a">${code}</div>
          <p style="margin:18px 0 0;color:#6b7280;font-size:13px">${T[2]}</p>`, '');
        await sendMail(env, email, T[3] + code, html, T[3] + code + '\n' + T[2]);
      }
      return json({ ok: true });
    }

    if (route === 'belepes') {
      const code = String(b.code || '').replace(/\D/g, '');
      const row = await env.DB.prepare(`SELECT * FROM staff_codes WHERE email = ?`).bind(email).first();
      const now = Math.floor(Date.now() / 1000);
      if (!row || row.expires_at < now || code.length !== 6) return json({ error: 'A kód hibás vagy lejárt. Kérj újat.' }, 400);
      if (row.attempts >= 5) return json({ error: 'Túl sok próbálkozás. Kérj új kódot.' }, 429);
      if ((await sha256hex('staff|' + email + '|' + code)) !== row.code_hash) {
        await env.DB.prepare(`UPDATE staff_codes SET attempts = attempts + 1 WHERE email = ?`).bind(email).run();
        return json({ error: 'Hibás kód.' }, 400);
      }
      await env.DB.prepare(`DELETE FROM staff_codes WHERE email = ?`).bind(email).run();
      const user = await env.DB.prepare(`SELECT id, email, name, role FROM users WHERE lower(email) = ?`).bind(email).first();
      if (!user) return json({ error: 'A kód hibás vagy lejárt. Kérj újat.' }, 400);
      const token = randomHex(32);
      const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000).toISOString().slice(0, 19);
      await env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).bind(token, user.id, expiresAt).run();
      return json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, 200, {
        'Set-Cookie': `ca_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`
      });
    }
    return json({ error: 'not_found' }, 404);
  } catch (e) {
    return json({ error: 'Szerverhiba.' }, 500);
  }
}

async function body(request) {
  try { const t = await request.text(); return t.length > 5000 ? {} : (JSON.parse(t) || {}); } catch (e) { return {}; }
}
function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
}
