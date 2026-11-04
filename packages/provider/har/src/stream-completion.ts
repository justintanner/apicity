// Inspect complete data lines as they arrive, including lines outside the saved
// head/tail. Unknown SSE protocols need only a complete final line. Recognized
// token protocols also need their final usage frame before a figure is settled.
export function streamCompletion() {
  const decoder = new TextDecoder();
  let line = "";
  let oversized = false;
  let lastByte: number | undefined;
  let recognized = false;
  let final = false;
  let unclassified = false;
  let lineBytes = 0;
  function object(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function inspect(text: string) {
    if (!text.startsWith("data:")) return;
    if (text.slice(5).trim() === "[DONE]") return;
    try {
      const frame = JSON.parse(text.slice(5)) as Record<string, unknown>;
      if (!frame || typeof frame !== "object") {
        unclassified = true;
        return;
      }
      const type = frame.type;
      if (
        typeof type === "string" &&
        /^(message_|content_block_|response\.)/.test(type)
      ) {
        recognized = true;
        if (
          [
            "message_delta",
            "response.completed",
            "response.incomplete",
            "response.failed",
            "response.done",
          ].includes(type) &&
          (type === "message_delta"
            ? object(frame.usage)
            : object(frame.response) && object(frame.response.usage))
        )
          final = true;
      } else if (Array.isArray(frame.choices)) {
        recognized = true;
        const choice = frame.choices[0] as
          | { finish_reason?: unknown }
          | undefined;
        if (
          object(frame.usage) &&
          (!frame.choices.length || choice?.finish_reason != null)
        )
          final = true;
      } else if (Array.isArray(frame.candidates)) {
        recognized = true;
        const candidate = frame.candidates[0] as
          | { finishReason?: unknown }
          | undefined;
        if (
          object(frame.usageMetadata) &&
          candidate?.finishReason !== undefined
        )
          final = true;
      } else if (type !== "ping") {
        unclassified = true;
      }
    } catch {
      unclassified = true;
    }
  }
  return {
    push(bytes: Uint8Array) {
      if (bytes.length) lastByte = bytes[bytes.length - 1];
      const parts = decoder.decode(bytes, { stream: true }).split("\n");
      for (let i = 0; i < parts.length; i++) {
        if (!oversized) {
          lineBytes += Buffer.byteLength(parts[i]!);
          line += parts[i];
          if (lineBytes > 1024 * 1024) {
            line = "";
            oversized = true;
            unclassified = true;
          }
        }
        if (i < parts.length - 1) {
          if (!oversized) inspect(line);
          line = "";
          lineBytes = 0;
          oversized = false;
        }
      }
    },
    cut() {
      return (
        (lastByte !== undefined && lastByte !== 0x0a) ||
        (recognized && (!final || unclassified))
      );
    },
  };
}
