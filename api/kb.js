import { store } from "./store.js";
function tokens(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 2);
}
export function searchKb({ query, tipo, operadora, limit = 6 }) {
  const s = store();
  const q = tokens(query);
  return (s.kb || [])
    .filter((c) => !tipo || c.tipo === tipo || c.tipo === "todos")
    .filter((c) => !operadora || String(c.operadora || "").toLowerCase() === String(operadora).toLowerCase())
    .map((c) => {
      const bag = tokens(c.text + " " + c.title + " " + (c.tags || ""));
      let score = 0;
      for (const w of q) if (bag.includes(w)) score += 1;
      return { ...c, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
export default async function handler(req, res) {
  const s = store();
  if (!s.kb) s.kb = [];
  if (req.method === "GET") {
    const docs = {};
    for (const c of s.kb) {
      if (!docs[c.docId]) docs[c.docId] = { docId: c.docId, title: c.title, tipo: c.tipo, operadora: c.operadora, chunks: 0 };
      docs[c.docId].chunks += 1;
    }
    res.status(200).json({ ok: true, docs: Object.values(docs), chunks: s.kb.length });
    return;
  }
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (body.action === "clear") {
    s.kb = s.kb.filter((c) => c.docId !== body.docId);
    res.status(200).json({ ok: true, chunks: s.kb.length });
    return;
  }
  const chunks = Array.isArray(body.chunks) ? body.chunks : [];
  const docId = body.docId || "doc-" + Date.now();
  for (const ch of chunks) {
    const text = String(ch.text || "").trim();
    if (text.length < 40) continue;
    s.kb.push({ id: "k" + s.kb.length + Date.now(), docId, title: body.title || "Manual", tipo: body.tipo || "todos", operadora: body.operadora || "", tags: body.tags || "", page: ch.page || 1, text: text.slice(0, 2500) });
  }
  res.status(200).json({ ok: true, docId, chunks: s.kb.filter((c) => c.docId === docId).length });
}
