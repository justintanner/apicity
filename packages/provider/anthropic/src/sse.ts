import type { AnthropicStreamEvent } from "./types";

export interface SSEEvent {
  event: string;
  data: string;
}

export async function* sseToIterable(res: Response): AsyncIterable<SSEEvent> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split(/\r?\n\r?\n/);
    for (let i = 0; i < parts.length - 1; i++) {
      const chunk = parts[i];
      const lines = chunk.split(/\r?\n/);
      let event = "message";
      let data = "";

      for (const line of lines) {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("event:")) {
          event = trimmed.slice(6).trim();
        } else if (trimmed.startsWith("data:")) {
          data = trimmed.slice(5).trim();
        }
      }

      if (data) {
        yield { event, data };
      }
    }
    buffer = parts[parts.length - 1];
  }

  const trailing = buffer.trim();
  if (trailing.length) {
    const lines = trailing.split(/\r?\n/);
    let event = "message";
    let data = "";

    for (const line of lines) {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("event:")) {
        event = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("data:")) {
        data = trimmed.slice(5).trim();
      }
    }

    if (data) {
      yield { event, data };
    }
  }
}

export async function* parseAnthropicStream(
  res: Response
): AsyncIterable<AnthropicStreamEvent> {
  for await (const sse of sseToIterable(res)) {
    if (sse.data === "[DONE]") return;
    try {
      yield JSON.parse(sse.data) as AnthropicStreamEvent;
    } catch {
      // skip malformed events
    }
  }
}
