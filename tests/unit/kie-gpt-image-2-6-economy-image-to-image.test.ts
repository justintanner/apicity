import { describe, expect, it, vi } from "vitest";

import {
  createKie,
  GptImage26EconomyImageToImageRequestSchema as RootSchema,
  KieError,
  type GptImage26EconomyImageToImageRequest,
  type MediaGenerationRequest,
} from "@apicity/kie";
import {
  GptImage26EconomyImageToImageRequestSchema,
  KIE_MEDIA_MODELS,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

const MODEL = "gpt-image-2-6/economy-image-to-image";
const schema = GptImage26EconomyImageToImageRequestSchema;
const IMAGE = "https://example.com/your-image.png";

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
      "Keep the shelf, the mug shapes, the window light and the camera angle unchanged. Change the glaze of every mug to matte black.",
    input_urls: [IMAGE],
    aspect_ratio: "auto",
    background: "auto",
    output_format: "png",
  },
} satisfies GptImage26EconomyImageToImageRequest;

describe("Kie GPT Image 2.6 economy image-to-image contract", () => {
  it("exports one schema from the root and the zod entry", () => {
    expect(RootSchema).toBe(GptImage26EconomyImageToImageRequestSchema);
  });

  it("accepts the docs request example", () => {
    expect(schema.safeParse(DOCS_EXAMPLE).success).toBe(true);
  });

  // Text-to-image proved that kie fails an economy task sent without
  // aspect_ratio (a refunded failCode 500), and the image-to-image recording
  // sends it. This pins the field as required with no default.
  it("requires aspect_ratio and injects no default for it", () => {
    const missing = parse({ prompt: "x", input_urls: [IMAGE] });
    expect(missing.success).toBe(false);
    expect(issueAt(missing, "input.aspect_ratio")).toBe(true);

    const parsed = schema.parse({
      model: MODEL,
      input: { prompt: "x", input_urls: [IMAGE], aspect_ratio: "3:2" },
    });
    expect(parsed.input.aspect_ratio).toBe("3:2");
  });

  it("fills the other documented defaults", () => {
    const parsed = schema.parse({
      model: MODEL,
      input: { prompt: "x", input_urls: [IMAGE], aspect_ratio: "auto" },
    });
    expect(parsed.input).toEqual({
      prompt: "x",
      input_urls: [IMAGE],
      aspect_ratio: "auto",
      background: "auto",
      output_format: "png",
    });
  });

  it("takes zero to 16 input images, as the docs make them optional", () => {
    for (const count of [0, 1, 16]) {
      expect(
        parse({
          prompt: "x",
          aspect_ratio: "auto",
          input_urls: Array(count).fill(IMAGE),
        }).success,
        String(count)
      ).toBe(true);
    }
    expect(parse({ prompt: "x", aspect_ratio: "auto" }).success).toBe(true);
    const tooMany = parse({
      prompt: "x",
      aspect_ratio: "auto",
      input_urls: Array(17).fill(IMAGE),
    });
    expect(issueAt(tooMany, "input.input_urls")).toBe(true);
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
    for (const ratio of ["3:4", "1:2", "9:21"]) {
      const result = parse({ prompt: "x", aspect_ratio: ratio });
      expect(issueAt(result, "input.aspect_ratio"), ratio).toBe(true);
    }
  });

  it("takes png output only and no GIF fields", () => {
    for (const output_format of ["gif", "jpeg", "webp"]) {
      const result = parse({
        prompt: "x",
        aspect_ratio: "auto",
        output_format,
      });
      expect(issueAt(result, "input.output_format"), output_format).toBe(true);
    }
    const parsed = schema.parse({
      model: MODEL,
      input: { prompt: "x", aspect_ratio: "auto", frame_count: "9" },
    });
    expect(parsed.input).not.toHaveProperty("frame_count");
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
});

describe("Kie GPT Image 2.6 economy image-to-image registries", () => {
  it("is catalogued, guarded and described", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(schema);
    expect(modelInputSchemas[MODEL].type).toBe("image");
  });

  it("describes every documented field, with prompt and aspect_ratio required", () => {
    const { fields } = modelInputSchemas[MODEL];
    expect(Object.keys(fields)).toEqual([
      "prompt",
      "input_urls",
      "aspect_ratio",
      "background",
      "output_format",
    ]);
    expect(
      Object.entries(fields)
        .filter(([, field]) => field.required)
        .map(([name]) => name)
    ).toEqual(["prompt", "aspect_ratio"]);
    expect(fields.input_urls.maxItems).toBe(16);
    expect(fields.aspect_ratio.default).toBeUndefined();
    expect(fields.background.default).toBe("auto");
    expect(fields.output_format.enum).toEqual(["png"]);
    expect(fields.output_format.default).toBe("png");
  });

  it("rejects a request without aspect_ratio at the provider boundary before fetch", async () => {
    const mockFetch = vi.fn<typeof globalThis.fetch>(() => {
      throw new Error("economy validation reached fetch");
    });
    const provider = createKie({
      apiKey: "test-key",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request = {
      model: MODEL,
      input: {
        prompt: "Add a small red scarf to the cat.",
        input_urls: [IMAGE],
      },
    };

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
