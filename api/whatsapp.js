import { store } from "./store.js";
import { extractFromText, dossierOf } from "./parse.js";
const SCRIPT = {
  novo: "Ola, {nome}! Atendimento NEXO SAUDE. Para cotar: cidade, tipo e vidas. Quando for a proposta, envie o CPF por aqui.",
  qualificando: "Perfeito. Se puder, envie o CPF. O CRM guarda e eu nao peco de novo na proposta.",
  cotacao: "Vou passar ao corretor habilitado. Se ja tiver foto do RG ou comprovante, pode mandar no Zap.",
  proposta: "Estou montando a proposta com o que ja esta no dossie.",
  aguardando: "Ainda faz sentido seguir com a cotacao esta semana?",
};
function digits(v) { return String(v || "").replace(/\D/g, ""); }
export default async function handler(req, res) {
  const s = store();
  if (!s.messages) s.messages = [];
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (req.method === "GET") { res.status(200).json({ ok: true, hook: "POST Evolution -> /api/whatsapp" }); return; }
  const remote = body?.data?.key?.remoteJid || body.phone || "";
  const text = body?.data?.message?.conversation || body?.data?.message?.extendedTextMessage?.text || body.text || "";
  const caption = body?.data?.message?.imageMessage?.caption || body?.data?.message?.documentMessage?.caption || "";
  const hasImage = Boolean(body?.data?.message?.imageMessage || body?.data?.message?.documentMessage || body.hasFile);
  const phone = String(remote).replace(/\D/g, "");
  let lead = s.leads.find((l) => digits(l.whatsapp).endsWith(phone.slice(-8)));
  if (!lead) {
    lead = { id: String(s.seq++), status: "aberto", stage: "novo", receivedAt: new Date().toISOString(), nome: body.pushName || body?.data?.pushName || "WhatsApp", whatsapp: phone, cidade: "", tipo: "individual", vidas: "1", source: "whatsapp", dossier: {}, files: {} };
    s.leads.unshift(lead);
  }
  if (!lead.dossier) lead.dossier = dossierOf(lead);
  if (!lead.files) lead.files = {};
  const incoming = String(text || caption || "");
  s.messages.push({ id: "m" + Date.now(), leadId: lead.id, phone, dir: "in", text: incoming || (hasImage ? "[arquivo recebido]" : ""), at: new Date().toISOString() });
  const found = extractFromText(incoming);
  Object.assign(lead.dossier, found);
  const blob = (incoming + " " + caption).toLowerCase();
  if (hasImage) {
    if (/cnpj|contrato social/.test(blob)) lead.files.doc_cnpj = { name: "arquivo WhatsApp", at: new Date().toISOString() };
    else if (/cpf/.test(blob)) lead.files.doc_cpf = { name: "arquivo WhatsApp", at: new Date().toISOString() };
    else if (/comprovante|resid/.test(blob)) lead.files.doc_comp = { name: "arquivo WhatsApp", at: new Date().toISOString() };
    else lead.files.doc_rg = { name: "arquivo WhatsApp", at: new Date().toISOString() };
  }
  const t = incoming.toLowerCase();
  if (/nao quero|não quero|desisto|parar/.test(t)) lead.stage = "perdido";
  else if (/fechei|contratei/.test(t)) lead.stage = "ganho";
  else if (found.cpf) lead.stage = lead.stage === "novo" ? "qualificando" : lead.stage;
  else if (/\b(rj|sp|rio|empresa|pme|familiar|individual|vida)/.test(t)) lead.stage = "qualificando";
  let reply = (SCRIPT[lead.stage] || SCRIPT.novo).replace("{nome}", lead.nome || "");
  if (found.cpf) reply = "CPF " + found.cpf + " salvo no dossie. Nao vou pedir de novo. Se tiver RG ou comprovante, pode mandar a foto.";
  s.messages.push({ id: "mo" + Date.now(), leadId: lead.id, phone, dir: "out", text: reply, at: new Date().toISOString() });
  const hook = process.env.EVOLUTION_SEND_URL;
  if (hook && phone) {
    try {
      await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY || "" }, body: JSON.stringify({ number: phone, text: reply }) });
    } catch (e) {}
  }
  res.status(200).json({ ok: true, leadId: lead.id, stage: lead.stage, saved: found, reply });
}
