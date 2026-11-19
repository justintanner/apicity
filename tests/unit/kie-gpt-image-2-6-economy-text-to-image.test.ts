import { describe, expect, it, vi } from "vitest";

import {
  createKie,
  GptImage26EconomyTextToImageRequestSchema as RootSchema,
  KieError,
  type GptImage26EconomyTextToImageRequest,
  type MediaGenerationRequest,
} from "@apicity/kie";
import {
  GptImage26EconomyTextToImageRequestSchema,
  KIE_MEDIA_MODELS,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

const MODEL = "gpt-image-2-6/economy-text-to-image";
const schema = GptImage26EconomyTextToImageRequestSchema;

const parse = (input: Record<string, unknown>) =>
  schema.safeParse({ model: MODEL, input });

const issueAt = (result: ReturnType<typeof parse>, path: string): boolean =>
  !result.success &&
  result.error.issues.some((issue) => issue.path.join(".") === path);

// The docs request example (read 2026-11-19), every documented field set.
const DOCS_EXAMPLE = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    prompt:
      'A sunlit ceramic studio shelf lined with hand-thrown mugs in muted terracotta and sage glazes, soft morning light through a side window, shallow depth of field, clean editorial product photography, with a small paper tag on the middle shelf that reads "BATCH 07".',
    aspect_ratio: "auto",
    background: "auto",
    output_format: "png",
    frame_count: "auto",
    frame_duration_ms: "auto",
  },
} satisfies GptImage26EconomyTextToImageRequest;

describe("Kie GPT Image 2.6 economy text-to-image contract", () => {
  it("exports one schema from the root and the zod entry", () => {
    expect(RootSchema).toBe(GptImage26EconomyTextToImageRequestSchema);
  });

  it("accepts the docs request example", () => {
    expect(schema.safeParse(DOCS_EXAMPLE).success).toBe(true);
  });

  // Four prompt-only tasks failed upstream with a refunded failCode 500;
  // prompt plus aspect_ratio alone succeeded. These pin that decision so a
  // future "tidy up the defaults" pass cannot relax it back to optional.
  it("requires aspect_ratio and injects no default for it", () => {
    const promptOnly = parse({ prompt: "A red balloon." });
    expect(promptOnly.success).toBe(false);
    expect(issueAt(promptOnly, "input.aspect_ratio")).toBe(true);

    const parsed = schema.parse({
      model: MODEL,
      input: { prompt: "A red balloon.", aspect_ratio: "16:9" },
    });
    expect(parsed.input.aspect_ratio).toBe("16:9");
  });

  it("fills the other documented defaults", () => {
    const parsed = schema.parse({
      model: MODEL,
      input: { prompt: "A red balloon.", aspect_ratio: "auto" },
    });
    expect(parsed.input).toEqual({
      prompt: "A red balloon.",
      aspect_ratio: "auto",
      background: "auto",
      output_format: "png",
      frame_count: "auto",
      frame_duration_ms: "auto",
    });
  });

  it("accepts the eight economy aspect ratios only", () => {
    for (const ratio of [
      "auto",
      "1:1",
      "16:9",
      "9:16",
      "3:2",
      "2:3",
      "21:9",
      "4:3",
    ]) {
      expect(parse({ prompt: "x", aspect_ratio: ratio }).success, ratio).toBe(
        true
      );
    }
    for (const ratio of ["3:4", "1:2", "9:21", "1K"]) {
      const result = parse({ prompt: "x", aspect_ratio: ratio });
      expect(issueAt(result, "input.aspect_ratio"), ratio).toBe(true);
    }
  });

  it("bounds the prompt at 1 to 20,000 characters", () => {
    expect(
      parse({ prompt: "x".repeat(20000), aspect_ratio: "auto" }).success
    ).toBe(true);
    for (const prompt of ["", "x".repeat(20001)]) {
      expect(
        issueAt(parse({ prompt, aspect_ratio: "auto" }), "input.prompt")
      ).toBe(true);
    }
  });

  it("takes png or gif and the three backgrounds", () => {
    for (const output_format of ["png", "gif"]) {
      expect(
        parse({ prompt: "x", aspect_ratio: "auto", output_format }).success
      ).toBe(true);
    }
    for (const output_format of ["jpeg", "webp", "svg"]) {
      const result = parse({
        prompt: "x",
        aspect_ratio: "auto",
        output_format,
      });
      expect(issueAt(result, "input.output_format"), output_format).toBe(true);
    }
    for (const background of ["transparent", "opaque", "auto"]) {
      expect(
        parse({ prompt: "x", aspect_ratio: "auto", background }).success
      ).toBe(true);
    }
  });

  it("sets frame fields explicitly only with gif output", () => {
    for (const frames of [
      { frame_count: "9" },
      { frame_count: "64", frame_duration_ms: 20 },
      { frame_duration_ms: 2000 },
    ]) {
      expect(
        parse({
          prompt: "x",
          aspect_ratio: "auto",
          output_format: "gif",
          ...frames,
        }).success
      ).toBe(true);
    }
    for (const [field, value] of [
      ["frame_count", "9"],
      ["frame_duration_ms", 120],
    ] as const) {
      const result = parse({
        prompt: "x",
        aspect_ratio: "auto",
        output_format: "png",
        [field]: value,
      });
      expect(issueAt(result, `input.${field}`), field).toBe(true);
    }
  });

  it("takes auto or an integer 20-2000 as frame_duration_ms", () => {
    for (const frame_duration_ms of [19, 2001, 120.5, "120", "fast"]) {
      const result = parse({
        prompt: "x",
        aspect_ratio: "auto",
        output_format: "gif",
        frame_duration_ms,
      });
      expect(result.success, String(frame_duration_ms)).toBe(false);
    }
    for (const frame_count of ["5", "100", 9]) {
      const result = parse({
        prompt: "x",
        aspect_ratio: "auto",
        output_format: "gif",
        frame_count,
      });
      expect(issueAt(result, "input.frame_count"), String(frame_count)).toBe(
        true
      );
    }
  });
});

describe("Kie GPT Image 2.6 economy text-to-image registries", () => {
  it("is catalogued, guarded and described", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(schema);
    expect(modelInputSchemas[MODEL].type).toBe("image");
  });

  it("describes every documented field, with prompt and aspect_ratio required", () => {
    const { fields } = modelInputSchemas[MODEL];
    expect(Object.keys(fields)).toEqual([
      "prompt",
      "aspect_ratio",
      "background",
      "output_format",
      "frame_count",
      "frame_duration_ms",
    ]);
    expect(
      Object.entries(fields)
        .filter(([, field]) => field.required)
        .map(([name]) => name)
    ).toEqual(["prompt", "aspect_ratio"]);
    expect(fields.aspect_ratio.default).toBeUndefined();
    expect(fields.background.default).toBe("auto");
    expect(fields.output_format.default).toBe("png");
    expect(fields.frame_count.default).toBe("auto");
    expect(fields.frame_duration_ms.default).toBe("auto");
  });

  it("rejects a prompt-only request at the provider boundary before fetch", async () => {
    const mockFetch = vi.fn<typeof globalThis.fetch>(() => {
      throw new Error("economy validation reached fetch");
    });
    const provider = createKie({
      apiKey: "test-key",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request = { model: MODEL, input: { prompt: "A red balloon." } };

    const rejection: unknown = await provider.post.api.v1.jobs
      .createTask(
        request as unknown as MediaGenerationRequest,
        mintKieCreateTaskOtp(request)
      )
      .catch((error: unknown) => error);

    expect(rejection).toBeInstanceOf(KieError);
    if (!(rejection instanceof KieError)) throw rejection;
    expect(rejection.status).toBe(400);
    expect(rejection.message).toContain("Invalid Kie createTask request");
    expect(rejection.message).toContain("input.aspect_ratio");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
