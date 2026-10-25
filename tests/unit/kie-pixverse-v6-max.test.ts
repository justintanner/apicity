import { describe, it, expect, vi } from "vitest";
import { createKie } from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KieMediaModelSchema,
  PixverseV6MaxImageToVideoInputSchema,
  PixverseV6MaxImageToVideoRequestSchema,
  PixverseV6MaxTaskResultJsonSchema,
  PixverseV6MaxTextToVideoInputSchema,
  PixverseV6MaxTextToVideoRequestSchema,
  type PixverseV6MaxImageToVideoRequest,
  type PixverseV6MaxTextToVideoRequest,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { zodToJsonSchema } from "../../packages/cli/src/schema";
import { TEST_PAYGATE_SECRET, mintKieCreateTaskOtp } from "../harness";

const TEXT = "pixverse-v6-max/text-to-video";
const IMAGE = "pixverse-v6-max/image-to-video";
const FRAME = "https://example.com/first-frame.png";

// The docs' own example payloads (2026-10-25), callBackUrl aside.
const TEXT_INPUT = {
  prompt:
    "A cinematic tracking shot of a skateboarder racing through a neon-lit rainy city at night",
  aspect_ratio: "16:9",
  quality: "720p",
  duration: 5,
  generate_audio_switch: false,
  seed: 123456,
} as const;
const IMAGE_INPUT = {
  prompt: "Use the supplied image as the exact first frame",
  image_urls: [FRAME],
  quality: "720p",
  duration: 5,
  generate_audio_switch: false,
  seed: 123456,
} as const;

const text = (input: Record<string, unknown>) =>
  PixverseV6MaxTextToVideoRequestSchema.safeParse({ model: TEXT, input });
const image = (input: Record<string, unknown>) =>
  PixverseV6MaxImageToVideoRequestSchema.safeParse({ model: IMAGE, input });
const without = (input: Record<string, unknown>, field: string) =>
  Object.fromEntries(Object.entries(input).filter(([key]) => key !== field));

describe("PixVerse V6 Max createTask models", () => {
  it.each([
    [TEXT, TEXT_INPUT],
    [IMAGE, IMAGE_INPUT],
  ] as const)(
    "%s is a listed, guarded model accepted by the createTask union",
    (model, input) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(CREATE_TASK_GUARDS[model]).toBeDefined();
      expect(CreateTaskRequestSchema.safeParse({ model, input }).success).toBe(
        true
      );
    }
  );

  it.each([
    [TEXT, TEXT_INPUT],
    [IMAGE, IMAGE_INPUT],
  ] as const)(
    "%s sends an accepted request to createTask unchanged",
    async (model, input) => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            msg: "success",
            data: { taskId: "pixverse-v6-max-task" },
          }),
          { status: 200 }
        )
      );
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });
      const request = { model, input } as
        | PixverseV6MaxTextToVideoRequest
        | PixverseV6MaxImageToVideoRequest;

      const result = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(result.data?.taskId).toBe("pixverse-v6-max-task");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual(request);
    }
  );

  it("keeps every field upstream marks required and defaults audio off", () => {
    for (const field of ["prompt", "aspect_ratio", "quality", "duration"]) {
      expect(text(without(TEXT_INPUT, field)).success, field).toBe(false);
    }
    for (const field of ["prompt", "image_urls", "quality", "duration"]) {
      expect(image(without(IMAGE_INPUT, field)).success, field).toBe(false);
    }

    const parsed = text(
      without(without(TEXT_INPUT, "seed"), "generate_audio_switch")
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data?.input.generate_audio_switch).toBe(false);
    expect(parsed.data?.input.seed).toBeUndefined();
    expect(
      image(without(IMAGE_INPUT, "generate_audio_switch")).data?.input
        .generate_audio_switch
    ).toBe(false);
  });

  it.each([
    ["an empty prompt", { prompt: "" }],
    ["a prompt over 5000 characters", { prompt: "x".repeat(5001) }],
    ["an undocumented aspect ratio", { aspect_ratio: "4:5" }],
    ["an undocumented quality", { quality: "2160p" }],
    [
      "upper-case quality, which the cost table cannot select",
      { quality: "720P" },
    ],
    ["a zero duration", { duration: 0 }],
    ["a 16 s duration", { duration: 16 }],
    ["a fractional duration", { duration: 2.5 }],
    ["a string duration", { duration: "5" }],
    ["a negative seed", { seed: -1 }],
    ["a seed above 2147483647", { seed: 2147483648 }],
    ["a string audio switch", { generate_audio_switch: "true" }],
  ])("rejects text-to-video with %s", (_label, patch) => {
    expect(text({ ...TEXT_INPUT, ...patch }).success).toBe(false);
  });

  it("accepts the documented boundaries", () => {
    expect(
      text({ ...TEXT_INPUT, prompt: "x", duration: 1, seed: 0 }).success
    ).toBe(true);
    expect(
      text({
        ...TEXT_INPUT,
        prompt: "x".repeat(5000),
        aspect_ratio: "21:9",
        quality: "1080p",
        duration: 15,
        seed: 2147483647,
      }).success
    ).toBe(true);
    expect(
      image({ ...IMAGE_INPUT, quality: "360p", duration: 1 }).success
    ).toBe(true);
  });

  it.each([
    ["no image", { image_urls: [] }],
    ["two images", { image_urls: [FRAME, FRAME] }],
    ["a bare file name", { image_urls: ["first-frame.png"] }],
    ["a string instead of an array", { image_urls: FRAME }],
    ["an empty prompt", { prompt: "" }],
    ["a 16 s duration", { duration: 16 }],
  ])("rejects image-to-video with %s", (_label, patch) => {
    expect(image({ ...IMAGE_INPUT, ...patch }).success).toBe(false);
  });

  it("accepts an OSS first-frame address, which upstream lists beside HTTP(S)", () => {
    expect(
      image({ ...IMAGE_INPUT, image_urls: ["oss://bucket/first-frame.png"] })
        .success
    ).toBe(true);
  });

  it("rejects aspect_ratio on image-to-video before any fetch", async () => {
    const result = image({ ...IMAGE_INPUT, aspect_ratio: "16:9" });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ["input", "aspect_ratio"],
        message:
          "pixverse-v6-max/image-to-video takes its aspect ratio from the source image; do not send aspect_ratio",
      }),
    ]);

    const mockFetch = vi.fn();
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    // Invalid by construction: the input type forbids aspect_ratio, so the
    // cast is what lets the guard see it.
    const request = {
      model: IMAGE,
      input: { ...IMAGE_INPUT, aspect_ratio: "16:9" },
    } as unknown as PixverseV6MaxImageToVideoRequest;

    await expect(
      provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      )
    ).rejects.toMatchObject({
      name: "KieError",
      status: 400,
      message: expect.stringContaining(
        "input.aspect_ratio: pixverse-v6-max/image-to-video takes its aspect ratio from the source image"
      ),
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("validates the task result JSON", () => {
    const clip =
      "https://tempfile.aiquickdraw.com/pixverse-v6/1792749298819-oqsde536h2.mp4";
    expect(
      PixverseV6MaxTaskResultJsonSchema.parse({ resultUrls: [clip] })
    ).toEqual({ resultUrls: [clip] });
    expect(PixverseV6MaxTaskResultJsonSchema.safeParse({}).success).toBe(false);
    expect(
      PixverseV6MaxTaskResultJsonSchema.safeParse({ resultUrls: [] }).success
    ).toBe(false);
  });
});

describe("PixVerse V6 Max model input descriptors", () => {
  it.each([
    [TEXT, PixverseV6MaxTextToVideoInputSchema, []],
    // aspect_ratio is a schema-side rejection, not a field to send.
    [IMAGE, PixverseV6MaxImageToVideoInputSchema, ["aspect_ratio"]],
  ] as const)("%s mirrors its input schema", (model, schema, forbidden) => {
    const descriptor = modelInputSchemas[model];
    const json = zodToJsonSchema(schema);
    const properties = json.properties as Record<
      string,
      Record<string, unknown>
    >;
    const required = new Set(json.required as string[]);
    const sendable = Object.keys(schema.shape).filter(
      (name) => !(forbidden as readonly string[]).includes(name)
    );

    expect(descriptor.type).toBe("video");
    expect(Object.keys(descriptor.fields).sort()).toEqual(sendable.sort());
    for (const [name, field] of Object.entries(descriptor.fields)) {
      const property = properties[name];
      expect(field.required === true, name).toBe(required.has(name));
      for (const key of [
        "enum",
        "default",
        "minimum",
        "maximum",
        "minLength",
        "maxLength",
        "minItems",
        "maxItems",
      ] as const) {
        expect(field[key], `${name}.${key}`).toEqual(property[key]);
      }
      expect(field.description, name).toBe(property.description);
    }
    for (const name of forbidden) {
      expect(properties[name]).toMatchObject({ not: {} });
      expect(required.has(name)).toBe(false);
    }
  });
});

describe("PixVerse V6 Max pricing", () => {
  const estimate = (model: string, input: Record<string, unknown>) =>
    computeEstimate({ provider: "kie", payload: { model, input } });

  // Credits per second from the feed and both kie.ai tabs, at $0.005 each.
  const LADDER = [
    ["360p", false, 4.8],
    ["360p", true, 7.2],
    ["540p", false, 7.2],
    ["540p", true, 8.8],
    ["720p", false, 8.8],
    ["720p", true, 12],
    ["1080p", false, 17.6],
    ["1080p", true, 22.4],
  ] as const;

  it.each([TEXT, IMAGE])(
    "%s bills output seconds on the quality x audio ladder",
    (model) => {
      for (const [quality, audio, credits] of LADDER) {
        const result = estimate(model, {
          quality,
          duration: 3,
          generate_audio_switch: audio,
        });
        expect(result.usd, `${quality} audio=${audio}`).toBeCloseTo(
          3 * credits * 0.005,
          10
        );
        expect(result.warnings).toEqual([]);
      }
    }
  );

  it.each([TEXT, IMAGE])(
    "%s matches the docs callback example and prices an omitted switch as no audio",
    (model) => {
      // Both docs callback examples bill 44 credits for 5 s at 720p, no audio.
      expect(estimate(model, { quality: "720p", duration: 5 }).usd).toBeCloseTo(
        44 * 0.005,
        10
      );
    }
  );

  it("fails closed without quality or duration", () => {
    const noQuality = estimate(TEXT, { duration: 5 });
    expect(noQuality.usd).toBe(0);
    expect(noQuality.warnings.join(" ")).toContain(
      "missing required selector(s): quality"
    );
    const noDuration = estimate(IMAGE, { quality: "720p" });
    expect(noDuration.usd).toBe(0);
    expect(noDuration.warnings.join(" ")).toContain("could not derive units");
  });
});
