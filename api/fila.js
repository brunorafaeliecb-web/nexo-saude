import { store } from "./store.js";
function ensure() {
  const s = store();
  if (!s.fila) s.fila = { seq: 1000, tickets: [] };
  return s;
}
function waiting() { return ensure().fila.tickets.filter((t) => t.status === "waiting"); }
export default async function handler(req, res) {
  const s = ensure();
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (req.method === "GET") {
    const code = String(req.query?.code || "");
    const one = code ? s.fila.tickets.find((t) => t.code === code) : null;
    res.status(200).json({
      ok: true,
      waiting: waiting().length,
      ticket: one ? { ...one, position: one.status === "waiting" ? waiting().findIndex((t) => t.code === one.code) + 1 : 0 } : null,
      tickets: s.fila.tickets.slice(0, 80),
    });
    return;
  }
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  const action = body.action || "enter";
  if (action === "enter") {
    const ticket = {
      id: String(Date.now()),
      code: "NEXO-" + String(++s.fila.seq),
      status: "waiting",
      createdAt: new Date().toISOString(),
      nome: body.nome || "",
      whatsapp: body.whatsapp || "",
      cidade: body.cidade || "",
      tipo: body.tipo || "individual",
      vidas: body.vidas || "1",
      leadId: body.leadId || null,
    };
    s.fila.tickets.push(ticket);
    res.status(200).json({ ok: true, ticket, position: waiting().length, etaMin: Math.max(2, waiting().length * 3) });
    return;
  }
  if (action === "next") {
    const next = waiting()[0];
    if (!next) { res.status(200).json({ ok: true, empty: true }); return; }
    next.status = "attending";
    next.calledAt = new Date().toISOString();
    next.broker = body.broker || { nome: "corretor" };
    res.status(200).json({ ok: true, ticket: next, waiting: waiting().length });
    return;
  }
  if (action === "done" || action === "skip" || action === "no-show") {
    const t = s.fila.tickets.find((x) => x.code === body.code || x.id === body.id);
    if (!t) { res.status(404).json({ ok: false, error: "Senha nao encontrada" }); return; }
    t.status = action === "done" ? "done" : action === "skip" ? "waiting" : "abandoned";
    if (action === "skip") {
      s.fila.tickets = s.fila.tickets.filter((x) => x.id !== t.id).concat([t]);
    }
    res.status(200).json({ ok: true, ticket: t });
    return;
  }
  res.status(400).json({ ok: false });
}
