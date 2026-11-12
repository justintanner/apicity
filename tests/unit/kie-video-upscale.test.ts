import { describe, expect, expectTypeOf, it } from "vitest";

import {
  KieVideoUpscaleRequestSchema as RootKieVideoUpscaleRequestSchema,
  type KieVideoUpscaleParsedRequest,
  type KieVideoUpscaleRequest,
  type KieVideoUpscaleRequestInput,
  type KieVideoUpscaleResolution,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  KieVideoUpscaleRequestSchema,
  KieVideoUpscaleResolutionSchema,
  MediaGenerationRequestSchema,
} from "@apicity/kie/zod";

import { zodToJsonSchema } from "../../packages/cli/src/schema";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "video/upscale" as const;
const VIDEO = "https://example.com/cat.mp4";

// The docs request example (read 2026-11-12).
const DOCUMENTED_REQUEST = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    video_url:
      "https://file.aiquickdraw.com/custom-page/akr/section-images/1758166466095hvbwkrpw.mp4",
    resolution: "2K",
  },
} satisfies KieVideoUpscaleRequest;

// The recorded pin (tests/integration/kie-video-upscale.test.ts); the
// recording sent KIE's upload URL for cat1-kling-o3-3s.mp4.
const RECORDED_REQUEST = {
  model: MODEL,
  input: { video_url: VIDEO, resolution: "1080P" },
} satisfies KieVideoUpscaleRequest;

function parseInput(input: Record<string, unknown>) {
  return KieVideoUpscaleRequestSchema.safeParse({ model: MODEL, input });
}

function failsAt(input: Record<string, unknown>, field: string) {
  const result = parseInput(input);
  if (result.success) return false;
  return result.error.issues.some(
    (issue) => issue.path.join(".") === `input.${field}`
  );
}

describe("Kie Video Upscale request contract", () => {
  it("accepts the documented example and the recorded pin directly, through the guard, and through the aggregates", () => {
    for (const request of [DOCUMENTED_REQUEST, RECORDED_REQUEST]) {
      expect(KieVideoUpscaleRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CREATE_TASK_GUARDS[MODEL].safeParse(request).success).toBe(true);
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    }
  });

  it("fills in the documented default box, 2K", () => {
    const parsed = KieVideoUpscaleRequestSchema.parse({
      model: MODEL,
      input: { video_url: VIDEO },
    });
    expect(parsed.input).toEqual({ video_url: VIDEO, resolution: "2K" });
  });

  it("takes the box uppercase, exactly as the docs write it", () => {
    expect(KieVideoUpscaleResolutionSchema.options).toEqual([
      "1080P",
      "2K",
      "4K",
    ]);
    for (const resolution of KieVideoUpscaleResolutionSchema.options) {
      expect(
        parseInput({ video_url: VIDEO, resolution }).success,
        resolution
      ).toBe(true);
    }
    for (const resolution of ["1080p", "2k", "4k", "720P", "8K", "", 1080]) {
      expect(
        failsAt({ video_url: VIDEO, resolution }, "resolution"),
        JSON.stringify(resolution)
      ).toBe(true);
    }
  });

  it("requires one public http(s) video_url", () => {
    for (const video_url of [
      undefined,
      "",
      "not a url",
      "ftp://example.com/cat.mp4",
      [VIDEO],
    ]) {
      expect(
        failsAt({ video_url, resolution: "2K" }, "video_url"),
        JSON.stringify(video_url)
      ).toBe(true);
    }
  });

  it("takes an optional callBackUrl, which must be a URL", () => {
    expect(
      KieVideoUpscaleRequestSchema.safeParse({
        ...RECORDED_REQUEST,
        callBackUrl: "not a url",
      }).success
    ).toBe(false);
  });

  it("carries the docs' field text into the JSON schema that apicity describe prints", () => {
    interface JsonNode {
      required?: string[];
      properties?: Record<string, JsonNode>;
      description?: string;
      enum?: unknown[];
      default?: unknown;
    }
    const json = zodToJsonSchema(KieVideoUpscaleRequestSchema) as JsonNode;
    const input = json.properties?.input;
    expect(input?.required).toEqual(["video_url"]);
    const properties = input?.properties ?? {};
    expect(Object.keys(properties)).toEqual(["video_url", "resolution"]);
    expect(properties.video_url?.description).toContain(
      "at most 50 MB and 60 seconds, in MP4, MOV or MKV"
    );
    expect(properties.resolution).toMatchObject({
      enum: ["1080P", "2K", "4K"],
      default: "2K",
    });
    expect(properties.resolution?.description).toContain(
      "Landscape boxes are 1080P 1920x1080, 2K 2560x1440 and 4K 3840x2160; portrait boxes are rotated 90 degrees."
    );
  });
});

describe("Kie Video Upscale model id", () => {
  it("lists the id, which stays enum-only", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(KieMediaModelSchema.safeParse(MODEL).success).toBe(true);
    for (const nearMiss of [
      "video",
      "video/upscaler",
      "video/upscale-pro",
      "video-upscale",
      "kie/video-upscale",
      "Video/upscale",
    ]) {
      expect(KieMediaModelSchema.safeParse(nearMiss).success, nearMiss).toBe(
        false
      );
    }
  });

  it("is registered in the guards and the descriptors", () => {
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(KieVideoUpscaleRequestSchema);
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("video");
    expect(Object.keys(descriptor.fields)).toEqual(["video_url", "resolution"]);
    expect(descriptor.fields.video_url).toMatchObject({
      type: "string",
      required: true,
    });
    expect(descriptor.fields.resolution).toMatchObject({
      type: "string",
      enum: [...KieVideoUpscaleResolutionSchema.options],
      default: "2K",
    });
    expect(descriptor.fields.resolution.required).toBeUndefined();
  });
});

describe("Kie Video Upscale public exports", () => {
  it("keeps the root schema value identical to the zod subpath", () => {
    expect(RootKieVideoUpscaleRequestSchema).toBe(KieVideoUpscaleRequestSchema);
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<KieVideoUpscaleRequestInput>().toEqualTypeOf<KieVideoUpscaleRequest>();
    expectTypeOf(
      KieVideoUpscaleRequestSchema.parse(DOCUMENTED_REQUEST)
    ).toEqualTypeOf<KieVideoUpscaleParsedRequest>();
    expectTypeOf<
      KieVideoUpscaleRequest["model"]
    >().toEqualTypeOf<"video/upscale">();
    expectTypeOf<KieVideoUpscaleResolution>().toEqualTypeOf<
      "1080P" | "2K" | "4K"
    >();
    expectTypeOf<
      KieVideoUpscaleParsedRequest["input"]["resolution"]
    >().toEqualTypeOf<KieVideoUpscaleResolution>();
  });
});
