export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "nexo-saude",
          receivedAt: new Date().toISOString(),
          ...body,
        }),
      });
    } catch (e) {
      console.error("webhook", e);
    }
  }
  res.status(200).json({ ok: true });
}
