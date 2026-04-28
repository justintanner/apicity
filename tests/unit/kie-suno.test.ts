import { describe, it, expect } from "vitest";

import { createSunoProvider } from "../../packages/provider/kie/src/suno";
import { SunoGenerateRequestSchema } from "../../packages/provider/kie/src/zod";

interface CapturedRequest {
  url: string;
  init: RequestInit | undefined;
}

function makeStubFetch(responseBody: unknown): {
  fetch: typeof fetch;
  captured: CapturedRequest[];
} {
  const captured: CapturedRequest[] = [];
  const fetchImpl = (async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    captured.push({ url: String(input), init });
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return { fetch: fetchImpl, captured };
}

const ALL_MODELS = [
  "V3_5",
  "V4",
  "V4_5",
  "V4_5PLUS",
  "V4_5ALL",
  "V5",
  "V5_5",
] as const;

const VALID_GENERATE = {
  prompt: "A happy pop song about summer",
  model: "V4",
  instrumental: false,
  customMode: true,
  callBackUrl: "https://example.com/cb",
};

describe("KIE Suno provider", () => {
  const createProvider = (responseBody: unknown = { code: 200, msg: "ok" }) => {
    const { fetch, captured } = makeStubFetch(responseBody);
    const provider = createSunoProvider(
      "https://api.kie.ai",
      "test-api-key",
      fetch,
      30000
    );
    return { provider, captured };
  };

  describe("namespace structure", () => {
    it("exposes the post.api.v1 surface for every endpoint", () => {
      const { provider } = createProvider();
      const v1 = provider.post.api.v1;
      expect(typeof v1.generate).toBe("function");
      expect(typeof v1.generate.extend).toBe("function");
      expect(typeof v1.generate.uploadCover).toBe("function");
      expect(typeof v1.generate.uploadExtend).toBe("function");
      expect(typeof v1.wav.generate).toBe("function");
      expect(typeof v1.vocalRemoval.generate).toBe("function");
      expect(typeof v1.mp4.generate).toBe("function");
      expect(typeof v1.lyrics).toBe("function");
      expect(typeof v1.style.generate).toBe("function");
      expect(typeof v1.midi.generate).toBe("function");
    });

    it("exposes the get.api.v1.generate.recordInfo endpoint", () => {
      const { provider } = createProvider();
      expect(typeof provider.get.api.v1.generate.recordInfo).toBe("function");
    });

    it("attaches a zod schema to every method that accepts a request body", () => {
      const { provider } = createProvider();
      const v1 = provider.post.api.v1;
      expect(typeof v1.generate.schema.safeParse).toBe("function");
      expect(typeof v1.generate.extend.schema.safeParse).toBe("function");
      expect(typeof v1.generate.uploadCover.schema.safeParse).toBe("function");
      expect(typeof v1.generate.uploadExtend.schema.safeParse).toBe("function");
      expect(typeof v1.wav.generate.schema.safeParse).toBe("function");
      expect(typeof v1.vocalRemoval.generate.schema.safeParse).toBe("function");
      expect(typeof v1.mp4.generate.schema.safeParse).toBe("function");
      expect(typeof v1.lyrics.schema.safeParse).toBe("function");
      expect(typeof v1.style.generate.schema.safeParse).toBe("function");
      expect(typeof v1.midi.generate.schema.safeParse).toBe("function");
    });
  });

  describe("SunoGenerateRequestSchema", () => {
    it("accepts the canonical valid payload", () => {
      const result = SunoGenerateRequestSchema.safeParse(VALID_GENERATE);
      expect(result.success).toBe(true);
    });

    it("requires callBackUrl", () => {
      const { callBackUrl: _drop, ...withoutCallback } = VALID_GENERATE;
      void _drop;
      const result = SunoGenerateRequestSchema.safeParse(withoutCallback);
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("callBackUrl"))
      ).toBe(true);
    });

    it.each(["prompt", "model", "instrumental", "customMode"] as const)(
      "rejects payload missing required field %s",
      (field) => {
        const payload: Record<string, unknown> = { ...VALID_GENERATE };
        delete payload[field];
        const result = SunoGenerateRequestSchema.safeParse(payload);
        expect(result.success).toBe(false);
        expect(result.error?.issues.some((i) => i.path.includes(field))).toBe(
          true
        );
      }
    );

    it("rejects an unknown model literal", () => {
      const result = SunoGenerateRequestSchema.safeParse({
        ...VALID_GENERATE,
        model: "V6",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it.each(ALL_MODELS)("accepts model %s", (model) => {
      const result = SunoGenerateRequestSchema.safeParse({
        ...VALID_GENERATE,
        model,
      });
      expect(result.success).toBe(true);
    });

    it("accepts the full set of optional fields", () => {
      const result = SunoGenerateRequestSchema.safeParse({
        ...VALID_GENERATE,
        style: "Jazz Fusion",
        negativeTags: "rock, pop",
        title: "My Jazz Song",
        vocalGender: "f",
        styleWeight: 0.7,
        weirdnessConstraint: 0.2,
        audioWeight: 0.5,
        personaId: "persona-123",
      });
      expect(result.success).toBe(true);
    });

    it.each([
      ["styleWeight", -0.1],
      ["styleWeight", 1.1],
      ["weirdnessConstraint", 1.5],
      ["audioWeight", -1],
    ] as const)("rejects %s outside 0..1 (%s)", (field, value) => {
      const result = SunoGenerateRequestSchema.safeParse({
        ...VALID_GENERATE,
        [field]: value,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes(field))).toBe(
        true
      );
    });

    it("rejects vocalGender outside 'm'|'f'", () => {
      const result = SunoGenerateRequestSchema.safeParse({
        ...VALID_GENERATE,
        vocalGender: "x",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("POST /api/v1/generate", () => {
    it("posts JSON to the generate URL with the user's body", async () => {
      const { provider, captured } = createProvider({
        code: 200,
        data: { taskId: "t-1" },
      });
      const result = await provider.post.api.v1.generate(VALID_GENERATE);
      expect(captured).toHaveLength(1);
      expect(captured[0].url).toBe("https://api.kie.ai/api/v1/generate");
      expect(captured[0].init?.method).toBe("POST");
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(
        VALID_GENERATE
      );
      expect(result.data?.taskId).toBe("t-1");
    });
  });

  describe("POST /api/v1/generate/extend", () => {
    const VALID_EXTEND = {
      defaultParamFlag: true,
      audioId: "aud-1",
      prompt: "extend with a bridge",
      model: "V5" as const,
      callBackUrl: "https://example.com/cb",
      style: "Synthwave",
      title: "Side B",
      continueAt: 30,
    };

    it("posts to /api/v1/generate/extend with the body", async () => {
      const { provider, captured } = createProvider({
        code: 200,
        data: { taskId: "t-2" },
      });
      await provider.post.api.v1.generate.extend(VALID_EXTEND);
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/generate/extend"
      );
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_EXTEND);
    });

    it("requires defaultParamFlag, audioId, prompt, model, callBackUrl", () => {
      const schema = SunoGenerateRequestSchema; // sanity touch — not used here
      void schema;
      const { provider } = createProvider();
      const required = [
        "defaultParamFlag",
        "audioId",
        "prompt",
        "model",
        "callBackUrl",
      ];
      for (const field of required) {
        const partial: Record<string, unknown> = { ...VALID_EXTEND };
        delete partial[field];
        const result =
          provider.post.api.v1.generate.extend.schema.safeParse(partial);
        expect(result.success).toBe(false);
        expect(result.error?.issues.some((i) => i.path.includes(field))).toBe(
          true
        );
      }
    });

    it("accepts the optional weighting fields and vocalGender", () => {
      const { provider } = createProvider();
      const result = provider.post.api.v1.generate.extend.schema.safeParse({
        ...VALID_EXTEND,
        negativeTags: "lofi",
        vocalGender: "m",
        styleWeight: 0.8,
        weirdnessConstraint: 0.1,
        audioWeight: 0.4,
        personaId: "persona-9",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("POST /api/v1/wav/generate", () => {
    const VALID_WAV = {
      taskId: "task-1",
      audioId: "aud-1",
      callBackUrl: "https://example.com/cb",
    };

    it("posts to /api/v1/wav/generate with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.wav.generate(VALID_WAV);
      expect(captured[0].url).toBe("https://api.kie.ai/api/v1/wav/generate");
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_WAV);
    });

    it.each(["taskId", "audioId", "callBackUrl"] as const)(
      "requires %s",
      (field) => {
        const { provider } = createProvider();
        const partial: Record<string, unknown> = { ...VALID_WAV };
        delete partial[field];
        const result =
          provider.post.api.v1.wav.generate.schema.safeParse(partial);
        expect(result.success).toBe(false);
      }
    );
  });

  describe("POST /api/v1/vocal-removal/generate", () => {
    const VALID_VR = {
      taskId: "task-1",
      audioId: "aud-1",
      callBackUrl: "https://example.com/cb",
    };

    it("posts to /api/v1/vocal-removal/generate with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.vocalRemoval.generate(VALID_VR);
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/vocal-removal/generate"
      );
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_VR);
    });

    it.each(["separate_vocal", "split_stem"] as const)(
      "accepts type=%s",
      (type) => {
        const { provider } = createProvider();
        const result =
          provider.post.api.v1.vocalRemoval.generate.schema.safeParse({
            ...VALID_VR,
            type,
          });
        expect(result.success).toBe(true);
      }
    );

    it("rejects an unknown type literal", () => {
      const { provider } = createProvider();
      const result =
        provider.post.api.v1.vocalRemoval.generate.schema.safeParse({
          ...VALID_VR,
          type: "split_drums",
        });
      expect(result.success).toBe(false);
    });
  });

  describe("POST /api/v1/mp4/generate", () => {
    const VALID_MP4 = {
      taskId: "task-1",
      audioId: "aud-1",
      callBackUrl: "https://example.com/cb",
    };

    it("posts to /api/v1/mp4/generate with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.mp4.generate(VALID_MP4);
      expect(captured[0].url).toBe("https://api.kie.ai/api/v1/mp4/generate");
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_MP4);
    });

    it("accepts optional author and domainName", () => {
      const { provider } = createProvider();
      const result = provider.post.api.v1.mp4.generate.schema.safeParse({
        ...VALID_MP4,
        author: "Some Artist",
        domainName: "example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects author longer than 50 chars", () => {
      const { provider } = createProvider();
      const result = provider.post.api.v1.mp4.generate.schema.safeParse({
        ...VALID_MP4,
        author: "x".repeat(51),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("POST /api/v1/lyrics", () => {
    const VALID_LYRICS = {
      prompt: "A nostalgic song about summer rain",
      callBackUrl: "https://example.com/cb",
    };

    it("posts to /api/v1/lyrics with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.lyrics(VALID_LYRICS);
      expect(captured[0].url).toBe("https://api.kie.ai/api/v1/lyrics");
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_LYRICS);
    });

    it("rejects prompt longer than 200 chars", () => {
      const { provider } = createProvider();
      const result = provider.post.api.v1.lyrics.schema.safeParse({
        ...VALID_LYRICS,
        prompt: "x".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("requires callBackUrl", () => {
      const { provider } = createProvider();
      const result = provider.post.api.v1.lyrics.schema.safeParse({
        prompt: "A song",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("POST /api/v1/style/generate (boost style)", () => {
    it("posts to /api/v1/style/generate with `content` field", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.style.generate({ content: "Pop, Mysterious" });
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/style/generate"
      );
      expect(JSON.parse(String(captured[0].init?.body))).toEqual({
        content: "Pop, Mysterious",
      });
    });

    it("requires content", () => {
      const { provider } = createProvider();
      const result = provider.post.api.v1.style.generate.schema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("POST /api/v1/midi/generate", () => {
    const VALID_MIDI = {
      taskId: "task-1",
      callBackUrl: "https://example.com/cb",
    };

    it("posts to /api/v1/midi/generate with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.midi.generate(VALID_MIDI);
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/midi/generate"
      );
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_MIDI);
    });

    it("accepts optional audioId", () => {
      const { provider } = createProvider();
      const result = provider.post.api.v1.midi.generate.schema.safeParse({
        ...VALID_MIDI,
        audioId: "aud-1",
      });
      expect(result.success).toBe(true);
    });

    it("requires taskId and callBackUrl", () => {
      const { provider } = createProvider();
      for (const field of ["taskId", "callBackUrl"] as const) {
        const partial: Record<string, unknown> = { ...VALID_MIDI };
        delete partial[field];
        const result =
          provider.post.api.v1.midi.generate.schema.safeParse(partial);
        expect(result.success).toBe(false);
      }
    });
  });

  describe("POST /api/v1/generate/upload-cover", () => {
    const VALID_UC = {
      uploadUrl: "https://example.com/song.mp3",
      prompt: "Cover this in a synthwave style",
      customMode: true,
      instrumental: false,
      model: "V5_5" as const,
      callBackUrl: "https://example.com/cb",
      style: "Synthwave",
      title: "Cover Take",
    };

    it("posts to /api/v1/generate/upload-cover with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.generate.uploadCover(VALID_UC);
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/generate/upload-cover"
      );
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_UC);
    });

    it.each([
      "uploadUrl",
      "prompt",
      "customMode",
      "instrumental",
      "model",
      "callBackUrl",
    ] as const)("requires %s", (field) => {
      const { provider } = createProvider();
      const partial: Record<string, unknown> = { ...VALID_UC };
      delete partial[field];
      const result =
        provider.post.api.v1.generate.uploadCover.schema.safeParse(partial);
      expect(result.success).toBe(false);
    });
  });

  describe("POST /api/v1/generate/upload-extend", () => {
    const VALID_UE = {
      uploadUrl: "https://example.com/song.mp3",
      defaultParamFlag: true,
      instrumental: false,
      continueAt: 60,
      model: "V5" as const,
      callBackUrl: "https://example.com/cb",
      prompt: "Continue the chorus then resolve",
    };

    it("posts to /api/v1/generate/upload-extend with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.generate.uploadExtend(VALID_UE);
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/generate/upload-extend"
      );
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_UE);
    });

    it.each([
      "uploadUrl",
      "defaultParamFlag",
      "instrumental",
      "continueAt",
      "model",
      "callBackUrl",
    ] as const)("requires %s", (field) => {
      const { provider } = createProvider();
      const partial: Record<string, unknown> = { ...VALID_UE };
      delete partial[field];
      const result =
        provider.post.api.v1.generate.uploadExtend.schema.safeParse(partial);
      expect(result.success).toBe(false);
    });
  });

  describe("GET /api/v1/generate/record-info", () => {
    it("hits the URL with the taskId query string and parses the response", async () => {
      const responseBody = {
        code: 200,
        msg: "success",
        data: {
          taskId: "task-1",
          parentMusicId: "parent-1",
          response: {
            taskId: "task-1",
            sunoData: [
              {
                id: "track-1",
                audioUrl: "https://cdn.kie.ai/audio.mp3",
                streamAudioUrl: "https://cdn.kie.ai/stream.mp3",
                imageUrl: "https://cdn.kie.ai/cover.jpg",
                prompt: "song",
                modelName: "chirp-v4",
                title: "Title",
                tags: "pop",
                createTime: "2026-04-28T00:00:00Z",
                duration: 180,
              },
            ],
          },
          status: "SUCCESS",
          type: "chirp-v4",
          operationType: "generate",
          errorCode: null,
          errorMessage: null,
        },
      };
      const { provider, captured } = createProvider(responseBody);
      const result = await provider.get.api.v1.generate.recordInfo("task-1");
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/generate/record-info?taskId=task-1"
      );
      expect(captured[0].init?.method).toBe("GET");
      expect(result.data?.taskId).toBe("task-1");
      expect(result.data?.status).toBe("SUCCESS");
      expect(result.data?.operationType).toBe("generate");
      expect(result.data?.response?.sunoData?.[0].audioUrl).toBe(
        "https://cdn.kie.ai/audio.mp3"
      );
    });

    it("URL-encodes the taskId", async () => {
      const { provider, captured } = createProvider({
        code: 200,
        data: { taskId: "weird/id with space" },
      });
      await provider.get.api.v1.generate.recordInfo("weird/id with space");
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/generate/record-info?taskId=weird%2Fid%20with%20space"
      );
    });
  });

  describe("authorization header", () => {
    it("sends Bearer <apiKey> on POST requests", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.generate(VALID_GENERATE);
      const headers = captured[0].init?.headers as
        | Record<string, string>
        | undefined;
      const authVal =
        headers?.["Authorization"] ?? headers?.["authorization"] ?? "";
      expect(authVal).toBe("Bearer test-api-key");
    });
  });
});
