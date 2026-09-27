import { store } from "./store.js";
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const s = store();
  const lead = {
    id: String(s.seq++),
    status: "aberto",
    receivedAt: new Date().toISOString(),
    wl: body.wl || null,
    nome: body.nome || "",
    whatsapp: body.whatsapp || "",
    cidade: body.cidade || "",
    tipo: body.tipo || "individual",
    vidas: body.vidas || "1",
  };
  s.leads.unshift(lead);
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "nexo-saude", ...lead }) });
    } catch (e) { console.error(e); }
  }
  res.status(200).json({ ok: true, id: lead.id });
}
