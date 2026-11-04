/**
 * A tee reads ahead for capture. Native streams discard their unread queue on an
 * error, so keep the caller's chunks outside that queue until the caller asks.
 * This retains no more than the tee would buffer for a slow consumer.
 */
export function queuedResponse(response: Response): Response {
  if (!response.body) return response;
  const reader = response.body.getReader();
  let chunks: Uint8Array[] = [];
  let at = 0;
  let ended = false;
  let cancelled = false;
  let failure: unknown;
  let failed = false;
  let wake: (() => void) | undefined;
  void (async () => {
    try {
      while (!cancelled) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
        wake?.();
      }
    } catch (error) {
      failure = error;
      failed = true;
    } finally {
      ended = true;
      reader.releaseLock();
      wake?.();
    }
  })();
  const body = new ReadableStream<Uint8Array>(
    {
      async pull(controller) {
        while (at === chunks.length && !ended && !cancelled) {
          await new Promise<void>((resolve) => {
            wake = resolve;
          });
          wake = undefined;
        }
        if (cancelled) return;
        if (at < chunks.length) {
          controller.enqueue(chunks[at++]!);
          if (at === chunks.length || at >= 1024) {
            chunks = chunks.slice(at);
            at = 0;
          }
        } else if (failed) controller.error(failure);
        else controller.close();
      },
      cancel(reason) {
        cancelled = true;
        chunks = [];
        at = 0;
        // A tee cancellation waits for its sibling; do not hold up the caller.
        if (!ended) void reader.cancel(reason).catch(() => undefined);
        wake?.();
      },
    },
    { highWaterMark: 0 }
  );
  const result = new Response(body, response);
  for (const key of ["url", "redirected", "type"] as const) {
    Object.defineProperty(result, key, { value: response[key] });
  }
  return result;
}
