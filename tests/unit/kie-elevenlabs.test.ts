import { describe, it, expect } from "vitest";

import { createElevenLabsProvider } from "../../packages/provider/kie/src/elevenlabs";

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

const CREATE_TASK_URL = "https://api.kie.ai/api/v1/jobs/createTask";

describe("KIE ElevenLabs provider", () => {
  const createProvider = (responseBody: unknown = { code: 200, msg: "ok" }) => {
    const { fetch, captured } = makeStubFetch(responseBody);
    const provider = createElevenLabsProvider(
      "https://api.kie.ai",
      "test-api-key",
      fetch,
      30000
    );
    return { provider, captured };
  };

  describe("namespace structure", () => {
    it("exposes createTask methods for each ElevenLabs model", () => {
      const { provider } = createProvider();
      const ct = provider.post.api.v1.jobs.createTask;
      expect(typeof ct.dialogue).toBe("function");
      expect(typeof ct.sfx).toBe("function");
      expect(typeof ct.stt).toBe("function");
      expect(typeof ct.audioIsolation).toBe("function");
      expect(typeof ct.ttsMultilingual).toBe("function");
      expect(typeof ct.ttsTurbo).toBe("function");
    });

    it("exposes recordInfo on both post.api.v1.jobs and get.api.v1.jobs", () => {
      const { provider } = createProvider();
      expect(typeof provider.post.api.v1.jobs.recordInfo).toBe("function");
      expect(typeof provider.get.api.v1.jobs.recordInfo).toBe("function");
    });

    it("attaches a zod schema to every createTask method", () => {
      const { provider } = createProvider();
      const ct = provider.post.api.v1.jobs.createTask;
      expect(typeof ct.dialogue.schema.safeParse).toBe("function");
      expect(typeof ct.sfx.schema.safeParse).toBe("function");
      expect(typeof ct.stt.schema.safeParse).toBe("function");
      expect(typeof ct.audioIsolation.schema.safeParse).toBe("function");
      expect(typeof ct.ttsMultilingual.schema.safeParse).toBe("function");
      expect(typeof ct.ttsTurbo.schema.safeParse).toBe("function");
    });
  });

  describe("envelope wrapping", () => {
    it("sfx wraps the input in {model: 'elevenlabs/sound-effect-v2', input}", async () => {
      const { provider, captured } = createProvider({
        code: 200,
        data: { taskId: "t-sfx" },
      });
      await provider.post.api.v1.jobs.createTask.sfx({
        text: "explosion",
        duration_seconds: 2,
        prompt_influence: 0.5,
      });
      expect(captured[0].url).toBe(CREATE_TASK_URL);
      expect(captured[0].init?.method).toBe("POST");
      const body = JSON.parse(String(captured[0].init?.body));
      expect(body).toEqual({
        model: "elevenlabs/sound-effect-v2",
        input: {
          text: "explosion",
          duration_seconds: 2,
          prompt_influence: 0.5,
        },
      });
    });

    it("dialogue wraps the input in {model: 'elevenlabs/text-to-dialogue-v3', input}", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.jobs.createTask.dialogue({
        dialogue: [{ text: "Hello there", voice: "Adam" }],
        stability: 0.5,
      });
      const body = JSON.parse(String(captured[0].init?.body));
      expect(body.model).toBe("elevenlabs/text-to-dialogue-v3");
      expect(body.input.dialogue[0].voice).toBe("Adam");
      expect(body.input.stability).toBe(0.5);
    });

    it("stt wraps the input under model 'elevenlabs/speech-to-text'", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.jobs.createTask.stt({
        audio_url: "https://example.com/a.mp3",
        diarize: true,
      });
      const body = JSON.parse(String(captured[0].init?.body));
      expect(body.model).toBe("elevenlabs/speech-to-text");
      expect(body.input.audio_url).toBe("https://example.com/a.mp3");
      expect(body.input.diarize).toBe(true);
    });

    it("audioIsolation wraps under model 'elevenlabs/audio-isolation'", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.jobs.createTask.audioIsolation({
        audio_url: "https://example.com/a.mp3",
        output_format: "mp3_44100_128",
      });
      const body = JSON.parse(String(captured[0].init?.body));
      expect(body.model).toBe("elevenlabs/audio-isolation");
      expect(body.input.audio_url).toBe("https://example.com/a.mp3");
    });

    it("ttsMultilingual wraps under 'elevenlabs/text-to-speech-multilingual-v2'", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.jobs.createTask.ttsMultilingual({
        text: "Bonjour",
        voice: "Sarah",
        language_code: "fr",
      });
      const body = JSON.parse(String(captured[0].init?.body));
      expect(body.model).toBe("elevenlabs/text-to-speech-multilingual-v2");
      expect(body.input.voice).toBe("Sarah");
      expect(body.input.language_code).toBe("fr");
    });

    it("ttsTurbo wraps under 'elevenlabs/text-to-speech-turbo-2-5'", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.jobs.createTask.ttsTurbo({
        text: "Hello",
        voice: "Brian",
      });
      const body = JSON.parse(String(captured[0].init?.body));
      expect(body.model).toBe("elevenlabs/text-to-speech-turbo-2-5");
      expect(body.input.text).toBe("Hello");
      expect(body.input.voice).toBe("Brian");
    });
  });

  describe("schema validation (envelope form)", () => {
    it("sfx schema rejects duration_seconds outside 0.5..22", () => {
      const { provider } = createProvider();
      const sfx = provider.post.api.v1.jobs.createTask.sfx.schema;
      expect(
        sfx.safeParse({
          model: "elevenlabs/sound-effect-v2",
          input: { text: "x", duration_seconds: 0.4 },
        }).success
      ).toBe(false);
      expect(
        sfx.safeParse({
          model: "elevenlabs/sound-effect-v2",
          input: { text: "x", duration_seconds: 22.5 },
        }).success
      ).toBe(false);
      expect(
        sfx.safeParse({
          model: "elevenlabs/sound-effect-v2",
          input: { text: "x", duration_seconds: 5 },
        }).success
      ).toBe(true);
    });

    it("sfx schema rejects prompt_influence outside 0..1", () => {
      const { provider } = createProvider();
      const sfx = provider.post.api.v1.jobs.createTask.sfx.schema;
      expect(
        sfx.safeParse({
          model: "elevenlabs/sound-effect-v2",
          input: { text: "x", prompt_influence: 1.5 },
        }).success
      ).toBe(false);
      expect(
        sfx.safeParse({
          model: "elevenlabs/sound-effect-v2",
          input: { text: "x", prompt_influence: 0.5 },
        }).success
      ).toBe(true);
    });

    it("sfx schema rejects text longer than 5000 chars", () => {
      const { provider } = createProvider();
      const sfx = provider.post.api.v1.jobs.createTask.sfx.schema;
      const result = sfx.safeParse({
        model: "elevenlabs/sound-effect-v2",
        input: { text: "x".repeat(5001) },
      });
      expect(result.success).toBe(false);
    });

    it("audioIsolation schema requires audio_url", () => {
      const { provider } = createProvider();
      const ai = provider.post.api.v1.jobs.createTask.audioIsolation.schema;
      expect(
        ai.safeParse({
          model: "elevenlabs/audio-isolation",
          input: {},
        }).success
      ).toBe(false);
    });

    it("ttsMultilingual schema rejects similarity_boost > 1", () => {
      const { provider } = createProvider();
      const tts = provider.post.api.v1.jobs.createTask.ttsMultilingual.schema;
      const result = tts.safeParse({
        model: "elevenlabs/text-to-speech-multilingual-v2",
        input: { text: "hi", voice: "Adam", similarity_boost: 1.2 },
      });
      expect(result.success).toBe(false);
    });

    it("ttsTurbo schema rejects unknown voice literal", () => {
      const { provider } = createProvider();
      const tts = provider.post.api.v1.jobs.createTask.ttsTurbo.schema;
      const result = tts.safeParse({
        model: "elevenlabs/text-to-speech-turbo-2-5",
        input: { text: "hi", voice: "NotAVoice" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("recordInfo", () => {
    it("hits /api/v1/jobs/recordInfo with the taskId query string", async () => {
      const responseBody = {
        code: 200,
        msg: "success",
        data: {
          taskId: "task-1",
          model: "elevenlabs/sound-effect-v2",
          state: "success",
          resultJson: '{"audioUrl":"https://cdn.kie.ai/sfx.mp3"}',
        },
      };
      const { provider, captured } = createProvider(responseBody);
      const result = await provider.get.api.v1.jobs.recordInfo("task-1");
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=task-1"
      );
      expect(captured[0].init?.method).toBe("GET");
      expect(result.data?.taskId).toBe("task-1");
      expect(result.data?.model).toBe("elevenlabs/sound-effect-v2");
    });

    it("URL-encodes the taskId", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.get.api.v1.jobs.recordInfo("a b/c");
      expect(captured[0].url).toBe(
        "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=a%20b%2Fc"
      );
    });
  });

  describe("authorization header", () => {
    it("sends Bearer <apiKey>", async () => {
      const { provider, captured } = createProvider({ code: 200 });
      await provider.post.api.v1.jobs.createTask.sfx({ text: "boom" });
      const headers = captured[0].init?.headers as
        | Record<string, string>
        | undefined;
      const authVal =
        headers?.["Authorization"] ?? headers?.["authorization"] ?? "";
      expect(authVal).toBe("Bearer test-api-key");
    });
  });
});
