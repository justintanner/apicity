import { sseToIterable } from "./sse";
import type { AnthropicStreamEvent } from "./types";

export async function* parseAnthropicStream(
  res: Response
): AsyncIterable<AnthropicStreamEvent> {
  for await (const sse of sseToIterable(res)) {
    if (sse.data === "[DONE]") return;
    try {
      yield JSON.parse(sse.data) as AnthropicStreamEvent;
    } catch {
      // Skip malformed events.
    }
  }
}
