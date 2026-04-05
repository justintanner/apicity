import { describe, it, expect, vi } from "vitest";

import { kie } from "../../packages/provider/kie/src/kie";

describe("KIE provider switching", () => {
  it("routes Veo requests through the veo namespace", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "veo-1" } }), {
        status: 200,
      })
    );

    const provider = kie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
    });

    await provider.veo.post.api.v1.veo.generate({
      prompt: "Make a short video",
      model: "veo3",
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/veo/generate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      prompt: "Make a short video",
      model: "veo3",
    });
  });

  it("routes Suno requests through the suno namespace", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "suno-1" } }), {
        status: 200,
      })
    );

    const provider = kie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
    });

    await provider.suno.post.api.v1.generate({
      prompt: "Write a synthwave track",
      model: "V4",
      instrumental: true,
      customMode: false,
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/generate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      prompt: "Write a synthwave track",
      model: "V4",
      instrumental: true,
      customMode: false,
    });
  });

  it("routes Claude requests through the claude namespace", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [] }), {
        status: 200,
      })
    );

    const provider = kie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
    });

    await provider.claude.post.v1.messages({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "Hello" }],
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/claude/v1/messages");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "Hello" }],
    });
  });

  it("keeps grok-imagine models on createTask and exposes their schema", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "grok-1" } }), {
        status: 200,
      })
    );

    const provider = kie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
    });

    const payload = {
      model: "grok-imagine/text-to-image" as const,
      input: {
        prompt: "A glass greenhouse in a storm",
        aspect_ratio: "16:9" as const,
      },
    };

    expect(provider.modelInputSchemas["grok-imagine/text-to-image"].type).toBe(
      "image"
    );
    expect(
      provider.post.api.v1.jobs.createTask.validatePayload(payload)
    ).toEqual({
      valid: true,
      errors: [],
    });

    await provider.post.api.v1.jobs.createTask(payload);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });
});
