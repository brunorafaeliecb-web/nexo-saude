import { isAdmin, issueSession, clearSession, checkOrigin } from "./_admin-auth.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") { res.status(200).json({ ok: true, authenticated: isAdmin(req) }); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  if (!checkOrigin(req)) { res.status(403).json({ ok: false, error: "Invalid origin" }); return; }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (body.action === "logout") { clearSession(res); res.status(200).json({ ok: true }); return; }
  if (body.action !== "login" || typeof body.pin !== "string" || body.pin.length > 256) { res.status(400).json({ ok: false }); return; }
  if (!isAdmin({headers:{"x-admin-pin":body.pin}}) || !issueSession(res)) {
    res.status(401).json({ ok: false, error: "Unauthorized or server session not configured" }); return;
  }
  res.status(200).json({ ok: true, authenticated: true });
}
