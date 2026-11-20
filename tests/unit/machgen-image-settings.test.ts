import { readFileSync } from "node:fs";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  MACHGEN_IMAGE_MODELS,
  MACHGEN_IMAGE_SURFACES,
  MachGenGenerateRequestSchema,
  MachGenImageConfigSchema,
  MachGenUpscaleQuoteRequestSchema,
  type MachGenGenerateImageConfig,
  type MachGenGenerateRequest,
  type MachGenImageConfig,
} from "@apicity/machgen";
import { computeEstimate } from "@apicity/cost";
import { zodToJsonSchema } from "../../packages/cli/src/schema";

const evidence = JSON.parse(
  readFileSync(
    "tests/fixtures/machgen-evidence/machgen-image-settings-2026-11-18.json",
    "utf8"
  )
) as {
  modelList: {
    models: Record<string, Record<"T2I" | "I2I", Record<string, unknown>>>;
  };
  surfaces: typeof MACHGEN_IMAGE_SURFACES;
  probes: {
    label: string;
    endpoint?: string;
    request: Record<string, unknown>;
    local: "accept" | "reject";
    localPhrase?: string;
  }[];
};

const base = {
  model: "GPT-Image-2",
  task_type: "T2I",
  prompt: "A red circle.",
  image_config: { height: 1024 },
} satisfies MachGenGenerateRequest;

describe("MachGen image settings", () => {
  it("preserves the explicit config object and narrows the request by size_mode", () => {
    expectTypeOf<MachGenImageConfig["height"]>().toEqualTypeOf<number>();
    expectTypeOf<MachGenGenerateRequest["image_config"]>().toEqualTypeOf<
      MachGenGenerateImageConfig | undefined
    >();
    const configs: MachGenGenerateImageConfig[] = [
      { size_mode: "auto" },
      base.image_config,
      // @ts-expect-error Explicit sizing requires a height.
      { size_mode: "explicit", width: 1024 },
      // @ts-expect-error Automatic sizing excludes explicit dimensions.
      { size_mode: "auto", height: 1024 },
    ];
    expect(
      configs.map(
        (image_config) =>
          MachGenGenerateRequestSchema.safeParse({ ...base, image_config })
            .success
      )
    ).toEqual([true, true, false, false]);
    expect(
      MachGenImageConfigSchema.pick({ height: true }).safeParse({}).success
    ).toBe(false);
    const missing = MachGenGenerateRequestSchema.safeParse({
      ...base,
      image_config: { width: 1024 },
    });
    expect(missing.error?.issues[0].path).toEqual(["image_config", "height"]);
  });

  it("describes both sizes and all three excluded auto-size fields in the CLI", () => {
    expect(zodToJsonSchema(MachGenGenerateRequestSchema)).toMatchObject({
      properties: {
        image_config: {
          anyOf: [
            {
              required: ["height"],
              properties: { size_mode: { const: "explicit" } },
            },
            {
              required: ["size_mode"],
              properties: {
                size_mode: { const: "auto" },
                height: { not: {} },
                width: { not: {} },
                aspect_ratio: { not: {} },
              },
            },
          ],
        },
      },
    });
  });

  it("matches the captured settings for both tasks of each registered model", () => {
    expect(Object.keys(MACHGEN_IMAGE_SURFACES)).toEqual([
      ...MACHGEN_IMAGE_MODELS,
    ]);
    // Seedream 5.5 was registered from the 2026-11-20 docs page. The
    // 2026-11-18 fixture stays the record of the models captured that day.
    const { "Seedream-5.5": seedream, ...registered } = MACHGEN_IMAGE_SURFACES;
    expect(registered).toEqual(evidence.surfaces);
    expect(seedream.T2I).toEqual(seedream.I2I);
    expect(seedream.T2I).toEqual({
      qualities: [],
      complexities: [],
      backgrounds: ["auto", "opaque", "transparent"],
      outputFormats: ["png", "jpeg"],
      defaultOutputFormat: "png",
      autoSize: true,
      mask: false,
      markup: false,
      continuation: false,
      safetyIdentifier: true,
      safetyIdentifierMax: 64,
      resolutionTiers: ["1K", "1.5K", "2K"],
    });
    for (const model of MACHGEN_IMAGE_MODELS) {
      if (model === "Seedream-5.5") continue;
      for (const task of ["T2I", "I2I"] as const) {
        const row = evidence.modelList.models[model][task];
        expect(MACHGEN_IMAGE_SURFACES[model][task]).toEqual({
          qualities: row.image_qualities,
          complexities: row.image_complexities,
          backgrounds: row.image_backgrounds,
          outputFormats: row.output_formats,
          ...(row.default_output_format === null
            ? {}
            : { defaultOutputFormat: row.default_output_format }),
          autoSize: row.supports_auto_image_size,
          mask: row.supports_image_mask,
          markup: row.supports_image_markup,
          continuation: row.image_continuation !== null,
          safetyIdentifier: model.startsWith("GPT-Image-"),
        });
      }
    }
  });

  it.each(evidence.probes)(
    "matches the local rule for $label",
    ({ endpoint, request, local, localPhrase }) => {
      const schema = endpoint
        ? MachGenUpscaleQuoteRequestSchema
        : MachGenGenerateRequestSchema;
      const result = schema.safeParse(request);
      expect(result.success).toBe(local === "accept");
      if (localPhrase)
        expect(result.error?.issues.map((i) => i.message)).toContainEqual(
          expect.stringContaining(localPhrase)
        );
    }
  );

  it.each(["Nano-Banana-2", "Nano-Banana-2.1"])(
    "respects the model list for %s",
    (model) => {
      const request = {
        ...base,
        model,
        task_type: "I2I",
        src_task_ids: ["previous"],
      };
      expect(MachGenGenerateRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(
        MachGenGenerateRequestSchema.safeParse({ ...request, image_output: {} })
          .success
      ).toBe(true);
      for (const extra of [
        { image_output: { quality: "low" } },
        { image_output: { output_format: "png" } },
        { image_config: { size_mode: "auto" } },
        { src_mask_url: "https://example.com/mask.png" },
        { safety_identifier: "user" },
      ])
        expect(
          MachGenGenerateRequestSchema.safeParse({ ...request, ...extra })
            .success
        ).toBe(false);
    }
  );

  it("checks field bounds on unregistered aliases and preserves extra controls", () => {
    const request = {
      ...base,
      model: "Future-Image-Model",
      task_type: "I2I",
      image_config: { size_mode: "auto" },
      continuation_task_id: "previous",
      image_output: {
        output_format: "gif",
        partial_images: 3,
        layers: { count: 2 },
        watermark: true,
      },
    };
    expect(MachGenGenerateRequestSchema.parse(request)).toEqual(request);
    expect(
      MachGenGenerateRequestSchema.safeParse({
        ...request,
        image_output: { partial_images: 4 },
      }).success
    ).toBe(false);
    expect(
      MachGenGenerateRequestSchema.safeParse({
        ...request,
        task_type: "T2V",
        video_config: { height: 480, duration_secs: 4 },
      }).success
    ).toBe(false);
  });

  it("accepts Seedream 5.5 settings and refuses the ones the page excludes", () => {
    const sources = (count: number) =>
      Array.from({ length: count }, (_, i) => `https://example.com/${i}.jpg`);
    const request = {
      ...base,
      model: "Seedream-5.5",
      task_type: "I2I" as const,
      src_image_urls: sources(10),
      image_config: { height: 1024 },
      image_output: {
        output_format: "png" as const,
        partial_images: 3,
        layers: { max_images: 2 },
        watermark: true,
      },
      safety_identifier: "user-1",
    };
    expect(MachGenGenerateRequestSchema.parse(request)).toEqual(request);
    expect(
      MachGenGenerateRequestSchema.parse({
        ...request,
        src_image_urls: sources(1),
        image_config: { size_mode: "auto", resolution: "1.5K" },
        image_output: { output_format: "jpeg", watermark: true },
        safety_identifier: "a".repeat(64),
      }).image_config
    ).toEqual({ size_mode: "auto", resolution: "1.5K" });

    const reject = (overrides: Record<string, unknown>, phrase: string) => {
      const result = MachGenGenerateRequestSchema.safeParse({
        ...request,
        src_image_urls: sources(1),
        image_output: { output_format: "png" },
        ...overrides,
      });
      expect(result.success, phrase).toBe(false);
      if (!result.success)
        expect(
          result.error.issues.map((issue) => issue.message).join("\n")
        ).toContain(phrase);
    };
    reject({ image_output: { output_format: "gif" } }, "output_format='gif'");
    reject(
      { continuation_task_id: "previous" },
      "do not support image continuation"
    );
    reject(
      { image_output: { output_format: "jpeg", background: "transparent" } },
      "Transparent backgrounds require"
    );
    reject(
      { image_output: { background: "opaque", layers: { max_images: 2 } } },
      "Omit background"
    );
    reject({ src_image_urls: sources(11) }, "at most 10");
    reject({ safety_identifier: "a".repeat(65) }, "at most 64 ASCII");
    reject({ safety_identifier: "caf\u00e9" }, "at most 64 ASCII");
    reject(
      {
        model: "GPT-Image-2.6-Sunburst",
        image_config: { size_mode: "auto", resolution: "1K" },
      },
      "does not support resolution='1K'"
    );
  });

  it.each([
    {
      ...base,
      task_type: "I2I",
      src_task_ids: ["source"],
      src_mask_url: "https://example.com/mask.png",
      image_output: {
        background: "transparent",
        output_format: "webp",
        output_compression: 0,
      },
    },
    {
      ...base,
      model: "GPT-Image-2.5-Flare",
      task_type: "I2I",
      src_task_ids: ["source"],
      src_markup_url: "https://example.com/markup.png",
      image_output: {
        quality: "max",
        output_format: "jpeg",
        output_compression: 100,
      },
    },
    {
      ...base,
      model: "GPT-Image-2.6-Sunburst",
      task_type: "I2I",
      continuation_task_id: "previous",
      image_config: { size_mode: "auto" },
      safety_identifier: "u".repeat(128),
    },
    {
      ...base,
      model: "GPT-Image-2.6-Flare",
      image_output: {
        complexity: "high",
        output_format: "gif",
        frame_count: 16,
        frame_duration_ms: 655350,
      },
    },
    {
      ...base,
      model: "GPT-Image-2.6-Flare",
      image_output: {
        output_format: "svg",
        svg: { model: "gpt-5.5-pro", reasoning: { effort: "xhigh" } },
      },
    },
  ])("preserves supported $model $task_type settings", (request) => {
    expect(MachGenGenerateRequestSchema.parse(request)).toEqual(request);
  });

  it.each(
    MACHGEN_IMAGE_MODELS.filter((model) => model.startsWith("GPT-Image-"))
  )("leaves automatic size unpriced on %s", (model) => {
    const request = {
      ...base,
      model,
      image_config: { size_mode: "auto" },
      image_output: { quality: "low" },
    };
    expect(MachGenGenerateRequestSchema.safeParse(request).success).toBe(true);
    const quote = computeEstimate({ provider: "machgen", payload: request });
    expect(quote.usd).toBe(0);
    expect(quote.warnings.length).toBeGreaterThan(0);
  });
});
