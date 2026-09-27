import { searchKb } from "./kb.js";
export default async function handler(req, res) {
  const body = req.method === "GET" ? req.query || {} : (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {});
  const query = body.query || body.q || "";
  if (!query) { res.status(400).json({ ok: false, error: "Pergunte algo do manual" }); return; }
  const hits = searchKb({ query, tipo: body.tipo, operadora: body.operadora, limit: 6 });
  const context = hits.map((h, i) => `[${i + 1}] ${h.title} p.${h.page} (${h.operadora || "s/op"} · ${h.tipo})\n${h.text}`).join("\n\n");
  let answer = "";
  if (!hits.length) answer = "Nao achei isso nos PDFs carregados. Nao invento carencia, cobertura nem preco. Suba o manual do plano na base.";
  else {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      try {
        const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + key, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Voce e consultor NEXO SAUDE. Responda SO com o que esta nos trechos. Se nao estiver escrito, diga que nao consta no PDF. Cite manual e pagina. Nao invente preco.\nPergunta: " + query + "\n\nTrechos:\n" + context }] }] }),
        });
        const j = await r.json();
        answer = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (e) {}
    }
    if (!answer) {
      answer = "Com base nos manuais:\n\n" + hits.slice(0, 3).map((h) => "• " + h.title + " p." + h.page + ": " + h.text.slice(0, 280)).join("\n\n");
    }
  }
  res.status(200).json({ ok: true, answer, hits: hits.map((h) => ({ title: h.title, page: h.page, tipo: h.tipo, operadora: h.operadora, score: h.score })) });
}
