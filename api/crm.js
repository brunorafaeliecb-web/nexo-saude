import { store, STAGES } from "./store.js";
import { checklist, dossierOf } from "./parse.js";
function digits(v) { return String(v || "").replace(/\D/g, ""); }
export default async function handler(req, res) {
  const s = store();
  if (!s.messages) s.messages = [];
  if (req.method === "GET") {
    const leads = s.leads.map((l) => {
      const items = checklist(l);
      const ready = items.filter((i) => i.ready).length;
      return {
        ...l,
        stage: l.stage || "novo",
        dossier: dossierOf(l),
        files: l.files || {},
        checklist: items,
        docsReady: ready,
        docsTotal: items.length,
        messages: s.messages.filter((m) => m.leadId === l.id || digits(m.phone) === digits(l.whatsapp)),
      };
    });
    res.status(200).json({ ok: true, stages: STAGES, leads });
    return;
  }
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const lead = s.leads.find((l) => l.id === String(body.id));
  if (!lead) { res.status(404).json({ ok: false, error: "Lead nao encontrado" }); return; }
  if (!lead.dossier) lead.dossier = dossierOf(lead);
  if (!lead.files) lead.files = {};
  if (body.stage && STAGES.includes(body.stage)) lead.stage = body.stage;
  if (body.dossier && typeof body.dossier === "object") {
    lead.dossier = { ...lead.dossier, ...body.dossier };
    if (body.dossier.nome) lead.nome = body.dossier.nome;
    if (body.dossier.cidade) lead.cidade = body.dossier.cidade;
    if (body.dossier.whatsapp) lead.whatsapp = body.dossier.whatsapp;
  }
  if (body.file && body.file.id) {
    lead.files[body.file.id] = { name: body.file.name || body.file.id, at: new Date().toISOString(), note: body.file.note || "recebido" };
  }
  if (body.note) {
    s.messages.push({ id: "n" + Date.now(), leadId: lead.id, phone: lead.whatsapp, dir: "note", text: body.note, at: new Date().toISOString() });
  }
  res.status(200).json({ ok: true, lead, checklist: checklist(lead) });
}
