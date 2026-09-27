import { store } from "./store.js";
function mask(l) {
  const w = String(l.whatsapp || "");
  return { ...l, whatsapp: w.length > 4 ? "\u2022\u2022\u2022" + w.slice(-4) : "\u2022\u2022\u2022" };
}
export default async function handler(req, res) {
  const pin = process.env.ADMIN_PIN;
  const admin = pin && req.headers["x-admin-pin"] === pin;
  const leads = store().leads.map((l) => (admin ? l : mask(l)));
  res.status(200).json({ ok: true, leads });
}
