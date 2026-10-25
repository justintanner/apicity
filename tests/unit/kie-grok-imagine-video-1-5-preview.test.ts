import { describe, it, expect, vi } from "vitest";
import { createKie } from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  GrokVideo15PreviewInputSchema,
  GrokVideo15PreviewRequestSchema,
  type GrokVideo15PreviewRequest,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { zodToJsonSchema } from "../../packages/cli/src/schema";
import { TEST_PAYGATE_SECRET, mintKieCreateTaskOtp } from "../harness";

const MODEL = "grok-imagine-video-1-5-preview";
const ANCHOR = "https://example.com/anchor.jpg";
const STUDIO = "https://example.com/studio.jpg";

// The recorded keyframes request
// (tests/integration/kie-grok-imagine-video-1-5-preview-frames.test.ts).
const FRAMES = {
  prompt:
    "The camera pulls back from the news anchor and pans across a retro control room, then returns to the anchor.",
  image_urls: [ANCHOR],
  first_frame_url: ANCHOR,
  keyframes: [{ url: STUDIO, timestamp_s: 1.5 }],
  last_frame_url: ANCHOR,
  aspect_ratio: "16:9",
  resolution: "480p",
  duration: 3,
};

const NEW_FIELDS = [
  "first_frame_url",
  "last_frame_url",
  "loop_url",
  "keyframes",
  "enable_audio",
] as const;

const parse = (input: Record<string, unknown>) =>
  GrokVideo15PreviewRequestSchema.safeParse({ model: MODEL, input });
const issues = (input: Record<string, unknown>) =>
  parse(input).error?.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  ) ?? [];
const keyframe = (timestamp_s: number) => ({ url: STUDIO, timestamp_s });

function mockProvider(fetch: typeof globalThis.fetch) {
  return createKie({
    apiKey: "test-key",
    baseURL: "https://api.kie.ai",
    fetch,
    paygate: { secret: TEST_PAYGATE_SECRET },
  });
}

describe("Grok Imagine Video 1.5 Preview frame controls", () => {
  it("guards createTask with the extended schema", () => {
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(GrokVideo15PreviewRequestSchema);
    expect(
      CreateTaskRequestSchema.safeParse({ model: MODEL, input: FRAMES }).success
    ).toBe(true);
  });

  it("accepts first and last frames around up to four keyframes", () => {
    expect(issues(FRAMES)).toEqual([]);
    expect(
      issues({
        ...FRAMES,
        duration: 8,
        keyframes: [keyframe(1), keyframe(2.5), keyframe(4), keyframe(7.9)],
      })
    ).toEqual([]);
    expect(issues({ image_urls: [ANCHOR], first_frame_url: ANCHOR })).toEqual(
      []
    );
    expect(issues({ image_urls: [ANCHOR], last_frame_url: STUDIO })).toEqual(
      []
    );
  });

  it("accepts a loop image alone or with matching end frames", () => {
    expect(issues({ image_urls: [STUDIO], loop_url: STUDIO })).toEqual([]);
    expect(
      issues({
        image_urls: [ANCHOR],
        loop_url: STUDIO,
        first_frame_url: STUDIO,
        last_frame_url: STUDIO,
        keyframes: [{ url: ANCHOR, timestamp_s: 4 }],
      })
    ).toEqual([]);
  });

  it("accepts keyframes exactly 1/3 second apart", () => {
    expect(
      issues({
        image_urls: [ANCHOR],
        duration: 2,
        keyframes: [
          keyframe(4 / 3),
          keyframe(1 / 3),
          keyframe(1),
          keyframe(2 / 3),
        ],
      })
    ).toEqual([]);
  });

  // KIE's docs cap image_urls at one, but a two-image request (task
  // 27541afd290e8048d72881fd3a4f7a2c, 2026-10-25) succeeded and billed the
  // plain rate, so the guard keeps accepting more than one.
  it("keeps accepting two image_urls", () => {
    expect(issues({ image_urls: [ANCHOR, STUDIO] })).toEqual([]);
  });

  it("defaults audio on", () => {
    const parsed = parse({ image_urls: [ANCHOR] });
    expect(parsed.data?.input).toMatchObject({
      enable_audio: true,
      duration: 8,
    });
    expect(parsed.data?.input.keyframes).toBeUndefined();
    expect(
      parse({ image_urls: [ANCHOR], enable_audio: false }).data?.input
        .enable_audio
    ).toBe(false);
  });

  it.each([
    [
      "a keyframe at 0",
      { keyframes: [keyframe(0)] },
      "input.keyframes.0.timestamp_s",
    ],
    [
      "a negative keyframe",
      { keyframes: [keyframe(-1)] },
      "input.keyframes.0.timestamp_s",
    ],
    [
      "a keyframe at the duration",
      { duration: 3, keyframes: [keyframe(1), keyframe(3)] },
      "input.keyframes.1.timestamp_s: keyframe timestamp_s must be less than duration (3s)",
    ],
    [
      "a keyframe at the default 8 s duration",
      { keyframes: [keyframe(8)] },
      "input.keyframes.0.timestamp_s: keyframe timestamp_s must be less than duration (8s)",
    ],
    [
      "keyframes 0.2 s apart",
      { duration: 3, keyframes: [keyframe(2), keyframe(1.2), keyframe(1)] },
      "input.keyframes: keyframes must be at least 1/3 second apart",
    ],
    [
      "two keyframes at one time",
      { keyframes: [keyframe(2), keyframe(2)] },
      "input.keyframes: keyframes must be at least 1/3 second apart",
    ],
    [
      "five keyframes",
      { keyframes: [1, 2, 3, 4, 5].map(keyframe) },
      "input.keyframes",
    ],
    [
      "a keyframe without a url",
      { keyframes: [{ timestamp_s: 1 }] },
      "input.keyframes.0.url",
    ],
    [
      "a keyframe without a timestamp",
      { keyframes: [{ url: STUDIO }] },
      "input.keyframes.0.timestamp_s",
    ],
    [
      "a string timestamp",
      { keyframes: [{ url: STUDIO, timestamp_s: "1" }] },
      "input.keyframes.0.timestamp_s",
    ],
    [
      "a loop with a different first frame",
      { loop_url: STUDIO, first_frame_url: ANCHOR },
      "input.first_frame_url: loop_url cannot be combined with a different first_frame_url",
    ],
    [
      "a loop with a different last frame",
      { loop_url: STUDIO, last_frame_url: ANCHOR },
      "input.last_frame_url: loop_url cannot be combined with a different last_frame_url",
    ],
    ["no image_urls", { image_urls: [] }, "input.image_urls"],
    ["a string audio switch", { enable_audio: "false" }, "input.enable_audio"],
  ])("rejects %s", (_label, patch, expected) => {
    const found = issues({ image_urls: [ANCHOR], ...patch });
    expect(
      found.some((issue) => issue.startsWith(expected)),
      found.join("; ")
    ).toBe(true);
  });

  it("sends a frames request to createTask unchanged", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          msg: "success",
          data: { taskId: "grok-frames-task" },
        }),
        { status: 200 }
      )
    );
    const request: GrokVideo15PreviewRequest = {
      model: MODEL,
      input: { ...FRAMES, aspect_ratio: "16:9", resolution: "480p" },
    };

    const result = await mockProvider(mockFetch).post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(result.data?.taskId).toBe("grok-frames-task");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it("rejects a late keyframe before any fetch", async () => {
    const mockFetch = vi.fn();
    const request: GrokVideo15PreviewRequest = {
      model: MODEL,
      input: { image_urls: [ANCHOR], duration: 3, keyframes: [keyframe(3)] },
    };

    await expect(
      mockProvider(mockFetch).post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      )
    ).rejects.toMatchObject({
      name: "KieError",
      status: 400,
      message: expect.stringContaining("input.keyframes.0.timestamp_s"),
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("Grok Imagine Video 1.5 Preview model input descriptor", () => {
  const descriptor = modelInputSchemas[MODEL];
  const json = zodToJsonSchema(GrokVideo15PreviewInputSchema);
  const properties = json.properties as Record<string, Record<string, unknown>>;

  it("lists every input field", () => {
    expect(Object.keys(descriptor.fields).sort()).toEqual(
      Object.keys(GrokVideo15PreviewInputSchema.shape).sort()
    );
    expect(descriptor.fields.image_urls).toMatchObject({
      required: true,
      minItems: 1,
    });
    expect(descriptor.fields.image_urls.maxItems).toBeUndefined();
    expect(properties.image_urls.maxItems).toBeUndefined();
  });

  it("mirrors the frame-control fields", () => {
    for (const name of NEW_FIELDS) {
      const field = descriptor.fields[name];
      const property = properties[name];
      expect(field.required, name).toBeUndefined();
      expect(field.type, name).toBe(property.type);
      expect(field.description, name).toBe(property.description);
      for (const key of ["default", "maxItems"] as const) {
        expect(field[key], `${name}.${key}`).toEqual(property[key]);
      }
    }

    const items = properties.keyframes.items as Record<string, unknown>;
    const itemProperties = items.properties as Record<
      string,
      Record<string, unknown>
    >;
    const described = descriptor.fields.keyframes.items?.properties ?? {};
    expect(items.required).toEqual(["url", "timestamp_s"]);
    for (const [name, property] of Object.entries(itemProperties)) {
      expect(described[name]?.required, name).toBe(true);
      expect(described[name]?.type, name).toBe(property.type);
      expect(described[name]?.description, name).toBe(property.description);
    }
    expect(described.timestamp_s.exclusiveMinimum).toBe(0);
    expect(itemProperties.timestamp_s.exclusiveMinimum).toBe(0);
  });
});

describe("Grok Imagine Video 1.5 Preview frame-control pricing", () => {
  const estimate = (input: Record<string, unknown>) =>
    computeEstimate({ provider: "kie", payload: { model: MODEL, input } });

  it("matches the recorded generations' bills", () => {
    // tests/recordings/kie_2079838932/grok-imagine-video-1-5-preview-keyframes:
    // 3 s billed 7.2 credits; ...-loop: 2 s without audio billed 4.8 credits.
    expect(estimate(FRAMES).usd).toBeCloseTo(7.2 * 0.005, 10);
    expect(
      estimate({
        image_urls: [STUDIO],
        loop_url: STUDIO,
        aspect_ratio: "16:9",
        resolution: "480p",
        duration: 2,
        enable_audio: false,
      }).usd
    ).toBeCloseTo(4.8 * 0.005, 10);
  });

  it("prices frame controls at the plain per-second rate", () => {
    const plain = estimate({ image_urls: [ANCHOR], duration: 3 });
    expect(plain.usd).toBeCloseTo(3 * 0.012, 10);
    expect(estimate(FRAMES).usd).toBe(plain.usd);
    expect(
      estimate({
        image_urls: [STUDIO],
        loop_url: STUDIO,
        duration: 3,
        enable_audio: false,
      }).usd
    ).toBe(plain.usd);
  });
});
