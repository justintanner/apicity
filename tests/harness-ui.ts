import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  workflows,
  resolveTemplate,
  resolveBody,
  extractByPath,
  extractOutputs,
  collectVars,
  getApiKey,
  type WorkflowState,
  type StepState,
} from "./workflows.js";

const PORT = 3475;
const RECORDINGS_DIR = path.resolve(import.meta.dirname, "recordings");
const WORKFLOW_STATE_PATH = path.resolve(
  import.meta.dirname,
  "workflow-state.json"
);
const MEDIA_DIR = path.resolve(import.meta.dirname, "..", "harness_media");

async function cacheMedia(taskId: string, remoteUrl: string): Promise<string> {
  const ext = path.extname(new URL(remoteUrl).pathname) || ".bin";
  const cacheFile = `kie_${taskId}${ext}`;
  const cachePath = path.join(MEDIA_DIR, cacheFile);
  if (fs.existsSync(cachePath)) return `/harness_media/${cacheFile}`;
  const res = await fetch(remoteUrl);
  if (!res.ok) return remoteUrl;
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  fs.writeFileSync(cachePath, buffer);
  return `/harness_media/${cacheFile}`;
}

function readWorkflowState(): WorkflowState {
  if (fs.existsSync(WORKFLOW_STATE_PATH)) {
    return JSON.parse(fs.readFileSync(WORKFLOW_STATE_PATH, "utf-8"));
  }
  return {};
}

function writeWorkflowState(state: WorkflowState): void {
  fs.writeFileSync(WORKFLOW_STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

function getOrInitWorkflowState(
  state: WorkflowState,
  workflowId: string
): Record<string, StepState> {
  const wf = workflows.find((w) => w.id === workflowId);
  if (!wf) throw new Error(`Unknown workflow: ${workflowId}`);
  if (!state[workflowId]) {
    state[workflowId] = { steps: {} };
  }
  const steps = state[workflowId].steps;
  for (let i = 0; i < wf.steps.length; i++) {
    if (!steps[String(i)]) {
      const isReady = wf.layout === "compare" || i === 0;
      steps[String(i)] = { status: isReady ? "ready" : "locked" };
    }
  }
  return steps;
}

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

const HTML = fs.readFileSync(
  path.resolve(import.meta.dirname, "harness-ui.html"),
  "utf-8"
);

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

  if (req.method === "GET" && req.url === "/api/e2e-outputs") {
    const outputsPath = path.resolve(RECORDINGS_DIR, "..", "e2e-outputs.json");
    try {
      if (fs.existsSync(outputsPath)) {
        const data = fs.readFileSync(outputsPath, "utf-8");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(data);
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end("{}");
      }
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  if (req.method === "POST" && req.url === "/api/save-step-output") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { recording, outputs } = JSON.parse(body) as {
          recording: string;
          outputs: Record<string, string>;
        };
        if (!recording || !outputs || typeof outputs !== "object") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request" }));
          return;
        }
        const outputsPath = path.resolve(
          RECORDINGS_DIR,
          "..",
          "e2e-outputs.json"
        );
        let existing: Record<string, Record<string, string>> = {};
        if (fs.existsSync(outputsPath)) {
          existing = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));
        }
        existing[recording] = { ...existing[recording], ...outputs };
        fs.writeFileSync(outputsPath, JSON.stringify(existing, null, 2) + "\n");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  // --- Workflow endpoints ---

  if (req.method === "GET" && req.url === "/api/workflows") {
    try {
      const state = readWorkflowState();
      const result = workflows.map((wf) => {
        const steps = getOrInitWorkflowState(state, wf.id);
        return {
          id: wf.id,
          name: wf.name,
          layout: wf.layout || "sequential",
          setupOutputs: state[wf.id]?.setupOutputs ?? {},
          steps: wf.steps.map((stepDef, i) => ({
            name: stepDef.name,
            description: stepDef.description,
            hasAsync: !!stepDef.async,
            asyncOutputKeys: stepDef.async
              ? Object.keys(stepDef.async.outputExtractors)
              : [],
            ...steps[String(i)],
          })),
        };
      });
      writeWorkflowState(state);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  if (req.method === "POST" && req.url === "/api/workflow/run") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { workflowId, stepIndex } = JSON.parse(body) as {
          workflowId: string;
          stepIndex: number;
        };
        const wf = workflows.find((w) => w.id === workflowId);
        if (!wf) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unknown workflow" }));
          return;
        }
        const stepDef = wf.steps[stepIndex];
        if (!stepDef) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid step index" }));
          return;
        }
        const apiKey = getApiKey(stepDef.apiProvider);
        if (!apiKey) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: `${stepDef.apiProvider.toUpperCase()}_API_KEY not set`,
            })
          );
          return;
        }
        const state = readWorkflowState();
        const steps = getOrInitWorkflowState(state, workflowId);
        const step = steps[String(stepIndex)];
        if (step.status !== "ready" && step.status !== "failed") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: `Step is ${step.status}, not ready` })
          );
          return;
        }
        const vars = collectVars(steps, stepIndex);
        const resolvedUrl = resolveTemplate(stepDef.request.url, vars);
        const resolvedBody = stepDef.request.body
          ? resolveBody(stepDef.request.body, vars)
          : undefined;
        const apiRes = await fetch(resolvedUrl, {
          method: stepDef.request.method,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: resolvedBody ? JSON.stringify(resolvedBody) : undefined,
        });
        const responseBody = await apiRes.json();
        const outputs = extractOutputs(responseBody, stepDef.outputExtractors);
        step.status = "ready";
        step.request = {
          method: stepDef.request.method,
          url: resolvedUrl,
          body: resolvedBody,
        };
        step.response = { status: apiRes.status, body: responseBody };
        step.outputs = outputs;
        writeWorkflowState(state);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            request: step.request,
            response: step.response,
            outputs: step.outputs,
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/workflow/poll") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { workflowId, stepIndex } = JSON.parse(body) as {
          workflowId: string;
          stepIndex: number;
        };
        const wf = workflows.find((w) => w.id === workflowId);
        if (!wf) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unknown workflow" }));
          return;
        }
        const stepDef = wf.steps[stepIndex];
        if (!stepDef?.async) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Step has no async config" }));
          return;
        }
        const apiKey = getApiKey(stepDef.apiProvider);
        if (!apiKey) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: `${stepDef.apiProvider.toUpperCase()}_API_KEY not set`,
            })
          );
          return;
        }
        const state = readWorkflowState();
        const steps = getOrInitWorkflowState(state, workflowId);
        const step = steps[String(stepIndex)];
        const vars = { ...collectVars(steps, stepIndex), ...step.outputs };
        const pollUrl = resolveTemplate(stepDef.async.pollUrl, vars);
        const apiRes = await fetch(pollUrl, {
          method: stepDef.async.pollMethod,
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const responseBody = await apiRes.json();
        const statusVal =
          extractByPath(responseBody, stepDef.async.completionField) ?? "";
        const isDone = stepDef.async.completionValues.includes(statusVal);
        const isFailed = stepDef.async.failureValues.includes(statusVal);
        if (isDone) {
          const asyncOutputs = extractOutputs(
            responseBody,
            stepDef.async.outputExtractors
          );
          step.outputs = { ...step.outputs, ...asyncOutputs };
          // Cache media files locally
          const taskId = step.outputs?.task_id;
          if (taskId) {
            for (const [key, url] of Object.entries(step.outputs ?? {})) {
              if (
                key !== "task_id" &&
                typeof url === "string" &&
                url.startsWith("http")
              ) {
                step.outputs[key] = await cacheMedia(taskId, url);
              }
            }
          }
          writeWorkflowState(state);
        }
        if (isFailed) {
          step.status = "failed";
          step.error = `Async operation ${statusVal}`;
          writeWorkflowState(state);
        }
        let progress: number | undefined;
        if (stepDef.async.progressField) {
          const raw = extractByPath(responseBody, stepDef.async.progressField);
          if (raw != null) progress = Number(raw);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: statusVal,
            isDone,
            isFailed,
            progress,
            body: responseBody,
            outputs: step.outputs,
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/workflow/approve") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { workflowId, stepIndex } = JSON.parse(body) as {
          workflowId: string;
          stepIndex: number;
        };
        const wf = workflows.find((w) => w.id === workflowId);
        if (!wf) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unknown workflow" }));
          return;
        }
        const state = readWorkflowState();
        const steps = getOrInitWorkflowState(state, workflowId);
        const step = steps[String(stepIndex)];
        step.status = "completed";
        step.completedAt = new Date().toISOString();
        const nextIdx = stepIndex + 1;
        if (wf.layout !== "compare" && nextIdx < wf.steps.length) {
          steps[String(nextIdx)].status = "ready";
        }
        writeWorkflowState(state);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            nextStep: nextIdx < wf.steps.length ? nextIdx : null,
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/workflow/run-all") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { workflowId } = JSON.parse(body) as { workflowId: string };
        const wf = workflows.find((w) => w.id === workflowId);
        if (!wf || wf.layout !== "compare") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not a compare workflow" }));
          return;
        }
        // Check all required API keys (per-step + KIE for uploads)
        const requiredProviders = new Set(wf.steps.map((s) => s.apiProvider));
        if (wf.setup?.uploads && Object.keys(wf.setup.uploads).length > 0) {
          requiredProviders.add("kie");
        }
        const missingKeys = Array.from(requiredProviders).filter(
          (p) => !getApiKey(p)
        );
        if (missingKeys.length > 0) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: `API keys not set for: ${missingKeys.join(", ")}`,
            })
          );
          return;
        }
        const state = readWorkflowState();
        const steps = getOrInitWorkflowState(state, workflowId);

        // Resolve setup inputs (cross-workflow refs + file uploads)
        let setupVars: Record<string, string> = {};
        if (state[workflowId].setupOutputs) {
          setupVars = { ...state[workflowId].setupOutputs };
        }
        if (wf.setup) {
          const needsSetup = Object.keys({
            ...wf.setup.fromWorkflows,
            ...wf.setup.uploads,
          }).some((k) => !(k in setupVars));
          if (needsSetup) {
            // Resolve cross-workflow references
            if (wf.setup.fromWorkflows) {
              for (const [varName, ref] of Object.entries(
                wf.setup.fromWorkflows
              )) {
                if (varName in setupVars) continue;
                const refState = state[ref.workflowId];
                const refStep = refState?.steps?.[String(ref.stepIndex)];
                const val = refStep?.outputs?.[ref.outputKey];
                if (!val) {
                  res.writeHead(400, {
                    "Content-Type": "application/json",
                  });
                  res.end(
                    JSON.stringify({
                      error: `Setup: ${ref.workflowId} step ${ref.stepIndex} output "${ref.outputKey}" not available. Run that workflow first.`,
                    })
                  );
                  return;
                }
                setupVars[varName] = val;
              }
            }
            // Upload local files
            if (wf.setup.uploads) {
              for (const [varName, filePath] of Object.entries(
                wf.setup.uploads
              )) {
                if (varName in setupVars) continue;
                const absPath = path.resolve(filePath);
                if (!fs.existsSync(absPath)) {
                  res.writeHead(400, {
                    "Content-Type": "application/json",
                  });
                  res.end(
                    JSON.stringify({
                      error: `Setup: file not found: ${filePath}`,
                    })
                  );
                  return;
                }
                const fileData = fs.readFileSync(absPath);
                const fileName = path.basename(absPath);
                const ext = path.extname(fileName).slice(1).toLowerCase();
                const mimeMap: Record<string, string> = {
                  png: "image/png",
                  jpg: "image/jpeg",
                  jpeg: "image/jpeg",
                  gif: "image/gif",
                  webp: "image/webp",
                  mp4: "video/mp4",
                };
                const mime = mimeMap[ext] ?? "application/octet-stream";
                const uploadPath = `uploads/${Date.now()}_${fileName}`;
                const formData = new FormData();
                formData.append(
                  "file",
                  new Blob([fileData], { type: mime }),
                  fileName
                );
                formData.append("uploadPath", uploadPath);
                const uploadRes = await fetch(
                  "https://kieai.redpandaai.co/api/file-stream-upload",
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${getApiKey("kie")}`,
                    },
                    body: formData,
                  }
                );
                if (!uploadRes.ok) {
                  res.writeHead(500, {
                    "Content-Type": "application/json",
                  });
                  res.end(
                    JSON.stringify({
                      error: `Upload failed for ${fileName}: ${uploadRes.status}`,
                    })
                  );
                  return;
                }
                const uploadBody = (await uploadRes.json()) as {
                  data?: { downloadUrl?: string };
                  downloadUrl?: string;
                };
                const dlUrl =
                  uploadBody.data?.downloadUrl ?? uploadBody.downloadUrl;
                if (!dlUrl) {
                  res.writeHead(500, {
                    "Content-Type": "application/json",
                  });
                  res.end(
                    JSON.stringify({
                      error: `Upload returned no downloadUrl for ${fileName}`,
                    })
                  );
                  return;
                }
                setupVars[varName] = dlUrl;
              }
            }
            state[workflowId].setupOutputs = setupVars;
            writeWorkflowState(state);
          }
        }

        const results = await Promise.allSettled(
          wf.steps.map(async (stepDef, i) => {
            const step = steps[String(i)];
            if (step.response) return { skipped: true };
            const resolvedBody = stepDef.request.body
              ? resolveBody(stepDef.request.body, setupVars)
              : undefined;
            const stepApiKey = getApiKey(stepDef.apiProvider);
            const apiRes = await fetch(stepDef.request.url, {
              method: stepDef.request.method,
              headers: {
                Authorization: `Bearer ${stepApiKey}`,
                "Content-Type": "application/json",
              },
              body: resolvedBody ? JSON.stringify(resolvedBody) : undefined,
            });
            const responseBody = await apiRes.json();
            const outputs = extractOutputs(
              responseBody,
              stepDef.outputExtractors
            );
            step.status = "ready";
            step.request = {
              method: stepDef.request.method,
              url: stepDef.request.url,
              body: resolvedBody,
            };
            step.response = { status: apiRes.status, body: responseBody };
            step.outputs = outputs;
            return { ok: true, outputs };
          })
        );
        writeWorkflowState(state);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, results }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/workflow/poll-all") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { workflowId } = JSON.parse(body) as { workflowId: string };
        const wf = workflows.find((w) => w.id === workflowId);
        if (!wf) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unknown workflow" }));
          return;
        }
        const state = readWorkflowState();
        const steps = getOrInitWorkflowState(state, workflowId);
        const results = await Promise.allSettled(
          wf.steps.map(async (stepDef, i) => {
            if (!stepDef.async) return { skipped: true };
            const step = steps[String(i)];
            if (!step.response || !step.outputs) return { skipped: true };
            const asyncKeys = Object.keys(stepDef.async.outputExtractors);
            const alreadyDone = asyncKeys.every(
              (k) => k in (step.outputs ?? {})
            );
            if (alreadyDone) return { skipped: true, isDone: true };
            const apiKey = getApiKey(stepDef.apiProvider);
            if (!apiKey) return { error: "API key not set" };
            const vars = { ...step.outputs };
            const pollUrl = resolveTemplate(stepDef.async.pollUrl, vars);
            const apiRes = await fetch(pollUrl, {
              method: stepDef.async.pollMethod,
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            const responseBody = await apiRes.json();
            const statusVal =
              extractByPath(responseBody, stepDef.async.completionField) ?? "";
            const isDone = stepDef.async.completionValues.includes(statusVal);
            const isFailed = stepDef.async.failureValues.includes(statusVal);
            if (isDone) {
              const asyncOutputs = extractOutputs(
                responseBody,
                stepDef.async.outputExtractors
              );
              step.outputs = { ...step.outputs, ...asyncOutputs };
              // Cache media files locally
              const cacheId = step.outputs?.task_id ?? step.outputs?.request_id;
              if (cacheId) {
                for (const [key, url] of Object.entries(step.outputs ?? {})) {
                  if (
                    key !== "task_id" &&
                    key !== "request_id" &&
                    typeof url === "string" &&
                    url.startsWith("http")
                  ) {
                    step.outputs[key] = await cacheMedia(cacheId, url);
                  }
                }
              }
            }
            if (isFailed) {
              step.status = "failed";
              step.error = `Async operation ${statusVal}`;
            }
            let progress: number | undefined;
            if (stepDef.async.progressField) {
              const raw = extractByPath(
                responseBody,
                stepDef.async.progressField
              );
              if (raw != null) progress = Number(raw);
            }
            return { isDone, isFailed, progress, status: statusVal };
          })
        );
        writeWorkflowState(state);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            results: results.map((r) =>
              r.status === "fulfilled" ? r.value : { error: String(r.reason) }
            ),
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/workflow/reset") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { workflowId } = JSON.parse(body) as { workflowId: string };
        const wf = workflows.find((w) => w.id === workflowId);
        if (!wf) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unknown workflow" }));
          return;
        }
        const state = readWorkflowState();
        delete state[workflowId];
        writeWorkflowState(state);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
    return;
  }

  if (req.method === "GET" && req.url?.startsWith("/harness_media/")) {
    const fileName = path.basename(req.url);
    const filePath = path.join(MEDIA_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const mimeTypes: Record<string, string> = {
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      mp3: "audio/mpeg",
      wav: "audio/wav",
    };
    const mime = mimeTypes[ext] ?? "application/octet-stream";
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": mime,
      "Content-Length": stat.size,
      "Cache-Control": "public, max-age=86400",
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Polly.js Test Harness → http://localhost:${PORT}`);
});
