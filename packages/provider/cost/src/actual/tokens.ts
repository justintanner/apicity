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
// so the total is the three counts added. Reasoning is inside the output total
// on every shape but one: an xAI compact call reports total_tokens as input +
// output + reasoning, so the total itself says when to add it.
export function readTokenUsage(found: FoundUsage, out: Extracted): void {
  const { usage } = found;
  const read = (key: Parameters<typeof setNumber>[1], paths: string[]) => {
    const hit = first(found, paths);
    if (hit) setNumber(out, key, hit.value, hit.evidence);
    return hit?.value;
  };
  const anthropicShape =
    usage.cache_read_input_tokens !== undefined ||
    usage.cache_creation_input_tokens !== undefined;

  const cacheRead = read(
    "cacheReadInputTokens",
    anthropicShape
      ? ["cache_read_input_tokens"]
      : [
          "input_tokens_details.cached_tokens",
          "prompt_tokens_details.cached_tokens",
          "cached_tokens",
        ]
  );
  const cacheWrite = read(
    "cacheWriteInputTokens",
    anthropicShape
      ? ["cache_creation_input_tokens"]
      : [
          "input_tokens_details.cache_write_tokens",
          "prompt_tokens_details.cache_write_tokens",
        ]
  );
  const input = first(found, ["input_tokens", "prompt_tokens"]);
  if (input) {
    const total = anthropicShape
      ? input.value + (cacheRead ?? 0) + (cacheWrite ?? 0)
      : input.value;
    setNumber(out, "inputTokens", total, input.evidence);
  }

  const reasoning = read("reasoningTokens", [
    "output_tokens_details.reasoning_tokens",
    "completion_tokens_details.reasoning_tokens",
    "output_tokens_details.thinking_tokens",
  ]);
  const output = first(found, ["output_tokens", "completion_tokens"]);
  if (output) {
    const statedTotal = asFiniteNumber(usage.total_tokens);
    const excludesReasoning =
      input !== undefined &&
      reasoning !== undefined &&
      reasoning > 0 &&
      statedTotal === input.value + output.value + reasoning;
    setNumber(
      out,
      "outputTokens",
      excludesReasoning ? output.value + reasoning : output.value,
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
    "completion_tokens_details.audio_tokens",
  ]);
  read("imageOutputTokens", ["output_tokens_details.image_tokens"]);
  read("seconds", ["seconds"]);

  const oneHour = numberAt(usage, "cache_creation.ephemeral_1h_input_tokens");
  if (oneHour !== undefined) {
    out.evidence.push(
      usageEvidence(found, "cache_creation.ephemeral_1h_input_tokens")
    );
    if (oneHour > 0) out.unpricedCacheWrite = true;
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
