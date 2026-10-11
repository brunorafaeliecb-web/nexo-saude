import { store } from "./store.js";
function mask(l) {
  const w = String(l.whatsapp || "");
  return { ...l, whatsapp: w.length > 4 ? "\u2022\u2022\u2022" + w.slice(-4) : "\u2022\u2022\u2022" };
}
export default async function handler(req, res) {
  // Privileged CRM/queue endpoint: deny by default if not configured.
  const configuredPin = process.env.ADMIN_PIN;
  if (!configuredPin || req.headers?.["x-admin-pin"] !== configuredPin) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const pin = process.env.ADMIN_PIN;
  const admin = pin && req.headers["x-admin-pin"] === pin;
  const leads = store().leads.map((l) => (admin ? l : mask(l)));
  res.status(200).json({ ok: true, leads });
}
