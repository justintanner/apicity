import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  parseHarPaths,
  getGitStatus,
  getHarCommits,
  recordingHasMedia,
} from "./har-data.js";

const args = process.argv.slice(2);

let htmlOutputPath: string | null = null;
let gitApprove = false;
let mediaOnly = false;
let port = 3475;
const paths: string[] = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--html" && args[i + 1]) {
    htmlOutputPath = args[++i];
  } else if (args[i] === "--git-approve") {
    gitApprove = true;
  } else if (args[i] === "--media-only") {
    mediaOnly = true;
  } else if (args[i] === "--port" && args[i + 1]) {
    port = parseInt(args[++i], 10);
  } else if (!args[i].startsWith("-")) {
    paths.push(args[i]);
  }
}

if (paths.length === 0) {
  console.error(
    "Usage: npx tsx tests/harness-serve.ts [--html out.html] [--media-only] [--git-approve] [--port N] <file.har|dir> ..."
  );
  process.exit(1);
}

const recordings = parseHarPaths(paths.map((p) => path.resolve(p))).filter(
  (rec) => !mediaOnly || recordingHasMedia(rec)
);

const commitMap = getHarCommits(recordings.map((r) => r.source));
for (const rec of recordings) {
  rec.commit = commitMap.get(rec.source) ?? null;
}

recordings.sort((a, b) => {
  const ad = a.commit?.date ?? Number.POSITIVE_INFINITY;
  const bd = b.commit?.date ?? Number.POSITIVE_INFINITY;
  if (ad !== bd) return bd - ad;
  return a.source.localeCompare(b.source);
});

if (gitApprove) {
  for (const rec of recordings) {
    const rel = path.relative(process.cwd(), rec.source);
    rec.gitStatus = getGitStatus(rel);
    rec.source = rel;
  }
}

const VIEWER_HTML = fs.readFileSync(
  path.resolve(import.meta.dirname, "har-viewer.html"),
  "utf-8"
);

// Static HTML export
if (htmlOutputPath) {
  const data = { recordings, features: { gitApprove: false } };
  const dataScript = `<script>var HAR_DATA = ${JSON.stringify(data)};</script>`;
  const output = VIEWER_HTML.replace("</head>", dataScript + "\n</head>");
  fs.writeFileSync(htmlOutputPath, output);
  console.log(`Wrote ${htmlOutputPath} (${recordings.length} recording(s))`);
  process.exit(0);
}

// Server mode
const features = { gitApprove };

function jsonResponse(
  res: http.ServerResponse,
  status: number,
  body: unknown
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(VIEWER_HTML);
    return;
  }

  if (req.method === "GET" && req.url === "/api/data") {
    jsonResponse(res, 200, { recordings, features });
    return;
  }

  if (req.method === "POST" && req.url === "/api/approve" && gitApprove) {
    const body = await readBody(req);
    try {
      const { path: filePath } = JSON.parse(body) as { path: string };
      if (!filePath || filePath.includes("..")) {
        jsonResponse(res, 400, { error: "Invalid path" });
        return;
      }
      execSync(`git add "${filePath}"`);
      const rec = recordings.find((r) => r.source === filePath);
      if (rec) rec.gitStatus = "clean";
      jsonResponse(res, 200, { ok: true });
    } catch (err) {
      jsonResponse(res, 500, { error: String(err) });
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(port, () => {
  console.log(
    `HAR Viewer \u2192 http://localhost:${port} (${recordings.length} recording(s))`
  );
});
