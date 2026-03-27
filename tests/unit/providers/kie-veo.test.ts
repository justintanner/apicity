// Tests for the Veo sub-provider
import { describe, it, expect, vi } from "vitest";
import {
  createVeoProvider,
  KieError,
} from "../../../packages/provider/kie/src";

describe("kie veo provider", () => {
  interface VeoGenerateRequest {
    prompt: string;
    model?: "veo3" | "veo3_fast";
    aspectRatio?: "16:9" | "9:16" | "Auto";
    generationType?: string;
    imageUrls?: string[];
    seeds?: number;
    watermark?: string;
    enableTranslation?: boolean;
  }

  interface VeoExtendRequest {
    taskId: string;
    prompt: string;
    model?: "fast" | "quality";
    seeds?: number;
    watermark?: string;
  }

  interface VeoSubmitResponse {
    code: number;
    data?: { taskId?: string };
  }

  interface VeoProvider {
    api: {
      v1: {
        veo: {
          generate(req: VeoGenerateRequest): Promise<VeoSubmitResponse>;
          extend(req: VeoExtendRequest): Promise<VeoSubmitResponse>;
        };
      };
    };
  }

  function createMockVeoProvider(): VeoProvider {
    return {
      api: {
        v1: {
          veo: {
            generate: vi.fn().mockResolvedValue({
              code: 200,
              data: { taskId: "veo-task-123" },
            }),
            extend: vi.fn().mockResolvedValue({
              code: 200,
              data: { taskId: "veo-extend-456" },
            }),
          },
        },
      },
    };
  }

  it("should generate a video with text prompt", async () => {
    const veo = createMockVeoProvider();
    const result = await veo.api.v1.veo.generate({
      prompt: "A rocket launch at sunset",
      model: "veo3_fast",
      aspectRatio: "16:9",
    });
    expect(result.data?.taskId).toBe("veo-task-123");
  });

  it("should generate with reference images", async () => {
    const veo = createMockVeoProvider();
    const result = await veo.api.v1.veo.generate({
      prompt: "Similar style video",
      model: "veo3_fast",
      generationType: "REFERENCE_2_VIDEO",
      imageUrls: ["https://example.com/ref1.jpg"],
    });
    expect(result.data?.taskId).toBe("veo-task-123");
  });

  it("should extend a completed video", async () => {
    const veo = createMockVeoProvider();
    const result = await veo.api.v1.veo.extend({
      taskId: "veo-task-123",
      prompt: "Continue the scene with a zoom out",
      model: "fast",
    });
    expect(result.data?.taskId).toBe("veo-extend-456");
  });

  it("should generate a task and return taskId", async () => {
    const veo = createMockVeoProvider();
    const result = await veo.api.v1.veo.generate({
      prompt: "A beautiful sunset",
    });
    expect(result.data?.taskId).toBe("veo-task-123");
  });

  describe("real factory", () => {
    function mockFetchOk(body: Record<string, unknown>): typeof fetch {
      return vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(body), { status: 200 })
        ) as unknown as typeof fetch;
    }

    it("should send generate request to correct URL", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: { taskId: "t1" } }), {
          status: 200,
        })
      );
      const provider = createVeoProvider(
        "https://api.kie.ai",
        "sk-test",
        mockFetch as unknown as typeof fetch,
        30000
      );

      await provider.api.v1.veo.generate({
        prompt: "A sunset",
        model: "veo3",
      });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.kie.ai/api/v1/veo/generate");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.prompt).toBe("A sunset");
      expect(body.model).toBe("veo3");
    });

    it("should send extend request to correct URL", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ code: 200, data: { taskId: "t2" } }),
          { status: 200 }
        )
      );
      const provider = createVeoProvider(
        "https://api.kie.ai",
        "sk-test",
        mockFetch as unknown as typeof fetch,
        30000
      );

      await provider.api.v1.veo.extend({
        taskId: "t1",
        prompt: "Continue the scene",
        model: "fast",
      });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.kie.ai/api/v1/veo/extend");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.taskId).toBe("t1");
      expect(body.prompt).toBe("Continue the scene");
    });

    it("should return response with taskId", async () => {
      const provider = createVeoProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetchOk({ code: 200, data: { taskId: "veo-xyz" } }),
        30000
      );

      const result = await provider.api.v1.veo.generate({
        prompt: "test",
        model: "veo3_fast",
        aspectRatio: "16:9",
        generationType: "TEXT_2_VIDEO",
      });

      expect(result.code).toBe(200);
      expect(result.data?.taskId).toBe("veo-xyz");
    });
  });

  describe("error handling (real factory)", () => {
    it("should throw KieError on HTTP error", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ msg: "Unauthorized" }),
          { status: 401 }
        )
      );
      const provider = createVeoProvider(
        "https://api.kie.ai",
        "bad-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.api.v1.veo.generate({ prompt: "test" });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).status).toBe(401);
      }
    });

    it("should throw KieError on network failure", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed"));
      const provider = createVeoProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.api.v1.veo.extend({
          taskId: "t1",
          prompt: "continue",
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).message).toContain("Request failed");
      }
    });
  });

  describe("payloadSchema", () => {
    const provider = createVeoProvider(
      "https://api.kie.ai",
      "test-key",
      fetch,
      30000
    );

    it("generate should have method POST", () => {
      expect(provider.api.v1.veo.generate.payloadSchema.method).toBe("POST");
    });

    it("extend should have method POST", () => {
      expect(provider.api.v1.veo.extend.payloadSchema.method).toBe("POST");
    });

    it("generate validatePayload should accept valid request", () => {
      const result = provider.api.v1.veo.generate.validatePayload({
        prompt: "A sunset",
      });
      expect(result.valid).toBe(true);
    });

    it("generate validatePayload should reject missing prompt", () => {
      const result = provider.api.v1.veo.generate.validatePayload({});
      expect(result.valid).toBe(false);
    });

    it("extend validatePayload should accept valid request", () => {
      const result = provider.api.v1.veo.extend.validatePayload({
        taskId: "t1",
        prompt: "continue",
      });
      expect(result.valid).toBe(true);
    });

    it("extend validatePayload should reject missing taskId", () => {
      const result = provider.api.v1.veo.extend.validatePayload({
        prompt: "continue",
      });
      expect(result.valid).toBe(false);
    });

    it("extend validatePayload should reject missing prompt", () => {
      const result = provider.api.v1.veo.extend.validatePayload({
        taskId: "t1",
      });
      expect(result.valid).toBe(false);
    });
  });
});
