import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const PORT = 3475;
const RECORDINGS_DIR = path.resolve(import.meta.dirname, "recordings");

interface HarEntry {
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    postData?: { text: string };
  };
  response: {
    status: number;
    statusText: string;
    headers: Array<{ name: string; value: string }>;
    content: { text?: string };
  };
}

interface Recording {
  name: string;
  path: string;
  gitStatus: "new" | "modified" | "clean";
  entries: HarEntry[];
}

function getGitStatus(filePath: string): "new" | "modified" | "clean" {
  try {
    const out = execSync(`git status --porcelain "${filePath}"`, {
      encoding: "utf-8",
    }).trim();
    if (!out) return "clean";
    if (out.startsWith("??") || out.startsWith("A ")) return "new";
    return "modified";
  } catch {
    return "new";
  }
}

function scanRecordings(): Recording[] {
  const results: Recording[] = [];
  if (!fs.existsSync(RECORDINGS_DIR)) return results;

  function walk(dir: string, prefix: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(
          path.join(dir, entry.name),
          prefix ? `${prefix}/${entry.name}` : entry.name
        );
      } else if (entry.name === "recording.har") {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(process.cwd(), fullPath);
        try {
          const har = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          results.push({
            name: prefix,
            path: relPath,
            gitStatus: getGitStatus(relPath),
            entries: har.log?.entries ?? [],
          });
        } catch {
          // skip malformed HAR files
        }
      }
    }
  }

  walk(RECORDINGS_DIR, "");
  return results;
}

function gitAdd(filePath: string): void {
  execSync(`git add "${filePath}"`);
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Polly.js Test Harness</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  ::-webkit-scrollbar { width: 12px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; margin: 4px 0; }
  ::-webkit-scrollbar-thumb { background: #45475a; border-radius: 6px; border: 3px solid transparent; background-clip: padding-box; }
  ::-webkit-scrollbar-thumb:hover { background: #585b70; }
  ::-webkit-scrollbar-corner { background: #11111b; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #1e1e2e; color: #cdd6f4; height: 100vh; display: grid; grid-template-columns: 240px 4px 1fr 4px 1fr; grid-template-rows: 1fr auto; }
  #sidebar { background: #181825; display: flex; flex-direction: column; overflow-y: auto; }
  #sidebar h2 { padding: 8px 16px; font-size: 14px; color: #a6adc8; text-transform: uppercase; letter-spacing: 1px; flex-shrink: 0; }
  #rec-list { flex: 1; overflow-y: auto; }
  .resize-handle { background: #313244; cursor: col-resize; position: relative; transition: background 0.15s; }
  .resize-handle:hover, .resize-handle.dragging { background: #89b4fa; }
  .provider-label { padding: 6px 16px; font-size: 11px; color: #6c7086; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
  .rec-item { padding: 8px 16px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; border-left: 3px solid transparent; }
  .rec-item:hover { background: #313244; }
  .rec-item.active { background: #313244; border-left-color: #89b4fa; }
  .entry-item { padding: 5px 16px 5px 32px; font-size: 12px; color: #6c7086; cursor: pointer; border-left: 3px solid transparent; }
  .entry-item:hover { background: #313244; color: #a6adc8; }
  .entry-item.active { background: #313244; color: #cdd6f4; border-left-color: #cba6f7; }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot.clean { background: #a6e3a1; }
  .dot.modified { background: #f9e2af; }
  .dot.new { background: #f38ba8; }
  .pane { overflow-y: auto; padding: 16px; min-width: 0; }
  .pane-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a6adc8; margin-bottom: 8px; }
  .body-wrap { position: relative; margin: 8px -16px 0; }
  .body-wrap .copy-btn { position: absolute; top: 6px; right: 6px; background: #313244; border: none; border-radius: 4px; color: #a6adc8; cursor: pointer; padding: 5px 6px; font-size: 11px; display: flex; align-items: center; justify-content: center; }
  .body-wrap .copy-btn:hover { background: #45475a; color: #cdd6f4; }
  pre.body { background: #11111b; border-radius: 0; padding: 12px 16px; margin: 0; overflow: auto; font-size: 12px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; }
  .json-key { color: #89b4fa; }
  .json-str { color: #a6e3a1; }
  .json-num { color: #fab387; }
  .json-bool { color: #cba6f7; }
  .json-null { color: #6c7086; }
  #actions { grid-column: 1 / -1; padding: 12px 16px; background: #181825; border-top: 1px solid #313244; display: flex; gap: 12px; align-items: center; }
  #actions .spacer { flex: 1; }
  #actions button { padding: 8px 20px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 600; }
  #approve-btn { background: #a6e3a1; color: #1e1e2e; }
  #approve-btn:hover { background: #94e2d5; }
  #approve-btn:disabled { opacity: .4; cursor: default; }
  #refresh-btn { background: #89b4fa; color: #1e1e2e; }
  #refresh-btn:hover { background: #74c7ec; }
  #refresh-btn:disabled { opacity: .4; cursor: default; }
  #refresh-btn.hidden { display: none; }
  #copy-llm-btn { background: #89b4fa; color: #1e1e2e; }
  #copy-llm-btn:hover { background: #74c7ec; }
  #copy-llm-btn:disabled { opacity: .4; cursor: default; }
  #status-msg { font-size: 12px; color: #a6adc8; }
  .empty { padding: 40px; text-align: center; color: #6c7086; font-size: 14px; }
  .b64-img-preview { max-width: 320px; max-height: 240px; border-radius: 6px; border: 1px solid #313244; display: block; margin: 4px 0; }
  .video-preview { max-width: 480px; max-height: 320px; border-radius: 6px; border: 1px solid #313244; display: block; margin: 4px 0; }
  .audio-preview { max-width: 320px; border-radius: 6px; display: block; margin: 4px 0; }
  .b64-truncated { color: #6c7086; font-style: italic; }
  #check-result { margin-top: 12px; }
  #check-result video { max-width: 100%; max-height: 360px; border-radius: 6px; border: 1px solid #313244; display: block; margin: 8px 0; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-right: 8px; }
  .status-badge.pending { background: #f9e2af; color: #1e1e2e; }
  .status-badge.done { background: #a6e3a1; color: #1e1e2e; }
  .status-badge.failed { background: #f38ba8; color: #1e1e2e; }
  .status-badge.expired { background: #6c7086; color: #cdd6f4; }
  .progress-bar { background: #313244; border-radius: 4px; height: 8px; margin: 8px 0; overflow: hidden; }
  .progress-fill { background: #89b4fa; height: 100%; transition: width 0.3s; }
</style>
</head>
<body>
<div id="sidebar">
  <h2>Generations</h2>
  <div id="rec-list"></div>
</div>
<div class="resize-handle" id="resize-1"></div>
<div class="pane" id="req-pane"><div class="empty">Select a recording</div></div>
<div class="resize-handle" id="resize-2"></div>
<div class="pane" id="res-pane"></div>
<div id="actions">
  <button id="approve-btn" disabled>Approve</button>
  <button id="refresh-btn" class="hidden">Refresh</button>
  <span id="status-msg"></span>
  <div class="spacer"></div>
  <button id="copy-llm-btn" disabled>Copy for LLM</button>
</div>
<script>
let recordings = [];
let selected = null;
let selectedEntry = 0;
let renderGeneration = 0;

function inferMimeType(b64) {
  if (b64.startsWith("/9j/")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("R0lGOD")) return "image/gif";
  if (b64.startsWith("UklGR")) return "image/webp";
  return null;
}

function syntaxHighlight(json) {
  if (typeof json !== "string") json = JSON.stringify(json, null, 2);
  return json
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"([^"]+)"\\s*:/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-str">"$1"</span>')
    .replace(/: (\\d+\\.?\\d*)/g, ': <span class="json-num">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-bool">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>');
}

function inlineMediaPreviews(html) {
  // b64_json keys (xAI image responses) — always an image
  html = html.replace(
    /(<span class="json-key">"b64_json"<\\/span>:\\s*<span class="json-str">")(([A-Za-z0-9+\\/=]{40})([A-Za-z0-9+\\/=]*))"<\\/span>/g,
    function(match, prefix, fullB64, first40, rest) {
      var mime = inferMimeType(fullB64) || "image/jpeg";
      return prefix + first40 + '...<span class="b64-truncated">[' + fullB64.length + ' chars]</span>"</span>' +
        '<img class="b64-img-preview" src="data:' + mime + ';base64,' + fullB64 + '">';
    }
  );
  // "data" keys with 100+ base64 chars (kimicoding vision)
  html = html.replace(
    /(<span class="json-key">"data"<\\/span>:\\s*<span class="json-str">")(([A-Za-z0-9+\\/=]{100,}))"<\\/span>/g,
    function(match, prefix, fullB64, _unused) {
      var mime = inferMimeType(fullB64);
      if (!mime) return match;
      return prefix + fullB64.substring(0, 40) + '...<span class="b64-truncated">[' + fullB64.length + ' chars]</span>"</span>' +
        '<img class="b64-img-preview" src="data:' + mime + ';base64,' + fullB64 + '">';
    }
  );
  // "url" keys with data:image URIs (OpenAI vision)
  html = html.replace(
    /(<span class="json-key">"url"<\\/span>:\\s*<span class="json-str">")(data:image\\/[a-z+]+;base64,([A-Za-z0-9+\\/=]{40})([A-Za-z0-9+\\/=]*))"<\\/span>/g,
    function(match, prefix, fullUri, first40, rest) {
      return prefix + fullUri.substring(0, 40) + '...<span class="b64-truncated">[' + fullUri.length + ' chars]</span>"</span>' +
        '<img class="b64-img-preview" src="' + fullUri + '">';
    }
  );
  // "url" keys with HTTP image URLs (xAI, OpenAI image generation)
  html = html.replace(
    /(<span class="json-key">"url"<\\/span>:\\s*<span class="json-str">")(https?:\\/\\/[^"]*\\.(?:jpe?g|png|gif|webp|svg)(?:[^"]*)?)"<\\/span>/gi,
    function(match, prefix, fullUrl) {
      return prefix + fullUrl + '"</span>' +
        '<img class="b64-img-preview" src="' + fullUrl + '">';
    }
  );
  // "url" keys with HTTP video URLs (mp4, webm, mov, ogg)
  html = html.replace(
    /(<span class="json-key">"url"<\\/span>:\\s*<span class="json-str">")(https?:\\/\\/[^"]*\\.(?:mp4|webm|mov|ogg)(?:[^"]*)?)"<\\/span>/gi,
    function(match, prefix, fullUrl) {
      return prefix + fullUrl + '"</span>' +
        '<video class="video-preview" controls src="' + fullUrl + '"></video>';
    }
  );
  // "video_url" keys with HTTP URLs
  html = html.replace(
    /(<span class="json-key">"video_url"<\\/span>:\\s*<span class="json-str">")(https?:\\/\\/[^"]*)"<\\/span>/gi,
    function(match, prefix, fullUrl) {
      return prefix + fullUrl + '"</span>' +
        '<video class="video-preview" controls src="' + fullUrl + '"></video>';
    }
  );
  // "url" keys with HTTP audio URLs (mp3, wav, flac, aac, ogg)
  html = html.replace(
    /(<span class="json-key">"url"<\\/span>:\\s*<span class="json-str">")(https?:\\/\\/[^"]*\\.(?:mp3|wav|flac|aac)(?:[^"]*)?)"<\\/span>/gi,
    function(match, prefix, fullUrl) {
      return prefix + fullUrl + '"</span>' +
        '<audio class="audio-preview" controls src="' + fullUrl + '"></audio>';
    }
  );
  // Generic image URLs in any string value (catch-all after key-specific rules)
  html = html.replace(
    /(<span class="json-str">")(https?:\\/\\/[^"]*\\.(?:jpe?g|png|gif|webp|svg)(?:\\?[^"]*)?)"<\\/span>(?!<img)/gi,
    function(match, prefix, fullUrl) {
      return prefix + fullUrl + '"</span>' +
        '<img class="b64-img-preview" src="' + fullUrl + '">';
    }
  );
  // Generic video URLs in any string value (catch-all)
  html = html.replace(
    /(<span class="json-str">")(https?:\\/\\/[^"]*\\.(?:mp4|webm|mov)(?:\\?[^"]*)?)"<\\/span>(?!<video)/gi,
    function(match, prefix, fullUrl) {
      return prefix + fullUrl + '"</span>' +
        '<video class="video-preview" controls src="' + fullUrl + '"></video>';
    }
  );
  // Generic audio URLs in any string value (catch-all)
  html = html.replace(
    /(<span class="json-str">")(https?:\\/\\/[^"]*\\.(?:mp3|wav|flac|aac)(?:\\?[^"]*)?)"<\\/span>(?!<audio)/gi,
    function(match, prefix, fullUrl) {
      return prefix + fullUrl + '"</span>' +
        '<audio class="audio-preview" controls src="' + fullUrl + '"></audio>';
    }
  );
  // "task_id" / "taskId" keys — add clickable preview link for KIE tasks
  html = html.replace(
    /(<span class="json-key">"task_?[iI]d"<\\/span>:\\s*<span class="json-str">")(([a-f0-9]{20,}))"<\\/span>/gi,
    function(match, prefix, taskId) {
      return prefix + taskId + '"</span>' +
        ' <a href="#" class="task-id-preview" data-taskid="' + taskId + '" style="color:#89b4fa;font-size:11px;text-decoration:none" title="Preview source task">[preview]</a>' +
        '<div class="task-id-result" data-for="' + taskId + '"></div>';
    }
  );
  return html;
}

function redactAuth(val) { return /^bearer\\s/i.test(val) ? "Bearer ***" : val; }

function wrapBody(rawText, highlightedHtml) {
  var escaped = rawText.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
  return '<div class="body-wrap"><button class="copy-btn" data-raw="' + escaped + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button><pre class="body">' + highlightedHtml + '</pre></div>';
}

function titleCaseHeader(name) {
  return name.replace(/\\b[a-z]/g, function(c) { return c.toUpperCase(); });
}

function renderHeaders(headers) {
  var lines = [];
  var raw = [];
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    var name = titleCaseHeader(h.name);
    var val = h.name.toLowerCase() === "authorization" ? redactAuth(h.value) : h.value;
    lines.push('<span class="json-key">' + name + '</span>: <span class="json-str">' + val + '</span>');
    raw.push(name + ": " + val);
  }
  return wrapBody(raw.join("\\n"), lines.join("\\n"));
}

function tryParseJson(text) {
  try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
}

function displayName(recName) {
  var parts = recName.split("/");
  var provider = parts[0].replace(/_\\d+$/, "");
  var test = parts.length > 1 ? parts[1].replace(/_\\d+$/, "") : parts[0];
  return { provider: provider, test: test };
}

function entryLabel(entry) {
  try {
    var u = new URL(entry.request.url);
    var segments = u.pathname.split("/").filter(Boolean);
    var last = segments[segments.length - 1] || u.pathname;
    return entry.request.method + " /" + last;
  } catch { return entry.request.method; }
}

function getVideoRequestId(rec) {
  for (var i = 0; i < rec.entries.length; i++) {
    var entry = rec.entries[i];
    var url = entry.request.url || "";
    if (url.includes("/videos/generations") || url.includes("/videos/edits")) {
      try {
        var body = JSON.parse(entry.response.content.text || "{}");
        if (body.request_id) return body.request_id;
      } catch {}
    }
  }
  return null;
}

function getKieTaskId(rec) {
  for (var i = rec.entries.length - 1; i >= 0; i--) {
    var entry = rec.entries[i];
    var url = entry.request.url || "";
    if (url.includes("/api/v1/jobs/createTask")) {
      try {
        var body = JSON.parse(entry.response.content.text || "{}");
        if (body.data && body.data.taskId) return body.data.taskId;
      } catch {}
    }
  }
  return null;
}

function renderCheckResult(data) {
  var html = '<div class="pane-label">Video Status</div>';
  html += '<span class="status-badge ' + data.status + '">' + data.status + '</span>';
  if (typeof data.progress === "number") {
    var pct = data.progress > 1 ? data.progress : data.progress * 100;
    html += '<span style="font-size:13px;color:#a6adc8">' + Math.round(pct) + '%</span>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
  }
  if (data.video && data.video.url) {
    html += '<video controls src="' + data.video.url + '"></video>';
    html += '<div style="margin-top:4px"><a href="' + data.video.url + '" target="_blank" style="color:#89b4fa;font-size:12px">Open in new tab</a></div>';
  }
  html += '<pre class="body">' + syntaxHighlight(JSON.stringify(data, null, 2)) + '</pre>';
  return html;
}

function renderKieCheckResult(data) {
  var rec = data.data || data;
  var html = '<div class="pane-label">KIE Task Status</div>';
  var state = rec.state || "unknown";
  var badgeClass = state === "success" ? "done" : state === "fail" ? "failed" : "pending";
  html += '<span class="status-badge ' + badgeClass + '">' + state + '</span>';
  if (typeof rec.progress === "number") {
    html += '<span style="font-size:13px;color:#a6adc8"> ' + rec.progress + '%</span>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + rec.progress + '%"></div></div>';
  }
  if (rec.resultJson) {
    try {
      var result = JSON.parse(rec.resultJson);
      if (result.resultUrls && result.resultUrls.length) {
        for (var i = 0; i < result.resultUrls.length; i++) {
          var u = result.resultUrls[i];
          if (/\\.mp4|video/i.test(u)) {
            html += '<video controls src="' + u + '" style="max-width:100%;max-height:360px;border-radius:6px;border:1px solid #313244;display:block;margin:8px 0"></video>';
          } else if (/\\.png|.\\.jpg|\\.jpeg|\\.webp|image/i.test(u)) {
            html += '<img class="b64-img-preview" src="' + u + '">';
          } else if (/\\.mp3|\\.wav|\\.flac|\\.aac|audio/i.test(u)) {
            html += '<audio class="audio-preview" controls src="' + u + '"></audio>';
          }
          html += '<div style="margin-top:4px"><a href="' + u + '" target="_blank" style="color:#89b4fa;font-size:12px">Open in new tab</a></div>';
        }
      }
    } catch {}
  }
  html += '<pre class="body">' + syntaxHighlight(JSON.stringify(data, null, 2)) + '</pre>';
  return html;
}

function checkKieTask(taskId, targetEl, gen) {
  targetEl.innerHTML = '<span style="color:#a6adc8;font-size:12px">Loading...</span>';
  fetch("/api/check-kie-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId }),
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (gen !== undefined && renderGeneration !== gen) return;
    if (data.error) {
      targetEl.innerHTML = '<span style="color:#f38ba8;font-size:12px">' + data.error + '</span>';
    } else {
      targetEl.innerHTML = renderKieCheckResult(data);
    }
  }).catch(function(err) {
    if (gen !== undefined && renderGeneration !== gen) return;
    targetEl.innerHTML = '<span style="color:#f38ba8;font-size:12px">Error: ' + err.message + '</span>';
  });
}

function autoEvalKieTaskIds(gen) {
  var taskLinks = document.querySelectorAll(".task-id-preview");
  taskLinks.forEach(function(link) {
    var taskId = link.dataset.taskid;
    var resultDiv = document.querySelector('.task-id-result[data-for="' + taskId + '"]');
    if (resultDiv && !resultDiv.innerHTML) {
      checkKieTask(taskId, resultDiv, gen);
    }
  });
}

function autoEvalFromResponse(rec, entryIdx, gen) {
  var entry = rec.entries[entryIdx];
  if (!entry) return;
  try {
    var body = JSON.parse(entry.response.content.text || "{}");
    var taskId = body.data && body.data.taskId;
    if (!taskId) return;
    var resultDiv = document.getElementById("check-result");
    if (resultDiv) checkKieTask(taskId, resultDiv, gen);
  } catch {}
}

function autoEvalXaiVideo(rec, gen) {
  var reqId = getVideoRequestId(rec);
  if (!reqId) return;
  var resultDiv = document.getElementById("check-result");
  if (!resultDiv) return;
  resultDiv.innerHTML = '<span style="color:#a6adc8;font-size:12px">Loading video status...</span>';
  fetch("/api/check-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_id: reqId }),
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (renderGeneration !== gen) return;
    if (data.error) {
      resultDiv.innerHTML = '<span style="color:#f38ba8;font-size:12px">' + data.error + '</span>';
    } else {
      resultDiv.innerHTML = renderCheckResult(data);
    }
  }).catch(function(err) {
    if (renderGeneration !== gen) return;
    resultDiv.innerHTML = '<span style="color:#f38ba8;font-size:12px">Error: ' + err.message + '</span>';
  });
}

function buildTransactionText(entry) {
  var req = entry.request;
  var res = entry.response;
  var lines = [];
  lines.push("REQUEST");
  lines.push(req.method + " " + new URL(req.url).pathname);
  for (var i = 0; i < req.headers.length; i++) {
    var h = req.headers[i];
    var val = h.name.toLowerCase() === "authorization" ? redactAuth(h.value) : h.value;
    lines.push(titleCaseHeader(h.name) + ": " + val);
  }
  if (req.postData && req.postData.text) {
    lines.push("");
    lines.push(tryParseJson(req.postData.text));
  }
  lines.push("");
  lines.push("RESPONSE " + res.status + " " + res.statusText);
  for (var j = 0; j < res.headers.length; j++) {
    var rh = res.headers[j];
    lines.push(titleCaseHeader(rh.name) + ": " + rh.value);
  }
  if (res.content && res.content.text) {
    lines.push("");
    lines.push(tryParseJson(res.content.text));
  }
  return lines.join("\\n");
}

function renderEntry(entry) {
  const req = entry.request;
  const res = entry.response;

  document.getElementById("req-pane").innerHTML =
    '<div class="pane-label">Request</div>' +
    '<div class="header-line" style="font-size:15px;font-weight:600;margin-bottom:6px">' + req.method + " " + new URL(req.url).pathname + '</div>' +
    renderHeaders(req.headers) +
    (req.postData?.text ? wrapBody(tryParseJson(req.postData.text), inlineMediaPreviews(syntaxHighlight(tryParseJson(req.postData.text)))) : '');

  document.getElementById("res-pane").innerHTML =
    '<div class="pane-label">Response ' + res.status + ' ' + res.statusText + '</div>' +
    renderHeaders(res.headers) +
    (res.content?.text ? wrapBody(tryParseJson(res.content.text), inlineMediaPreviews(syntaxHighlight(tryParseJson(res.content.text)))) : '') +
    '<div id="check-result"></div>';
}

function render() {
  renderGeneration++;
  var gen = renderGeneration;
  var list = document.getElementById("rec-list");

  // Group recordings by provider
  var groups = {};
  var groupOrder = [];
  for (var i = 0; i < recordings.length; i++) {
    var dn = displayName(recordings[i].name);
    if (!groups[dn.provider]) {
      groups[dn.provider] = [];
      groupOrder.push(dn.provider);
    }
    groups[dn.provider].push({ idx: i, test: dn.test, rec: recordings[i] });
  }

  var html = "";
  for (var g = 0; g < groupOrder.length; g++) {
    var provider = groupOrder[g];
    var items = groups[provider];
    html += '<div class="provider-label">' + provider + '</div>';
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var isActive = selected === item.idx;
      html += '<div class="rec-item' + (isActive ? ' active' : '') + '" data-idx="' + item.idx + '">' +
        '<span class="dot ' + item.rec.gitStatus + '"></span>' + item.test + '</div>';
      if (isActive && item.rec.entries.length > 1) {
        for (var e = 0; e < item.rec.entries.length; e++) {
          html += '<div class="entry-item' + (selectedEntry === e ? ' active' : '') + '" data-idx="' + item.idx + '" data-entry="' + e + '">' +
            entryLabel(item.rec.entries[e]) + '</div>';
        }
      }
    }
  }
  list.innerHTML = html;

  list.querySelectorAll(".rec-item").forEach(function(el) {
    el.addEventListener("click", function() {
      var idx = parseInt(el.dataset.idx);
      if (selected !== idx) {
        selected = idx;
        selectedEntry = 0;
      }
      render();
    });
  });

  list.querySelectorAll(".entry-item").forEach(function(el) {
    el.addEventListener("click", function(e) {
      e.stopPropagation();
      selected = parseInt(el.dataset.idx);
      selectedEntry = parseInt(el.dataset.entry);
      render();
    });
  });

  var btn = document.getElementById("approve-btn");
  var refreshBtn = document.getElementById("refresh-btn");
  var copyLlmBtn = document.getElementById("copy-llm-btn");
  if (selected !== null && recordings[selected]) {
    var rec = recordings[selected];
    renderEntry(rec.entries[selectedEntry] || { request: { method: "", url: "about:blank", headers: [] }, response: { status: 0, statusText: "", headers: [], content: {} } });
    btn.disabled = rec.gitStatus === "clean";
    copyLlmBtn.disabled = false;
    document.getElementById("status-msg").textContent = rec.gitStatus === "clean" ? "Already approved" : "";

    var reqId = getVideoRequestId(rec);
    var kieTaskId = getKieTaskId(rec);
    if (reqId || kieTaskId) {
      refreshBtn.classList.remove("hidden");
      refreshBtn.dataset.requestId = reqId || kieTaskId;
      refreshBtn.dataset.provider = reqId ? "xai" : "kie";
    } else {
      refreshBtn.classList.add("hidden");
    }

    // Auto-eval: resolve task_ids and video statuses
    autoEvalKieTaskIds(gen);
    autoEvalFromResponse(rec, selectedEntry, gen);
    autoEvalXaiVideo(rec, gen);
  } else {
    refreshBtn.classList.add("hidden");
    copyLlmBtn.disabled = true;
  }
}

document.getElementById("approve-btn").addEventListener("click", async () => {
  if (selected === null) return;
  const rec = recordings[selected];
  document.getElementById("status-msg").textContent = "Approving...";
  const res = await fetch("/api/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: rec.path }),
  });
  if (res.ok) {
    rec.gitStatus = "clean";
    document.getElementById("status-msg").textContent = "Approved and staged";
    document.getElementById("approve-btn").disabled = true;
    render();
  } else {
    document.getElementById("status-msg").textContent = "Failed to approve";
  }
});

document.getElementById("refresh-btn").addEventListener("click", async () => {
  var btn = document.getElementById("refresh-btn");
  var requestId = btn.dataset.requestId;
  var provider = btn.dataset.provider;
  if (!requestId) return;
  var statusMsg = document.getElementById("status-msg");
  var resultDiv = document.getElementById("check-result");
  btn.disabled = true;
  statusMsg.textContent = "Checking...";
  try {
    var endpoint = provider === "kie" ? "/api/check-kie-task" : "/api/check-video";
    var bodyKey = provider === "kie" ? "task_id" : "request_id";
    var payload = {};
    payload[bodyKey] = requestId;
    var res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    var data = await res.json();
    if (!res.ok) {
      statusMsg.textContent = data.error || "Check failed";
      if (resultDiv) resultDiv.innerHTML = "";
    } else if (provider === "kie") {
      var rec = data.data || data;
      statusMsg.textContent = "State: " + (rec.state || "unknown");
      if (resultDiv) resultDiv.innerHTML = renderKieCheckResult(data);
    } else {
      statusMsg.textContent = "Status: " + data.status;
      if (resultDiv) resultDiv.innerHTML = renderCheckResult(data);
    }
  } catch (err) {
    statusMsg.textContent = "Error: " + err.message;
  }
  btn.disabled = false;
});

document.getElementById("copy-llm-btn").addEventListener("click", function() {
  if (selected === null) return;
  var rec = recordings[selected];
  var entry = rec.entries[selectedEntry];
  if (!entry) return;
  var text = buildTransactionText(entry);
  var btn = document.getElementById("copy-llm-btn");
  navigator.clipboard.writeText(text).then(function() {
    btn.textContent = "Copied!";
    setTimeout(function() { btn.textContent = "Copy for LLM"; }, 1200);
  });
});

document.addEventListener("click", function(e) {
  var copyBtn = e.target.closest(".copy-btn");
  if (copyBtn) {
    var raw = copyBtn.dataset.raw;
    navigator.clipboard.writeText(raw).then(function() {
      copyBtn.textContent = "\\u2713";
      setTimeout(function() { copyBtn.innerHTML = "\\u2398"; }, 1200);
    });
    return;
  }
  var link = e.target.closest(".task-id-preview");
  if (!link) return;
  e.preventDefault();
  var taskId = link.dataset.taskid;
  var resultDiv = document.querySelector('.task-id-result[data-for="' + taskId + '"]');
  if (!resultDiv) return;
  if (resultDiv.innerHTML) { resultDiv.innerHTML = ""; return; }
  checkKieTask(taskId, resultDiv);
});

fetch("/api/recordings").then(r => r.json()).then(data => {
  recordings = data;
  if (recordings.length) { selected = 0; }
  render();
});

// Resizable columns
(function() {
  var cols = [240, 4, 0, 4, 0]; // sidebar, handle, req, handle, res
  function applyGrid() {
    document.body.style.gridTemplateColumns =
      cols[0] + "px " + cols[1] + "px " + cols[2] + "px " + cols[3] + "px " + cols[4] + "px";
  }
  function initCols() {
    var w = window.innerWidth;
    var fixed = cols[0] + cols[1] + cols[3];
    var remaining = w - fixed;
    cols[2] = Math.floor(remaining / 2);
    cols[4] = remaining - cols[2];
    applyGrid();
  }
  initCols();
  window.addEventListener("resize", initCols);

  function setupHandle(handleId, leftIdx, rightIdx) {
    var handle = document.getElementById(handleId);
    handle.addEventListener("mousedown", function(e) {
      e.preventDefault();
      handle.classList.add("dragging");
      var startX = e.clientX;
      var startLeft = cols[leftIdx];
      var startRight = cols[rightIdx];
      var total = startLeft + startRight;
      var minW = leftIdx === 0 ? 160 : 200;

      function onMove(e) {
        var dx = e.clientX - startX;
        var newLeft = Math.max(minW, Math.min(total - 200, startLeft + dx));
        cols[leftIdx] = newLeft;
        cols[rightIdx] = total - newLeft;
        applyGrid();
      }
      function onUp() {
        handle.classList.remove("dragging");
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }
  setupHandle("resize-1", 0, 2);
  setupHandle("resize-2", 2, 4);
})();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML);
    return;
  }

  if (req.method === "GET" && req.url === "/api/recordings") {
    const data = scanRecordings();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
    return;
  }

  if (req.method === "POST" && req.url === "/api/approve") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { path: filePath } = JSON.parse(body) as { path: string };
        if (!filePath || filePath.includes("..")) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid path" }));
          return;
        }
        gitAdd(filePath);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/check-video") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { request_id } = JSON.parse(body) as {
          request_id: string;
        };
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "XAI_API_KEY not set" }));
          return;
        }
        if (!request_id) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing request_id" }));
          return;
        }
        const apiRes = await fetch(`https://api.x.ai/v1/videos/${request_id}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const data = await apiRes.json();
        res.writeHead(apiRes.status, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/check-kie-task") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { task_id } = JSON.parse(body) as { task_id: string };
        const apiKey = process.env.KIE_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "KIE_API_KEY not set" }));
          return;
        }
        if (!task_id) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing task_id" }));
          return;
        }
        const apiRes = await fetch(
          `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(task_id)}`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        const data = await apiRes.json();
        res.writeHead(apiRes.status, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Polly.js Test Harness → http://localhost:${PORT}`);
});
