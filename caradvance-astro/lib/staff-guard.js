/**
 * "Csak Sales Desk" jogosultság (role = 'sales_desk').
 *
 * Az ilyen fiók a /sales/ felületet használhatja, a belső CRM-et (/admin, /belso és az
 * adataikat kiszolgáló /api/... végpontok) nem. A gyökér _middleware.js minden kérés elején hívja.
 *
 * Engedett: belépés / kilépés / /me / belépő link / e-mail kód, /api/desk/*, /sales/*.
 * Tiltott: minden más /api/belso…, /api/fiok-admin, /api/szerzodes-admin,
 * valamint a /belso/* és /admin/* szerveroldali oldalai (pl. Ajánlatmotor).
 */

export const DESK_ROLE = 'sales_desk';

const API_BLOCK = /^\/api\/(belso|belso-crm|belso-notion|belso-penzugy|fiok-admin|szerzodes-admin)(\/|$)/;
const API_ALLOW = /^\/api\/belso\/(login|logout|me|link(\/open)?)$/;
const PAGE_BLOCK = /^\/(belso|admin)\/./; // a /admin/ belépő oldal maga szabad (az irányít tovább a /sales/-re)

function sessionToken(request) {
  const m = /(?:^|;\s*)ca_session=([^;]+)/.exec(request.headers.get('Cookie') || '');
  return m ? decodeURIComponent(m[1]) : '';
}

/** Response, ha a kérést meg kell állítani; különben null. */
export async function deskGuard(request, env) {
  const p = new URL(request.url).pathname;
  const isApi = API_BLOCK.test(p) && !API_ALLOW.test(p);
  const isPage = !isApi && PAGE_BLOCK.test(p);
  if (!isApi && !isPage) return null;
  const token = sessionToken(request);
  if (!token || !env.DB) return null;
  const row = await env.DB.prepare(`SELECT u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).bind(token).first();
  if (!row || row.role !== DESK_ROLE) return null;
  if (isApi) {
    return new Response(JSON.stringify({ error: 'Ez a fiók csak a Sales Desket érheti el.', desk_only: true }), {
      status: 403, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    });
  }
  return new Response(null, { status: 302, headers: { Location: '/sales/', 'cache-control': 'no-store' } });
}
