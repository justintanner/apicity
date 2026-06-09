import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createXai } from "../packages/provider/xai/src/index.js";

const args = process.argv.slice(2);
let port = 3476;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--port" && args[i + 1]) {
    port = parseInt(args[++i], 10);
  }
}

const apiKey = process.env.XAI_API_KEY;
if (!apiKey) {
  console.error(
    "XAI_API_KEY is required. Run with: op run --env-file=.env pnpm run harness:voice"
  );
  process.exit(1);
}

const provider = createXai({ apiKey });

const HTML_PATH = path.resolve(import.meta.dirname, "voice-harness.html");

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
  });
}

function jsonResponse(
  res: http.ServerResponse,
  status: number,
  body: unknown
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    const html = fs.readFileSync(HTML_PATH, "utf-8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/api/ephemeral") {
    try {
      const body = await readBody(req);
      const parsed = body
        ? (JSON.parse(body) as {
            session?: Record<string, unknown>;
            model?: string;
          })
        : {};
      const result = await provider.post.v1.realtime.clientSecrets({
        session: parsed.session ?? {},
      });
      jsonResponse(res, 200, result);
    } catch (err) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 500;
      jsonResponse(res, status, { error: String(err) });
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(port, () => {
  console.log(`xAI Voice Harness → http://localhost:${port}`);
});
