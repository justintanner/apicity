import { describe, expect, it, vi } from "vitest";

import { fal } from "../../packages/provider/fal/src/fal";

function makeErroringSseResponse(chunks: string[], error: Error): Response {
  const encoder = new TextEncoder();
  let index = 0;

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
        return;
      }

      controller.error(error);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("fal stream error handling", () => {
  it("propagates SSE connection loss after yielding prior events", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        makeErroringSseResponse(
          ['data: {"message":"first","level":"info"}\n\n'],
          new Error("stream interrupted")
        )
      );

    const provider = fal({
      apiKey: "fal-test",
      fetch: mockFetch as unknown as typeof fetch,
    });

    const stream = await provider.post.stream.v1.serverless.logs.stream();
    const iterator = stream[Symbol.asyncIterator]();

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: expect.objectContaining({ message: "first", level: "info" }),
    });
    await expect(iterator.next()).rejects.toThrow("stream interrupted");
  });
});
