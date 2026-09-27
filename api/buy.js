import { store, priceOf } from "./store.js";
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const s = store();
  const lead = s.leads.find((l) => l.id === String(body.id));
  if (!lead) { res.status(404).json({ ok: false, error: "Lead sumiu" }); return; }
  if (lead.status !== "aberto") { res.status(409).json({ ok: false, error: "Ja vendido" }); return; }
  lead.status = "vendido";
  lead.soldAt = new Date().toISOString();
  lead.buyer = body.corretor || {};
  lead.price = priceOf(lead.tipo);
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    try { await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "lead_sold", ...lead }) }); } catch (e) {}
  }
  res.status(200).json({ ok: true, lead });
}
