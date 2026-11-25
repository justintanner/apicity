import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  OpenAiTranscribeResponse,
  OpenAiTranscriptionDurationUsage,
  OpenAiTranscriptionTokenUsage,
  OpenAiTranscriptionUsage,
} from "@apicity/openai";

// HAR learning pass 2 (ac-11lqw3) over the 2026-11-25 videobook capture
// corpus: all 12 gpt-transcribe calls answered with duration usage, for
// example capture 2026-10-29T16-18-19.604Z-86300472-7129-4adf-ba7e-c30f74e3a26c.
// The token shape is pinned against a committed recording in
// tests/integration/openai-transcribe-dialog.test.ts.
describe("openai transcription usage", () => {
  it("types both usage shapes on the transcription response", () => {
    expectTypeOf<OpenAiTranscribeResponse["usage"]>().toEqualTypeOf<
      OpenAiTranscriptionUsage | undefined
    >();
    expectTypeOf<OpenAiTranscriptionUsage>().toEqualTypeOf<
      OpenAiTranscriptionTokenUsage | OpenAiTranscriptionDurationUsage
    >();
  });

  it("narrows the duration shape gpt-transcribe returns", () => {
    const captured: OpenAiTranscribeResponse = {
      text: "t",
      usage: { type: "duration", seconds: 91 },
    };
    const usage = captured.usage;
    expect(usage?.type).toBe("duration");
    if (usage?.type !== "duration") return;
    expectTypeOf(usage).toEqualTypeOf<OpenAiTranscriptionDurationUsage>();
    expect(usage.seconds).toBe(91);
  });
});
