import http from "node:http";

/** Minimal stand-in for the Paystack API so payment logic can be tested without real keys. */
export function startMockPaystack(port = 4010) {
  let mode: "success" | "wrong_amount" | "failed" = "success";
  const tx = new Map<string, { amount: number; currency: string }>();
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const send = (code: number, json: unknown) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(json)); };
      // Mock Anthropic Messages API: returns catalogue ids from the prompt plus one invented id, to prove validation.
      if (req.method === "POST" && req.url === "/v1/messages") {
        if (req.headers["x-api-key"] !== "test-ai-key") return send(401, { error: "bad key" });
        const b = JSON.parse(body);
        const prompt = JSON.parse(b.messages[0].content) as { CATALOGUE: { id: string }[] };
        const ids = prompt.CATALOGUE.slice(0, 2).map((c) => c.id);
        const reply = { days: [{ day: 1, items: [{ id: ids[0], note: "Start here" }, { id: "11111111-2222-3333-4444-555555555555", note: "Invented 5-star resort" }] }, { day: 2, items: ids[1] ? [{ id: ids[1] }] : [] }] };
        return send(200, { content: [{ type: "text", text: "Here you go:\n" + JSON.stringify(reply) }] });
      }
      if (req.headers.authorization !== "Bearer sk_test_mock") return send(401, { status: false, message: "Invalid key" });
      if (req.method === "POST" && req.url === "/transaction/initialize") {
        const b = JSON.parse(body);
        tx.set(b.reference, { amount: b.amount, currency: b.currency });
        return send(200, { status: true, message: "ok", data: { authorization_url: `${b.callback_url}?reference=${b.reference}`, reference: b.reference } });
      }
      const m = req.url?.match(/^\/transaction\/verify\/(.+)$/);
      if (req.method === "GET" && m) {
        const ref = decodeURIComponent(m[1]); const t = tx.get(ref);
        if (!t) return send(404, { status: false, message: "Transaction not found" });
        return send(200, { status: true, message: "ok", data: {
          status: mode === "failed" ? "failed" : "success", reference: ref, currency: t.currency, channel: "mobile_money", paid_at: new Date().toISOString(),
          amount: mode === "wrong_amount" ? 100 : t.amount } });
      }
      send(404, { status: false, message: "not found" });
    });
  });
  return new Promise<{ close: () => void; setMode: (m: typeof mode) => void; initialised: () => string[] }>((resolve) =>
    server.listen(port, "127.0.0.1", () => resolve({ close: () => server.close(), setMode: (m) => { mode = m; }, initialised: () => [...tx.keys()] })));
}
