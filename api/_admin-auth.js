import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "nexo_admin_session";
const TTL_SECONDS = 60 * 60 * 4;

function equal(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function signature(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function isAdmin(req) {
  const pin = process.env.ADMIN_PIN;
  if (!pin) return false;
  if (equal(req.headers?.["x-admin-pin"], pin)) return true; // server-to-server compatibility only
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const cookies = String(req.headers?.cookie || "").split(";").map(x => x.trim());
  const cookie = cookies.find(x => x.startsWith(COOKIE + "="));
  if (!cookie) return false;
  const [expires, mac] = cookie.slice(COOKIE.length + 1).split(".");
  if (!expires || !mac || !/^\d{10,13}$/.test(expires)) return false;
  const now = Date.now();
  const expiry = Number(expires);
  if (!Number.isSafeInteger(expiry) || expiry < now || expiry > now + TTL_SECONDS * 1000) return false;
  return equal(mac, signature(expires, secret));
}

export function issueSession(res) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const expires = String(Date.now() + TTL_SECONDS * 1000);
  const token = expires + "." + signature(expires, secret);
  res.setHeader("Set-Cookie", COOKIE + "=" + token + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + TTL_SECONDS);
  res.setHeader("Cache-Control", "no-store");
  return true;
}

export function clearSession(res) {
  res.setHeader("Set-Cookie", COOKIE + "=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
  res.setHeader("Cache-Control", "no-store");
}

export function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  res.status(401).json({ ok: false, error: "Unauthorized" });
  return false;
}

export function checkOrigin(req) {
  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (!origin || !host) return false;
  try { const u = new URL(origin); return u.host === host && u.protocol === "https:"; }
  catch { return false; }
}
