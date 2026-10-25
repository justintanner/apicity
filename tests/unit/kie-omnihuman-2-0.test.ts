import { describe, it, expect, vi } from "vitest";
import { createKie } from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KieMediaModelSchema,
  Omnihuman20InputSchema,
  Omnihuman20RequestSchema,
  Omnihuman20TaskResultJsonSchema,
  type Omnihuman20Request,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { zodToJsonSchema } from "../../packages/cli/src/schema";
import { TEST_PAYGATE_SECRET, mintKieCreateTaskOtp } from "../harness";

const MODEL = "omnihuman-2-0";
const IMAGE = "https://example.com/portrait.png";
const AUDIO = "https://example.com/speech.wav";

// The docs' own example payload (2026-10-25), callBackUrl aside.
const INPUT = {
  image_urls: [
    "https://static.aiquickdraw.com/tools/example/1792734497529_2RcDODp8.png",
  ],
  audio_url:
    "https://static.aiquickdraw.com/tools/example/1792734490067_FvBSDOOl.wav",
  prompt:
    "A museum guide explains how starlight lets us look into the universe’s past in a friendly, engaging manner.",
  enable_watermark: true,
};

const parse = (input: Record<string, unknown>) =>
  Omnihuman20RequestSchema.safeParse({ model: MODEL, input });
const without = (input: Record<string, unknown>, field: string) =>
  Object.fromEntries(Object.entries(input).filter(([key]) => key !== field));

function mockProvider(fetch: typeof globalThis.fetch) {
  return createKie({
    apiKey: "test-key",
    baseURL: "https://api.kie.ai",
    fetch,
    paygate: { secret: TEST_PAYGATE_SECRET },
  });
}

describe("OmniHuman 2.0 createTask model", () => {
  it("is a listed, guarded model accepted by the createTask union", () => {
    expect(KieMediaModelSchema.safeParse(MODEL).success).toBe(true);
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(Omnihuman20RequestSchema);
    expect(
      CreateTaskRequestSchema.safeParse({ model: MODEL, input: INPUT }).success
    ).toBe(true);
  });

  it("sends an accepted request to createTask unchanged", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          msg: "success",
          data: { taskId: "omnihuman-2-0-task" },
        }),
        { status: 200 }
      )
    );
    const request: Omnihuman20Request = {
      model: MODEL,
      input: INPUT,
      callBackUrl: "https://example.com/callback",
    };

    const result = await mockProvider(mockFetch).post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(result.data?.taskId).toBe("omnihuman-2-0-task");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it("requires the image and the audio, and defaults the watermark on", () => {
    for (const field of ["image_urls", "audio_url"]) {
      expect(parse(without(INPUT, field)).success, field).toBe(false);
    }

    const parsed = parse({ image_urls: [IMAGE], audio_url: AUDIO });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.input.enable_watermark).toBe(true);
    expect(parsed.data?.input.prompt).toBeUndefined();
    expect(
      parse({ ...INPUT, enable_watermark: false }).data?.input.enable_watermark
    ).toBe(false);
  });

  it.each([
    ["no image", { image_urls: [] }],
    ["two images", { image_urls: [IMAGE, IMAGE] }],
    ["a bare image file name", { image_urls: ["portrait.png"] }],
    ["an image string instead of an array", { image_urls: IMAGE }],
    ["a bare audio file name", { audio_url: "speech.wav" }],
    ["a prompt over 300 characters", { prompt: "x".repeat(301) }],
    ["a string watermark switch", { enable_watermark: "false" }],
  ])("rejects %s", (_label, patch) => {
    expect(parse({ ...INPUT, ...patch }).success).toBe(false);
  });

  it("accepts a 300-character prompt", () => {
    expect(parse({ ...INPUT, prompt: "x".repeat(300) }).success).toBe(true);
  });

  it("rejects a callBackUrl that is not a URL", () => {
    expect(
      Omnihuman20RequestSchema.safeParse({
        model: MODEL,
        input: INPUT,
        callBackUrl: "callback",
      }).success
    ).toBe(false);
  });

  it("rejects a 1.5-shaped request before any fetch", async () => {
    const mockFetch = vi.fn();
    // 1.5 sends one image as image_url; 2.0 takes a one-element image_urls.
    // Invalid by construction, so the cast is what lets the guard see it.
    const request = {
      model: MODEL,
      input: { image_url: IMAGE, audio_url: AUDIO },
    } as unknown as Omnihuman20Request;

    await expect(
      mockProvider(mockFetch).post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      )
    ).rejects.toMatchObject({
      name: "KieError",
      status: 400,
      message: expect.stringContaining("input.image_urls"),
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("validates the task result JSON", () => {
    const clip =
      "https://static.aiquickdraw.com/tools/example/1792734516894_OplehJyL.mp4";
    expect(
      Omnihuman20TaskResultJsonSchema.parse({ resultUrls: [clip] })
    ).toEqual({ resultUrls: [clip] });
    expect(Omnihuman20TaskResultJsonSchema.safeParse({}).success).toBe(false);
    expect(
      Omnihuman20TaskResultJsonSchema.safeParse({ resultUrls: [] }).success
    ).toBe(false);
  });
});

describe("OmniHuman 2.0 model input descriptor", () => {
  it("mirrors its input schema", () => {
    const descriptor = modelInputSchemas[MODEL];
    const json = zodToJsonSchema(Omnihuman20InputSchema);
    const properties = json.properties as Record<
      string,
      Record<string, unknown>
    >;
    const required = new Set(json.required as string[]);

    expect(descriptor.type).toBe("video");
    expect(Object.keys(descriptor.fields).sort()).toEqual(
      Object.keys(Omnihuman20InputSchema.shape).sort()
    );
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
  });
});

describe("OmniHuman 2.0 pricing", () => {
  const estimate = (input: Record<string, unknown>, durationSeconds?: number) =>
    computeEstimate({
      provider: "kie",
      payload: { model: MODEL, input },
      ...(durationSeconds === undefined
        ? {}
        : { costHints: { durationSeconds } }),
    });

  it("bills 14 credits ($0.07) per whole output second", () => {
    for (const [declared, billed] of [
      [4, 4],
      [4.2, 5],
      [6, 6],
      [300, 300],
    ]) {
      const result = estimate(INPUT, declared);
      expect(result.usd, `${declared} s`).toBeCloseTo(billed * 14 * 0.005, 10);
      expect(result.breakdown).toMatchObject({
        units: billed,
        unit: "seconds",
        perUnitUsd: 0.07,
      });
      expect(result.warnings).toEqual([]);
    }
  });

  it("matches the recorded generation's bill", () => {
    // tests/recordings/kie_2079838932/omnihuman-2-0_961523171: the 6.008 s
    // dialog.mp3 rendered a 7.000 s video billed 98 credits.
    expect(estimate(INPUT, 6.008).usd).toBeCloseTo(98 * 0.005, 10);
  });

  it("does not price the watermark switch", () => {
    expect(estimate({ ...INPUT, enable_watermark: false }, 6).usd).toBe(
      estimate(INPUT, 6).usd
    );
  });

  it("fails closed without the audio length", () => {
    const result = estimate(INPUT);
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain("could not derive units");
  });
});
