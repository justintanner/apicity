// Tests for the Suno sub-provider
import { describe, it, expect, vi } from "vitest";
import {
  createSunoProvider,
  KieError,
} from "../../../packages/provider/kie/src";

describe("kie suno provider", () => {
  interface SunoGenerateRequest {
    prompt: string;
    model: "V4" | "V4_5" | "V4_5PLUS" | "V4_5ALL" | "V5";
    instrumental: boolean;
    customMode: boolean;
    style?: string;
    negativeTags?: string;
    title?: string;
  }

  interface SunoSubmitResponse {
    code: number;
    msg?: string;
    data?: { taskId?: string };
  }

  interface SunoProvider {
    api: {
      v1: {
        generate(req: SunoGenerateRequest): Promise<SunoSubmitResponse>;
      };
    };
  }

  function createMockSunoProvider(): SunoProvider {
    return {
      api: {
        v1: {
          generate: vi.fn().mockResolvedValue({
            code: 200,
            data: { taskId: "suno-task-123" },
          }),
        },
      },
    };
  }

  it("should generate music", async () => {
    const suno = createMockSunoProvider();
    const result = await suno.api.v1.generate({
      prompt: "A smooth jazz ballad with piano and saxophone",
      model: "V4_5",
      instrumental: true,
      customMode: true,
    });
    expect(result.data?.taskId).toBe("suno-task-123");
  });

  it("should generate instrumental music", async () => {
    const suno = createMockSunoProvider();
    const result = await suno.api.v1.generate({
      prompt: "An upbeat electronic dance track",
      instrumental: true,
      model: "V4_5",
      customMode: true,
    });
    expect(result.data?.taskId).toBe("suno-task-123");
  });

  it("should generate with custom mode options", async () => {
    const suno = createMockSunoProvider();
    const result = await suno.api.v1.generate({
      prompt: "Verse 1: Walking down the street...",
      style: "pop rock",
      customMode: true,
      instrumental: false,
      model: "V4_5",
      title: "City Walk",
      negativeTags: "heavy metal",
    });
    expect(result.data?.taskId).toBe("suno-task-123");
  });

  it("should generate a task and return taskId", async () => {
    const suno = createMockSunoProvider();
    const result = await suno.api.v1.generate({
      prompt: "A lullaby",
      model: "V5",
      instrumental: false,
      customMode: false,
    });
    expect(result.data?.taskId).toBe("suno-task-123");
  });

  describe("real factory", () => {
    it("should send request to correct URL with correct body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ code: 200, data: { taskId: "s1" } }),
          { status: 200 }
        )
      );
      const provider = createSunoProvider(
        "https://api.kie.ai",
        "sk-test",
        mockFetch as unknown as typeof fetch,
        30000
      );

      await provider.api.v1.generate({
        prompt: "A jazz ballad",
        model: "V4_5",
        instrumental: true,
        customMode: true,
        style: "jazz",
        title: "My Song",
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.kie.ai/api/v1/generate");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.prompt).toBe("A jazz ballad");
      expect(body.model).toBe("V4_5");
      expect(body.instrumental).toBe(true);
      expect(body.style).toBe("jazz");
      expect(body.title).toBe("My Song");
    });

    it("should return response with taskId", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ code: 200, msg: "success", data: { taskId: "s2" } }),
          { status: 200 }
        )
      );
      const provider = createSunoProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      const result = await provider.api.v1.generate({
        prompt: "test",
        model: "V5",
        instrumental: false,
        customMode: false,
      });

      expect(result.code).toBe(200);
      expect(result.data?.taskId).toBe("s2");
    });
  });

  describe("error handling (real factory)", () => {
    it("should throw KieError on HTTP error", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ msg: "Insufficient credits" }),
          { status: 402 }
        )
      );
      const provider = createSunoProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.api.v1.generate({
          prompt: "test",
          model: "V5",
          instrumental: false,
          customMode: false,
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).status).toBe(402);
      }
    });

    it("should throw KieError on network failure", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed"));
      const provider = createSunoProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.api.v1.generate({
          prompt: "test",
          model: "V5",
          instrumental: false,
          customMode: false,
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).message).toContain("Request failed");
      }
    });
  });

  describe("payloadSchema", () => {
    const provider = createSunoProvider(
      "https://api.kie.ai",
      "test-key",
      fetch,
      30000
    );

    it("should have method POST", () => {
      expect(provider.api.v1.generate.payloadSchema.method).toBe("POST");
    });

    it("should accept valid request", () => {
      const result = provider.api.v1.generate.validatePayload({
        prompt: "A song",
        model: "V5",
        instrumental: false,
        customMode: false,
      });
      expect(result.valid).toBe(true);
    });

    it("should reject missing prompt", () => {
      const result = provider.api.v1.generate.validatePayload({
        model: "V5",
        instrumental: false,
        customMode: false,
      });
      expect(result.valid).toBe(false);
    });

    it("should reject missing required fields", () => {
      const result = provider.api.v1.generate.validatePayload({
        prompt: "A song",
      });
      expect(result.valid).toBe(false);
    });
  });
});
