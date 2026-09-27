import { store } from "./store.js";
const SCRIPT = {
  novo: "Ola, {nome}! Atendimento NEXO SAUDE. Para cotar: cidade, tipo (individual/familiar/empresa) e quantas vidas. Sem dado de saude por aqui.",
  qualificando: "Perfeito. Qual faixa de valor mensal cabe no orcamento?",
  cotacao: "Vou passar para um corretor habilitado da sua cidade.",
  proposta: "Proposta no texto. O corretor explica no audio se quiser.",
  aguardando: "Ainda faz sentido seguir com a cotacao esta semana?"
};
function digits(v){return String(v||"").replace(/\D/g,"");}
export default async function handler(req, res) {
  const s = store();
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (req.method === "GET") { res.status(200).json({ ok: true, hook: "POST Evolution -> /api/whatsapp" }); return; }
  const remote = body?.data?.key?.remoteJid || body.phone || "";
  const text = body?.data?.message?.conversation || body?.data?.message?.extendedTextMessage?.text || body.text || "";
  const phone = String(remote).replace(/\D/g,"");
  let lead = s.leads.find((l) => digits(l.whatsapp).endsWith(phone.slice(-8)));
  if (!lead) {
    lead = { id: String(s.seq++), status: "aberto", stage: "novo", receivedAt: new Date().toISOString(), nome: body.pushName || "WhatsApp", whatsapp: phone, cidade: "", tipo: "individual", vidas: "1", source: "whatsapp" };
    s.leads.unshift(lead);
  }
  s.messages.push({ id: "m"+Date.now(), leadId: lead.id, phone, dir: "in", text: String(text), at: new Date().toISOString() });
  const t = String(text).toLowerCase();
  if (/nao quero|desisto|parar/.test(t)) lead.stage = "perdido";
  else if (/fechei|contratei/.test(t)) lead.stage = "ganho";
  else if (/\b(rj|sp|rio|empresa|pme|familiar|individual|vida)/.test(t)) lead.stage = "qualificando";
  const reply = (SCRIPT[lead.stage] || SCRIPT.novo).replace("{nome}", lead.nome || "");
  s.messages.push({ id: "mo"+Date.now(), leadId: lead.id, phone, dir: "out", text: reply, at: new Date().toISOString() });
  const hook = process.env.EVOLUTION_SEND_URL;
  if (hook && phone) {
    try {
      await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY || "" }, body: JSON.stringify({ number: phone, text: reply }) });
    } catch (e) {}
  }
  res.status(200).json({ ok: true, leadId: lead.id, stage: lead.stage, reply });
}
