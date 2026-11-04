import type { ProviderExchange } from "../types";
import type { Extracted, Extractor } from "./shared";
import {
  SUBMIT_PENDING,
  asFiniteNumber,
  framesOf,
  get,
  headerNumber,
  modelFrom,
  numberAt,
  pathOf,
  setNumber,
} from "./shared";
import {
  findUsage,
  readTokenUsage,
  readUsageMetadata,
  usageEvidence,
} from "./tokens";

const USD_PER_KIE_CREDIT = 0.005;
const XAI_TICKS_PER_USD = 1e10;
const MICROS_PER_USD = 1e6;

function blank(exchange: ProviderExchange): Extracted {
  return { usage: {}, evidence: [], model: modelFrom(exchange), warnings: [] };
}

function warn(out: Extracted, warning: string): void {
  (out.warnings ??= []).push(warning);
}

// The final state of a token call: usage present, or nothing to say yet.
function settleTokens(exchange: ProviderExchange, out: Extracted): void {
  const status = framesOf(exchange.responseBody)
    .map((frame) => get(frame, "status") ?? get(frame, "response.status"))
    .filter((value) => typeof value === "string")
    .at(-1);
  if (status === "queued" || status === "in_progress") {
    out.settled = false;
    warn(out, SUBMIT_PENDING);
  }
  if (exchange.bodyTruncated && out.usage.outputTokens === undefined) {
    out.settled = false;
    warn(
      out,
      "the captured body was truncated before the usage frame, so usage is incomplete"
    );
  }
}

function serviceTierOf(exchange: ProviderExchange): string | undefined {
  for (const frame of [...framesOf(exchange.responseBody)].reverse()) {
    for (const path of ["service_tier", "response.service_tier"]) {
      const value = get(frame, path);
      if (typeof value === "string") return value;
    }
    const nested = get(frame, "usage.service_tier");
    if (typeof nested === "string") return nested;
  }
  return undefined;
}

const tokenFamily: Extractor = (exchange) => {
  const out = blank(exchange);
  const found = findUsage(exchange.responseBody);
  if (found) readTokenUsage(found, out);
  out.serviceTier = serviceTierOf(exchange);
  settleTokens(exchange, out);
  return out;
};

const xai: Extractor = (exchange) => {
  const out = tokenFamily(exchange);
  const found = findUsage(exchange.responseBody);
  const ticks = found ? numberAt(found.usage, "cost_in_usd_ticks") : undefined;
  if (ticks !== undefined && found) {
    out.statedUsd = ticks / XAI_TICKS_PER_USD;
    out.evidence.push(usageEvidence(found, "cost_in_usd_ticks"));
  }
  const path = pathOf(exchange.url);
  if (/\/v1\/videos\//.test(path) && exchange.method === "GET") {
    const body = exchange.responseBody;
    setNumber(
      out,
      "seconds",
      numberAt(body, "video.duration"),
      "video.duration"
    );
    const status = get(body, "status");
    if (status !== "done" && status !== "failed") {
      out.settled = false;
      warn(out, SUBMIT_PENDING);
    }
  } else if (/\/v1\/videos\//.test(path) && exchange.method === "POST") {
    out.settled = false;
    warn(out, SUBMIT_PENDING);
  }
  return out;
};

// A poll's own answer to "is this task over": the market routes report state,
// the older Veo and image routes successFlag (0 while generating), and Suno a
// status. undefined means the response is not a poll.
function kieTaskFinished(body: unknown): boolean | undefined {
  const state = get(body, "data.state");
  if (typeof state === "string") {
    return state === "success" || state === "fail" || state === "failed";
  }
  const flag = get(body, "data.successFlag");
  if (typeof flag === "number") return flag !== 0;
  const status = get(body, "data.status");
  if (typeof status === "string") {
    return status === "SUCCESS" || /FAILED|ERROR|EXCEPTION/.test(status);
  }
  return undefined;
}

const kie: Extractor = (exchange) => {
  const out = blank(exchange);
  const body = exchange.responseBody;
  const found = findUsage(body);
  if (found) readTokenUsage(found, out);
  readUsageMetadata(body, out);
  // A pass-through usage.cost_in_usd_ticks on the grok routes is xAI's figure,
  // not KIE's bill, so it is not read.
  const frames = framesOf(body);
  const chatCredits = frames
    .map((frame) => asFiniteNumber(get(frame, "credits_consumed")))
    .filter((value) => value !== undefined)
    .at(-1);
  if (chatCredits !== undefined) {
    setNumber(out, "credits", chatCredits, "credits_consumed");
    out.statedUsd = chatCredits * USD_PER_KIE_CREDIT;
  }
  const imageTool = (path: string) => numberAt(get(body, "tool_usage"), path);
  setNumber(
    out,
    "imageOutputTokens",
    imageTool("image_gen.output_tokens_details.image_tokens"),
    "tool_usage.image_gen.output_tokens_details.image_tokens"
  );
  setNumber(
    out,
    "imageInputTokens",
    imageTool("image_gen.input_tokens_details.image_tokens"),
    "tool_usage.image_gen.input_tokens_details.image_tokens"
  );

  const taskCredits = numberAt(body, "data.creditsConsumed");
  if (taskCredits !== undefined) {
    setNumber(out, "credits", taskCredits, "data.creditsConsumed");
    out.statedUsd = taskCredits * USD_PER_KIE_CREDIT;
  }
  const taskModel = get(body, "data.model");
  if (typeof taskModel === "string") out.model = taskModel;

  const finished = kieTaskFinished(body);
  if (finished !== undefined) {
    out.settled = finished;
    if (!finished) warn(out, SUBMIT_PENDING);
  } else if (
    exchange.method === "POST" &&
    get(body, "data.taskId") !== undefined
  ) {
    out.settled = false;
    warn(out, SUBMIT_PENDING);
  }
  return out;
};

const MACHGEN_RUNNING = new Set(["PENDING", "QUEUED", "RUNNING", "PROCESSING"]);

const machgen: Extractor = (exchange) => {
  const out = blank(exchange);
  const body = exchange.responseBody;
  const path = pathOf(exchange.url);
  const model = get(body, "metadata.model");
  if (typeof model === "string") out.model = model;
  if (/\/api\/v0\/tasks\/[^/]+\/billing/.test(path)) {
    const list = numberAt(body, "generation_cost_micros");
    const net = numberAt(body, "net_cost_micros");
    if (list !== undefined) {
      out.statedListUsd = list / MICROS_PER_USD;
      out.evidence.push("generation_cost_micros");
    }
    if (net !== undefined) {
      out.statedUsd = net / MICROS_PER_USD;
      out.evidence.push("net_cost_micros");
    }
    return out;
  }
  setNumber(
    out,
    "seconds",
    numberAt(body, "metadata.duration_secs"),
    "metadata.duration_secs"
  );
  if (/\/api\/v0\/upscale\/quote/.test(path)) {
    warn(out, "a quote states a price before the call; it is not a charge");
    return out;
  }
  if (/\/api\/v0\/generate/.test(path)) {
    out.settled = false;
    warn(out, SUBMIT_PENDING);
  } else if (/\/api\/v0\/tasks\//.test(path)) {
    const status = get(body, "status");
    out.settled = typeof status === "string" && !MACHGEN_RUNNING.has(status);
    if (!out.settled) warn(out, SUBMIT_PENDING);
  }
  return out;
};

const fal: Extractor = (exchange) => {
  const out = blank(exchange);
  const body = exchange.responseBody;
  const url = new URL(exchange.url, "https://fal.run");
  const isQueue = url.host === "queue.fal.run";
  // fal payloads name no model: the endpoint id on a submit is the pricing key.
  if (exchange.method === "POST") out.model = url.pathname.replace(/^\//, "");

  setNumber(
    out,
    "billableUnits",
    headerNumber(exchange, "x-fal-billable-units"),
    "header:x-fal-billable-units"
  );
  const found = findUsage(body);
  if (found) {
    readTokenUsage(found, out);
    const cost = numberAt(found.usage, "cost");
    if (cost !== undefined) {
      out.statedUsd = cost;
      out.evidence.push(usageEvidence(found, "cost"));
    }
  }
  for (const path of [
    "video.duration",
    "audio.duration",
    "audio_duration",
    "output_duration",
  ]) {
    const seconds = numberAt(body, path);
    if (seconds !== undefined && out.usage.seconds === undefined) {
      setNumber(out, "seconds", seconds, path);
    }
  }
  // A queue submit or status read says nothing about the bill. Only the
  // finished result carries the unit header.
  const finished = !isQueue || exchange.status === 200;
  const isStatusRead =
    isQueue && (url.pathname.endsWith("/status") || exchange.method === "POST");
  if (isStatusRead || !finished) {
    out.settled = false;
    warn(out, SUBMIT_PENDING);
  } else if (
    out.usage.billableUnits === undefined &&
    out.statedUsd === undefined
  ) {
    warn(out, "no x-fal-billable-units header on this response");
  }
  return out;
};

const elevenlabs: Extractor = (exchange) => {
  const out = blank(exchange);
  const body = exchange.responseBody;
  setNumber(
    out,
    "credits",
    headerNumber(exchange, "character-cost"),
    "header:character-cost"
  );
  const fiat = headerNumber(exchange, "fiat-cost-before-overages");
  if (fiat !== undefined) {
    out.statedUsd = fiat;
    out.evidence.push("header:fiat-cost-before-overages");
    if (fiat === 0) {
      warn(out, "fiat-cost-before-overages reads 0 inside a plan's quota");
    }
  }
  setNumber(
    out,
    "seconds",
    numberAt(body, "audio_duration_secs"),
    "audio_duration_secs"
  );
  // Conversation records report agent usage after the call.
  const metadata = get(body, "metadata");
  if (metadata !== undefined) {
    setNumber(out, "credits", numberAt(metadata, "cost"), "metadata.cost");
    setNumber(
      out,
      "seconds",
      numberAt(metadata, "call_duration_secs"),
      "metadata.call_duration_secs"
    );
    setNumber(
      out,
      "characters",
      numberAt(metadata, "charging.tts_usage.total_characters"),
      "metadata.charging.tts_usage.total_characters"
    );
  }
  if (out.usage.credits !== undefined && fiat === undefined) {
    warn(
      out,
      "character-cost is credits, whose USD value depends on the plan, so it is not a stated charge"
    );
  }
  return out;
};

const alibaba: Extractor = (exchange) => {
  const out = tokenFamily(exchange);
  const usage = findUsage(exchange.responseBody)?.usage;
  if (usage) {
    setNumber(out, "seconds", numberAt(usage, "duration"), "usage.duration");
    setNumber(
      out,
      "images",
      numberAt(usage, "image_count"),
      "usage.image_count"
    );
  }
  const path = pathOf(exchange.url);
  if (/\/api\/v1\/tasks\//.test(path)) {
    const status = get(exchange.responseBody, "output.task_status");
    out.settled = status !== "PENDING" && status !== "RUNNING";
    if (!out.settled) warn(out, SUBMIT_PENDING);
  } else if (
    exchange.method === "POST" &&
    get(exchange.responseBody, "output.task_id") !== undefined &&
    usage === undefined
  ) {
    out.settled = false;
    warn(out, SUBMIT_PENDING);
  }
  return out;
};

const fireworks: Extractor = (exchange) => {
  const out = tokenFamily(exchange);
  if (out.usage.inputTokens === undefined) {
    setNumber(
      out,
      "inputTokens",
      headerNumber(exchange, "fireworks-prompt-tokens"),
      "header:fireworks-prompt-tokens"
    );
  } else if (
    exchange.responseHeaders["fireworks-prompt-tokens"] !== undefined
  ) {
    out.evidence.push("header:fireworks-prompt-tokens");
  }
  if (out.usage.cacheReadInputTokens === undefined) {
    setNumber(
      out,
      "cacheReadInputTokens",
      headerNumber(exchange, "fireworks-cached-prompt-tokens"),
      "header:fireworks-cached-prompt-tokens"
    );
  } else if (
    exchange.responseHeaders["fireworks-cached-prompt-tokens"] !== undefined
  ) {
    out.evidence.push("header:fireworks-cached-prompt-tokens");
  }
  const body = exchange.responseBody;
  setNumber(
    out,
    "seconds",
    numberAt(body, "acceleratorSeconds"),
    "acceleratorSeconds"
  );
  if (out.usage.inputTokens === undefined) {
    setNumber(
      out,
      "inputTokens",
      numberAt(body, "jobProgress.inputTokens"),
      "jobProgress.inputTokens"
    );
    setNumber(
      out,
      "outputTokens",
      numberAt(body, "jobProgress.outputTokens"),
      "jobProgress.outputTokens"
    );
    setNumber(
      out,
      "cacheReadInputTokens",
      numberAt(body, "jobProgress.cachedInputTokenCount"),
      "jobProgress.cachedInputTokenCount"
    );
  }
  return out;
};

const google: Extractor = (exchange) => {
  const out = blank(exchange);
  readUsageMetadata(exchange.responseBody, out);
  setNumber(
    out,
    "characters",
    numberAt(exchange.responseBody, "totalBillableCharacters"),
    "totalBillableCharacters"
  );
  const fromPath = /\/models\/([^/:]+):/.exec(pathOf(exchange.url))?.[1];
  if (fromPath) out.model = fromPath;
  return out;
};

const wavespeed: Extractor = (exchange) => {
  const out = blank(exchange);
  const body = exchange.responseBody;
  const model = get(body, "data.model");
  if (typeof model === "string") out.model = model;
  const status = get(body, "data.status");
  if (status === "completed" || status === "failed") {
    out.settled = true;
  } else if (status !== undefined) {
    out.settled = false;
    warn(out, SUBMIT_PENDING);
  }
  if (get(body, "data.timings.inference") !== undefined) {
    out.evidence.push("data.timings.inference");
  }
  warn(
    out,
    "wavespeed states no charge in its responses; POST /api/v3/billings/search has it"
  );
  return out;
};

const nothingToRead =
  (why: string): Extractor =>
  (exchange) => {
    const out = blank(exchange);
    warn(out, why);
    return out;
  };

// Flat plans report usage but bill nothing per call.
const planFamily =
  (plan: string): Extractor =>
  (exchange) => {
    const out = tokenFamily(exchange);
    warn(out, `${plan} is a flat plan, so usage carries no per-call charge`);
    return out;
  };

const EXTRACTORS: Readonly<Record<string, Extractor>> = {
  alibaba,
  anthropic: tokenFamily,
  elevenlabs,
  fal,
  fireworks,
  google,
  kie,
  kimicoding: planFamily("the Kimi Code plan"),
  machgen,
  openai: tokenFamily,
  quo: nothingToRead(
    "quo states no charge in its response; one segment is the unit"
  ),
  s3: nothingToRead(
    "s3 states no charge in its response; one request is the unit"
  ),
  wavespeed,
  x: nothingToRead(
    "x states no charge in its response; one request or returned resource is the unit"
  ),
  xai,
  zaicoding: planFamily("the GLM Coding Plan"),
};

export function extractorFor(provider: string): Extractor {
  return (
    EXTRACTORS[provider] ??
    nothingToRead(`no billing fields are known for provider '${provider}'`)
  );
}
