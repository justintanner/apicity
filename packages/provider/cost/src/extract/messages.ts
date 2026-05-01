interface MessagePart {
  type?: unknown;
  text?: unknown;
}

interface Message {
  role?: unknown;
  content?: unknown;
}

// Walks a chat-style messages array and joins all text content into a single
// string for token counting. Non-text content parts (image_url, audio, tool
// calls) are skipped — image/audio token costs are out of scope, matching
// existing behavior.
export function flattenMessages(messages: unknown): string {
  if (!Array.isArray(messages)) return "";
  const parts: string[] = [];
  for (const m of messages) {
    if (m === null || typeof m !== "object") continue;
    const msg = m as Message;
    const c = msg.content;
    if (typeof c === "string") {
      parts.push(c);
    } else if (Array.isArray(c)) {
      for (const p of c) {
        if (p === null || typeof p !== "object") continue;
        const part = p as MessagePart;
        if (part.type === "text" && typeof part.text === "string") {
          parts.push(part.text);
        }
      }
    }
  }
  return parts.join("\n");
}

export function asString(x: unknown): string | undefined {
  return typeof x === "string" ? x : undefined;
}

export function asNumber(x: unknown): number | undefined {
  return typeof x === "number" && Number.isFinite(x) ? x : undefined;
}

export function asObject(x: unknown): Record<string, unknown> | undefined {
  return x !== null && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : undefined;
}

export function pickMaxOutputTokens(
  payload: Record<string, unknown>
): number | undefined {
  return (
    asNumber(payload.max_tokens) ??
    asNumber(payload.max_output_tokens) ??
    asNumber(payload.max_completion_tokens)
  );
}
