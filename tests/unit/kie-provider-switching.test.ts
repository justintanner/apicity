import { describe, it, expect, vi } from "vitest";
import { createKie } from "@apicity/kie";
import {
  TEST_PAYGATE_SECRET,
  mintKieCreateTaskOtp,
  mintKieVeoOtp,
} from "../harness";

describe("KIE provider switching", () => {
  it("routes Veo requests through the veo namespace", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "veo-1" } }), {
        status: 200,
      })
    );

    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    const payload = {
      prompt: "Make a short video",
      model: "veo3",
    } as const;

    await provider.veo.post.api.v1.veo.generate(
      payload,
      mintKieVeoOtp("api.v1.veo.generate", payload)
    );

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/veo/generate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it("routes Suno requests through the suno namespace", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "suno-1" } }), {
        status: 200,
      })
    );

    const provider = createKie({
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

    const provider = createKie({
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

  it("routes Gemini Omni Audio requests through the omni audio namespace", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          msg: "success",
          data: { audioId: "audio-1", name: "Narrator" },
        }),
        { status: 200 }
      )
    );

    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
    });

    const payload = {
      audio_id: "narrator",
      name: "Narrator",
      voice_description: "A calm narration voice.",
      example_dialogue: "Hello from Kie.",
    };

    expect(
      provider.post.api.v1.omni.audio.create.schema.safeParse(payload).success
    ).toBe(true);

    const result = await provider.post.api.v1.omni.audio.create(payload);

    expect(result.data?.audioId).toBe("audio-1");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/omni/audio/create");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it("keeps grok-imagine models on createTask and exposes their schema", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "grok-1" } }), {
        status: 200,
      })
    );

    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
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
    const validationResult =
      provider.post.api.v1.jobs.createTask.schema.safeParse(payload);
    expect(validationResult.success).toBe(true);

    await provider.post.api.v1.jobs.createTask(
      payload,
      mintKieCreateTaskOtp(payload)
    );

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });
});
