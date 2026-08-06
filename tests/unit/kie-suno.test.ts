import { describe, it, expect } from "vitest";

import { createSunoProvider } from "../../packages/provider/kie/src/suno";
import { SunoGenerateRequestSchema } from "../../packages/provider/kie/src/zod";
import type { SunoMidiRecordInfoResponse } from "@apicity/kie";

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
  model: "V4" as const,
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
      expect(typeof v1.generate.mashup).toBe("function");
      expect(typeof v1.generate.replaceSection).toBe("function");
      expect(typeof v1.generate.sounds).toBe("function");
      expect(typeof v1.generate.addInstrumental).toBe("function");
      expect(typeof v1.generate.addVocals).toBe("function");
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
      expect(typeof v1.generate.mashup.schema.safeParse).toBe("function");
      expect(typeof v1.generate.replaceSection.schema.safeParse).toBe(
        "function"
      );
      expect(typeof v1.generate.sounds.schema.safeParse).toBe("function");
      expect(typeof v1.generate.addInstrumental.schema.safeParse).toBe(
        "function"
      );
      expect(typeof v1.generate.addVocals.schema.safeParse).toBe("function");
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

    // `model` is now an open enum (SunoModelAliasSchema in zod.ts), so the
    // not-yet-listed version `V6` validates by design and can no longer stand
    // in for an unknown literal here. The negative keeps its job with a
    // near-miss of a listed id — `V4-5` uses a hyphen where Suno's grammar
    // uses an underscore. Full accept/alias/reject coverage for every opened
    // kie model field lives in tests/unit/kie-zod.test.ts.
    it("rejects an unknown model literal", () => {
      const result = SunoGenerateRequestSchema.safeParse({
        ...VALID_GENERATE,
        model: "V4-5",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("accepts a not-yet-listed Suno version alias", () => {
      const result = SunoGenerateRequestSchema.safeParse({
        ...VALID_GENERATE,
        model: "V6",
      });
      expect(result.success).toBe(true);
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
      expect(captured[0].url).toBe("https://api.kie.ai/api/v1/generate/extend");
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
        if (result.success) throw new Error("expected failure");
        expect(result.error.issues.some((i) => i.path.includes(field))).toBe(
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
      expect(captured[0].url).toBe("https://api.kie.ai/api/v1/style/generate");
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
      expect(captured[0].url).toBe("https://api.kie.ai/api/v1/midi/generate");
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

  describe("POST /api/v1/generate/mashup", () => {
    const VALID_MASHUP = {
      uploadUrlList: [
        "https://example.com/audio1.mp3",
        "https://example.com/audio2.mp3",
      ] as [string, string],
      customMode: false,
      model: "V4" as const,
      callBackUrl: "https://example.com/cb",
    };

    it("posts to /api/v1/generate/mashup with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.generate.mashup(VALID_MASHUP);
      expect(captured[0].url).toBe("https://api.kie.ai/api/v1/generate/mashup");
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_MASHUP);
    });

    it.each(["uploadUrlList", "customMode", "model", "callBackUrl"] as const)(
      "requires %s",
      (field) => {
        const { provider } = createProvider();
        const partial: Record<string, unknown> = { ...VALID_MASHUP };
        delete partial[field];
        const result =
          provider.post.api.v1.generate.mashup.schema.safeParse(partial);
        expect(result.success).toBe(false);
      }
    );
  });

  describe("POST /api/v1/generate/replace-section", () => {
    const VALID_REPLACE = {
      taskId: "task-1",
      audioId: "audio-1",
      prompt: "Replace this section with a brighter bridge",
      tags: "pop, upbeat",
      title: "Replacement",
      infillStartS: 10.5,
      infillEndS: 20.75,
      callBackUrl: "https://example.com/cb",
    };

    it("posts to /api/v1/generate/replace-section with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.generate.replaceSection(VALID_REPLACE);
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/generate/replace-section"
      );
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_REPLACE);
    });

    it.each([
      "taskId",
      "audioId",
      "prompt",
      "tags",
      "title",
      "infillStartS",
      "infillEndS",
    ] as const)("requires %s", (field) => {
      const { provider } = createProvider();
      const partial: Record<string, unknown> = { ...VALID_REPLACE };
      delete partial[field];
      const result =
        provider.post.api.v1.generate.replaceSection.schema.safeParse(partial);
      expect(result.success).toBe(false);
    });
  });

  describe("POST /api/v1/generate/sounds", () => {
    const VALID_SOUNDS = {
      prompt: "Rain on a tin roof",
      model: "V5" as const,
      soundLoop: true,
    };

    it("posts to /api/v1/generate/sounds with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.generate.sounds(VALID_SOUNDS);
      expect(captured[0].url).toBe("https://api.kie.ai/api/v1/generate/sounds");
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(VALID_SOUNDS);
    });

    it("accepts optional sound controls", () => {
      const { provider } = createProvider();
      const result = provider.post.api.v1.generate.sounds.schema.safeParse({
        ...VALID_SOUNDS,
        soundTempo: 166,
        soundKey: "D#m",
        grabLyrics: true,
        callBackUrl: "https://example.com/cb",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("POST /api/v1/generate/add-instrumental", () => {
    const VALID_ADD_INSTRUMENTAL = {
      uploadUrl: "https://example.com/vocal.mp3",
      title: "Backing Track",
      tags: "acoustic, piano",
      callBackUrl: "https://example.com/cb",
      model: "V4_5PLUS" as const,
    };

    it("posts to /api/v1/generate/add-instrumental with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.generate.addInstrumental(
        VALID_ADD_INSTRUMENTAL
      );
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/generate/add-instrumental"
      );
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(
        VALID_ADD_INSTRUMENTAL
      );
    });

    it.each(["uploadUrl", "title", "tags", "callBackUrl", "model"] as const)(
      "requires %s",
      (field) => {
        const { provider } = createProvider();
        const partial: Record<string, unknown> = {
          ...VALID_ADD_INSTRUMENTAL,
        };
        delete partial[field];
        const result =
          provider.post.api.v1.generate.addInstrumental.schema.safeParse(
            partial
          );
        expect(result.success).toBe(false);
      }
    );
  });

  describe("POST /api/v1/generate/add-vocals", () => {
    const VALID_ADD_VOCALS = {
      uploadUrl: "https://example.com/instrumental.mp3",
      prompt: "A calm vocal about summer dreams",
      title: "Summer Dreams",
      style: "soft pop",
      negativeTags: "heavy metal, strong drum beats",
      callBackUrl: "https://example.com/cb",
      model: "V4_5PLUS" as const,
    };

    it("posts to /api/v1/generate/add-vocals with the body", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.generate.addVocals(VALID_ADD_VOCALS);
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/generate/add-vocals"
      );
      expect(JSON.parse(String(captured[0].init?.body))).toEqual(
        VALID_ADD_VOCALS
      );
    });

    it.each([
      "uploadUrl",
      "prompt",
      "title",
      "style",
      "negativeTags",
      "callBackUrl",
      "model",
    ] as const)("requires %s", (field) => {
      const { provider } = createProvider();
      const partial: Record<string, unknown> = { ...VALID_ADD_VOCALS };
      delete partial[field];
      const result =
        provider.post.api.v1.generate.addVocals.schema.safeParse(partial);
      expect(result.success).toBe(false);
    });

    it("requires non-empty negativeTags", () => {
      const { provider } = createProvider();
      const result = provider.post.api.v1.generate.addVocals.schema.safeParse({
        ...VALID_ADD_VOCALS,
        negativeTags: "",
      });

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

  describe("GET /api/v1/midi/record-info", () => {
    // The populated example from https://docs.kie.ai/suno-api/get-midi-details.
    const POPULATED = {
      code: 200,
      msg: "success",
      data: {
        taskId: "5c79****be8e",
        recordTaskId: -1,
        audioId: "e231****-****-****-****-****8cadc7dc",
        callbackUrl: "https://example.callback",
        completeTime: 1760335255000,
        createTime: 1760335251000,
        successFlag: 1,
        errorCode: null,
        errorMessage: null,
        midiData: {
          state: "complete",
          instruments: [
            {
              name: "Drums",
              notes: [
                {
                  pitch: 73,
                  start: 0.036458333333333336,
                  end: 0.18229166666666666,
                  velocity: 1,
                },
              ],
            },
          ],
        },
      },
    };

    it("exposes a callable with request and response schema metadata", () => {
      const { provider } = createProvider();
      const recordInfo = provider.get.api.v1.midi.recordInfo;
      expect(typeof recordInfo).toBe("function");
      expect(typeof recordInfo.schema.safeParse).toBe("function");
      expect(typeof recordInfo.responseSchema.safeParse).toBe("function");
    });

    it("issues a bodyless GET with the percent-encoded taskId", async () => {
      const { provider, captured } = createProvider(POPULATED);
      const result: SunoMidiRecordInfoResponse =
        await provider.get.api.v1.midi.recordInfo(
          "midi/job?attempt=1&source=test"
        );
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/midi/record-info" +
          "?taskId=midi%2Fjob%3Fattempt%3D1%26source%3Dtest"
      );
      expect(captured[0].init?.method).toBe("GET");
      expect(captured[0].init?.body).toBeUndefined();
      expect(result.data?.successFlag).toBe(1);
      expect(result.data?.midiData?.instruments?.[0].notes[0].pitch).toBe(73);
    });

    // Typed reads, not just a passthrough parse: the response schema is
    // `.passthrough()`, so a positive safeParse stays green even if a
    // documented field is dropped from the schema. Reading each field off the
    // typed result makes `tsc -p tests/tsconfig.json` fail on that regression,
    // including for the optional/nullable members a negative parse cannot
    // reach.
    it("types every documented field on the response", async () => {
      const { provider } = createProvider(POPULATED);
      const result: SunoMidiRecordInfoResponse =
        await provider.get.api.v1.midi.recordInfo("task-1");
      const data = result.data;
      const instrument = data?.midiData?.instruments?.[0];
      const note = instrument?.notes[0];

      expect(result.code).toBe(200);
      expect(result.msg).toBe("success");
      expect(data?.taskId).toBe("5c79****be8e");
      expect(data?.recordTaskId).toBe(-1);
      expect(data?.audioId).toBe("e231****-****-****-****-****8cadc7dc");
      expect(data?.callbackUrl).toBe("https://example.callback");
      expect(data?.createTime).toBe(1760335251000);
      expect(data?.completeTime).toBe(1760335255000);
      expect(data?.successFlag).toBe(1);
      expect(data?.errorCode).toBeNull();
      expect(data?.errorMessage).toBeNull();
      expect(data?.midiData?.state).toBe("complete");
      expect(instrument?.name).toBe("Drums");
      expect(note?.pitch).toBe(73);
      expect(note?.start).toBe(0.036458333333333336);
      expect(note?.end).toBe(0.18229166666666666);
      expect(note?.velocity).toBe(1);
    });

    it("accepts the documented populated response", () => {
      const { provider } = createProvider();
      const result =
        provider.get.api.v1.midi.recordInfo.responseSchema.safeParse(POPULATED);
      expect(result.success).toBe(true);
    });

    it("accepts every documented successFlag", () => {
      const { provider } = createProvider();
      for (const successFlag of [0, 1, 2, 3]) {
        const result =
          provider.get.api.v1.midi.recordInfo.responseSchema.safeParse({
            code: 200,
            msg: "success",
            data: { taskId: "task-1", successFlag },
          });
        expect(result.success).toBe(true);
      }
    });

    it("accepts empty MIDI data and an empty instrument list", () => {
      const { provider } = createProvider();
      const schema = provider.get.api.v1.midi.recordInfo.responseSchema;
      expect(
        schema.safeParse({
          code: 200,
          data: { taskId: "task-1", successFlag: 1, midiData: {} },
        }).success
      ).toBe(true);
      expect(
        schema.safeParse({
          code: 200,
          data: {
            taskId: "task-1",
            successFlag: 1,
            midiData: { state: "complete", instruments: [] },
          },
        }).success
      ).toBe(true);
    });

    it("accepts nullable and string-coded failure details", () => {
      const { provider } = createProvider();
      const schema = provider.get.api.v1.midi.recordInfo.responseSchema;
      expect(
        schema.safeParse({
          code: 200,
          data: {
            taskId: "task-1",
            successFlag: 3,
            errorCode: "GENERATE_MIDI_FAILED",
            errorMessage: "midi generation failed",
            midiData: null,
            completeTime: null,
          },
        }).success
      ).toBe(true);
      expect(
        schema.safeParse({
          code: 200,
          data: {
            taskId: "task-1",
            successFlag: 2,
            errorCode: null,
            errorMessage: null,
          },
        }).success
      ).toBe(true);
    });

    it("keeps forward-compatible fields at every object level", () => {
      const { provider } = createProvider();
      const withExtras = {
        code: 200,
        msg: "success",
        requestId: "req-extra",
        data: {
          taskId: "task-1",
          successFlag: 1,
          futureField: "keep-me",
          midiData: {
            state: "complete",
            tempo: 120,
            instruments: [
              {
                name: "Drums",
                program: 0,
                notes: [
                  { pitch: 73, start: 0, end: 1, velocity: 1, channel: 9 },
                ],
              },
            ],
          },
        },
      };
      const result =
        provider.get.api.v1.midi.recordInfo.responseSchema.safeParse(
          withExtras
        );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(withExtras);
      }
    });

    it("accepts the missing-task envelope", () => {
      const { provider } = createProvider();
      const result =
        provider.get.api.v1.midi.recordInfo.responseSchema.safeParse({
          code: 200,
          msg: "success",
          data: null,
        });
      expect(result.success).toBe(true);
    });

    it("resolves rather than throws on the missing-task envelope", async () => {
      // HTTP 200 with data:null is Kie's not-found shape; the transport must
      // return it to the caller instead of raising.
      const { provider } = createProvider({
        code: 200,
        msg: "success",
        data: null,
      });
      const result: SunoMidiRecordInfoResponse =
        await provider.get.api.v1.midi.recordInfo(
          "apicity-test-nonexistent-task-id-do-not-record-real"
        );
      expect(result.code).toBe(200);
      expect(result.msg).toBe("success");
      expect(result.data).toBeNull();
    });

    it("requires a non-empty taskId", () => {
      const { provider } = createProvider();
      const schema = provider.get.api.v1.midi.recordInfo.schema;
      expect(schema.safeParse({}).success).toBe(false);
      expect(schema.safeParse({ taskId: "" }).success).toBe(false);
      expect(schema.safeParse({ taskId: "task-1" }).success).toBe(true);
    });

    it("rejects non-numeric note values", () => {
      const { provider } = createProvider();
      const result =
        provider.get.api.v1.midi.recordInfo.responseSchema.safeParse({
          code: 200,
          data: {
            taskId: "task-1",
            successFlag: 1,
            midiData: {
              state: "complete",
              instruments: [
                {
                  name: "Drums",
                  notes: [{ pitch: "73", start: 0, end: 1, velocity: 1 }],
                },
              ],
            },
          },
        });
      expect(result.success).toBe(false);
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
