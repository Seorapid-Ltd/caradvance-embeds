// The Sales Desk moved from /admin/desk/ to /sales/ (25 Nov 2026) — keep old links working.
export const onRequest = ({ request }) => Response.redirect(new URL('/sales/', request.url).toString(), 301);
