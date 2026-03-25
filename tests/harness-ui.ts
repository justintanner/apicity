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
  .pipeline-label { padding: 6px 16px 6px 24px; font-size: 12px; color: #cba6f7; cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .pipeline-label:hover { background: #313244; }
  .pipeline-label .arrow { font-size: 10px; transition: transform 0.15s; }
  .pipeline-label .arrow.collapsed { transform: rotate(-90deg); }
  .pipeline-step { padding: 6px 16px 6px 40px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 8px; border-left: 3px solid transparent; }
  .pipeline-step:hover { background: #313244; }
  .pipeline-step.active { background: #313244; border-left-color: #cba6f7; }
  .pipeline-step .step-num { color: #6c7086; font-size: 11px; min-width: 16px; }
  .pipeline-step .step-arrow { color: #45475a; font-size: 10px; margin: 0 2px; }
  .pipeline-hidden { display: none; }
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
  .dot.locked { background: #585b70; }
  .dot.ready { background: #f9e2af; }
  .dot.running { background: #89b4fa; animation: pulse 1.5s infinite; }
  .dot.completed { background: #a6e3a1; }
  .dot.failed { background: #f38ba8; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
  .section-label { padding: 8px 16px; font-size: 14px; color: #a6adc8; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #313244; }
  .wf-step { padding: 6px 16px 6px 32px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 8px; border-left: 3px solid transparent; }
  .wf-step:hover { background: #313244; }
  .wf-step.active { background: #313244; border-left-color: #cba6f7; }
  .wf-step .step-num { color: #6c7086; font-size: 11px; min-width: 16px; }
  .wf-step.locked { opacity: 0.5; cursor: default; }
  .step-description { color: #a6adc8; font-size: 12px; font-style: italic; margin-bottom: 12px; }
  .review-badge { font-size: 10px; padding: 1px 6px; border-radius: 3px; font-weight: 600; margin-left: auto; flex-shrink: 0; }
  .review-badge.needs-review { background: #f38ba8; color: #1e1e2e; }
  .review-badge.approved { background: #a6e3a1; color: #1e1e2e; }
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
  #run-btn { background: #f9e2af; color: #1e1e2e; }
  #run-btn:hover { background: #f5c2e7; }
  #run-btn:disabled { opacity: .4; cursor: default; }
  #run-btn.hidden { display: none; }
  #refresh-btn { background: #89b4fa; color: #1e1e2e; }
  #refresh-btn:hover { background: #74c7ec; }
  #refresh-btn:disabled { opacity: .4; cursor: default; }
  #refresh-btn.hidden { display: none; }
  #save-output-btn { background: #cba6f7; color: #1e1e2e; }
  #save-output-btn:hover { background: #b4befe; }
  #save-output-btn:disabled { opacity: .4; cursor: default; }
  #save-output-btn.hidden { display: none; }
  #reset-btn { background: #45475a; color: #cdd6f4; }
  #reset-btn:hover { background: #f38ba8; color: #1e1e2e; }
  #reset-btn.hidden { display: none; }
  #run-all-btn { background: #f9e2af; color: #1e1e2e; }
  #run-all-btn:hover { background: #f5c2e7; }
  #run-all-btn:disabled { opacity: .4; cursor: default; }
  #run-all-btn.hidden { display: none; }
  #refresh-all-btn { background: #89b4fa; color: #1e1e2e; }
  #refresh-all-btn:hover { background: #74c7ec; }
  #refresh-all-btn:disabled { opacity: .4; cursor: default; }
  #refresh-all-btn.hidden { display: none; }
  .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; overflow-y: auto; }
  .compare-cell { background: #181825; border-radius: 8px; padding: 16px; border: 1px solid #313244; display: flex; flex-direction: column; }
  .compare-cell .model-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .compare-cell .model-name { font-size: 14px; font-weight: 600; color: #cba6f7; }
  .compare-cell .model-desc { font-size: 11px; color: #6c7086; margin-bottom: 8px; }
  .compare-cell .compare-image { max-width: 100%; border-radius: 6px; border: 1px solid #313244; margin-top: 8px; }
  .compare-cell .cell-status { font-size: 12px; color: #a6adc8; margin-top: 4px; }
  #copy-llm-btn { background: #89b4fa; color: #1e1e2e; }
  #copy-llm-btn:hover { background: #74c7ec; }
  #copy-llm-btn:disabled { opacity: .4; cursor: default; }
  .pipeline-context { padding: 8px 12px; background: #181825; border-radius: 6px; margin-bottom: 12px; font-size: 12px; color: #a6adc8; display: flex; gap: 12px; align-items: center; }
  .pipeline-context .pipe-name { color: #cba6f7; font-weight: 600; }
  .pipeline-context .pipe-step { color: #89b4fa; }
  .pipeline-context .pipe-input { color: #a6e3a1; }
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
  <div class="section-label">Workflows</div>
  <div id="workflow-list"></div>
  <h2>Recordings</h2>
  <div id="rec-list"></div>
</div>
<div class="resize-handle" id="resize-1"></div>
<div class="pane" id="req-pane"><div class="empty">Select a recording</div></div>
<div class="resize-handle" id="resize-2"></div>
<div class="pane" id="res-pane"></div>
<div id="actions">
  <button id="run-btn" class="hidden">Run</button>
  <button id="run-all-btn" class="hidden">Run All</button>
  <button id="approve-btn" disabled>Approve</button>
  <button id="refresh-btn" class="hidden">Refresh</button>
  <button id="refresh-all-btn" class="hidden">Refresh All</button>
  <button id="save-output-btn" class="hidden" disabled>Save Output</button>
  <span id="status-msg"></span>
  <div class="spacer"></div>
  <button id="reset-btn" class="hidden">Reset</button>
  <button id="copy-llm-btn" disabled>Copy for LLM</button>
</div>
<script>
let recordings = [];
let selected = null;
let selectedEntry = 0;
let renderGeneration = 0;
let collapsedPipelines = {};
let e2eOutputs = {};
let lastRefreshResult = null;
let workflowData = [];
let selectedWorkflow = null;
let selectedWfStep = null;
let collapsedWorkflows = {};

function loadWorkflows() {
  fetch("/api/workflows").then(function(r) { return r.json(); }).then(function(data) {
    workflowData = data || [];
    render();
  }).catch(function() { workflowData = []; });
}

function renderWorkflowSidebar() {
  var wfList = document.getElementById("workflow-list");
  var html = "";
  for (var w = 0; w < workflowData.length; w++) {
    var wf = workflowData[w];
    var isCollapsed = collapsedWorkflows[wf.id];
    var arrowClass = isCollapsed ? " collapsed" : "";
    var layoutBadge = wf.layout === "compare"
      ? ' <span style="font-size:10px;color:#f9e2af;padding:1px 4px;background:#45475a;border-radius:3px">compare</span>'
      : '';
    html += '<div class="pipeline-label" data-wf="' + wf.id + '">' +
      '<span class="arrow' + arrowClass + '">\\u25BE</span> ' + wf.name + layoutBadge + '</div>';
    for (var s = 0; s < wf.steps.length; s++) {
      var step = wf.steps[s];
      var isActive = selectedWorkflow === wf.id && selectedWfStep === s;
      var hiddenClass = isCollapsed ? " pipeline-hidden" : "";
      var lockedClass = (wf.layout !== "compare" && step.status === "locked") ? " locked" : "";
      html += '<div class="wf-step' + (isActive ? ' active' : '') + hiddenClass + lockedClass + '" data-wf="' + wf.id + '" data-step="' + s + '">' +
        '<span class="step-num">' + (s + 1) + '.</span>' +
        '<span class="dot ' + step.status + '"></span>' +
        step.name + '</div>';
    }
  }
  wfList.innerHTML = html;

  wfList.querySelectorAll(".pipeline-label").forEach(function(el) {
    el.addEventListener("click", function() {
      var wfId = el.dataset.wf;
      var wf = workflowData.find(function(w) { return w.id === wfId; });
      if (wf && wf.layout === "compare") {
        selectedWorkflow = wfId;
        selectedWfStep = null;
        selected = null;
        selectedEntry = 0;
      } else {
        collapsedWorkflows[wfId] = !collapsedWorkflows[wfId];
      }
      render();
    });
  });

  wfList.querySelectorAll(".wf-step").forEach(function(el) {
    el.addEventListener("click", function() {
      var wfId = el.dataset.wf;
      var stepIdx = parseInt(el.dataset.step);
      // Find the step status
      var wf = workflowData.find(function(w) { return w.id === wfId; });
      if (wf && wf.layout !== "compare" && wf.steps[stepIdx] && wf.steps[stepIdx].status === "locked") return;
      selectedWorkflow = wfId;
      selectedWfStep = wf && wf.layout === "compare" ? null : stepIdx;
      selected = null;
      selectedEntry = 0;
      render();
    });
  });
}

function renderWorkflowStep() {
  var wf = workflowData.find(function(w) { return w.id === selectedWorkflow; });
  if (!wf) return;
  var step = wf.steps[selectedWfStep];
  if (!step) return;

  var reqPane = document.getElementById("req-pane");
  var resPane = document.getElementById("res-pane");

  // Request pane
  var reqHtml = '<div class="pane-label">' + wf.name + '</div>';
  reqHtml += '<div style="font-size:15px;font-weight:600;margin-bottom:4px">Step ' + (selectedWfStep + 1) + ': ' + step.name + '</div>';
  reqHtml += '<div class="step-description">' + step.description + '</div>';
  if (step.request) {
    reqHtml += '<div style="font-size:13px;font-weight:600;margin-bottom:6px">' + step.request.method + ' ' + step.request.url + '</div>';
    if (step.request.body) {
      var bodyStr = JSON.stringify(step.request.body, null, 2);
      reqHtml += wrapBody(bodyStr, inlineMediaPreviews(syntaxHighlight(bodyStr)));
    }
  } else {
    reqHtml += '<div style="color:#6c7086;margin-top:16px">Click <strong>Run</strong> to execute this step</div>';
  }
  reqPane.innerHTML = reqHtml;

  // Response pane
  if (step.response) {
    var resBody = JSON.stringify(step.response.body, null, 2);
    var resHtml = '<div class="pane-label">Response ' + step.response.status + '</div>' +
      wrapBody(resBody, inlineMediaPreviews(syntaxHighlight(resBody)));

    // Show resolved outputs (image_url, video_url) with media previews
    if (step.outputs && Object.keys(step.outputs).length) {
      resHtml += '<div class="pane-label" style="margin-top:16px">Outputs</div>';
      var outStr = JSON.stringify(step.outputs, null, 2);
      resHtml += wrapBody(outStr, inlineMediaPreviews(syntaxHighlight(outStr)));
    }

    resHtml += '<div id="check-result"></div>';
    resPane.innerHTML = resHtml;
  } else {
    resPane.innerHTML = '<div class="empty">Click Run to execute this step</div>';
  }
}

function renderCompareGrid() {
  var wf = workflowData.find(function(w) { return w.id === selectedWorkflow; });
  if (!wf) return;

  var reqPane = document.getElementById("req-pane");
  var resPane = document.getElementById("res-pane");

  // Extract prompt from first step's request body
  var prompt = "";
  if (wf.steps[0] && wf.steps[0].request && wf.steps[0].request.body) {
    var body = wf.steps[0].request.body;
    prompt = (body.input && body.input.prompt) || "";
  } else {
    var stepDef = wf.steps[0];
    if (stepDef) prompt = "Pending...";
  }

  // Show setup info if workflow has setup dependencies
  var setupInfo = wf.setupOutputs || {};
  var gridHtml = '<div class="pane-label">' + wf.name + '</div>';
  if (Object.keys(setupInfo).length > 0) {
    gridHtml += '<div style="padding:4px 16px 0;font-size:12px;color:#6c7086">';
    for (var sk in setupInfo) {
      var sv = setupInfo[sk];
      var isImg = /\\.(png|jpg|jpeg|gif|webp)$/i.test(sv);
      gridHtml += '<div style="margin:2px 0"><span style="color:#cba6f7">' + sk + ':</span> ';
      if (isImg) {
        gridHtml += '<img src="' + sv + '" style="max-height:40px;border-radius:4px;vertical-align:middle;margin-left:4px">';
      } else {
        gridHtml += '<span style="color:#a6adc8">' + sv.substring(0, 80) + (sv.length > 80 ? '\u2026' : '') + '</span>';
      }
      gridHtml += '</div>';
    }
    gridHtml += '</div>';
  }
  if (prompt) {
    gridHtml += '<div style="padding:4px 16px 0;font-size:13px;color:#a6adc8;line-height:1.5">' +
      '<span style="color:#89b4fa;font-weight:600">Prompt:</span> ' +
      '<span style="color:#cdd6f4">' + prompt + '</span></div>';
  }
  gridHtml += '<div class="compare-grid">';

  for (var s = 0; s < wf.steps.length; s++) {
    var step = wf.steps[s];
    gridHtml += '<div class="compare-cell">';
    gridHtml += '<div class="model-header">';
    gridHtml += '<span class="dot ' + step.status + '"></span>';
    gridHtml += '<span class="model-name">' + step.name + '</span>';
    gridHtml += '</div>';
    gridHtml += '<div class="model-desc">' + step.description + '</div>';

    // Show media output (image or video)
    var mediaUrl = (step.outputs && (step.outputs.video_url || step.outputs.image_url)) || "";
    var isVideo = /\\.(mp4|webm|mov)$/i.test(mediaUrl) || (step.outputs && step.outputs.video_url);
    if (mediaUrl && isVideo) {
      gridHtml += '<video class="compare-image" src="' + mediaUrl + '" controls muted style="max-width:100%"></video>';
    } else if (mediaUrl) {
      gridHtml += '<img class="compare-image" src="' + mediaUrl + '" onerror="this.style.display=&quot;none&quot;">';
    } else if (step.status === "failed") {
      gridHtml += '<div class="cell-status" style="color:#f38ba8">' + (step.error || "Failed") + '</div>';
    } else if (step.response) {
      var asyncKeys = step.asyncOutputKeys || [];
      var asyncDone = asyncKeys.length === 0 || (step.outputs && asyncKeys.every(function(k) { return k in step.outputs; }));
      if (!asyncDone) {
        gridHtml += '<div class="cell-status" style="color:#89b4fa">Generating\u2026 click Refresh All</div>';
      }
    } else {
      gridHtml += '<div class="cell-status">Ready</div>';
    }

    if (step.request && step.request.body) {
      gridHtml += '<details style="margin-top:8px"><summary style="cursor:pointer;color:#6c7086;font-size:11px">Request Payload</summary>';
      gridHtml += '<pre class="body" style="font-size:11px;max-height:200px">' + syntaxHighlight(JSON.stringify(step.request.body, null, 2)) + '</pre>';
      gridHtml += '</details>';
    }
    if (step.response) {
      gridHtml += '<details style="margin-top:8px"><summary style="cursor:pointer;color:#6c7086;font-size:11px">Response JSON</summary>';
      gridHtml += '<pre class="body" style="font-size:11px;max-height:200px">' + syntaxHighlight(JSON.stringify(step.response.body, null, 2)) + '</pre>';
      gridHtml += '</details>';
    }

    gridHtml += '</div>';
  }

  gridHtml += '</div>';
  reqPane.innerHTML = gridHtml;
  resPane.innerHTML = '';
}

function isE2EStep(recName) {
  return /\\/e2e-[^/]+\\/step-\\d+/.test(recName);
}

function parseE2EStep(recName) {
  var m = recName.match(/^([^/]+)\\/e2e-([^/]+)\\/step-(\\d+)-(.+?)(?:_\\d+)?$/);
  if (!m) {
    m = recName.match(/^([^/]+)_\\d+\\/e2e-([^/]+)_\\d+\\/step-(\\d+)-(.+?)(?:_\\d+)?$/);
  }
  if (!m) return null;
  return { provider: m[1].replace(/_\\d+$/, ""), pipeline: m[2].replace(/_\\d+$/, ""), stepNum: parseInt(m[3]), stepName: m[4].replace(/_\\d+$/, "") };
}

function getE2ERecordingName(rec) {
  var rn = "";
  try { var har = rec.entries[0]; rn = ""; } catch {}
  var dn = displayName(rec.name);
  // Reconstruct: provider/e2e-pipeline/step-N-name
  var parts = rec.name.split("/");
  var clean = parts.map(function(p) { return p.replace(/_\\d+$/, ""); });
  return clean.join("/");
}

function detectStepOutputs(rec) {
  // Determine what outputs this E2E step can provide
  var outputs = {};
  for (var i = 0; i < rec.entries.length; i++) {
    var text = rec.entries[i].response?.content?.text;
    if (!text) continue;
    try {
      var body = JSON.parse(text);
      if (body.data && Array.isArray(body.data) && body.data[0] && body.data[0].url) {
        outputs.image_url = body.data[0].url;
      }
      if (body.request_id) {
        outputs.request_id = body.request_id;
      }
      if (body.video && body.video.url) {
        outputs.video_url = body.video.url;
      }
      if (body.data && body.data.taskId) {
        outputs.task_id = body.data.taskId;
      }
    } catch {}
  }
  return outputs;
}

function loadE2EOutputs() {
  fetch("/api/e2e-outputs").then(function(r) { return r.json(); }).then(function(data) {
    e2eOutputs = data || {};
  }).catch(function() { e2eOutputs = {}; });
}

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
  // "url" keys with HTTP URLs that have no recognized media extension — try as image with graceful fallback
  html = html.replace(
    /(<span class="json-key">"url"<\\/span>:\\s*<span class="json-str">")(https?:\\/\\/[^"]+)"<\\/span>(?!<img|<video|<audio)/gi,
    function(match, prefix, fullUrl) {
      return prefix + fullUrl + '"</span>' +
        '<img class="b64-img-preview" src="' + fullUrl + '" onerror="this.style.display=\\x27none\\x27">';
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
          } else if (/\\.png|\\.jpg|\\.jpeg|\\.webp|image/i.test(u)) {
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

  renderWorkflowSidebar();

  var list = document.getElementById("rec-list");

  // Group recordings by provider, separating E2E pipelines
  var groups = {};
  var groupOrder = [];
  for (var i = 0; i < recordings.length; i++) {
    var dn = displayName(recordings[i].name);
    if (!groups[dn.provider]) {
      groups[dn.provider] = { regular: [], pipelines: {} };
      groupOrder.push(dn.provider);
    }
    var parsed = parseE2EStep(recordings[i].name);
    if (parsed) {
      var pipeKey = parsed.pipeline;
      if (!groups[dn.provider].pipelines[pipeKey]) {
        groups[dn.provider].pipelines[pipeKey] = [];
      }
      groups[dn.provider].pipelines[pipeKey].push({ idx: i, stepNum: parsed.stepNum, stepName: parsed.stepName, rec: recordings[i] });
    } else {
      groups[dn.provider].regular.push({ idx: i, test: dn.test, rec: recordings[i] });
    }
  }

  var html = "";
  for (var g = 0; g < groupOrder.length; g++) {
    var provider = groupOrder[g];
    var group = groups[provider];
    html += '<div class="provider-label">' + provider + '</div>';

    // Regular recordings
    for (var j = 0; j < group.regular.length; j++) {
      var item = group.regular[j];
      var isActive = selected === item.idx;
      var badge = item.rec.gitStatus === "clean"
        ? ''
        : '<span class="review-badge needs-review">review</span>';
      html += '<div class="rec-item' + (isActive ? ' active' : '') + '" data-idx="' + item.idx + '">' +
        '<span class="dot ' + item.rec.gitStatus + '"></span>' + item.test + badge + '</div>';
      if (isActive && item.rec.entries.length > 1) {
        for (var e = 0; e < item.rec.entries.length; e++) {
          html += '<div class="entry-item' + (selectedEntry === e ? ' active' : '') + '" data-idx="' + item.idx + '" data-entry="' + e + '">' +
            entryLabel(item.rec.entries[e]) + '</div>';
        }
      }
    }

    // E2E pipelines
    var pipeKeys = Object.keys(group.pipelines);
    for (var p = 0; p < pipeKeys.length; p++) {
      var pipeKey = pipeKeys[p];
      var steps = group.pipelines[pipeKey].sort(function(a, b) { return a.stepNum - b.stepNum; });
      var isCollapsed = collapsedPipelines[provider + "/" + pipeKey];
      var arrowClass = isCollapsed ? " collapsed" : "";
      html += '<div class="pipeline-label" data-pipe="' + provider + '/' + pipeKey + '">' +
        '<span class="arrow' + arrowClass + '">\\u25BE</span> e2e-' + pipeKey + '</div>';
      for (var s = 0; s < steps.length; s++) {
        var step = steps[s];
        var stepActive = selected === step.idx;
        var stepBadge = step.rec.gitStatus === "clean"
          ? ''
          : '<span class="review-badge needs-review">review</span>';
        var hiddenClass = isCollapsed ? " pipeline-hidden" : "";
        html += '<div class="pipeline-step' + (stepActive ? ' active' : '') + hiddenClass + '" data-idx="' + step.idx + '" data-pipe="' + provider + '/' + pipeKey + '">' +
          '<span class="step-num">' + step.stepNum + '.</span>' +
          '<span class="dot ' + step.rec.gitStatus + '"></span>' +
          step.stepName + stepBadge + '</div>';
        if (stepActive && step.rec.entries.length > 1) {
          for (var e = 0; e < step.rec.entries.length; e++) {
            html += '<div class="entry-item' + (selectedEntry === e ? ' active' : '') + hiddenClass + '" data-idx="' + step.idx + '" data-entry="' + e + '">' +
              entryLabel(step.rec.entries[e]) + '</div>';
          }
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
      selectedWorkflow = null;
      selectedWfStep = null;
      render();
    });
  });

  list.querySelectorAll(".pipeline-label").forEach(function(el) {
    el.addEventListener("click", function() {
      var pipe = el.dataset.pipe;
      collapsedPipelines[pipe] = !collapsedPipelines[pipe];
      render();
    });
  });

  list.querySelectorAll(".pipeline-step").forEach(function(el) {
    el.addEventListener("click", function() {
      var idx = parseInt(el.dataset.idx);
      if (selected !== idx) {
        selected = idx;
        selectedEntry = 0;
      }
      selectedWorkflow = null;
      selectedWfStep = null;
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
  var runBtn = document.getElementById("run-btn");
  var runAllBtn = document.getElementById("run-all-btn");
  var refreshAllBtn = document.getElementById("refresh-all-btn");
  var saveOutputBtn = document.getElementById("save-output-btn");
  var resetBtn = document.getElementById("reset-btn");
  var copyLlmBtn = document.getElementById("copy-llm-btn");

  // Compare mode
  if (selectedWorkflow !== null) {
    var compareWf = workflowData.find(function(w) { return w.id === selectedWorkflow; });
    if (compareWf && compareWf.layout === "compare") {
      renderCompareGrid();
      var statusMsg = document.getElementById("status-msg");

      runBtn.classList.add("hidden");
      refreshBtn.classList.add("hidden");
      saveOutputBtn.classList.add("hidden");
      resetBtn.classList.remove("hidden");
      copyLlmBtn.disabled = true;

      // Run All: visible if any step is ready with no response
      var anyRunnable = compareWf.steps.some(function(s) {
        return (s.status === "ready" && !s.response) || s.status === "failed";
      });
      if (anyRunnable) {
        runAllBtn.classList.remove("hidden");
        runAllBtn.disabled = false;
      } else {
        runAllBtn.classList.add("hidden");
      }

      // Refresh All: visible if any step has async pending
      var anyPending = compareWf.steps.some(function(s) {
        if (!s.hasAsync || !s.response) return false;
        var asyncKeys = s.asyncOutputKeys || [];
        return asyncKeys.length > 0 && !(s.outputs && asyncKeys.every(function(k) { return k in s.outputs; }));
      });
      if (anyPending) {
        refreshAllBtn.classList.remove("hidden");
        refreshAllBtn.disabled = false;
      } else {
        refreshAllBtn.classList.add("hidden");
      }

      // Approve: enable when all steps have their async outputs
      var allDone = compareWf.steps.every(function(s) {
        var asyncKeys = s.asyncOutputKeys || [];
        return asyncKeys.length === 0 || (s.outputs && asyncKeys.every(function(k) { return k in s.outputs; }));
      });
      var allApproved = compareWf.steps.every(function(s) { return s.status === "completed"; });
      btn.disabled = !allDone || allApproved;
      btn.textContent = "Approve All";

      if (!compareWf.steps.some(function(s) { return s.response; })) {
        statusMsg.textContent = "Ready \u2014 click Run All";
        statusMsg.style.color = "#f9e2af";
      } else if (anyPending) {
        statusMsg.textContent = "Generating\u2026 click Refresh All to poll";
        statusMsg.style.color = "#89b4fa";
      } else if (allDone && !allApproved) {
        statusMsg.textContent = "All complete \u2014 review and approve";
        statusMsg.style.color = "#a6e3a1";
      } else if (allApproved) {
        statusMsg.textContent = "All approved";
        statusMsg.style.color = "#a6e3a1";
      }

      return;
    }
  }

  // Workflow step mode
  if (selectedWorkflow !== null && selectedWfStep !== null) {
    var wf = workflowData.find(function(w) { return w.id === selectedWorkflow; });
    if (wf) {
      var step = wf.steps[selectedWfStep];
      renderWorkflowStep();

      var statusMsg = document.getElementById("status-msg");
      saveOutputBtn.classList.add("hidden");
      copyLlmBtn.disabled = !step.response;

      // Run button: visible when step is ready and not yet run (no response), or failed
      if (step.status === "ready" && !step.response || step.status === "failed") {
        runBtn.classList.remove("hidden");
        runBtn.disabled = false;
        runBtn.dataset.wf = selectedWorkflow;
        runBtn.dataset.step = String(selectedWfStep);
      } else {
        runBtn.classList.add("hidden");
      }

      // Approve button: enabled when step has a response and is not yet completed
      if (step.response && step.status !== "completed") {
        // For async steps, only enable approve if async outputs have been extracted
        var asyncKeys = step.asyncOutputKeys || [];
        var asyncDone = asyncKeys.length === 0 || (step.outputs && asyncKeys.every(function(k) { return k in step.outputs; }));
        if (step.hasAsync && !asyncDone) {
          btn.disabled = true;
          btn.textContent = "Approve";
        } else {
          btn.disabled = false;
          btn.textContent = selectedWfStep < wf.steps.length - 1 ? "Approve & Continue" : "Approve";
        }
      } else if (step.status === "completed") {
        btn.disabled = true;
        btn.textContent = "Approve";
        statusMsg.textContent = "Completed";
        statusMsg.style.color = "#a6e3a1";
      } else {
        btn.disabled = true;
        btn.textContent = "Approve";
      }

      // Refresh button: visible for async steps that have been run but not yet done
      if (step.hasAsync && step.response && step.status !== "completed") {
        refreshBtn.classList.remove("hidden");
        refreshBtn.dataset.wfMode = "true";
        refreshBtn.dataset.wf = selectedWorkflow;
        refreshBtn.dataset.step = String(selectedWfStep);
      } else {
        refreshBtn.classList.add("hidden");
      }

      if (step.status === "ready" && !step.response) {
        statusMsg.textContent = "Ready — click Run";
        statusMsg.style.color = "#f9e2af";
      } else if (step.status === "ready" && step.response && step.hasAsync) {
        statusMsg.textContent = "Running — click Refresh to poll";
        statusMsg.style.color = "#89b4fa";
      } else if (step.status === "ready" && step.response) {
        statusMsg.textContent = "Review and approve";
        statusMsg.style.color = "#f9e2af";
      } else if (step.status === "failed") {
        statusMsg.textContent = step.error || "Failed";
        statusMsg.style.color = "#f38ba8";
      }

      // Reset button: visible in workflow mode
      resetBtn.classList.remove("hidden");
    }
    return;
  }

  // Recording mode — hide workflow-only buttons
  runBtn.classList.add("hidden");
  runAllBtn.classList.add("hidden");
  refreshAllBtn.classList.add("hidden");
  resetBtn.classList.add("hidden");

  if (selected !== null && recordings[selected]) {
    var rec = recordings[selected];
    var parsed = parseE2EStep(rec.name);

    // Pipeline context header above response pane
    if (parsed) {
      var recKey = getE2ERecordingName(rec);
      var pipeSteps = [];
      for (var pi = 0; pi < recordings.length; pi++) {
        var pp = parseE2EStep(recordings[pi].name);
        if (pp && pp.pipeline === parsed.pipeline && pp.provider === parsed.provider) pipeSteps.push(pp);
      }
      var totalSteps = pipeSteps.length;
      var ctxHtml = '<div class="pipeline-context">' +
        '<span class="pipe-name">e2e-' + parsed.pipeline + '</span>' +
        '<span class="pipe-step">Step ' + parsed.stepNum + ' of ' + totalSteps + ': ' + parsed.stepName + '</span>';
      // Show input from previous step
      if (parsed.stepNum > 1) {
        var prevKey = parsed.provider + '/e2e-' + parsed.pipeline + '/step-' + (parsed.stepNum - 1);
        // Find the actual previous step recording name
        for (var pk in e2eOutputs) {
          if (pk.indexOf(prevKey) === 0 || pk === prevKey) {
            var prevOut = e2eOutputs[pk];
            var inputKeys = Object.keys(prevOut);
            if (inputKeys.length) {
              ctxHtml += '<span class="pipe-input">Input: ' + inputKeys.join(", ") + ' from step ' + (parsed.stepNum - 1) + '</span>';
            }
            break;
          }
        }
      }
      ctxHtml += '</div>';
      renderEntry(rec.entries[selectedEntry] || { request: { method: "", url: "about:blank", headers: [] }, response: { status: 0, statusText: "", headers: [], content: {} } });
      document.getElementById("res-pane").innerHTML = ctxHtml + document.getElementById("res-pane").innerHTML;
    } else {
      renderEntry(rec.entries[selectedEntry] || { request: { method: "", url: "about:blank", headers: [] }, response: { status: 0, statusText: "", headers: [], content: {} } });
    }

    btn.disabled = rec.gitStatus === "clean";
    copyLlmBtn.disabled = false;
    var statusMsg = document.getElementById("status-msg");
    if (rec.gitStatus === "clean") {
      statusMsg.textContent = "Approved";
      statusMsg.style.color = "#a6e3a1";
    } else {
      statusMsg.textContent = "Pending review — approve to stage for commit";
      statusMsg.style.color = "#f38ba8";
    }

    var reqId = getVideoRequestId(rec);
    var kieTaskId = getKieTaskId(rec);
    if (reqId || kieTaskId) {
      refreshBtn.classList.remove("hidden");
      refreshBtn.dataset.wfMode = "false";
      refreshBtn.dataset.requestId = reqId || kieTaskId;
      refreshBtn.dataset.provider = reqId ? "xai" : "kie";
    } else {
      refreshBtn.classList.add("hidden");
    }

    // Save Output button — visible for E2E steps
    if (parsed) {
      saveOutputBtn.classList.remove("hidden");
      var outputs = detectStepOutputs(rec);
      // Also check if refresh resolved a video URL
      if (lastRefreshResult && lastRefreshResult.video && lastRefreshResult.video.url) {
        outputs.video_url = lastRefreshResult.video.url;
      }
      if (lastRefreshResult && lastRefreshResult.request_id) {
        outputs.request_id = lastRefreshResult.request_id;
      }
      var outKeys = Object.keys(outputs);
      if (outKeys.length > 0) {
        saveOutputBtn.disabled = false;
        saveOutputBtn.textContent = "Save " + outKeys.join(", ");
        saveOutputBtn.dataset.recording = getE2ERecordingName(rec);
        saveOutputBtn.dataset.outputs = JSON.stringify(outputs);
      } else {
        saveOutputBtn.disabled = true;
        saveOutputBtn.textContent = "Save Output";
      }
    } else {
      saveOutputBtn.classList.add("hidden");
    }

    // Auto-eval: resolve task_ids and video statuses
    autoEvalKieTaskIds(gen);
    autoEvalFromResponse(rec, selectedEntry, gen);
    autoEvalXaiVideo(rec, gen);
  } else {
    refreshBtn.classList.add("hidden");
    saveOutputBtn.classList.add("hidden");
    copyLlmBtn.disabled = true;
  }
}

document.getElementById("approve-btn").addEventListener("click", async () => {
  // Workflow approve
  if (selectedWorkflow !== null && selectedWfStep !== null) {
    document.getElementById("status-msg").textContent = "Approving...";
    var res = await fetch("/api/workflow/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId: selectedWorkflow, stepIndex: selectedWfStep }),
    });
    if (res.ok) {
      var data = await res.json();
      // Reload workflow state and advance to next step
      await new Promise(function(resolve) {
        fetch("/api/workflows").then(function(r) { return r.json(); }).then(function(wfs) {
          workflowData = wfs || [];
          if (data.nextStep !== null) {
            selectedWfStep = data.nextStep;
          }
          resolve();
        });
      });
      render();
    } else {
      document.getElementById("status-msg").textContent = "Failed to approve";
    }
    return;
  }
  // Recording approve
  if (selected === null) return;
  const rec = recordings[selected];
  document.getElementById("status-msg").textContent = "Approving...";
  const res2 = await fetch("/api/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: rec.path }),
  });
  if (res2.ok) {
    rec.gitStatus = "clean";
    var msg = document.getElementById("status-msg");
    msg.textContent = "Approved";
    msg.style.color = "#a6e3a1";
    document.getElementById("approve-btn").disabled = true;
    render();
  } else {
    document.getElementById("status-msg").textContent = "Failed to approve";
  }
});

document.getElementById("run-btn").addEventListener("click", async () => {
  var btn = document.getElementById("run-btn");
  var wfId = btn.dataset.wf;
  var stepIdx = parseInt(btn.dataset.step);
  if (!wfId) return;
  btn.disabled = true;
  document.getElementById("status-msg").textContent = "Running...";
  document.getElementById("status-msg").style.color = "#89b4fa";
  try {
    var res = await fetch("/api/workflow/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId: wfId, stepIndex: stepIdx }),
    });
    var data = await res.json();
    if (!res.ok) {
      document.getElementById("status-msg").textContent = data.error || "Run failed";
      document.getElementById("status-msg").style.color = "#f38ba8";
      btn.disabled = false;
      return;
    }
    // Reload workflow state
    var wfRes = await fetch("/api/workflows");
    workflowData = await wfRes.json();
    render();
  } catch (err) {
    document.getElementById("status-msg").textContent = "Error: " + err.message;
    document.getElementById("status-msg").style.color = "#f38ba8";
    btn.disabled = false;
  }
});

document.getElementById("reset-btn").addEventListener("click", async () => {
  if (selectedWorkflow === null) return;
  var res = await fetch("/api/workflow/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflowId: selectedWorkflow }),
  });
  if (res.ok) {
    var wfRes = await fetch("/api/workflows");
    workflowData = await wfRes.json();
    selectedWfStep = 0;
    render();
  }
});

document.getElementById("run-all-btn").addEventListener("click", async () => {
  var btn = document.getElementById("run-all-btn");
  btn.disabled = true;
  document.getElementById("status-msg").textContent = "Running all models\u2026";
  document.getElementById("status-msg").style.color = "#89b4fa";
  try {
    var res = await fetch("/api/workflow/run-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId: selectedWorkflow }),
    });
    if (!res.ok) {
      var data = await res.json();
      document.getElementById("status-msg").textContent = data.error || "Run failed";
      document.getElementById("status-msg").style.color = "#f38ba8";
      btn.disabled = false;
      return;
    }
    var wfRes = await fetch("/api/workflows");
    workflowData = await wfRes.json();
    render();
  } catch (err) {
    document.getElementById("status-msg").textContent = "Error: " + err.message;
    document.getElementById("status-msg").style.color = "#f38ba8";
    btn.disabled = false;
  }
});

document.getElementById("refresh-all-btn").addEventListener("click", async () => {
  var btn = document.getElementById("refresh-all-btn");
  btn.disabled = true;
  document.getElementById("status-msg").textContent = "Polling all models\u2026";
  document.getElementById("status-msg").style.color = "#89b4fa";
  try {
    var res = await fetch("/api/workflow/poll-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId: selectedWorkflow }),
    });
    var data = await res.json();
    if (!res.ok) {
      document.getElementById("status-msg").textContent = data.error || "Poll failed";
      document.getElementById("status-msg").style.color = "#f38ba8";
    }
    var wfRes = await fetch("/api/workflows");
    workflowData = await wfRes.json();
    render();
  } catch (err) {
    document.getElementById("status-msg").textContent = "Error: " + err.message;
    document.getElementById("status-msg").style.color = "#f38ba8";
  }
  btn.disabled = false;
});

document.getElementById("refresh-btn").addEventListener("click", async () => {
  var btn = document.getElementById("refresh-btn");

  // Workflow poll mode
  if (btn.dataset.wfMode === "true") {
    var wfId = btn.dataset.wf;
    var stepIdx = parseInt(btn.dataset.step);
    btn.disabled = true;
    document.getElementById("status-msg").textContent = "Polling...";
    document.getElementById("status-msg").style.color = "#89b4fa";
    try {
      var pollRes = await fetch("/api/workflow/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: wfId, stepIndex: stepIdx }),
      });
      var pollData = await pollRes.json();
      if (!pollRes.ok) {
        document.getElementById("status-msg").textContent = pollData.error || "Poll failed";
        document.getElementById("status-msg").style.color = "#f38ba8";
      } else {
        var pct = typeof pollData.progress === "number" ? Math.round(pollData.progress > 1 ? pollData.progress : pollData.progress * 100) : "";
        document.getElementById("status-msg").textContent = "Status: " + pollData.status + (pct ? " (" + pct + "%)" : "");
        document.getElementById("status-msg").style.color = pollData.isDone ? "#a6e3a1" : pollData.isFailed ? "#f38ba8" : "#f9e2af";
        // Show poll result in check-result div
        var resultDiv = document.getElementById("check-result");
        if (resultDiv) {
          var pollBodyStr = JSON.stringify(pollData.body, null, 2);
          resultDiv.innerHTML = '<div class="pane-label">Poll Result</div>' +
            wrapBody(pollBodyStr, inlineMediaPreviews(syntaxHighlight(pollBodyStr)));
        }
        if (pollData.isDone || pollData.isFailed) {
          // Reload workflow state to get updated outputs
          var wfRes = await fetch("/api/workflows");
          workflowData = await wfRes.json();
          render();
          return;
        }
      }
    } catch (err) {
      document.getElementById("status-msg").textContent = "Error: " + err.message;
      document.getElementById("status-msg").style.color = "#f38ba8";
    }
    btn.disabled = false;
    return;
  }

  // Recording refresh mode
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
      lastRefreshResult = data;
    } else {
      statusMsg.textContent = "Status: " + data.status;
      if (resultDiv) resultDiv.innerHTML = renderCheckResult(data);
      lastRefreshResult = data;
    }
    // Update Save Output button if we got new data
    if (selected !== null && recordings[selected]) {
      var selRec = recordings[selected];
      var selParsed = parseE2EStep(selRec.name);
      if (selParsed) {
        var saveBtn = document.getElementById("save-output-btn");
        var outputs = detectStepOutputs(selRec);
        if (lastRefreshResult && lastRefreshResult.video && lastRefreshResult.video.url) {
          outputs.video_url = lastRefreshResult.video.url;
        }
        if (lastRefreshResult && lastRefreshResult.request_id) {
          outputs.request_id = lastRefreshResult.request_id;
        }
        var outKeys = Object.keys(outputs);
        if (outKeys.length > 0) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save " + outKeys.join(", ");
          saveBtn.dataset.recording = getE2ERecordingName(selRec);
          saveBtn.dataset.outputs = JSON.stringify(outputs);
        }
      }
    }
  } catch (err) {
    statusMsg.textContent = "Error: " + err.message;
  }
  btn.disabled = false;
});

document.getElementById("save-output-btn").addEventListener("click", async function() {
  var btn = document.getElementById("save-output-btn");
  var recording = btn.dataset.recording;
  var outputs = btn.dataset.outputs;
  if (!recording || !outputs) return;
  btn.disabled = true;
  var statusMsg = document.getElementById("status-msg");
  statusMsg.textContent = "Saving outputs...";
  try {
    var res = await fetch("/api/save-step-output", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recording: recording, outputs: JSON.parse(outputs) }),
    });
    if (res.ok) {
      statusMsg.textContent = "Outputs saved";
      statusMsg.style.color = "#a6e3a1";
      btn.textContent = "Saved!";
      // Refresh e2e outputs cache
      loadE2EOutputs();
      setTimeout(function() { btn.textContent = "Save Output"; }, 1200);
    } else {
      var data = await res.json();
      statusMsg.textContent = data.error || "Failed to save";
      statusMsg.style.color = "#f38ba8";
      btn.disabled = false;
    }
  } catch (err) {
    statusMsg.textContent = "Error: " + err.message;
    statusMsg.style.color = "#f38ba8";
    btn.disabled = false;
  }
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

Promise.all([
  fetch("/api/recordings").then(r => r.json()),
  fetch("/api/workflows").then(r => r.json()),
]).then(function(results) {
  recordings = results[0];
  workflowData = results[1] || [];
  // Default: select first workflow step if available, else first recording
  if (workflowData.length && workflowData[0].steps.length) {
    selectedWorkflow = workflowData[0].id;
    selectedWfStep = 0;
  } else if (recordings.length) {
    selected = 0;
  }
  loadE2EOutputs();
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
        const apiKey = getApiKey(wf.steps[0].apiProvider);
        if (!apiKey) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "API key not set" }));
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
                    headers: { Authorization: `Bearer ${apiKey}` },
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
            const apiRes = await fetch(stepDef.request.url, {
              method: stepDef.request.method,
              headers: {
                Authorization: `Bearer ${apiKey}`,
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
