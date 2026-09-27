import { store, STAGES } from "./store.js";
function digits(v){return String(v||"").replace(/\D/g,"");}
export default async function handler(req, res) {
  const s = store();
  if (req.method === "GET") {
    const leads = s.leads.map((l) => ({
      ...l,
      stage: l.stage || "novo",
      messages: s.messages.filter((m) => m.leadId === l.id || digits(m.phone) === digits(l.whatsapp)),
      tasks: s.tasks.filter((t) => t.leadId === l.id && !t.done),
    }));
    res.status(200).json({ ok: true, stages: STAGES, leads });
    return;
  }
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const lead = s.leads.find((l) => l.id === String(body.id));
  if (!lead) { res.status(404).json({ ok: false, error: "Lead nao encontrado" }); return; }
  if (body.stage && STAGES.includes(body.stage)) lead.stage = body.stage;
  if (body.note) s.messages.push({ id: "n"+Date.now(), leadId: lead.id, phone: lead.whatsapp, dir: "note", text: body.note, at: new Date().toISOString() });
  if (body.followupAt) s.tasks.push({ id: "t"+Date.now(), leadId: lead.id, text: body.followupText || "Follow-up WhatsApp", at: body.followupAt, done: false });
  res.status(200).json({ ok: true, lead });
}
