import { describe, expect, it } from "vitest";

import { createKie, KieError, type MediaGenerationRequest } from "@apicity/kie";
import {
  Wan27ImageInputSchema,
  Wan27ImageProRequestSchema,
  Wan27ImageRequestSchema,
} from "@apicity/kie/zod";

import { modelInputSchemas } from "../../../packages/provider/kie/src/model-schemas";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../../harness";

const PROMPT = "A quiet observatory beneath a star-filled desert sky.";
const RESOLUTION_DEPENDENCY_MESSAGE = "aspect_ratio requires resolution";
const FOUR_K_MESSAGE =
  "resolution 4K is only supported for non-sequential text-to-image";

const MODEL_CASES = [
  {
    model: "wan/2-7-image",
    schema: Wan27ImageRequestSchema,
    invalidRequest: {
      model: "wan/2-7-image",
      input: { prompt: PROMPT, aspect_ratio: "16:9" },
    } satisfies MediaGenerationRequest,
    preservesProRestriction: false,
  },
  {
    model: "wan/2-7-image-pro",
    schema: Wan27ImageProRequestSchema,
    invalidRequest: {
      model: "wan/2-7-image-pro",
      input: { prompt: PROMPT, aspect_ratio: "16:9" },
    } satisfies MediaGenerationRequest,
    preservesProRestriction: true,
  },
] as const;

describe("KIE WAN 2.7 image resolution contract", () => {
  it("keeps omitted resolution absent from the shared parsed input", () => {
    const result = Wan27ImageInputSchema.safeParse({ prompt: PROMPT });

    expect(result.success).toBe(true);
    if (!result.success) throw result.error;
    expect(result.data.aspect_ratio).toBe("16:9");
    expect(result.data).not.toHaveProperty("resolution");
  });

  describe.each(MODEL_CASES)("$model", ({ model, schema, invalidRequest }) => {
    function expectCustomIssue(
      result: ReturnType<typeof schema.safeParse>,
      message: string
    ): void {
      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected schema failure");
      const issue = result.error.issues.find(
        (candidate) =>
          candidate.code === "custom" && candidate.message === message
      );
      expect(issue?.path).toEqual(["input", "resolution"]);
    }

    it("rejects explicit aspect_ratio without resolution", () => {
      const result = schema.safeParse({
        model,
        input: { prompt: PROMPT, aspect_ratio: "16:9" },
      });

      expectCustomIssue(result, RESOLUTION_DEPENDENCY_MESSAGE);
    });

    it("rejects prompt-only input after applying the aspect_ratio default", () => {
      const result = schema.safeParse({
        model,
        input: { prompt: PROMPT },
      });

      expectCustomIssue(result, RESOLUTION_DEPENDENCY_MESSAGE);
    });

    it("accepts resolution with the defaulted aspect_ratio", () => {
      const result = schema.safeParse({
        model,
        input: { prompt: PROMPT, resolution: "2K" },
      });

      expect(result.success).toBe(true);
      if (!result.success) throw result.error;
      expect(result.data.input.resolution).toBe("2K");
      expect(result.data.input.aspect_ratio).toBe("16:9");
    });

    it("preserves explicit aspect_ratio and resolution", () => {
      const result = schema.safeParse({
        model,
        input: {
          prompt: PROMPT,
          aspect_ratio: "16:9",
          resolution: "2K",
        },
      });

      expect(result.success).toBe(true);
      if (!result.success) throw result.error;
      expect(result.data.input.aspect_ratio).toBe("16:9");
      expect(result.data.input.resolution).toBe("2K");
    });

    it("retains the sequential 4K rejection", () => {
      const result = schema.safeParse({
        model,
        input: {
          prompt: PROMPT,
          aspect_ratio: "16:9",
          resolution: "4K",
          enable_sequential: true,
        },
      });

      expectCustomIssue(result, FOUR_K_MESSAGE);
    });

    it("accepts standard text-to-image at 4K", () => {
      const result = schema.safeParse({
        model,
        input: { prompt: PROMPT, resolution: "4K" },
      });

      expect(result.success).toBe(true);
      if (!result.success) throw result.error;
      expect(result.data.input.resolution).toBe("4K");
      expect(result.data.input.aspect_ratio).toBe("16:9");
    });

    it("rejects the guarded request before fetch", async () => {
      let fetchCount = 0;
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        paygate: { secret: TEST_PAYGATE_SECRET },
        fetch: async () => {
          fetchCount += 1;
          throw new Error(`createTask must not reach fetch for ${model}`);
        },
      });

      const rejection: unknown = await provider.post.api.v1.jobs
        .createTask(invalidRequest, mintKieCreateTaskOtp(invalidRequest))
        .catch((error: unknown) => error);

      expect(rejection).toBeInstanceOf(KieError);
      if (!(rejection instanceof KieError)) throw rejection;
      expect(rejection.status).toBe(400);
      expect(rejection.message).toContain(
        `input.resolution: ${RESOLUTION_DEPENDENCY_MESSAGE}`
      );
      expect(fetchCount).toBe(0);
    });
  });

  describe.each(MODEL_CASES)(
    "$model descriptor",
    ({ model, preservesProRestriction }) => {
      it("describes resolution as required by aspect_ratio", () => {
        const resolution = modelInputSchemas[model].fields.resolution;

        expect(resolution.required).toBe(true);
        expect(resolution.enum).toEqual(["1K", "2K", "4K"]);
        expect(resolution).not.toHaveProperty("default");
        expect(resolution.description).not.toMatch(/default.*2K/i);
        expect(resolution.description).toContain(
          "required when aspect_ratio is present"
        );
        expect(resolution.description).toContain(
          "including when the aspect_ratio default is applied"
        );
        if (preservesProRestriction) {
          expect(resolution.description).toContain(
            "4K only for text-to-image in standard mode"
          );
        }
      });
    }
  );
});
