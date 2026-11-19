import { describe, expect, it } from "vitest";
import {
  GptImage2BackgroundSchema,
  GptImage2ImageToImageAspectRatioSchema,
  GptImage2ImageToImageRequestSchema,
  GptImage2TextToImageAspectRatioSchema,
  GptImage2TextToImageRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// GPT Image 2 background and the image-to-image aspect ratios, from
// https://docs.kie.ai/market/gpt/gpt-image-2-text-to-image.md and
// .../gpt-image-2-image-to-image.md as read on 2026-11-19 (ac-ftdouc).
const IMAGE = "https://example.com/a.png";

const CASES = [
  {
    model: "gpt-image-2-text-to-image",
    schema: GptImage2TextToImageRequestSchema,
    base: { prompt: "A lighthouse at dusk" },
  },
  {
    model: "gpt-image-2-image-to-image",
    schema: GptImage2ImageToImageRequestSchema,
    base: { prompt: "Make it a poster", input_urls: [IMAGE] },
  },
] as const;

const messages = (
  schema: (typeof CASES)[number]["schema"],
  model: string,
  input: Record<string, unknown>
) => {
  const result = schema.safeParse({ model, input });
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe.each(CASES)("$model background", ({ model, schema, base }) => {
  it("is the createTask guard for the model", () => {
    expect(CREATE_TASK_GUARDS[model]).toBe(schema);
  });

  it.each(GptImage2BackgroundSchema.options)(
    "accepts background %s at 1K",
    (background) => {
      const result = schema.safeParse({
        model,
        input: { ...base, resolution: "1K", background },
      });
      expect(result.success).toBe(true);
      expect(result.data?.input.background).toBe(background);
    }
  );

  it("accepts background with resolution omitted (parsed as 1K)", () => {
    const result = schema.safeParse({
      model,
      input: { ...base, background: "transparent" },
    });
    expect(result.success).toBe(true);
    expect(result.data?.input.resolution).toBe("1K");
  });

  it.each(["2K", "4K"])("refuses background at %s", (resolution) => {
    expect(
      messages(schema, model, { ...base, resolution, background: "opaque" })
    ).toEqual(["background is only supported at 1K resolution"]);
    // Without background, 2K and 4K are unchanged.
    expect(messages(schema, model, { ...base, resolution })).toEqual([]);
  });

  it("rejects an off-vocabulary background", () => {
    expect(
      schema.safeParse({ model, input: { ...base, background: "white" } })
        .success
    ).toBe(false);
  });

  it("leaves background off the parsed request when omitted", () => {
    expect(schema.parse({ model, input: base }).input).not.toHaveProperty(
      "background"
    );
  });

  it("describes the same fields it parses", () => {
    expect(Object.keys(modelInputSchemas[model].fields).sort()).toEqual(
      Object.keys(schema.shape.input.shape).sort()
    );
  });
});

describe("GPT Image 2 aspect ratios", () => {
  it("gives image-to-image the sixteen text-to-image ratios", () => {
    expect([...GptImage2ImageToImageAspectRatioSchema.options].sort()).toEqual(
      [...GptImage2TextToImageAspectRatioSchema.options].sort()
    );
  });

  it.each(["2:1", "1:2", "3:1", "1:3", "9:21"])(
    "accepts the new image-to-image ratio %s at 1K",
    (aspect_ratio) => {
      expect(
        GptImage2ImageToImageRequestSchema.safeParse({
          model: "gpt-image-2-image-to-image",
          input: {
            prompt: "Make it a poster",
            input_urls: [IMAGE],
            aspect_ratio,
            resolution: "1K",
          },
        }).success
      ).toBe(true);
    }
  );
});
