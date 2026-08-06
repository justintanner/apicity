import { describe, it, expect } from "vitest";

import { createVeoProvider } from "../../packages/provider/kie/src/veo";
import {
  VeoGenerateRequestSchema,
  VeoExtendRequestSchema,
  VeoGet1080pVideoRequestSchema,
  VeoGet1080pVideoResponseSchema,
  VeoGet4kVideoRequestSchema,
  VeoGet4kVideoResponseSchema,
} from "../../packages/provider/kie/src/zod";

describe("KIE Veo provider", () => {
  const mockFetch = () => Promise.resolve(new Response());
  const createProvider = () =>
    createVeoProvider("https://api.kie.ai", "test-api-key", mockFetch, 30000);

  describe("namespace structure", () => {
    it("should have correct namespace structure", () => {
      const provider = createProvider();

      expect(provider.post).toBeDefined();
      expect(provider.post.api).toBeDefined();
      expect(provider.post.api.v1).toBeDefined();
      expect(provider.post.api.v1.veo).toBeDefined();
      expect(provider.post.api.v1.veo.generate).toBeDefined();
      expect(provider.post.api.v1.veo.extend).toBeDefined();
      expect(provider.post.api.v1.veo.get4kVideo).toBeDefined();
      expect(provider.get).toBeDefined();
      expect(provider.get.api).toBeDefined();
      expect(provider.get.api.v1).toBeDefined();
      expect(provider.get.api.v1.veo).toBeDefined();
      expect(provider.get.api.v1.veo.get1080pVideo).toBeDefined();
    });

    it("should have callable generate method", () => {
      const provider = createProvider();
      expect(typeof provider.post.api.v1.veo.generate).toBe("function");
    });

    it("should have callable extend method", () => {
      const provider = createProvider();
      expect(typeof provider.post.api.v1.veo.extend).toBe("function");
    });

    it("should have callable get1080pVideo method", () => {
      const provider = createProvider();
      expect(typeof provider.get.api.v1.veo.get1080pVideo).toBe("function");
    });

    it("should have callable get4kVideo method", () => {
      const provider = createProvider();
      expect(typeof provider.post.api.v1.veo.get4kVideo).toBe("function");
    });
  });

  describe("VeoGenerateRequestSchema", () => {
    it("should expose safeParse", () => {
      expect(typeof VeoGenerateRequestSchema.safeParse).toBe("function");
    });

    it("should expose parse", () => {
      expect(typeof VeoGenerateRequestSchema.parse).toBe("function");
    });
  });

  describe("VeoExtendRequestSchema", () => {
    it("should expose safeParse", () => {
      expect(typeof VeoExtendRequestSchema.safeParse).toBe("function");
    });

    it("should expose parse", () => {
      expect(typeof VeoExtendRequestSchema.parse).toBe("function");
    });
  });

  describe("VeoGet1080pVideo schemas", () => {
    it("should expose request and response safeParse", () => {
      expect(typeof VeoGet1080pVideoRequestSchema.safeParse).toBe("function");
      expect(typeof VeoGet1080pVideoResponseSchema.safeParse).toBe("function");
    });
  });

  describe("VeoGet4kVideo schemas", () => {
    it("should expose request and response safeParse", () => {
      expect(typeof VeoGet4kVideoRequestSchema.safeParse).toBe("function");
      expect(typeof VeoGet4kVideoResponseSchema.safeParse).toBe("function");
    });
  });

  describe("generate payload validation", () => {
    it("should validate valid generate payload", () => {
      const payload = {
        prompt: "A cat playing piano",
        model: "veo3",
        aspectRatio: "16:9",
      };

      const result = VeoGenerateRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should validate minimal generate payload", () => {
      const payload = {
        prompt: "A beautiful sunset",
      };

      const result = VeoGenerateRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject payload without required prompt", () => {
      const payload = {
        model: "veo3",
      };

      const result = VeoGenerateRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });

    it("should reject invalid model enum", () => {
      const payload = {
        prompt: "Test",
        model: "invalid_model",
      };

      const result = VeoGenerateRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject invalid aspectRatio enum", () => {
      const payload = {
        prompt: "Test",
        aspectRatio: "4:3",
      };

      const result = VeoGenerateRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("aspectRatio"))
      ).toBe(true);
    });

    it("should reject invalid generationType enum", () => {
      const payload = {
        prompt: "Test",
        generationType: "INVALID_TYPE",
      };

      const result = VeoGenerateRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("generationType"))
      ).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const payload = {
        prompt: "A dog running",
        model: "veo3_fast",
        aspectRatio: "9:16",
        generationType: "TEXT_2_VIDEO",
        imageUrls: ["https://example.com/image1.jpg"],
        seeds: 12345,
        watermark: "Sample",
        enableTranslation: true,
        resolution: "1080p",
        duration: 8,
        callBackUrl: "https://example.com/callback",
        enableFallback: false,
      };

      const result = VeoGenerateRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should accept documented resolution and duration values", () => {
      for (const resolution of ["720p", "1080p", "4k"] as const) {
        const result = VeoGenerateRequestSchema.safeParse({
          prompt: "A cat playing piano",
          resolution,
        });
        expect(result.success).toBe(true);
      }
      for (const duration of [4, 6, 8] as const) {
        const result = VeoGenerateRequestSchema.safeParse({
          prompt: "A cat playing piano",
          duration,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid resolution and duration", () => {
      const badRes = VeoGenerateRequestSchema.safeParse({
        prompt: "Test",
        resolution: "480p",
      });
      expect(badRes.success).toBe(false);
      expect(
        badRes.error?.issues.some((i) => i.path.includes("resolution"))
      ).toBe(true);

      const badDur = VeoGenerateRequestSchema.safeParse({
        prompt: "Test",
        duration: 5,
      });
      expect(badDur.success).toBe(false);
      expect(
        badDur.error?.issues.some((i) => i.path.includes("duration"))
      ).toBe(true);
    });
  });

  describe("extend payload validation", () => {
    it("should validate valid extend payload", () => {
      const payload = {
        taskId: "task-123",
        prompt: "Extend the video",
      };

      const result = VeoExtendRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject payload without taskId", () => {
      const payload = {
        prompt: "Extend the video",
      };

      const result = VeoExtendRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("taskId"))).toBe(
        true
      );
    });

    it("should reject payload without prompt", () => {
      const payload = {
        taskId: "task-123",
      };

      const result = VeoExtendRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });

    it("should validate with model option", () => {
      const payload = {
        taskId: "task-123",
        prompt: "Extend",
        model: "quality",
      };

      const result = VeoExtendRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject invalid model option", () => {
      const payload = {
        taskId: "task-123",
        prompt: "Extend",
        model: "invalid",
      };

      const result = VeoExtendRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should accept callBackUrl on extend", () => {
      const result = VeoExtendRequestSchema.safeParse({
        taskId: "task-123",
        prompt: "Extend the video",
        callBackUrl: "https://example.com/veo-extend-callback",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("get1080pVideo payload validation", () => {
    it("should validate valid request payload", () => {
      const result = VeoGet1080pVideoRequestSchema.safeParse({
        taskId: "veo-task-123",
        index: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing taskId", () => {
      const result = VeoGet1080pVideoRequestSchema.safeParse({ index: 0 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("taskId"))).toBe(
        true
      );
    });

    it("should reject negative index", () => {
      const result = VeoGet1080pVideoRequestSchema.safeParse({
        taskId: "veo-task-123",
        index: -1,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("index"))).toBe(
        true
      );
    });

    it("should validate response payload", () => {
      const result = VeoGet1080pVideoResponseSchema.safeParse({
        code: 200,
        msg: "success",
        data: {
          resultUrl: "https://example.com/video.mp4",
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("get4kVideo payload validation", () => {
    it("should validate valid request payload", () => {
      const result = VeoGet4kVideoRequestSchema.safeParse({
        taskId: "veo-task-123",
        index: 0,
        callBackUrl: "https://example.com/4k-callback",
      });
      expect(result.success).toBe(true);
    });

    it("should validate minimal request payload", () => {
      const result = VeoGet4kVideoRequestSchema.safeParse({
        taskId: "veo-task-123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing taskId", () => {
      const result = VeoGet4kVideoRequestSchema.safeParse({ index: 0 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("taskId"))).toBe(
        true
      );
    });

    it("should reject negative index", () => {
      const result = VeoGet4kVideoRequestSchema.safeParse({
        taskId: "veo-task-123",
        index: -1,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("index"))).toBe(
        true
      );
    });

    it("should validate response payload with null urls", () => {
      const result = VeoGet4kVideoResponseSchema.safeParse({
        code: 200,
        msg: "success",
        data: {
          taskId: "veo-task-123",
          resultUrls: null,
          imageUrls: null,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate response payload with result urls", () => {
      const result = VeoGet4kVideoResponseSchema.safeParse({
        code: 200,
        msg: "success",
        data: {
          taskId: "veo-task-123",
          resultUrls: ["https://example.com/video-4k.mp4"],
          imageUrls: ["https://example.com/thumb.jpg"],
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate null data envelope", () => {
      const result = VeoGet4kVideoResponseSchema.safeParse({
        code: 422,
        msg: "Record does not exist",
        data: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("provider method validation", () => {
    it("generate should have schema attached", () => {
      const provider = createProvider();
      expect(provider.post.api.v1.veo.generate.schema).toBeDefined();
      expect(typeof provider.post.api.v1.veo.generate.schema.safeParse).toBe(
        "function"
      );
    });

    it("generate schema should validate correctly", () => {
      const provider = createProvider();
      const result = provider.post.api.v1.veo.generate.schema.safeParse({
        prompt: "Test",
      });
      expect(result.success).toBe(true);
    });

    it("generate schema should reject invalid payload", () => {
      const provider = createProvider();
      const result = provider.post.api.v1.veo.generate.schema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("extend should have schema attached", () => {
      const provider = createProvider();
      expect(provider.post.api.v1.veo.extend.schema).toBeDefined();
      expect(typeof provider.post.api.v1.veo.extend.schema.safeParse).toBe(
        "function"
      );
    });

    it("extend schema should validate correctly", () => {
      const provider = createProvider();
      const result = provider.post.api.v1.veo.extend.schema.safeParse({
        taskId: "task-123",
        prompt: "Extend",
      });
      expect(result.success).toBe(true);
    });

    it("get1080pVideo should have request and response schemas attached", () => {
      const provider = createProvider();
      expect(provider.get.api.v1.veo.get1080pVideo.schema).toBeDefined();
      expect(
        provider.get.api.v1.veo.get1080pVideo.responseSchema
      ).toBeDefined();
      expect(
        provider.get.api.v1.veo.get1080pVideo.schema.safeParse({
          taskId: "task-123",
        }).success
      ).toBe(true);
    });

    it("get4kVideo should have request and response schemas attached", () => {
      const provider = createProvider();
      expect(provider.post.api.v1.veo.get4kVideo.schema).toBeDefined();
      expect(provider.post.api.v1.veo.get4kVideo.responseSchema).toBeDefined();
      expect(
        provider.post.api.v1.veo.get4kVideo.schema.safeParse({
          taskId: "task-123",
        }).success
      ).toBe(true);
    });
  });

  describe("get1080pVideo request dispatch", () => {
    it("serializes taskId and index as query params", async () => {
      const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
      const provider = createVeoProvider(
        "https://api.kie.ai",
        "test-api-key",
        async (input, init) => {
          calls.push({ input, init });

          return new Response(
            JSON.stringify({
              code: 200,
              msg: "success",
              data: { resultUrl: "https://example.com/video.mp4" },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        },
        30000
      );

      const result = await provider.get.api.v1.veo.get1080pVideo({
        taskId: "task id/with spaces",
        index: 0,
      });

      expect(result.data?.resultUrl).toBe("https://example.com/video.mp4");
      expect(calls).toHaveLength(1);
      expect(String(calls[0].input)).toBe(
        "https://api.kie.ai/api/v1/veo/get-1080p-video?taskId=task%20id%2Fwith%20spaces&index=0"
      );
      expect(calls[0].init?.method).toBe("GET");
      expect(calls[0].init?.headers).toMatchObject({
        Authorization: "Bearer test-api-key",
        "Content-Type": "application/json",
      });
    });
  });

  describe("get4kVideo request dispatch", () => {
    it("POSTs JSON body with taskId, index, and callBackUrl", async () => {
      const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
      const provider = createVeoProvider(
        "https://api.kie.ai",
        "test-api-key",
        async (input, init) => {
          calls.push({ input, init });

          return new Response(
            JSON.stringify({
              code: 200,
              msg: "success",
              data: {
                taskId: "task-123",
                resultUrls: null,
                imageUrls: null,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        },
        30000
      );

      const request = {
        taskId: "task-123",
        index: 0,
        callBackUrl: "https://example.com/4k-callback",
      };
      const result = await provider.post.api.v1.veo.get4kVideo(request);

      expect(result.data?.taskId).toBe("task-123");
      expect(calls).toHaveLength(1);
      expect(String(calls[0].input)).toBe(
        "https://api.kie.ai/api/v1/veo/get-4k-video"
      );
      expect(calls[0].init?.method).toBe("POST");
      expect(JSON.parse(String(calls[0].init?.body))).toEqual(request);
      expect(calls[0].init?.headers).toMatchObject({
        Authorization: "Bearer test-api-key",
        "Content-Type": "application/json",
      });
    });
  });

  describe("VeoModel type", () => {
    it("should accept documented model values including veo3_lite", () => {
      const provider = createProvider();
      // Documented family: veo3, veo3_fast, veo3_lite (ac-x16e16).
      const validModels = ["veo3", "veo3_fast", "veo3_lite"] as const;

      for (const model of validModels) {
        const result = provider.post.api.v1.veo.generate.schema.safeParse({
          prompt: "Test",
          model,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("VeoGenerationType", () => {
    it("should accept valid generation types", () => {
      const provider = createProvider();
      const validTypes = [
        "TEXT_2_VIDEO",
        "REFERENCE_2_VIDEO",
        "FIRST_AND_LAST_FRAMES_2_VIDEO",
      ];

      for (const generationType of validTypes) {
        const result = provider.post.api.v1.veo.generate.schema.safeParse({
          prompt: "Test",
          generationType,
        });
        expect(result.success).toBe(true);
      }
    });
  });
});
