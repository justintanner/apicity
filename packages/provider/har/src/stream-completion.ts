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
  function inspect(text: string) {
    if (!text.startsWith("data:")) return;
    try {
      const frame = JSON.parse(text.slice(5)) as Record<string, unknown>;
      if (!frame || typeof frame !== "object") return;
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
          ].includes(type)
        )
          final = true;
      } else if (Array.isArray(frame.choices)) {
        recognized = true;
        const choice = frame.choices[0] as
          | { finish_reason?: unknown }
          | undefined;
        if (
          frame.usage &&
          (!frame.choices.length || choice?.finish_reason != null)
        )
          final = true;
      } else if (Array.isArray(frame.candidates)) {
        recognized = true;
        const candidate = frame.candidates[0] as
          | { finishReason?: unknown }
          | undefined;
        if (frame.usageMetadata && candidate?.finishReason !== undefined)
          final = true;
      }
    } catch {
      // Non-JSON event data is not a recognized token protocol.
    }
  }
  return {
    push(bytes: Uint8Array) {
      if (bytes.length) lastByte = bytes[bytes.length - 1];
      const parts = decoder.decode(bytes, { stream: true }).split("\n");
      for (let i = 0; i < parts.length; i++) {
        if (!oversized) {
          line += parts[i];
          if (line.length > 1024 * 1024) {
            line = "";
            oversized = true;
          }
        }
        if (i < parts.length - 1) {
          if (!oversized) inspect(line);
          line = "";
          oversized = false;
        }
      }
    },
    cut() {
      return (
        (lastByte !== undefined && lastByte !== 0x0a) || (recognized && !final)
      );
    },
  };
}
