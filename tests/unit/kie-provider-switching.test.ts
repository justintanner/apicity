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

  it("routes Kie ElevenLabs TTS models through createTask", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "audio-1" } }), {
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
      model: "elevenlabs/text-to-speech-turbo-2-5" as const,
      input: {
        text: "A concise Apicity TTS helper test.",
        voice: "Rachel",
      },
    };

    expect(
      provider.post.api.v1.jobs.createTask.schema.safeParse(payload).success
    ).toBe(true);

    await provider.post.api.v1.jobs.createTask(
      payload,
      mintKieCreateTaskOtp(payload)
    );

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it("routes Kie ElevenLabs dialogue models through createTask", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "audio-2" } }), {
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
      model: "elevenlabs/text-to-dialogue-v3" as const,
      input: {
        dialogue: [
          {
            text: "Who is there?",
            voice: "JBFqnCBsd6RMkjVDRZzb",
          },
        ],
      },
    };

    expect(
      provider.post.api.v1.jobs.createTask.schema.safeParse(payload).success
    ).toBe(true);

    await provider.post.api.v1.jobs.createTask(
      payload,
      mintKieCreateTaskOtp(payload)
    );

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
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
    const video15Payload = {
      model: "grok-imagine/image-to-video" as const,
      input: {
        image_urls: ["https://example.com/reference.png"],
        prompt: "Animate the glass greenhouse as lightning flashes",
        duration: 6,
        resolution: "480p" as const,
        nsfw_checker: true,
      },
    };

    expect(provider.modelInputSchemas["grok-imagine/text-to-image"].type).toBe(
      "image"
    );
    expect(provider.modelInputSchemas["grok-imagine/text-to-video"].type).toBe(
      "video"
    );
    expect(provider.modelInputSchemas["grok-imagine/image-to-video"].type).toBe(
      "video"
    );
    expect(
      provider.modelInputSchemas["grok-imagine-video-1-5-preview"].type
    ).toBe("video");
    const validationResult =
      provider.post.api.v1.jobs.createTask.schema.safeParse(payload);
    expect(validationResult.success).toBe(true);
    expect(
      provider.post.api.v1.jobs.createTask.schema.safeParse(video15Payload)
        .success
    ).toBe(true);
    expect(
      provider.post.api.v1.jobs.createTask.schema.safeParse({
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: ["https://example.com/reference.png"],
          mode: "spicy",
        },
      }).success
    ).toBe(false);

    await provider.post.api.v1.jobs.createTask(
      payload,
      mintKieCreateTaskOtp(payload)
    );

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it("keeps Kling 3.0 Turbo models on createTask and exposes their schema", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ code: 200, data: { taskId: "kling-1" } }),
            { status: 200 }
          )
        )
      );

    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    const imagePayload = {
      model: "kling/v3-turbo-image-to-video" as const,
      input: {
        prompt: "A slow push-in on a studio product photo.",
        image_urls: ["https://example.com/product.png"],
        duration: 5,
        resolution: "1080p" as const,
      },
    };
    const textPayload = {
      model: "kling/v3-turbo-text-to-video" as const,
      input: {
        prompt: "A cinematic drone shot over glass towers at sunrise.",
        duration: 5,
        aspect_ratio: "16:9" as const,
        resolution: "720p" as const,
      },
    };

    expect(
      provider.modelInputSchemas["kling/v3-turbo-image-to-video"].type
    ).toBe("video");
    expect(
      provider.modelInputSchemas["kling/v3-turbo-text-to-video"].type
    ).toBe("video");
    expect(
      provider.post.api.v1.jobs.createTask.schema.safeParse(imagePayload)
        .success
    ).toBe(true);
    expect(
      provider.post.api.v1.jobs.createTask.schema.safeParse(textPayload).success
    ).toBe(true);

    await provider.post.api.v1.jobs.createTask(
      imagePayload,
      mintKieCreateTaskOtp(imagePayload)
    );
    await provider.post.api.v1.jobs.createTask(
      textPayload,
      mintKieCreateTaskOtp(textPayload)
    );

    const [imageUrl, imageInit] = mockFetch.mock.calls[0];
    expect(imageUrl).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(imageInit.method).toBe("POST");
    expect(JSON.parse(imageInit.body as string)).toEqual(imagePayload);

    const [textUrl, textInit] = mockFetch.mock.calls[1];
    expect(textUrl).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(textInit.method).toBe("POST");
    expect(JSON.parse(textInit.body as string)).toEqual(textPayload);
  });

  it("keeps Seedance 2 Mini image-reference requests on createTask", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ code: 200, data: { taskId: "seedance-mini-1" } }),
            { status: 200 }
          )
        )
      );

    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    const imagePayload = {
      model: "bytedance/seedance-2-mini" as const,
      input: {
        prompt: "Animate the reference cat with a subtle head turn.",
        reference_image_urls: ["https://example.com/cat.jpg"],
        duration: 4,
        resolution: "480p" as const,
        aspect_ratio: "16:9" as const,
        generate_audio: false,
        web_search: false,
        nsfw_checker: false,
      },
    };

    expect(provider.modelInputSchemas["bytedance/seedance-2-mini"].type).toBe(
      "video"
    );
    expect(
      provider.post.api.v1.jobs.createTask.schema.safeParse(imagePayload)
        .success
    ).toBe(true);

    await provider.post.api.v1.jobs.createTask(
      imagePayload,
      mintKieCreateTaskOtp(imagePayload)
    );

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(imagePayload);
  });
});
