import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
describe("fal OpenRouter Router decisions", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/openrouter-router-decisions");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("evaluates the greeting fixture", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // State from kie-gemini-3-8-flash-tts; the yes/no question is the planned new text.
    const result = await provider.run.openrouter.router.decisions({
      state: "Hello from Apicity. Have a wonderful day.",
      questions: {
        is_greeting: {
          type: "noul",
          instructions: "Is this message a greeting?",
        },
      },
    });
    expect(typeof result.model).toBe("string");
    expect(result.answers.is_greeting.type).toBe("noul");
    if (result.answers.is_greeting.type === "noul") {
      expect(result.answers.is_greeting.noul).toBeGreaterThanOrEqual(0);
      expect(result.answers.is_greeting.noul).toBeLessThanOrEqual(1);
    }
    expect(result.usage.input_tokens).toBeGreaterThanOrEqual(0);
    expect(result.usage.output_tokens).toBeGreaterThanOrEqual(0);
  }, 900000);
});
