import { describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import {
  GoogleGemini38FlashTtsRequestSchema as schema,
  GoogleGemini38TtsVoiceNames,
  CreateTaskRequestSchema,
} from "@apicity/kie/zod";
import { computeEstimate } from "../../../packages/provider/cost/src/compute";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../../harness";
const model = "google/gemini-3-8-flash-tts" as const;
const input = {
  speakers: [{ speaker_id: "Speaker 1" }],
  dialogue_turns: [
    {
      speaker_id: "Speaker 1",
      text: "Hello. <laugh> That works.",
      style: "Quiet and warm",
    },
  ],
};
describe("Gemini 3.8 Flash TTS", () => {
  it("applies new defaults and preserves per-turn style and tone tags", () => {
    expect(CreateTaskRequestSchema.parse({ model, input }).input).toEqual({
      ...input,
      speakers: [{ speaker_id: "Speaker 1", voice_name: "Fola" }],
      temperature: 1,
      filler_words: false,
    });
  });
  it("accepts all 70 documented voices", () => {
    expect(GoogleGemini38TtsVoiceNames).toHaveLength(70);
    for (const voice_name of GoogleGemini38TtsVoiceNames)
      expect(
        schema.safeParse({
          model,
          input: {
            ...input,
            speakers: [{ speaker_id: "Speaker 1", voice_name }],
          },
        }).success
      ).toBe(true);
  });
  it.each([-1, 2.1])("rejects temperature %s", (temperature) =>
    expect(
      schema.safeParse({ model, input: { ...input, temperature } }).success
    ).toBe(false)
  );
  it.each([0, 2])("accepts temperature %s", (temperature) =>
    expect(
      schema.safeParse({ model, input: { ...input, temperature } }).success
    ).toBe(true)
  );
  it.each(["Fola-typo", "unknown"])("rejects voice %s", (voice_name) =>
    expect(
      schema.safeParse({
        model,
        input: {
          ...input,
          speakers: [{ speaker_id: "Speaker 1", voice_name }],
        },
      }).success
    ).toBe(false)
  );
  it.each(["speakers", "dialogue_turns"])("requires nonempty %s", (field) =>
    expect(
      schema.safeParse({ model, input: { ...input, [field]: [] } }).success
    ).toBe(false)
  );
  it("accepts two speakers and filler words", () =>
    expect(
      schema.safeParse({
        model,
        input: {
          ...input,
          speakers: [
            { speaker_id: "Speaker 1" },
            { speaker_id: "Speaker 2", voice_name: "Bodi" },
          ],
          filler_words: true,
        },
      }).success
    ).toBe(true));
  it("rejects the obsolete accent field", () =>
    expect(
      schema.safeParse({
        model,
        input: {
          ...input,
          speakers: [{ speaker_id: "Speaker 1", accent: "American" }],
        },
      }).success
    ).toBe(false));
  it("rejects oversized dialogue", () =>
    expect(
      schema.safeParse({
        model,
        input: {
          ...input,
          dialogue_turns: [
            { speaker_id: "Speaker 1", text: "a".repeat(10001) },
          ],
        },
      }).success
    ).toBe(false));
  it("prices declared input and audio-output tokens", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: { model, input },
      costHints: { inputTokens: 1000, outputTokens: 1000 },
    });
    expect(estimate.usd).toBeCloseTo(0.00665);
    expect(estimate.warnings).toEqual([]);
  });
  it("does not estimate tokens from text length", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: { model, input },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("costHints.inputTokens");
  });
  it("rejects invalid speakers before transport", async () => {
    let calls = 0;
    const provider = createKie({
      apiKey: "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
      fetch: async () => {
        calls++;
        throw new Error("No transport");
      },
    });
    const req = {
      model,
      input: { ...input, speakers: [{ speaker_id: "narrator" }] },
    };
    await expect(
      provider.post.api.v1.jobs.createTask(req, mintKieCreateTaskOtp(req))
    ).rejects.toMatchObject({ name: "KieError", status: 400 });
    expect(calls).toBe(0);
  });
});
