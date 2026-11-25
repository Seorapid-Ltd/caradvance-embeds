// CarAdvance Sales Desk API — /api/desk/data, /api/desk/write → Notion (cars, dealers, contact log).
// Staff only (ca_session). Code and field map: lib/desk-api.js.
import { handle } from '../../../lib/desk-api.js';
export const onRequest = ({ request, env, waitUntil }) => handle(request, env, { waitUntil });
