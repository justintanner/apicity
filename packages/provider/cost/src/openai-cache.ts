// OpenAI prompt-cache retention and Responses API breakpoint TTL validation.
//
// The bundled OpenAI token tables carry only the default 30-minute cache-write
// rate (1.25x uncached input on GPT-5.6+). Extended 12-hour writes bill 2.5x
// (twice the bundled 30m rate), and older models' 24h retention is not bundled
// either. OpenAI documents three places where retention/TTL can be configured:
//   - legacy `prompt_cache_retention` ("in_memory" | "24h", plus "12h" guard)
//   - Responses `prompt_cache_options`: { mode?: "implicit" | "explicit", ttl?: "30m" | "12h" }
//   - per-breakpoint `prompt_cache_breakpoint`: { mode?: "explicit", ttl?: "30m" | "12h" }
//
// In implicit mode (default), request-level `prompt_cache_options.ttl` applies
// to both the implicit breakpoint and explicit breakpoints without their own
// `ttl`. In explicit mode, only `prompt_cache_breakpoint` blocks write cache
// entries (inheriting `prompt_cache_options.ttl` when a breakpoint omits `ttl`).

const EXTENDED_CACHE_WARNING =
  "openai: extended cache writes (12h/24h) are not bundled; the table stores the 30m write rate";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

interface BreakpointScan {
  error?: string;
  count: number;
  hasExtended: boolean;
}

function scanBreakpoints(
  root: unknown,
  requestTtl: "30m" | "12h"
): BreakpointScan {
  let count = 0;
  let hasExtended = false;
  let error: string | undefined;
  const seen = new Set<object>();

  const visit = (node: unknown): void => {
    if (error !== undefined || node === null || typeof node !== "object")
      return;
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (error !== undefined) return;
      if (key === "prompt_cache_breakpoint") {
        if (child === undefined || child === null) continue;
        if (!isPlainObject(child)) {
          error = "openai: prompt_cache_breakpoint must be an object";
          return;
        }
        const bpMode = child.mode;
        if (bpMode !== undefined && bpMode !== null && bpMode !== "explicit") {
          error = `openai: prompt_cache_breakpoint.mode ${JSON.stringify(bpMode)} is not supported; expected "explicit"`;
          return;
        }
        const bpTtl = child.ttl;
        if (bpTtl === undefined || bpTtl === null) {
          if (requestTtl === "12h") hasExtended = true;
        } else if (bpTtl === "30m") {
          // Explicit 30m override.
        } else if (bpTtl === "12h" || bpTtl === "24h") {
          hasExtended = true;
        } else {
          error = `openai: prompt_cache_breakpoint.ttl ${JSON.stringify(bpTtl)} is not supported; only "30m" writes are bundled`;
          return;
        }
        count += 1;
      } else {
        visit(child);
      }
    }
  };

  visit(root);
  return { error, count, hasExtended };
}

export function openaiCacheProblem(
  payload: Record<string, unknown>
): string | undefined {
  const retention = payload.prompt_cache_retention;
  if (retention !== undefined && retention !== null) {
    if (retention === "12h" || retention === "24h") {
      return EXTENDED_CACHE_WARNING;
    }
    if (retention !== "in_memory" && retention !== "30m") {
      return `openai: prompt_cache_retention ${JSON.stringify(retention)} is not supported; only default 30m/in_memory retention is bundled`;
    }
  }

  let mode: "implicit" | "explicit" = "implicit";
  let requestTtl: "30m" | "12h" = "30m";
  const options = payload.prompt_cache_options;
  if (options !== undefined && options !== null) {
    if (!isPlainObject(options)) {
      return "openai: prompt_cache_options must be an object";
    }
    const rawMode = options.mode;
    if (rawMode !== undefined && rawMode !== null) {
      if (rawMode !== "implicit" && rawMode !== "explicit") {
        return `openai: prompt_cache_options.mode ${JSON.stringify(rawMode)} is not supported; expected "implicit" or "explicit"`;
      }
      mode = rawMode;
    }
    const rawTtl = options.ttl;
    if (rawTtl !== undefined && rawTtl !== null) {
      if (rawTtl === "30m" || rawTtl === "12h") {
        requestTtl = rawTtl;
      } else if (rawTtl === "24h") {
        return EXTENDED_CACHE_WARNING;
      } else {
        return `openai: prompt_cache_options.ttl ${JSON.stringify(rawTtl)} is not supported; only "30m" writes are bundled`;
      }
    }
  }

  // Scan the entire payload for invalid or extended breakpoints, and scan
  // `payload.input` specifically when verifying whether explicit-mode overrides
  // eliminate a request-level 12h default.
  const allScan = scanBreakpoints(payload, requestTtl);
  if (allScan.error) return allScan.error;
  if (allScan.hasExtended) return EXTENDED_CACHE_WARNING;

  if (requestTtl === "12h") {
    if (mode !== "explicit") return EXTENDED_CACHE_WARNING;
    const hasPriorHistory =
      (payload.previous_response_id !== undefined &&
        payload.previous_response_id !== null &&
        payload.previous_response_id !== "") ||
      (payload.conversation !== undefined &&
        payload.conversation !== null &&
        payload.conversation !== "");
    if (hasPriorHistory || !Array.isArray(payload.input)) {
      return EXTENDED_CACHE_WARNING;
    }
    const inputScan = scanBreakpoints(payload.input, requestTtl);
    if (inputScan.error) return inputScan.error;
    if (inputScan.count === 0 || inputScan.hasExtended) {
      return EXTENDED_CACHE_WARNING;
    }
  }

  return undefined;
}
