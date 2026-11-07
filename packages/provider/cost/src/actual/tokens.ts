import type { Extracted } from "./shared";
import {
  asFiniteNumber,
  framesOf,
  get,
  isObject,
  numberAt,
  setNumber,
} from "./shared";

const USAGE_PATHS = [
  "usage",
  "response.usage",
  "message.usage",
  "choices.0.usage",
] as const;

function usageOf(frame: unknown, path: string): unknown {
  if (path === "choices.0.usage") {
    const choices = get(frame, "choices");
    return Array.isArray(choices) ? get(choices[0], "usage") : undefined;
  }
  return get(frame, path);
}

interface FoundUsage {
  usage: Record<string, unknown>;
  // Which field path each top-level usage key came from, for evidence.
  origins: Record<string, string>;
}

// The usage across a body's frames. A later frame's field wins: Anthropic
// streams input counts in message_start and output in message_delta, and the
// other shapes send one final usage object.
export function findUsage(body: unknown): FoundUsage | undefined {
  const usage: Record<string, unknown> = {};
  const origins: Record<string, string> = {};
  for (const frame of framesOf(body)) {
    for (const path of USAGE_PATHS) {
      const found = usageOf(frame, path);
      if (!isObject(found)) continue;
      const prefix = path === "choices.0.usage" ? "choices[].usage" : path;
      for (const [key, value] of Object.entries(found)) {
        usage[key] = value;
        origins[key] = prefix;
      }
    }
  }
  return Object.keys(usage).length > 0 ? { usage, origins } : undefined;
}

export function usageEvidence(found: FoundUsage, path: string): string {
  const top = path.split(".")[0] ?? path;
  return `${found.origins[top] ?? "usage"}.${path}`;
}

function first(
  found: FoundUsage,
  paths: readonly string[]
): { value: number; evidence: string } | undefined {
  for (const path of paths) {
    const value = numberAt(found.usage, path);
    if (value !== undefined) {
      return { value, evidence: usageEvidence(found, path) };
    }
  }
  return undefined;
}

// Reads a usage object in OpenAI's or Anthropic's shape into `out`.
//
// The two disagree on input. OpenAI-shaped totals include cached tokens, so
// the details are subsets. Anthropic's input_tokens is the uncached remainder,
// so the total is the three counts added. Output usually holds reasoning, but
// not always: an xAI compact call adds it to total_tokens only, and a KIE Gemini
// route reports thoughts nowhere else. So total_tokens decides: whatever it
// holds beyond input and output is output.
export function readTokenUsage(
  found: FoundUsage,
  out: Extracted,
  anthropic = false
): void {
  const { usage } = found;
  const read = (key: Parameters<typeof setNumber>[1], paths: string[]) => {
    const hit = first(found, paths);
    if (hit) setNumber(out, key, hit.value, hit.evidence);
    return hit?.value;
  };
  const anthropicShape =
    usage.cache_read_input_tokens !== undefined ||
    usage.cache_creation_input_tokens !== undefined ||
    (anthropic && usage.cache_creation !== undefined);

  const cacheRead = read(
    "cacheReadInputTokens",
    anthropicShape
      ? ["cache_read_input_tokens"]
      : [
          "input_tokens_details.cached_tokens",
          "input_token_details.cached_tokens",
          "prompt_tokens_details.cached_tokens",
          "cached_tokens",
        ]
  );
  let cacheWrite = read(
    "cacheWriteInputTokens",
    anthropicShape
      ? ["cache_creation_input_tokens"]
      : [
          "input_tokens_details.cache_write_tokens",
          "prompt_tokens_details.cache_write_tokens",
        ]
  );
  if (anthropic) {
    const fivePath = "cache_creation.ephemeral_5m_input_tokens";
    const hourPath = "cache_creation.ephemeral_1h_input_tokens";
    const five = numberAt(usage, fivePath);
    const hour = numberAt(usage, hourPath);
    const count = (n: number | undefined) =>
      n !== undefined && Number.isSafeInteger(n) && n >= 0;
    const hasFive = get(usage, fivePath) !== undefined;
    const hasHour = get(usage, hourPath) !== undefined;
    if (hasFive || hasHour) {
      if (hasFive) out.evidence.push(usageEvidence(found, fivePath));
      if (hasHour) out.evidence.push(usageEvidence(found, hourPath));
      if (
        (hasFive && !count(five)) ||
        (hasHour && !count(hour)) ||
        (usage.cache_creation_input_tokens !== undefined && !count(cacheWrite))
      ) {
        out.uncoveredCharge =
          "anthropic: invalid cache_creation split; no figure is derived";
      } else {
        if (
          cacheWrite === undefined &&
          five !== undefined &&
          hour !== undefined
        ) {
          cacheWrite = five + hour;
          setNumber(
            out,
            "cacheWriteInputTokens",
            cacheWrite,
            usageEvidence(found, "cache_creation")
          );
        }
        const inferredHour =
          hour ??
          (cacheWrite !== undefined && five !== undefined
            ? cacheWrite - five
            : undefined);
        const inferredFive =
          five ??
          (cacheWrite !== undefined && hour !== undefined
            ? cacheWrite - hour
            : undefined);
        if (
          !count(cacheWrite) ||
          !count(inferredHour) ||
          !count(inferredFive) ||
          inferredFive! + inferredHour! !== cacheWrite
        ) {
          out.uncoveredCharge =
            "anthropic: inconsistent or incomplete cache_creation split/total; no figure is derived";
        } else {
          setNumber(
            out,
            "cacheWrite1hInputTokens",
            inferredHour,
            usageEvidence(found, "cache_creation")
          );
        }
      }
    }
  }
  const input = first(found, ["input_tokens", "prompt_tokens"]);
  const inputTotal =
    input && anthropicShape
      ? input.value + (cacheRead ?? 0) + (cacheWrite ?? 0)
      : input?.value;
  if (input) setNumber(out, "inputTokens", inputTotal, input.evidence);

  read("reasoningTokens", [
    "output_tokens_details.reasoning_tokens",
    "completion_tokens_details.reasoning_tokens",
    "output_tokens_details.thinking_tokens",
  ]);
  const output = first(found, ["output_tokens", "completion_tokens"]);
  if (output) {
    const statedTotal = asFiniteNumber(usage.total_tokens);
    const hidden =
      statedTotal !== undefined && inputTotal !== undefined
        ? statedTotal - inputTotal - output.value
        : 0;
    setNumber(
      out,
      "outputTokens",
      output.value + Math.max(hidden, 0),
      output.evidence
    );
  }

  read("audioInputTokens", [
    "input_tokens_details.audio_tokens",
    "input_token_details.audio_tokens",
    "prompt_tokens_details.audio_tokens",
  ]);
  read("imageInputTokens", [
    "input_tokens_details.image_tokens",
    "input_token_details.image_tokens",
    "prompt_tokens_details.image_tokens",
  ]);
  read("audioOutputTokens", [
    "output_tokens_details.audio_tokens",
    "output_token_details.audio_tokens",
    "completion_tokens_details.audio_tokens",
  ]);
  read("imageOutputTokens", [
    "output_tokens_details.image_tokens",
    "output_token_details.image_tokens",
  ]);
  read("cacheReadAudioInputTokens", [
    "input_tokens_details.cached_tokens_details.audio_tokens",
    "input_token_details.cached_tokens_details.audio_tokens",
    "prompt_tokens_details.cached_tokens_details.audio_tokens",
  ]);
  read("cacheReadImageInputTokens", [
    "input_tokens_details.cached_tokens_details.image_tokens",
    "input_token_details.cached_tokens_details.image_tokens",
    "prompt_tokens_details.cached_tokens_details.image_tokens",
  ]);
  // A reported cached total of 0 has only one modality split. Filling it
  // is not an estimate: a positive total with no split stays unset, and
  // pricing then fails closed. Text-only usage has no modality counts, so
  // it does not gain these fields.
  if (
    cacheRead === 0 &&
    (out.usage.audioInputTokens !== undefined ||
      out.usage.imageInputTokens !== undefined ||
      out.usage.audioOutputTokens !== undefined ||
      out.usage.imageOutputTokens !== undefined)
  ) {
    if (out.usage.cacheReadAudioInputTokens === undefined) {
      out.usage.cacheReadAudioInputTokens = 0;
    }
    if (out.usage.cacheReadImageInputTokens === undefined) {
      out.usage.cacheReadImageInputTokens = 0;
    }
  }
  read("seconds", ["seconds"]);

  const oneHour = numberAt(usage, "cache_creation.ephemeral_1h_input_tokens");
  if (oneHour !== undefined) {
    out.evidence.push(
      usageEvidence(found, "cache_creation.ephemeral_1h_input_tokens")
    );
    if (oneHour > 0 && !anthropic) {
      out.uncoveredCharge =
        "1-hour cache writes have no bundled rate, so no figure is derived";
    }
  }
  if (
    numberAt(usage, "cache_creation.ephemeral_5m_input_tokens") !== undefined
  ) {
    out.evidence.push(
      usageEvidence(found, "cache_creation.ephemeral_5m_input_tokens")
    );
  }
}

// Google's usageMetadata. candidatesTokenCount excludes thoughts, so the
// output total adds them, and thinkingTokenCount is KIE's name for the field.
export function readUsageMetadata(body: unknown, out: Extracted): boolean {
  let meta: Record<string, unknown> = {};
  for (const frame of framesOf(body)) {
    const next = get(frame, "usageMetadata");
    if (isObject(next)) meta = { ...meta, ...next };
  }
  if (Object.keys(meta).length === 0) return false;
  const prompt = asFiniteNumber(meta.promptTokenCount);
  const candidates = asFiniteNumber(meta.candidatesTokenCount);
  const thoughtsField =
    meta.thoughtsTokenCount !== undefined
      ? "thoughtsTokenCount"
      : "thinkingTokenCount";
  const thoughts = asFiniteNumber(meta[thoughtsField]);
  setNumber(out, "inputTokens", prompt, "usageMetadata.promptTokenCount");
  if (candidates !== undefined || thoughts !== undefined) {
    setNumber(
      out,
      "outputTokens",
      (candidates ?? 0) + (thoughts ?? 0),
      "usageMetadata.candidatesTokenCount"
    );
  }
  setNumber(out, "reasoningTokens", thoughts, `usageMetadata.${thoughtsField}`);
  setNumber(
    out,
    "cacheReadInputTokens",
    asFiniteNumber(meta.cachedContentTokenCount),
    "usageMetadata.cachedContentTokenCount"
  );
  return true;
}

// Frames that carry a stream's whole usage. Anthropic's message_start has usage
// too, but its output count is a placeholder, and message_stop has none: a capture
// keeping a stream's two ends can hold it without the message_delta before it.
const FINAL_FRAME_TYPES: ReadonlySet<string> = new Set([
  "message_delta",
  "response.completed",
  "response.incomplete",
  "response.failed",
  "response.done",
]);

export function streamHasFinalUsage(frames: readonly unknown[]): boolean {
  return frames.some((frame) => {
    const type = get(frame, "type");
    if (typeof type === "string") return FINAL_FRAME_TYPES.has(type);
    if (isObject(get(frame, "usage"))) {
      // A chunk repeating a running count still has an unfinished choice.
      const choices = get(frame, "choices");
      return (
        !Array.isArray(choices) ||
        choices.length === 0 ||
        (get(choices[0], "finish_reason") ?? null) !== null
      );
    }
    if (get(frame, "credits_consumed") !== undefined) return true;
    const candidates = get(frame, "candidates");
    return (
      isObject(get(frame, "usageMetadata")) &&
      Array.isArray(candidates) &&
      get(candidates[0], "finishReason") !== undefined
    );
  });
}
