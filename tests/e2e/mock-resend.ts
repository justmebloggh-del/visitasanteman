import http from "node:http";

/** Stand-in for Resend's email API: records what the site would have sent, so notifications can be tested without a real key. */
export interface SentEmail { to: string; subject: string; text: string; reply_to?: string }

export function startMockResend(port = 4011) {
  const sent: SentEmail[] = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.method === "POST" && req.url === "/emails" && req.headers.authorization === "Bearer re_test_mock") {
        sent.push(JSON.parse(body));
        res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ id: "mock" }));
      } else { res.writeHead(401); res.end(); }
    });
  });
  return new Promise<{ close: () => void; sent: () => SentEmail[] }>((resolve) =>
    server.listen(port, "127.0.0.1", () => resolve({ close: () => server.close(), sent: () => sent })));
}
