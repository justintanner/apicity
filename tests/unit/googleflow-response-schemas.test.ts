import { describe, it, expect } from "vitest";

import {
  GoogleFlowApiErrorSchema,
  GoogleFlowCaptchaResultSchema,
  GoogleFlowMediaStatusSchema,
  GoogleFlowMediaVisibilitySchema,
  GoogleFlowVideoMediaEntrySchema,
  GoogleFlowVideosResponseSchema,
  GoogleFlowVideosUpscaleResponseSchema,
  GoogleFlowVideosExtendResponseSchema,
} from "../../packages/provider/googleflow/src/zod";

// The GF-S1 response primitives DESCRIBE upstream shapes permissively: every
// object level is `.passthrough()`, fields are optional unless the docs mark
// them always-present, and volatile string enums stay `z.string()`. The
// literals below are copied from the useapi.net google-flow Model blocks
// (post-google-flow-videos / post-google-flow-images).

describe("GoogleFlowCaptchaResultSchema", () => {
  // videos/images Model -> 200 OK -> top-level `captcha` object.
  const captchaLiteral = {
    service: "AntiCaptcha",
    taskId: "abc123...",
    durationMs: 3500,
    attempts: [
      {
        service: "AntiCaptcha",
        taskId: "abc123...",
        durationMs: 3500,
        success: true,
      },
    ],
  };

  it("parses the documented captcha result literal", () => {
    const result = GoogleFlowCaptchaResultSchema.safeParse(captchaLiteral);
    expect(result.success).toBe(true);
  });

  it("preserves an unknown extra field via .passthrough()", () => {
    const parsed = GoogleFlowCaptchaResultSchema.parse({
      ...captchaLiteral,
      internalId: "gf-internal-42",
      attempts: [{ success: false, internalNote: "retry" }],
    });
    // Top-level unknown field survives.
    expect((parsed as Record<string, unknown>).internalId).toBe(
      "gf-internal-42"
    );
    // Unknown field nested inside an attempt survives too.
    const firstAttempt = (parsed.attempts ?? [])[0] as Record<string, unknown>;
    expect(firstAttempt.internalNote).toBe("retry");
  });

  it("requires attempt.success to be a boolean", () => {
    const result = GoogleFlowCaptchaResultSchema.safeParse({
      attempts: [{ service: "AntiCaptcha" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty captcha object (all top-level fields optional)", () => {
    expect(GoogleFlowCaptchaResultSchema.safeParse({}).success).toBe(true);
  });
});

describe("GoogleFlowApiErrorSchema", () => {
  it("accepts the string error form with a captcha_quality: prefix", () => {
    const result = GoogleFlowApiErrorSchema.safeParse({
      error: "captcha_quality: too low",
    });
    expect(result.success).toBe(true);
  });

  it("accepts the Captcha service failed: prefix with a code sibling", () => {
    const result = GoogleFlowApiErrorSchema.safeParse({
      error: "Captcha service failed: ERROR_ZERO_BALANCE",
      code: 503,
    });
    expect(result.success).toBe(true);
  });

  it("accepts the structured error form plus the 429 empty-set siblings", () => {
    const result = GoogleFlowApiErrorSchema.safeParse({
      error: {
        code: 429,
        message: "rate limited",
        status: "RESOURCE_EXHAUSTED",
      },
      retryAfter: 30,
      skipReasons: ["empty-set"],
    });
    expect(result.success).toBe(true);
  });

  it("also accepts the documented ISO retryAfter and object skipReasons", () => {
    const result = GoogleFlowApiErrorSchema.safeParse({
      error: "no_eligible_account",
      message: "All accounts are temporarily rate limited.",
      retryAfter: "2025-11-17T12:40:00.000Z",
      skipReasons: [
        {
          email: "creator@example.com",
          reason: "PUBLIC_ERROR_PER_MODEL_DAILY_QUOTA_REACHED",
          model: "*",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("preserves unknown extra fields via .passthrough()", () => {
    const parsed = GoogleFlowApiErrorSchema.parse({
      error: "boom",
      internalId: "err-99",
    });
    expect((parsed as Record<string, unknown>).internalId).toBe("err-99");
  });

  it("rejects a body with no error field", () => {
    expect(GoogleFlowApiErrorSchema.safeParse({ code: 500 }).success).toBe(
      false
    );
  });
});

describe("GoogleFlowMediaStatusSchema", () => {
  it("parses the documented successful media status", () => {
    const result = GoogleFlowMediaStatusSchema.safeParse({
      mediaGenerationStatus: "MEDIA_GENERATION_STATUS_SUCCESSFUL",
    });
    expect(result.success).toBe(true);
  });

  it("tolerates an unknown status string (volatile enum stays z.string())", () => {
    const result = GoogleFlowMediaStatusSchema.safeParse({
      mediaGenerationStatus: "MEDIA_GENERATION_STATUS_BRAND_NEW",
      error: { code: 500, message: "internal" },
    });
    expect(result.success).toBe(true);
  });

  it("preserves an unknown extra field via .passthrough()", () => {
    const parsed = GoogleFlowMediaStatusSchema.parse({
      mediaGenerationStatus: "MEDIA_GENERATION_STATUS_FAILED",
      internalId: "media-7",
    });
    expect((parsed as Record<string, unknown>).internalId).toBe("media-7");
  });
});

describe("GoogleFlowMediaVisibilitySchema", () => {
  it("accepts the videos `visibility` field", () => {
    expect(
      GoogleFlowMediaVisibilitySchema.safeParse({ visibility: "PRIVATE" })
        .success
    ).toBe(true);
  });

  it("accepts the images `mediaVisibility` field", () => {
    expect(
      GoogleFlowMediaVisibilitySchema.safeParse({ mediaVisibility: "PRIVATE" })
        .success
    ).toBe(true);
  });

  it("preserves an unknown extra field via .passthrough()", () => {
    const parsed = GoogleFlowMediaVisibilitySchema.parse({
      visibility: "PUBLIC",
      internalId: "vis-1",
    });
    expect((parsed as Record<string, unknown>).internalId).toBe("vis-1");
  });
});

// GF-S4 video-generation SYNC response family. The literals below are copied
// from the useapi.net google-flow Model -> 200 OK blocks
// (post-google-flow-videos / -videos-upscale / -videos-extend, fetched
// 2026-07-22) and the committed stub recordings under
// tests/recordings/google-flow_3038927025/{i2v,omni-i2v}. Every schema DESCRIBES
// upstream permissively (.passthrough() at every level), so both the rich doc
// bodies and the sparse stub bodies parse.

// A full [videos] media[] entry: mediaMetadata.mediaStatus, video.generatedVideo
// with an internal snake_case model id, dimensions, operation, videoUrl.
const videosDocExampleBody = {
  jobId: "j1731859234567v-u12345-email:jo***@gmail.com-bot:google-flow",
  media: [
    {
      name: "a1d95d21-75d2-482d-a354-14ef8802ce66",
      projectId: "9f63078c-redacted",
      workflowId: "fa986834-redacted",
      workflowStepId: "CAE",
      mediaMetadata: {
        createTime: "2026-05-20T23:14:02.931677Z",
        mediaTitle:
          "A serene mountain landscape at sunset with camera slowly panning right",
        requestData: {
          videoGenerationRequestData: {
            videoModelControlInput: {
              videoModelName: "veo_3_1_t2v",
              videoGenerationMode: "VIDEO_GENERATION_MODE_TEXT_TO_VIDEO",
              videoAspectRatio: "VIDEO_ASPECT_RATIO_LANDSCAPE",
            },
          },
          clientPlatform: "CLIENT_PLATFORM_WEB",
        },
        mediaStatus: {
          mediaGenerationStatus: "MEDIA_GENERATION_STATUS_SUCCESSFUL",
        },
        visibility: "PRIVATE",
      },
      video: {
        generatedVideo: {
          seed: 123456,
          prompt:
            "A serene mountain landscape at sunset with camera slowly panning right",
          model: "veo_3_1_t2v",
          baseImageMediaGenerationId: "",
          isLooped: false,
          aspectRatio: "VIDEO_ASPECT_RATIO_LANDSCAPE",
        },
        dimensions: { length: "8s" },
        operation: { name: "a1d95d21-75d2-482d-a354-14ef8802ce66" },
      },
      mediaGenerationId:
        "user:12345-email:6a6f-video:a1d95d21-75d2-482d-a354-14ef8802ce66",
      videoUrl: "https://flow-content.google/video/a1d95d21?Expires=1",
      thumbnailUrl: "https://flow-content.google/image/a1d95d21?Expires=1",
    },
  ],
  remainingCredits: 18760,
  captcha: {
    service: "AntiCaptcha",
    taskId: "abc123",
    durationMs: 3500,
    attempts: [
      {
        service: "AntiCaptcha",
        taskId: "abc123",
        durationMs: 3500,
        success: true,
      },
    ],
  },
};

// The committed i2v / omni-i2v stub bodies. `url` is a stub-only key with no
// counterpart in the useapi.net docs — the canonical passthrough case.
const videosI2vStubBody = {
  jobId: "job-123",
  media: [
    {
      mediaGenerationId: "test-video-123",
      url: "https://example.com/video.mp4",
    },
  ],
};
const videosOmniStubBody = {
  jobId: "omni-job-123",
  media: [
    {
      mediaGenerationId: "test-omni-video-123",
      url: "https://example.com/omni-video.mp4",
    },
  ],
};

// A [vid-upscale] body with a POPULATED legacy operations[] (A3 / US-2): the
// nested operation.metadata.video.fifeUrl path must parse, not just an empty
// array. Both operations[] (legacy) and media[] (current) are returned.
const upscaleDocExampleBody = {
  jobId: "j1737312345678v-u12345-email:jo***@gmail.com-bot:google-flow",
  operations: [
    {
      operation: {
        name: "2fefd089-redacted_upsampled",
        metadata: {
          "@type":
            "type.googleapis.com/google.internal.labs.aisandbox.v1.Media",
          name: "2fefd089-redacted_upsampled",
          video: {
            seed: 0,
            model: "veo_3_1_upsampler_1080p",
            aspectRatio: "VIDEO_ASPECT_RATIO_LANDSCAPE",
            isLooped: false,
            upsampleResolution: "VIDEO_UPSAMPLE_RESOLUTION_1080P",
            fifeUrl: "https://flow-content.google/video/2fefd089_upsampled",
            servingBaseUri:
              "https://flow-content.google/image/2fefd089_upsampled",
            mediaGenerationId: "user:12345-email:6a6f-video:2fefd089_upsampled",
            mediaVisibility: "PRIVATE",
          },
        },
      },
      sceneId: "",
      status: "MEDIA_GENERATION_STATUS_SUCCESSFUL",
      mediaGenerationId: "user:12345-email:6a6f-video:2fefd089_upsampled",
    },
  ],
  media: [
    {
      name: "2fefd089-redacted_upsampled",
      mediaMetadata: {
        createTime: "2026-05-20T23:31:41.145235Z",
        mediaStatus: {
          mediaGenerationStatus: "MEDIA_GENERATION_STATUS_SUCCESSFUL",
        },
        visibility: "PRIVATE",
      },
      video: {
        generatedVideo: {
          seed: 0,
          model: "veo_3_1_upsampler_1080p",
          upsampleMetadata: {
            videoUpsampleResolution: "VIDEO_UPSAMPLE_RESOLUTION_1080P",
          },
        },
        dimensions: { length: "0s" },
        operation: { name: "2fefd089-redacted_upsampled" },
      },
      mediaGenerationId: "user:12345-email:6a6f-video:2fefd089_upsampled",
      videoUrl: "https://flow-content.google/video/2fefd089_upsampled",
      thumbnailUrl: "https://flow-content.google/image/2fefd089_upsampled",
    },
  ],
  remainingCredits: 18760,
};

// The [extend] Model block is field-identical to [videos] today; a compact body
// exercising the shared shape against the alias.
const extendDocExampleBody = {
  jobId: "j1737312345678v-u12345-email:jo***@gmail.com-bot:google-flow",
  media: [
    {
      name: "a1d95d21-redacted",
      mediaMetadata: {
        mediaStatus: {
          mediaGenerationStatus: "MEDIA_GENERATION_STATUS_SUCCESSFUL",
        },
        visibility: "PRIVATE",
      },
      video: {
        generatedVideo: {
          seed: 987654321,
          prompt: "The camera slowly pans right revealing a majestic waterfall",
          model: "veo_3_1_t2v",
          aspectRatio: "VIDEO_ASPECT_RATIO_LANDSCAPE",
        },
        dimensions: { length: "8s" },
        operation: { name: "a1d95d21-redacted" },
      },
      mediaGenerationId: "user:12345-email:6a6f-video:a1d95d21-redacted",
      videoUrl: "https://flow-content.google/video/a1d95d21?Expires=1",
      thumbnailUrl: "https://flow-content.google/image/a1d95d21?Expires=1",
    },
  ],
  remainingCredits: 18760,
};

describe("GoogleFlowVideoMediaEntrySchema", () => {
  it("parses a full [videos] media[] entry", () => {
    const result = GoogleFlowVideoMediaEntrySchema.safeParse(
      videosDocExampleBody.media[0]
    );
    expect(result.success).toBe(true);
  });

  it("requires only mediaGenerationId on the entry (OQ-1/A1)", () => {
    // The one field the stub and docs both always carry stays required;
    // everything else is optional, so a bare mediaGenerationId parses.
    expect(
      GoogleFlowVideoMediaEntrySchema.safeParse({ mediaGenerationId: "m-1" })
        .success
    ).toBe(true);
    // Omitting it fails.
    expect(GoogleFlowVideoMediaEntrySchema.safeParse({}).success).toBe(false);
  });
});

describe("GoogleFlowVideosResponseSchema", () => {
  it("parses the [videos] doc-example 200 body", () => {
    const result =
      GoogleFlowVideosResponseSchema.safeParse(videosDocExampleBody);
    expect(result.success).toBe(true);
  });

  it("parses the committed i2v and omni-i2v stub bodies", () => {
    expect(
      GoogleFlowVideosResponseSchema.safeParse(videosI2vStubBody).success
    ).toBe(true);
    expect(
      GoogleFlowVideosResponseSchema.safeParse(videosOmniStubBody).success
    ).toBe(true);
  });

  it("preserves the stub-only `url` via passthrough but never declares it", () => {
    const parsed = GoogleFlowVideosResponseSchema.parse(videosI2vStubBody);
    const entry = parsed.media[0];
    // Runtime: the undocumented `url` survives .passthrough()...
    expect((entry as Record<string, unknown>).url).toBe(
      "https://example.com/video.mp4"
    );
    // Compile-time: `url` is reachable ONLY through the passthrough index
    // signature, so its type is `unknown` — never a declared field like
    // `videoUrl: string | undefined`. Assigning it to `string` must fail; were
    // `url` ever declared as a typed field, this directive would go unused.
    // @ts-expect-error — stub-only `url` is untyped passthrough, not a declared field.
    const urlIsNotDeclared: string = entry.url;
    // The value still reads through at runtime (it survived .passthrough()).
    expect(urlIsNotDeclared).toBe("https://example.com/video.mp4");
  });
});

describe("GoogleFlowVideosUpscaleResponseSchema", () => {
  it("parses a [vid-upscale] body with a populated operations[] (fifeUrl path)", () => {
    const result = GoogleFlowVideosUpscaleResponseSchema.safeParse(
      upscaleDocExampleBody
    );
    expect(result.success).toBe(true);
  });
});

describe("GoogleFlowVideosExtendResponseSchema", () => {
  it("parses an [extend] doc-example body", () => {
    const result =
      GoogleFlowVideosExtendResponseSchema.safeParse(extendDocExampleBody);
    expect(result.success).toBe(true);
  });

  it("is the same schema object as GoogleFlowVideosResponseSchema (REQ-004)", () => {
    expect(GoogleFlowVideosExtendResponseSchema).toBe(
      GoogleFlowVideosResponseSchema
    );
  });
});
