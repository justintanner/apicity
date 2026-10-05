import { describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import {
  GoogleGemini38FlashLiteTtsRequestSchema as schema,
  CreateTaskRequestSchema,
} from "@apicity/kie/zod";
import { computeEstimate } from "../../../packages/provider/cost/src/compute";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../../harness";
const model = "google/gemini-3-8-flash-lite-tts" as const;
const input = {
  speakers: [{ speaker_id: "Speaker 1" }],
  dialogue_turns: [
    { speaker_id: "Speaker 1", text: "Hello.", style: "Friendly" },
  ],
};
describe("Gemini 3.8 Flash Lite TTS", () => {
  it("uses the 3.8 defaults through the public union", () => {
    expect(CreateTaskRequestSchema.parse({ model, input }).input).toEqual({
      ...input,
      speakers: [{ speaker_id: "Speaker 1", voice_name: "Fola" }],
      temperature: 1,
      filler_words: false,
    });
  });
  it("preserves freeform per-turn style", () =>
    expect(schema.parse({ model, input }).input.dialogue_turns[0].style).toBe(
      "Friendly"
    ));
  it("uses Lite audio-output pricing", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: { model, input },
      costHints: { inputTokens: 1000, outputTokens: 1000 },
    });
    expect(estimate.usd).toBeCloseTo(0.00455);
    expect(estimate.warnings).toEqual([]);
  });
  it("requires token counts", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: { model, input },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("costHints.outputTokens");
  });
  it("rejects unsupported voices before transport", async () => {
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
      input: {
        ...input,
        speakers: [{ speaker_id: "Speaker 1", voice_name: "unknown" }],
      },
    };
    await expect(
      provider.post.api.v1.jobs.createTask(
        req as Parameters<typeof provider.post.api.v1.jobs.createTask>[0],
        mintKieCreateTaskOtp(req)
      )
    ).rejects.toMatchObject({ name: "KieError", status: 400 });
    expect(calls).toBe(0);
  });
});
