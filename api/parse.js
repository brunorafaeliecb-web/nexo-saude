export function onlyDigits(v) { return String(v || "").replace(/\D/g, ""); }
export function validCpf(cpf) {
  const s = onlyDigits(cpf);
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
  let a = 0; for (let i = 0; i < 9; i++) a += Number(s[i]) * (10 - i);
  let d1 = (a * 10) % 11; if (d1 === 10) d1 = 0; if (d1 !== Number(s[9])) return false;
  a = 0; for (let i = 0; i < 10; i++) a += Number(s[i]) * (11 - i);
  let d2 = (a * 10) % 11; if (d2 === 10) d2 = 0; return d2 === Number(s[10]);
}
export function formatCpf(cpf) {
  const s = onlyDigits(cpf).slice(0, 11);
  if (s.length !== 11) return s;
  return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
export function formatCep(cep) {
  const s = onlyDigits(cep).slice(0, 8);
  if (s.length !== 8) return s;
  return s.replace(/(\d{5})(\d{3})/, "$1-$2");
}
export const DOC_ITEMS = [
  { id: "nome", label: "Nome completo", type: "field" },
  { id: "cpf", label: "CPF", type: "field" },
  { id: "rg", label: "RG", type: "field" },
  { id: "nascimento", label: "Data de nascimento", type: "field" },
  { id: "mae", label: "Nome da mae", type: "field" },
  { id: "email", label: "E-mail", type: "field" },
  { id: "whatsapp", label: "WhatsApp", type: "field" },
  { id: "cep", label: "CEP", type: "field" },
  { id: "endereco", label: "Endereco", type: "field" },
  { id: "cidade", label: "Cidade", type: "field" },
  { id: "tipo", label: "Tipo de plano", type: "field" },
  { id: "vidas", label: "Quantidade de vidas", type: "field" },
  { id: "cnpj", label: "CNPJ (PME)", type: "field" },
  { id: "doc_rg", label: "Foto RG (frente/verso)", type: "file" },
  { id: "doc_cpf", label: "Foto CPF", type: "file" },
  { id: "doc_comp", label: "Comprovante de residencia", type: "file" },
  { id: "doc_cnpj", label: "Cartao CNPJ / contrato social", type: "file" }
];
export function extractFromText(text) {
  const raw = String(text || ""); const out = {};
  const cpfMatch = raw.match(/\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/);
  if (cpfMatch && validCpf(cpfMatch[1])) out.cpf = formatCpf(cpfMatch[1]);
  const cepMatch = raw.match(/\b(\d{5}-?\d{3})\b/);
  if (cepMatch && onlyDigits(cepMatch[1]).length === 8) out.cep = formatCep(cepMatch[1]);
  const mail = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (mail) out.email = mail[0].toLowerCase();
  const nasc = raw.match(/\b(\d{2}[\/.]\d{2}[\/.]\d{4})\b/);
  if (nasc) out.nascimento = nasc[1].replace(/\./g, "/");
  const cnpj = raw.match(/\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/);
  if (cnpj && onlyDigits(cnpj[1]).length === 14) out.cnpj = cnpj[1];
  const rg = raw.match(/\brg[:\s]+([0-9.\-xX]{5,14})/i);
  if (rg) out.rg = rg[1];
  return out;
}
export function dossierOf(lead) {
  const d = { ...(lead.dossier || {}) };
  if (lead.nome && !d.nome) d.nome = lead.nome;
  if (lead.whatsapp && !d.whatsapp) d.whatsapp = lead.whatsapp;
  if (lead.cidade && !d.cidade) d.cidade = lead.cidade;
  if (lead.tipo && !d.tipo) d.tipo = lead.tipo;
  if (lead.vidas && !d.vidas) d.vidas = lead.vidas;
  return d;
}
export function checklist(lead) {
  const d = dossierOf(lead); const files = lead.files || {};
  return DOC_ITEMS.map((item) => {
    const ready = item.type === "file" ? Boolean(files[item.id]) : Boolean(String(d[item.id] || "").trim());
    return { ...item, ready, value: item.type === "file" ? files[item.id] : d[item.id] || "" };
  });
}
