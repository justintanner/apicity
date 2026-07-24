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
  GoogleFlowImageMediaEntrySchema,
  GoogleFlowImagesResponseSchema,
  GoogleFlowImagesUpscaleResponseSchema,
  GoogleFlowVideosGifResponseSchema,
  GoogleFlowVideosConcatenateResponseSchema,
  GoogleFlowJobRecordSchema,
  GoogleFlowJobCreatedResponseSchema,
  GoogleFlowJobsStatsResponseSchema,
  GoogleFlowAssetsUploadImageResponseSchema,
  GoogleFlowAssetsUploadVideoResponseSchema,
  GoogleFlowAssetsRetrieveResponseSchema,
  GoogleFlowCharacterVoiceSchema,
  GoogleFlowCharactersCreateResponseSchema,
  GoogleFlowCharactersListResponseSchema,
  GoogleFlowCharactersRetrieveResponseSchema,
  GoogleFlowVoiceSchema,
  GoogleFlowVoicesCreateResponseSchema,
  GoogleFlowVoicesListResponseSchema,
  GoogleFlowVoicesRetrieveResponseSchema,
  GoogleFlowAccountsListResponseSchema,
  GoogleFlowCaptchaProvidersResponseSchema,
  GoogleFlowCaptchaStatsResponseSchema,
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

// GF-S5 image-generation SYNC response family. The literals below are copied
// from the useapi.net google-flow Model -> 200 OK block
// (post-google-flow-images, fetched 2026-07-22). The generated-image payload
// nests under image.generatedImage; the doc example has no remainingCredits
// (unlike [videos]), so it is not declared — passthrough preserves it if a
// future body carries it.

// A full [images] media[] entry: image.generatedImage with an internal response
// model id (modelNameType), mediaVisibility, fifeUrl, aspectRatio, requestData.
const imagesDocExampleMediaEntry = {
  name: "…redacted…",
  workflowId: "…redacted…",
  image: {
    generatedImage: {
      seed: 123456,
      mediaGenerationId: "user:12345…redacted…",
      mediaVisibility: "PRIVATE",
      prompt: "A serene mountain landscape at sunset with vibrant colors",
      modelNameType: "HARBOR_SEAL",
      workflowId: "…redacted…",
      fifeUrl: "https://storage.googleapis.com/…redacted…",
      aspectRatio: "IMAGE_ASPECT_RATIO_LANDSCAPE",
      requestData: {
        promptInputs: [
          {
            textInput:
              "A serene mountain landscape at sunset with vibrant colors",
          },
        ],
        imageGenerationRequestData: { imageGenerationImageInputs: [] },
      },
    },
  },
};

const imagesDocExampleBody = {
  jobId: "j1731859345678i-u12345-email:jo***@gmail.com-bot:google-flow",
  media: [imagesDocExampleMediaEntry],
  captcha: {
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
  },
};

describe("GoogleFlowImageMediaEntrySchema", () => {
  it("parses a full [images] media[] entry (all generatedImage fields)", () => {
    const result = GoogleFlowImageMediaEntrySchema.safeParse(
      imagesDocExampleMediaEntry
    );
    expect(result.success).toBe(true);
  });

  it("parses a minimal entry (every field optional by default, OQ-3)", () => {
    const result = GoogleFlowImageMediaEntrySchema.safeParse({
      image: { generatedImage: { mediaGenerationId: "m-1" } },
    });
    expect(result.success).toBe(true);
  });

  it("preserves an undeclared generatedImage field via .passthrough()", () => {
    const parsed = GoogleFlowImageMediaEntrySchema.parse({
      image: {
        generatedImage: { mediaGenerationId: "m-1", futureField: true },
      },
    });
    const generatedImage = (parsed.image?.generatedImage ?? {}) as Record<
      string,
      unknown
    >;
    expect(generatedImage.futureField).toBe(true);
  });

  it("tolerates a novel modelNameType string (open response vocabulary, REQ-002)", () => {
    const result = GoogleFlowImageMediaEntrySchema.safeParse({
      image: { generatedImage: { modelNameType: "SOME_FUTURE_MODEL_2027" } },
    });
    expect(result.success).toBe(true);
  });
});

describe("GoogleFlowImagesResponseSchema", () => {
  it("parses the documented 200 body without a captcha", () => {
    const result = GoogleFlowImagesResponseSchema.safeParse({
      jobId: "j-1",
      media: [imagesDocExampleMediaEntry],
    });
    expect(result.success).toBe(true);
  });

  it("parses the same body plus a GF-S1 captcha object (reuse)", () => {
    const result =
      GoogleFlowImagesResponseSchema.safeParse(imagesDocExampleBody);
    expect(result.success).toBe(true);
  });

  it("requires jobId (a body missing it fails)", () => {
    expect(
      GoogleFlowImagesResponseSchema.safeParse({ media: [] }).success
    ).toBe(false);
  });

  it("preserves an unknown top-level field via .passthrough()", () => {
    const parsed = GoogleFlowImagesResponseSchema.parse({
      jobId: "j-1",
      media: [],
      remainingCredits: 18760,
    });
    expect((parsed as Record<string, unknown>).remainingCredits).toBe(18760);
  });
});

// GF-S6 encoded-payload SYNC response family. The literals below are copied from
// the useapi.net google-flow Model -> 200 OK blocks (post-google-flow-images-
// upscale / -videos-gif / -videos-concatenate, fetched 2026-07-22). Each 200
// body is a small base64-encoded media payload rather than a media[] array;
// every schema DESCRIBES upstream permissively (.passthrough() at every level),
// requires only the doc-always-present fields, and keeps the concatenate
// `status` an open z.string().

describe("GoogleFlowImagesUpscaleResponseSchema", () => {
  // [images/upscale] Model -> 200 OK: { encodedImage, captcha }.
  const upscaleDocBody = {
    encodedImage: "/9j/4AAQSkZJRgABAQAAAQABAAD...base64 encoded image data...",
    captcha: {
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
    },
  };

  it("parses the documented upscale 200 body (encodedImage + captcha)", () => {
    expect(
      GoogleFlowImagesUpscaleResponseSchema.safeParse(upscaleDocBody).success
    ).toBe(true);
  });

  it("parses a minimal body without a captcha (captcha optional)", () => {
    expect(
      GoogleFlowImagesUpscaleResponseSchema.safeParse({
        encodedImage: "/9j/4AAQSkZJRg...",
      }).success
    ).toBe(true);
  });

  it("requires encodedImage (a captcha-only body fails)", () => {
    expect(
      GoogleFlowImagesUpscaleResponseSchema.safeParse({ captcha: {} }).success
    ).toBe(false);
  });

  it("preserves unknown top-level and nested captcha fields via .passthrough()", () => {
    const parsed = GoogleFlowImagesUpscaleResponseSchema.parse({
      encodedImage: "/9j/4AAQSkZJRg...",
      remainingCredits: 42,
      captcha: {
        attempts: [{ success: true, futureField: true }],
      },
    }) as Record<string, unknown>;
    // Top-level unknown field survives.
    expect(parsed.remainingCredits).toBe(42);
    // Unknown field nested inside captcha.attempts[] survives too.
    const captcha = parsed.captcha as Record<string, unknown>;
    const firstAttempt = (captcha.attempts as Record<string, unknown>[])[0];
    expect(firstAttempt.futureField).toBe(true);
  });
});

describe("GoogleFlowVideosGifResponseSchema", () => {
  it("parses the documented gif 200 body", () => {
    expect(
      GoogleFlowVideosGifResponseSchema.safeParse({
        encodedGif:
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7...",
      }).success
    ).toBe(true);
  });

  it("requires encodedGif (an empty body fails)", () => {
    expect(GoogleFlowVideosGifResponseSchema.safeParse({}).success).toBe(false);
  });

  it("preserves an unknown top-level field via .passthrough()", () => {
    const parsed = GoogleFlowVideosGifResponseSchema.parse({
      encodedGif: "R0lGODlh...",
      remainingCredits: 42,
    });
    expect((parsed as Record<string, unknown>).remainingCredits).toBe(42);
  });
});

describe("GoogleFlowVideosConcatenateResponseSchema", () => {
  // [videos/concatenate] Model -> 200 OK: { jobId, status, inputsCount,
  // encodedVideo } — all four always-present.
  const concatDocBody = {
    jobId: "j1737312345678v-u12345-email:jo***@gmail.com-bot:google-flow",
    status: "MEDIA_GENERATION_STATUS_SUCCESSFUL",
    inputsCount: 3,
    encodedVideo: "AAAAIGZ0eXBpc29t...~21MB base64...",
  };

  it("parses the documented concatenate 200 body", () => {
    expect(
      GoogleFlowVideosConcatenateResponseSchema.safeParse(concatDocBody).success
    ).toBe(true);
  });

  it("requires all four fields (a body missing inputsCount fails)", () => {
    expect(
      GoogleFlowVideosConcatenateResponseSchema.safeParse({
        jobId: concatDocBody.jobId,
        status: concatDocBody.status,
        encodedVideo: concatDocBody.encodedVideo,
      }).success
    ).toBe(false);
  });

  it("tolerates a novel status string (open response vocabulary, REQ-004)", () => {
    expect(
      GoogleFlowVideosConcatenateResponseSchema.safeParse({
        ...concatDocBody,
        status: "MEDIA_GENERATION_STATUS_SOME_FUTURE_STATE",
      }).success
    ).toBe(true);
  });

  it("preserves an unknown top-level field via .passthrough()", () => {
    const parsed = GoogleFlowVideosConcatenateResponseSchema.parse({
      ...concatDocBody,
      remainingCredits: 42,
    });
    expect((parsed as Record<string, unknown>).remainingCredits).toBe(42);
  });
});

// The GF-S7 jobs & async-job response family. Fixtures are copied from the
// useapi.net Model blocks (fetched 2026-07-22):
//   [jobs-id] get-google-flow-jobs-jobid (Video Job / Image Job / Job failed),
//   [jobs]    get-google-flow-jobs (options= stats block),
//   the async 201 tabs on post-google-flow-videos / -extend / -upscale.

describe("GoogleFlowJobRecordSchema", () => {
  // [jobs-id] Model -> 200 OK -> "Video job (completed)".
  const completedVideoJob = {
    jobid: "j1731859234567v-u12345-email:jo***@gmail.com-bot:google-flow",
    type: "video",
    status: "completed",
    created: "2025-11-17T12:34:56.789Z",
    updated: "2025-11-17T12:37:23.456Z",
    request: {
      email: "jo***@gmail.com",
      prompt:
        "A serene mountain landscape at sunset with camera slowly panning right",
      model: "veo-3.1-fast",
      aspectRatio: "landscape",
      count: 2,
      seed: 123456,
      async: true,
      replyUrl: "https://your-domain.com/webhook",
    },
    response: {
      media: [
        {
          name: "a1d95d21-75d2-482d-a354-14ef8802ce66",
          projectId: "9f63078c-...redacted...",
          workflowId: "fa986834-...redacted...",
          workflowStepId: "CAE",
          mediaMetadata: {
            createTime: "2026-05-20T23:14:02.931677Z",
            mediaTitle:
              "A serene mountain landscape at sunset with camera slowly panning right",
            requestData: {
              videoGenerationRequestData: { "...": "..." },
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
            operation: { name: "a1d95d21-...redacted..." },
          },
          mediaGenerationId:
            "user:12345-email:6a6f...-video:a1d95d21-...redacted...",
          videoUrl:
            "https://flow-content.google/video/a1d95d21-...redacted...?Expires=...",
          thumbnailUrl:
            "https://flow-content.google/image/a1d95d21-...redacted...?Expires=...",
        },
      ],
      remainingCredits: 14845,
      captcha: {
        service: "CapSolver",
        taskId: "abc123...",
        durationMs: 3500,
        attempts: [
          {
            service: "CapSolver",
            taskId: "abc123...",
            durationMs: 3500,
            success: true,
          },
        ],
      },
    },
  };

  // [jobs-id] Model -> 200 OK -> "Image job (completed)".
  const completedImageJob = {
    jobid: "j1731859345678i-u12345-email:an***@gmail.com-bot:google-flow",
    type: "image",
    status: "completed",
    created: "2025-11-17T12:45:12.345Z",
    updated: "2025-11-17T12:45:34.678Z",
    request: {
      email: "an***@gmail.com",
      prompt: "A serene mountain landscape at sunset with vibrant colors",
      model: "nano-banana-2-lite",
      aspectRatio: "landscape",
      count: 4,
      replyUrl: "https://your-domain.com/webhook",
      replyRef: "custom-reference-123",
    },
    response: {
      media: [
        {
          name: "…redacted…",
          image: {
            generatedImage: {
              seed: 987654,
              mediaGenerationId: "user:12345…redacted…",
              fifeUrl: "https://storage.googleapis.com/...",
              prompt:
                "A serene mountain landscape at sunset with vibrant colors",
            },
          },
        },
      ],
      captcha: {
        service: "AntiCaptcha",
        taskId: "abc123...",
        durationMs: 3200,
        attempts: [
          {
            service: "AntiCaptcha",
            taskId: "abc123...",
            durationMs: 3200,
            success: true,
          },
        ],
      },
    },
  };

  // [jobs-id] Model -> 200 OK -> "Job failed". `error` / `errorDetails` / `code`
  // populated; `errorDetails` is the documented optional string.
  const failedJob = {
    jobid: "j1731859567890i-u12345-email:an***@gmail.com-bot:google-flow",
    type: "image",
    status: "failed",
    created: "2025-11-17T13:00:12.345Z",
    updated: "2025-11-17T13:00:45.678Z",
    request: {
      email: "an***@gmail.com",
      prompt: "Generate an image",
      model: "nano-banana-2",
    },
    error: "API error: 500",
    errorDetails: "Upstream model returned an internal error",
    code: 500,
    response: {
      error: {
        code: 500,
        message: "Internal error encountered.",
        status: "INTERNAL",
      },
    },
  };

  it("parses the completed-video job record", () => {
    expect(GoogleFlowJobRecordSchema.safeParse(completedVideoJob).success).toBe(
      true
    );
  });

  it("reuses the GF-S4 video media-entry schema for response.media[]", () => {
    // AC-5: the embedded video media entry parses via the GF-S4 schema, not a
    // redefined shape.
    expect(
      GoogleFlowVideoMediaEntrySchema.safeParse(
        completedVideoJob.response.media[0]
      ).success
    ).toBe(true);
    // AC-5: response.captcha parses via the GF-S1 captcha primitive.
    expect(
      GoogleFlowCaptchaResultSchema.safeParse(
        completedVideoJob.response.captcha
      ).success
    ).toBe(true);
  });

  it("parses the completed-image job record", () => {
    expect(GoogleFlowJobRecordSchema.safeParse(completedImageJob).success).toBe(
      true
    );
  });

  it("reuses the GF-S5 image media-entry schema for response.media[]", () => {
    // AC-5: the embedded image media entry parses via the GF-S5 schema.
    expect(
      GoogleFlowImageMediaEntrySchema.safeParse(
        completedImageJob.response.media[0]
      ).success
    ).toBe(true);
  });

  it("parses a failed job record with populated error/errorDetails/code", () => {
    expect(GoogleFlowJobRecordSchema.safeParse(failedJob).success).toBe(true);
  });

  it("rejects a status outside the closed enum (queued) — AC-3", () => {
    const result = GoogleFlowJobRecordSchema.safeParse({
      ...completedVideoJob,
      status: "queued",
    });
    expect(result.success).toBe(false);
  });

  it("preserves unknown top-level and nested fields via .passthrough()", () => {
    const parsed = GoogleFlowJobRecordSchema.parse({
      ...completedVideoJob,
      internalTrace: "gf-trace-1",
      response: { ...completedVideoJob.response, futureField: true },
    }) as Record<string, unknown>;
    // Top-level unknown field survives.
    expect(parsed.internalTrace).toBe("gf-trace-1");
    // Unknown field nested inside `response` survives too.
    const response = parsed.response as Record<string, unknown>;
    expect(response.futureField).toBe(true);
  });
});

describe("GoogleFlowJobCreatedResponseSchema", () => {
  // [videos] Model -> 201 Created: a job record with pending
  // `response.operations[]` and no finished `response.media`.
  const createdVideoJob201 = {
    jobid: "j1731859234567v-u12345-email:jo***@gmail.com-bot:google-flow",
    type: "video",
    status: "created",
    created: "2025-11-17T12:34:56.789Z",
    request: {
      async: true,
      prompt:
        "A serene mountain landscape at sunset with camera slowly panning right",
      email: "jo***@gmail.com",
      model: "veo-3.1-fast",
      aspectRatio: "landscape",
      duration: 8,
      count: 2,
      seed: 123456,
      replyUrl: "https://your-domain.com/webhook",
      replyRef: "custom-reference-123",
    },
    response: {
      operations: [
        {
          operation: { name: "1450903d...redacted...9c86f0" },
          sceneId: "1450903d...redacted...9c86f0",
          status: "MEDIA_GENERATION_STATUS_PENDING",
        },
        {
          operation: { name: "f2eec9bd...redacted...e16f7a" },
          sceneId: "f2eec9bd...redacted...e16f7a",
          status: "MEDIA_GENERATION_STATUS_PENDING",
        },
      ],
      captcha: {
        service: "AntiCaptcha",
        taskId: "14af1dbb-885c-4e25-8121-7a79489dfd0e",
        durationMs: 5357,
      },
    },
  };

  it("parses the 201-created body (operations[] present, no finished media)", () => {
    const parsed = GoogleFlowJobCreatedResponseSchema.parse(createdVideoJob201);
    const response = parsed.response as Record<string, unknown>;
    // Pending operations present...
    expect((response.operations as unknown[]).length).toBe(2);
    // ...and no finished media on the created body.
    expect(response.media).toBeUndefined();
  });

  it("covers the extend/upscale 201 shape (response.captcha only)", () => {
    // [extend]/[vid-upscale] Model -> 201 Created: same job-record shape with
    // only `response.captcha` and no operations. OQ-2: one shared shape.
    const result = GoogleFlowJobCreatedResponseSchema.safeParse({
      jobid: "j1737312345678v-u12345-email:jo***@gmail.com-bot:google-flow",
      type: "video",
      status: "created",
      created: "2026-01-29T12:34:56.789Z",
      request: {
        async: true,
        prompt: "The camera slowly pans right revealing a majestic waterfall",
        mediaGenerationId: "user:12345-email:6a6f...-video:CAMaJDMx...",
      },
      response: {
        captcha: {
          service: "AntiCaptcha",
          taskId: "14af1dbb-885c-4e25-8121-7a79489dfd0e",
          durationMs: 5357,
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("preserves an unknown top-level field via .passthrough()", () => {
    const parsed = GoogleFlowJobCreatedResponseSchema.parse({
      jobid: "j1731859234567v-...",
      type: "video",
      status: "created",
      created: "2025-11-17T12:34:56.789Z",
      response: { operations: [] },
      pollAfterMs: 5000,
    }) as Record<string, unknown>;
    expect(parsed.pollAfterMs).toBe(5000);
  });
});

describe("GoogleFlowJobsStatsResponseSchema", () => {
  // [jobs] Model -> 200 OK (options= stats block). The three fixtures exercise
  // the `videos` / `images` / `combined` groups, each exposing `summary` plus an
  // optional `executing` / `history` map (populated by options=executing /
  // options=history).
  it("parses the videos-group stats (summary + executing)", () => {
    const result = GoogleFlowJobsStatsResponseSchema.safeParse({
      emails: ["jo***@gmail.com"],
      videos: {
        summary: {
          "jo***@gmail.com": {
            executing: 1,
            completed: 5,
            failed: 0,
            rateLimited: 0,
            avgResponseTime: 12000,
            score: 6,
          },
        },
        executing: {
          "j1731859234567v-...": {
            email: "jo***@gmail.com",
            timestamp: 1731859234567,
            elapsed: "01:23",
          },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("parses the images-group stats (summary + history)", () => {
    const result = GoogleFlowJobsStatsResponseSchema.safeParse({
      emails: ["an***@gmail.com"],
      images: {
        summary: {
          "an***@gmail.com": {
            executing: 0,
            completed: 3,
            failed: 1,
            rateLimited: 0,
            avgResponseTime: 8000,
            score: 13,
          },
        },
        history: {
          "j1731859345678i-...": {
            email: "an***@gmail.com",
            timestamp: 1731859345678,
            httpStatus: 200,
            responseTime: 4200,
          },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("parses the combined-group stats (summary only)", () => {
    const result = GoogleFlowJobsStatsResponseSchema.safeParse({
      emails: ["jo***@gmail.com", "an***@gmail.com"],
      combined: {
        summary: {
          "jo***@gmail.com": {
            executing: 1,
            completed: 8,
            failed: 0,
            rateLimited: 0,
            avgResponseTime: 10000,
            score: 7,
          },
          "an***@gmail.com": {
            executing: 0,
            completed: 3,
            failed: 1,
            rateLimited: 0,
            avgResponseTime: 8000,
            score: 13,
          },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("preserves an unknown top-level field via .passthrough()", () => {
    const parsed = GoogleFlowJobsStatsResponseSchema.parse({
      emails: ["jo***@gmail.com"],
      combined: { summary: {} },
      generatedAt: "2026-07-22T00:00:00Z",
    }) as Record<string, unknown>;
    expect(parsed.generatedAt).toBe("2026-07-22T00:00:00Z");
  });
});

// GF-S8 assets response family. The literals below are copied from the
// useapi.net google-flow Model -> 200 OK blocks
// (post-google-flow-assets-email / get-google-flow-assets-mediagenerationid,
// fetched 2026-07-22). The two POST /assets upload bodies are DISTINCT: the
// image upload carries a `workflow` object and always-present `width`/`height`;
// the video upload has no `workflow`, an optional `media`, and a
// `durationSeconds`. The stub-vs-docs divergence (a `media[]` array wrapper in
// the committed i2v recording) is resolved in favor of the docs — see the
// image-upload passthrough test below.

const assetsImageUploadDocBody = {
  media: {
    name: "ff9aa5cc-...redacted...",
    projectId: "5c37e988-...redacted...",
    workflowId: "69603881-...redacted...",
    workflowStepId: "CAE",
    mediaMetadata: {
      createTime: "2026-02-27T16:34:25.128454Z",
      requestData: { clientPlatform: "CLIENT_PLATFORM_WEB" },
      visibility: "PRIVATE",
    },
    image: {
      userUploadedImage: { aspectRatio: "IMAGE_ASPECT_RATIO_UNSPECIFIED" },
      dimensions: { width: 1024, height: 1024 },
    },
  },
  workflow: {
    name: "69603881-...redacted...",
    metadata: {
      displayName: "upload.webp",
      createTime: "2026-02-27T16:34:25.128454Z",
      primaryMediaId: "ff9aa5cc-...redacted...",
    },
    projectId: "5c37e988-...redacted...",
  },
  mediaGenerationId: {
    mediaGenerationId: "user:12345-email:6a6f...-image:ff9aa5cc-...redacted...",
  },
  width: 1024,
  height: 1024,
  email: "jo***@gmail.com",
};

const assetsVideoUploadDocBody = {
  media: {
    name: "07c542b0-...redacted...",
    projectId: "5c37e988-...redacted...",
    workflowId: "290a1f7a-...redacted...",
    workflowStepId: "CAE",
    mediaMetadata: {
      createTime: "2026-05-20T23:04:23.089821Z",
      requestData: { clientPlatform: "CLIENT_PLATFORM_WEB" },
      mediaStatus: { mediaGenerationStatus: "MEDIA_GENERATION_STATUS_PENDING" },
      visibility: "PRIVATE",
    },
    video: {
      dimensions: { width: 1280, height: 720, length: "11.940s" },
      videoOffset: { startOffset: "0s", endOffset: "11.940s" },
      userUploadedVideo: { encodedVideo: "" },
    },
  },
  mediaGenerationId: {
    mediaGenerationId: "user:12345-email:6a6f...-video:07c542b0-...redacted...",
  },
  durationSeconds: 11.94,
  width: 1280,
  height: 720,
  email: "jo***@gmail.com",
};

const assetsRetrieveDocBody = {
  url: "https://storage.googleapis.com/...signed-url-with-expiry...",
  mediaGenerationId: "user:12345-email:6a6f...-image:ff9aa5cc-...redacted...",
};

describe("GoogleFlowAssetsUploadImageResponseSchema", () => {
  it("parses the [assets] documented image-upload 200 body", () => {
    const result = GoogleFlowAssetsUploadImageResponseSchema.safeParse(
      assetsImageUploadDocBody
    );
    expect(result.success).toBe(true);
    const parsed = GoogleFlowAssetsUploadImageResponseSchema.parse(
      assetsImageUploadDocBody
    );
    // The reference id nests one level: mediaGenerationId.mediaGenerationId.
    expect(parsed.mediaGenerationId.mediaGenerationId).toBe(
      "user:12345-email:6a6f...-image:ff9aa5cc-...redacted..."
    );
    expect(parsed.width).toBe(1024);
    expect(parsed.height).toBe(1024);
    expect(parsed.email).toBe("jo***@gmail.com");
  });

  it("preserves an unknown extra via .passthrough(); the stub media[] wrapper is never the typed shape", () => {
    const parsed = GoogleFlowAssetsUploadImageResponseSchema.parse({
      ...assetsImageUploadDocBody,
      internalTraceId: "gf-trace-1",
    }) as Record<string, unknown>;
    expect(parsed.internalTraceId).toBe("gf-trace-1");

    // The committed i2v stub returns POST /assets as
    // `{"media":[{"mediaGenerationId":{"mediaGenerationId":"..."}}]}` — a
    // `media[]` ARRAY the docs never describe. Docs win: `media` is typed as an
    // OBJECT and the always-present top-level fields are absent, so the stub's
    // array-wrapped form is NOT the documented shape. It is never encoded as a
    // typed field; only untyped `.passthrough()` data would ever carry it.
    const i2vStubBody = {
      media: [{ mediaGenerationId: { mediaGenerationId: "test-asset-123" } }],
    };
    expect(
      GoogleFlowAssetsUploadImageResponseSchema.safeParse(i2vStubBody).success
    ).toBe(false);
  });

  it("parses an object carrying only the documented always-present fields", () => {
    const result = GoogleFlowAssetsUploadImageResponseSchema.safeParse({
      media: {},
      mediaGenerationId: { mediaGenerationId: "user:1-image:abc" },
      width: 512,
      height: 512,
      email: "jo***@gmail.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("GoogleFlowAssetsUploadVideoResponseSchema", () => {
  it("parses the [assets] documented video-upload 200 body (distinct from image)", () => {
    const result = GoogleFlowAssetsUploadVideoResponseSchema.safeParse(
      assetsVideoUploadDocBody
    );
    expect(result.success).toBe(true);
    const parsed = GoogleFlowAssetsUploadVideoResponseSchema.parse(
      assetsVideoUploadDocBody
    );
    expect(parsed.mediaGenerationId.mediaGenerationId).toBe(
      "user:12345-email:6a6f...-video:07c542b0-...redacted..."
    );
    expect(parsed.durationSeconds).toBe(11.94);
    expect(parsed.email).toBe("jo***@gmail.com");
  });

  it("preserves an unknown extra field via .passthrough()", () => {
    const parsed = GoogleFlowAssetsUploadVideoResponseSchema.parse({
      ...assetsVideoUploadDocBody,
      loadBalancerNote: "auto-selected",
    }) as Record<string, unknown>;
    expect(parsed.loadBalancerNote).toBe("auto-selected");
  });

  it("parses an object carrying only the always-present fields (media/dimensions optional)", () => {
    const result = GoogleFlowAssetsUploadVideoResponseSchema.safeParse({
      mediaGenerationId: { mediaGenerationId: "user:1-video:abc" },
      email: "jo***@gmail.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("GoogleFlowAssetsRetrieveResponseSchema", () => {
  it("parses the [assets-dl] documented retrieve 200 body", () => {
    const result = GoogleFlowAssetsRetrieveResponseSchema.safeParse(
      assetsRetrieveDocBody
    );
    expect(result.success).toBe(true);
    const parsed = GoogleFlowAssetsRetrieveResponseSchema.parse(
      assetsRetrieveDocBody
    );
    expect(parsed.url).toBe(
      "https://storage.googleapis.com/...signed-url-with-expiry..."
    );
    // Here `mediaGenerationId` is a plain string echo of the path parameter,
    // not the nested `{ mediaGenerationId }` object of the upload responses.
    expect(parsed.mediaGenerationId).toBe(
      "user:12345-email:6a6f...-image:ff9aa5cc-...redacted..."
    );
  });

  it("preserves an unknown extra field via .passthrough()", () => {
    const parsed = GoogleFlowAssetsRetrieveResponseSchema.parse({
      ...assetsRetrieveDocBody,
      expiresInSeconds: 21600,
    }) as Record<string, unknown>;
    expect(parsed.expiresInSeconds).toBe(21600);
  });

  it("parses an object carrying only the documented always-present fields", () => {
    const result = GoogleFlowAssetsRetrieveResponseSchema.safeParse({
      url: "https://storage.googleapis.com/signed",
      mediaGenerationId: "user:1-image:abc",
    });
    expect(result.success).toBe(true);
  });
});

// -- Characters response family (GF-S9) --------------------------------------
// Doc-example literals transcribed from the useapi.net characters Model blocks
// (post-google-flow-characters / get-google-flow-characters /
// get-google-flow-characters-ref, fetched 2026-07-22, curl + Chrome UA).

const charactersCreateDocBody = {
  entityId: "f470f1b5-...",
  character:
    "user:12345-email:6a6f...-character:f470f1b5-...-imgs:2-voice:d990a2f9-...",
  displayName: "Carol",
  personalityNotes: "A curious traveler with a sharp wit",
  imageReferences: [{ mediaId: "abc123..." }, { mediaId: "def456..." }],
  voice: "user:12345-email:6a6f...-voice:d990a2f9-...-mid:d55b6d59-...",
};

// GET /characters entries: a live user voice (no audioUrl on list), a system
// preset, an orphan (deleted) voice, and a fourth entry with `voice` omitted —
// covering all four documented voice states.
const charactersListDocBody = {
  characters: [
    {
      character:
        "user:12345-email:6a6f...-character:f470f1b5-...-imgs:2-voice:d990a2f9-...",
      entityId: "f470f1b5-...",
      displayName: "Carol",
      personalityNotes: "A curious traveler with a sharp wit",
      imageReferences: [{ workflowId: "wf-a..." }, { workflowId: "wf-b..." }],
      voice: {
        source: "user",
        voice: "user:12345-email:6a6f...-voice:d990a2f9-...-mid:d55b6d59-...",
        workflowId: "d990a2f9-...",
        mediaId: "d55b6d59-...",
        displayName: "Cheerful Narrator",
        baseVoice: "Achernar",
        dialog: "Hello, this is a test voice.",
        voicePerformance: "Cheerful, energetic delivery",
      },
      thumbnailMediaId: "thumb-a...",
      createTime: "2026-06-05T18:14:07.706641Z",
      updateTime: "2026-06-05T18:14:16.004078Z",
    },
    {
      character:
        "user:12345-email:6a6f...-character:60831b31-...-imgs:1-voice:umbriel",
      entityId: "60831b31-...",
      displayName: "Frank",
      imageReferences: [{ workflowId: "wf-d..." }],
      voice: { source: "system", voice: "Umbriel", displayName: "Umbriel" },
      thumbnailMediaId: "thumb-d...",
      createTime: "2026-06-05T22:42:18.901333Z",
      updateTime: "2026-06-05T22:42:24.882179Z",
    },
    {
      character: "user:12345-email:6a6f...-character:8a4b0541-...-imgs:1",
      entityId: "8a4b0541-...",
      displayName: "Eve",
      imageReferences: [{ workflowId: "wf-c..." }],
      voice: { workflowId: "ccd7615f-...", deleted: true },
      thumbnailMediaId: "thumb-c...",
      createTime: "2026-06-05T18:15:37.734955Z",
      updateTime: "2026-06-05T18:15:41.167097Z",
    },
    {
      character: "user:12345-email:6a6f...-character:11112222-...-imgs:1",
      entityId: "11112222-...",
      displayName: "Grace",
      imageReferences: [{ workflowId: "wf-e..." }],
    },
  ],
};

// GET /characters/:ref: richer imageReferences items (workflowId + mediaId +
// previewUrl) and a live voice carrying audioUrl plus thumbnailUrl.
const charactersRetrieveDocBody = {
  character:
    "user:12345-email:6a6f...-character:f470f1b5-...-imgs:2-voice:d990a2f9-...",
  entityId: "f470f1b5-...",
  displayName: "Carol",
  personalityNotes: "A curious traveler with a sharp wit",
  imageReferences: [
    {
      workflowId: "wf-a...",
      mediaId: "media-a...",
      previewUrl:
        "https://flow-content.google/image/media-a...?Expires=...&Signature=...",
    },
    {
      workflowId: "wf-b...",
      mediaId: "media-b...",
      previewUrl:
        "https://flow-content.google/image/media-b...?Expires=...&Signature=...",
    },
  ],
  voice: {
    voice: "user:12345-email:6a6f...-voice:d990a2f9-...-mid:d55b6d59-...",
    workflowId: "d990a2f9-...",
    mediaId: "d55b6d59-...",
    displayName: "Cheerful Narrator",
    baseVoice: "Achernar",
    dialog: "Hello, this is a test voice.",
    voicePerformance: "Cheerful, energetic delivery",
    audioUrl:
      "https://flow-content.google/audio/d55b6d59-...?Expires=...&Signature=...",
  },
  thumbnailMediaId: "thumb-a...",
  thumbnailUrl:
    "https://flow-content.google/image/thumb-a...?Expires=...&Signature=...",
  createTime: "2026-06-05T18:14:07.706641Z",
  updateTime: "2026-06-05T18:14:16.004078Z",
};

describe("GoogleFlowCharactersCreateResponseSchema", () => {
  it("parses the [characters] documented create 200 body (voice as string echo)", () => {
    const result = GoogleFlowCharactersCreateResponseSchema.safeParse(
      charactersCreateDocBody
    );
    expect(result.success).toBe(true);
    const parsed = GoogleFlowCharactersCreateResponseSchema.parse(
      charactersCreateDocBody
    );
    expect(parsed.entityId).toBe("f470f1b5-...");
    expect(parsed.imageReferences[0].mediaId).toBe("abc123...");
    // `voice` is a plain string echo here, NOT the voice union (OQ-4).
    expect(parsed.voice).toBe(
      "user:12345-email:6a6f...-voice:d990a2f9-...-mid:d55b6d59-..."
    );
  });

  it("parses a create body with `voice` absent", () => {
    const result = GoogleFlowCharactersCreateResponseSchema.safeParse({
      entityId: "60831b31-...",
      character: "user:12345-email:6a6f...-character:60831b31-...-imgs:1",
      displayName: "Frank",
      imageReferences: [{ mediaId: "ghi789..." }],
    });
    expect(result.success).toBe(true);
  });

  it("preserves an unknown extra field via .passthrough()", () => {
    const parsed = GoogleFlowCharactersCreateResponseSchema.parse({
      ...charactersCreateDocBody,
      internalTraceId: "gf-char-1",
    }) as Record<string, unknown>;
    expect(parsed.internalTraceId).toBe("gf-char-1");
  });
});

describe("GoogleFlowCharactersListResponseSchema", () => {
  it("parses the [characters-ls] documented list 200 body (all voice states)", () => {
    const result = GoogleFlowCharactersListResponseSchema.safeParse(
      charactersListDocBody
    );
    expect(result.success).toBe(true);
    const parsed = GoogleFlowCharactersListResponseSchema.parse(
      charactersListDocBody
    );
    expect(parsed.characters).toHaveLength(4);

    // Entry 0: live user voice (object union), no audioUrl on the list surface.
    const live = parsed.characters[0].voice as unknown as Record<
      string,
      unknown
    >;
    expect(live.source).toBe("user");
    expect(live.mediaId).toBe("d55b6d59-...");
    expect(live.audioUrl).toBeUndefined();

    // Entry 1: system preset voice.
    const preset = parsed.characters[1].voice as unknown as Record<
      string,
      unknown
    >;
    expect(preset.source).toBe("system");
    expect(preset.voice).toBe("Umbriel");

    // Entry 2: orphan (deleted) voice — parses without a `source` field.
    const orphan = parsed.characters[2].voice as unknown as Record<
      string,
      unknown
    >;
    expect(orphan.deleted).toBe(true);
    expect(orphan.workflowId).toBe("ccd7615f-...");

    // Entry 3: voice omitted entirely.
    expect(parsed.characters[3].voice).toBeUndefined();
  });

  it("preserves unknown extras via .passthrough() at entry and item level", () => {
    const parsed = GoogleFlowCharactersListResponseSchema.parse({
      characters: [
        {
          character: "user:1-character:abc",
          entityId: "abc",
          displayName: "Hank",
          imageReferences: [{ workflowId: "wf-x", extraItemKey: "keep-me" }],
          internalEntryKey: "keep-me-too",
        },
      ],
    }) as unknown as { characters: Record<string, unknown>[] };
    const entry = parsed.characters[0];
    expect(entry.internalEntryKey).toBe("keep-me-too");
    const items = entry.imageReferences as Record<string, unknown>[];
    expect(items[0].extraItemKey).toBe("keep-me");
  });
});

describe("GoogleFlowCharactersRetrieveResponseSchema", () => {
  it("parses the [characters-get] documented retrieve 200 body (richer items + audioUrl)", () => {
    const result = GoogleFlowCharactersRetrieveResponseSchema.safeParse(
      charactersRetrieveDocBody
    );
    expect(result.success).toBe(true);
    const parsed = GoogleFlowCharactersRetrieveResponseSchema.parse(
      charactersRetrieveDocBody
    );
    // Richer imageReferences items carry workflowId + mediaId + previewUrl.
    expect(parsed.imageReferences[0].mediaId).toBe("media-a...");
    expect(parsed.imageReferences[0].previewUrl).toBe(
      "https://flow-content.google/image/media-a...?Expires=...&Signature=..."
    );
    // The live voice on retrieve additionally carries audioUrl.
    const voice = parsed.voice as unknown as Record<string, unknown>;
    expect(voice.audioUrl).toBe(
      "https://flow-content.google/audio/d55b6d59-...?Expires=...&Signature=..."
    );
    expect(parsed.thumbnailUrl).toBe(
      "https://flow-content.google/image/thumb-a...?Expires=...&Signature=..."
    );
  });

  it("preserves an unknown extra field via .passthrough()", () => {
    const parsed = GoogleFlowCharactersRetrieveResponseSchema.parse({
      ...charactersRetrieveDocBody,
      internalTraceId: "gf-char-get-1",
    }) as Record<string, unknown>;
    expect(parsed.internalTraceId).toBe("gf-char-get-1");
  });
});

describe("GoogleFlowCharacterVoiceSchema", () => {
  it("parses the live user voice state (list variant, no audioUrl)", () => {
    const result = GoogleFlowCharacterVoiceSchema.safeParse({
      source: "user",
      voice: "user:12345-email:6a6f...-voice:d990a2f9-...-mid:d55b6d59-...",
      workflowId: "d990a2f9-...",
      mediaId: "d55b6d59-...",
      displayName: "Cheerful Narrator",
      baseVoice: "Achernar",
      dialog: "Hello, this is a test voice.",
      voicePerformance: "Cheerful, energetic delivery",
    });
    expect(result.success).toBe(true);
  });

  it("parses the live user voice state with audioUrl (retrieve variant)", () => {
    const result = GoogleFlowCharacterVoiceSchema.safeParse({
      source: "user",
      voice: "user:12345-email:6a6f...-voice:d990a2f9-...",
      workflowId: "d990a2f9-...",
      mediaId: "d55b6d59-...",
      audioUrl:
        "https://flow-content.google/audio/d55b6d59-...?Expires=...&Signature=...",
    });
    expect(result.success).toBe(true);
  });

  it("parses the system preset voice state", () => {
    const result = GoogleFlowCharacterVoiceSchema.safeParse({
      source: "system",
      voice: "Umbriel",
      displayName: "Umbriel",
    });
    expect(result.success).toBe(true);
  });

  it("parses the orphan (deleted) voice state without a source field", () => {
    const result = GoogleFlowCharacterVoiceSchema.safeParse({
      workflowId: "ccd7615f-...",
      deleted: true,
    });
    expect(result.success).toBe(true);
  });

  it("preserves an unknown extra key on a voice member via .passthrough()", () => {
    const parsed = GoogleFlowCharacterVoiceSchema.parse({
      source: "system",
      voice: "Umbriel",
      displayName: "Umbriel",
      internalVoiceKey: "keep-me",
    }) as Record<string, unknown>;
    expect(parsed.internalVoiceKey).toBe("keep-me");
  });
});

// -- Voices + accounts/captcha response family (GF-S10) ----------------------
// Doc-example literals transcribed from the useapi.net Model blocks (fetched
// 2026-07-24, curl + Chrome UA): post-google-flow-voices / get-google-flow-
// voices / get-google-flow-voices-ref / get-google-flow-accounts /
// get+post-google-flow-accounts-captcha-providers /
// get-google-flow-accounts-captcha-stats.

// POST /voices 200 OK: the created user voice (audioUrl present).
const voicesCreateDocBody = {
  voice: "user:12345-email:6a6f...-voice:d990a2f9-...-mid:d55b6d59-...",
  source: "user",
  workflowId: "d990a2f9-...",
  mediaId: "d55b6d59-...",
  displayName: "Cheerful Narrator",
  baseVoice: "Achernar",
  dialog: "Hello, this is a test voice.",
  voicePerformance: "Cheerful, energetic delivery",
  audioUrl:
    "https://flow-content.google/audio/d55b6d59-...?Expires=...&KeyName=labs-flow-prod-cdn-key&Signature=...",
};

// GET /voices 200 OK: a system preset (static sampleUrl) and a user voice (no
// audioUrl on the list surface).
const voicesListDocBody = {
  voices: [
    {
      voice: "Achernar",
      source: "system",
      displayName: "Achernar",
      sampleUrl:
        "https://www.gstatic.com/aitestkitchen/voices/samples/Achernar.wav",
    },
    {
      voice: "user:12345-email:6a6f...-voice:d990a2f9-...-mid:d55b6d59-...",
      source: "user",
      displayName: "Cheerful Narrator",
      workflowId: "d990a2f9-...",
      mediaId: "d55b6d59-...",
      baseVoice: "Achernar",
      dialog: "Hello, this is a test voice.",
      voicePerformance: "Cheerful, energetic delivery",
      createTime: "2026-06-05T18:25:32.847291Z",
    },
  ],
};

// GET /voices/:ref 200 OK: the two documented single-voice variants.
const voicesRetrieveSystemBody = {
  voice: "Achernar",
  source: "system",
  displayName: "Achernar",
  sampleUrl:
    "https://www.gstatic.com/aitestkitchen/voices/samples/Achernar.wav",
};
const voicesRetrieveUserBody = {
  voice: "user:12345-email:6a6f...-voice:d990a2f9-...-mid:d55b6d59-...",
  source: "user",
  displayName: "Cheerful Narrator",
  workflowId: "d990a2f9-...",
  mediaId: "d55b6d59-...",
  baseVoice: "Achernar",
  dialog: "Hello, this is a test voice.",
  voicePerformance: "Cheerful, energetic delivery",
  createTime: "2026-06-05T18:25:32.847291Z",
  audioUrl:
    "https://flow-content.google/audio/d55b6d59-...?Expires=...&Signature=...",
};

describe("GoogleFlowVoiceSchema", () => {
  it("parses the system-preset variant (sampleUrl, no audio/media) — AC5", () => {
    expect(
      GoogleFlowVoiceSchema.safeParse(voicesRetrieveSystemBody).success
    ).toBe(true);
  });

  it("parses the user-created variant (audioUrl + workflow/media) — AC5", () => {
    expect(
      GoogleFlowVoiceSchema.safeParse(voicesRetrieveUserBody).success
    ).toBe(true);
  });

  it("requires voice/source/displayName (a body missing voice fails)", () => {
    expect(
      GoogleFlowVoiceSchema.safeParse({ source: "system", displayName: "X" })
        .success
    ).toBe(false);
  });

  it("tolerates a novel source string (open response vocabulary, AC9)", () => {
    expect(
      GoogleFlowVoiceSchema.safeParse({
        voice: "Achernar",
        source: "future-source",
        displayName: "Achernar",
      }).success
    ).toBe(true);
  });

  it("preserves an unknown extra field via .passthrough()", () => {
    const parsed = GoogleFlowVoiceSchema.parse({
      ...voicesRetrieveSystemBody,
      internalVoiceKey: "keep-me",
    }) as Record<string, unknown>;
    expect(parsed.internalVoiceKey).toBe("keep-me");
  });
});

describe("GoogleFlowVoicesCreateResponseSchema", () => {
  it("parses the [voices] documented create 200 body (user voice)", () => {
    const result =
      GoogleFlowVoicesCreateResponseSchema.safeParse(voicesCreateDocBody);
    expect(result.success).toBe(true);
    const parsed =
      GoogleFlowVoicesCreateResponseSchema.parse(voicesCreateDocBody);
    expect(parsed.voice).toBe(
      "user:12345-email:6a6f...-voice:d990a2f9-...-mid:d55b6d59-..."
    );
    expect(parsed.baseVoice).toBe("Achernar");
  });

  it("parses a create body with audioUrl absent (transient resolution)", () => {
    expect(
      GoogleFlowVoicesCreateResponseSchema.safeParse({
        voice: "user:1-voice:abc",
        source: "user",
        workflowId: "wf-abc",
        mediaId: "mid-abc",
        displayName: "Narrator",
        baseVoice: "Achernar",
        dialog: "Hi.",
        voicePerformance: "Calm",
      }).success
    ).toBe(true);
  });

  it("preserves an unknown extra field via .passthrough()", () => {
    const parsed = GoogleFlowVoicesCreateResponseSchema.parse({
      ...voicesCreateDocBody,
      internalTraceId: "gf-voice-1",
    }) as Record<string, unknown>;
    expect(parsed.internalTraceId).toBe("gf-voice-1");
  });
});

describe("GoogleFlowVoicesListResponseSchema", () => {
  it("parses the [voices-ls] documented list 200 body (system + user entries)", () => {
    const result =
      GoogleFlowVoicesListResponseSchema.safeParse(voicesListDocBody);
    expect(result.success).toBe(true);
    const parsed = GoogleFlowVoicesListResponseSchema.parse(voicesListDocBody);
    expect(parsed.voices).toHaveLength(2);
    // The system entry carries sampleUrl; the user list entry has no audioUrl.
    const system = parsed.voices[0] as Record<string, unknown>;
    expect(system.sampleUrl).toBe(
      "https://www.gstatic.com/aitestkitchen/voices/samples/Achernar.wav"
    );
    const user = parsed.voices[1] as Record<string, unknown>;
    expect(user.mediaId).toBe("d55b6d59-...");
    expect(user.audioUrl).toBeUndefined();
  });

  it("parses an empty voices array (no voices created yet)", () => {
    expect(
      GoogleFlowVoicesListResponseSchema.safeParse({ voices: [] }).success
    ).toBe(true);
  });

  it("preserves unknown extras via .passthrough() at envelope and entry level", () => {
    const parsed = GoogleFlowVoicesListResponseSchema.parse({
      voices: [
        {
          voice: "Achernar",
          source: "system",
          displayName: "Achernar",
          extraEntryKey: "keep-me",
        },
      ],
      nextPageToken: "tok-1",
    }) as unknown as {
      voices: Record<string, unknown>[];
      nextPageToken: unknown;
    };
    expect(parsed.nextPageToken).toBe("tok-1");
    expect(parsed.voices[0].extraEntryKey).toBe("keep-me");
  });
});

describe("GoogleFlowVoicesRetrieveResponseSchema", () => {
  it("parses the [voices-get] system voice 200 body", () => {
    expect(
      GoogleFlowVoicesRetrieveResponseSchema.safeParse(voicesRetrieveSystemBody)
        .success
    ).toBe(true);
  });

  it("parses the [voices-get] user voice 200 body (audioUrl present)", () => {
    const parsed = GoogleFlowVoicesRetrieveResponseSchema.parse(
      voicesRetrieveUserBody
    ) as Record<string, unknown>;
    expect(parsed.audioUrl).toBe(
      "https://flow-content.google/audio/d55b6d59-...?Expires=...&Signature=..."
    );
  });

  it("reuses the shared GoogleFlowVoiceSchema object", () => {
    expect(GoogleFlowVoicesRetrieveResponseSchema).toBe(GoogleFlowVoiceSchema);
  });
});

// GET /accounts 200 OK: the documented map keyed by account email.
const accountsListDocBody = {
  "a***@gmail.com": {
    created: "2025-11-09T22:02:04.802Z",
    health: "OK",
    nextRefresh: { scheduledFor: "2025-12-01T11:46:01.000Z" },
    project: {
      projectId: "a7e08e13-a6ea-4945-9841-cb4147e4f024",
      projectTitle: "Nov 11 - 02:56",
    },
    sessionData: { expires: "2025-12-01T12:46:01.000Z" },
  },
  "b***@gmail.com": {
    created: "2025-11-10T02:56:58.864Z",
    health: "OK",
    nextRefresh: { scheduledFor: "2025-12-01T09:13:16.000Z" },
    project: {
      projectId: "47050a10-06f4-4469-8ab0-6d294c703508",
      projectTitle: "Nov 11 - 02:56",
    },
    sessionData: { expires: "2025-12-01T10:13:16.000Z" },
  },
};

describe("GoogleFlowAccountsListResponseSchema", () => {
  it("parses the [accounts] documented list 200 body (map keyed by email)", () => {
    const result =
      GoogleFlowAccountsListResponseSchema.safeParse(accountsListDocBody);
    expect(result.success).toBe(true);
    const parsed =
      GoogleFlowAccountsListResponseSchema.parse(accountsListDocBody);
    const entryA = parsed["a***@gmail.com"] as Record<string, unknown>;
    expect(entryA.health).toBe("OK");
    const project = entryA.project as Record<string, unknown>;
    expect(project.projectId).toBe("a7e08e13-a6ea-4945-9841-cb4147e4f024");
  });

  it("parses a Record<email,{...}> with only `health` present, five fields absent — AC6", () => {
    const result = GoogleFlowAccountsListResponseSchema.safeParse({
      "john@gmail.com": { health: "OK" },
    });
    expect(result.success).toBe(true);
  });

  it("parses an empty object (no accounts configured)", () => {
    expect(GoogleFlowAccountsListResponseSchema.safeParse({}).success).toBe(
      true
    );
  });

  it("requires health on each account entry (an entry missing it fails)", () => {
    expect(
      GoogleFlowAccountsListResponseSchema.safeParse({
        "john@gmail.com": { created: "2025-11-09T22:02:04.802Z" },
      }).success
    ).toBe(false);
  });

  it("preserves an unknown extra field via .passthrough()", () => {
    const parsed = GoogleFlowAccountsListResponseSchema.parse({
      "john@gmail.com": { health: "OK", futureField: true },
    });
    const entry = parsed["john@gmail.com"] as Record<string, unknown>;
    expect(entry.futureField).toBe(true);
  });
});

describe("GoogleFlowCaptchaProvidersResponseSchema", () => {
  it("parses the [captcha-prov] body with providers configured (masked keys)", () => {
    expect(
      GoogleFlowCaptchaProvidersResponseSchema.safeParse({
        CapSolver: "abc12…",
        AntiCaptcha: "def34…",
      }).success
    ).toBe(true);
  });

  it("parses the no-providers body (freeCaptchaCredits only)", () => {
    expect(
      GoogleFlowCaptchaProvidersResponseSchema.safeParse({
        freeCaptchaCredits: 300,
      }).success
    ).toBe(true);
  });

  it("parses an empty body (all fields optional)", () => {
    expect(GoogleFlowCaptchaProvidersResponseSchema.safeParse({}).success).toBe(
      true
    );
  });

  it("preserves an unlisted provider key via .passthrough()", () => {
    const parsed = GoogleFlowCaptchaProvidersResponseSchema.parse({
      CapSolver: "abc12…",
      FutureCaptcha: "zzz99…",
    }) as Record<string, unknown>;
    expect(parsed.FutureCaptcha).toBe("zzz99…");
  });
});

// GET /accounts/captcha-stats 200 OK: the documented example body.
const captchaStatsDocBody = {
  date: "2026-02-03",
  total: 42,
  summary: {
    from: "2026-02-03T00:05:23.000Z",
    to: "2026-02-03T23:58:47.000Z",
    time_span: "23 hours 53 minutes",
    sample_size_by_provider: { CapSolver: 24, AntiCaptcha: 10, EzCaptcha: 8 },
    success_rate_by_provider: {
      CapSolver: 73.2,
      AntiCaptcha: 80.5,
      EzCaptcha: 68.4,
    },
    sample_size_by_tier: { PAYGATE_TIER_TWO: 30, PAYGATE_TIER_ONE: 12 },
    success_rate_by_tier: { PAYGATE_TIER_TWO: 81.0, PAYGATE_TIER_ONE: 66.7 },
    sample_size_by_sku: { WS_ULTRA: 22, G1_TIER2: 8, G1_TIER1: 12 },
    success_rate_by_sku: { WS_ULTRA: 84.1, G1_TIER2: 75.0, G1_TIER1: 66.7 },
    by_status_code_images: {
      "200": 69.1,
      "403": 8.5,
      "429:PUBLIC_ERROR_UNUSUAL_ACTIVITY_TOO_MUCH_TRAFFIC": 12.3,
      "429:PUBLIC_ERROR_PER_MODEL_DAILY_QUOTA_REACHED": 4.1,
      "429:PUBLIC_ERROR_USER_REQUESTS_THROTTLED": 1.0,
      "429:PUBLIC_ERROR_USER_QUOTA_REACHED": 1.4,
      "503": 3.6,
    },
    by_status_code_videos: {
      "200": 67.5,
      "403": 17.6,
      "429:PUBLIC_ERROR_UNUSUAL_ACTIVITY_TOO_MUCH_TRAFFIC": 8.7,
      "429:PUBLIC_ERROR_USER_REQUESTS_THROTTLED": 1.0,
      "429:PUBLIC_ERROR_USER_QUOTA_REACHED": 1.4,
      "503": 3.8,
    },
    avg_captcha_ms: 8500,
    avg_api_ms: 1200,
    avg_attempt: 1.2,
    lookup: {
      tiers: { PAYGATE_TIER_TWO: "Ultra $199", PAYGATE_TIER_ONE: "Pro" },
      skus: {
        WS_ULTRA: "Workspace Ultra",
        G1_TIER2: "Ultra $199",
        G1_TIER1: "Pro",
      },
    },
  },
  data: [
    {
      timestamp: "2026-02-03T10:30:00.000Z",
      jobId: "20260203103000123-user:123-bot:google-flow",
      provider: "AntiCaptcha",
      taskId: "abc123-task-id",
      route: "post-videos",
      statusText: "OK",
      pageAction: "VIDEO_GENERATION",
      error: "",
      reason: "",
      tier: "PAYGATE_TIER_TWO",
      sku: "WS_ULTRA",
      statusCode: 200,
      captchaDurationMs: 8500,
      apiDurationMs: 1200,
      attemptNumber: 1,
    },
  ],
};

describe("GoogleFlowCaptchaStatsResponseSchema", () => {
  it("parses the [captcha-stats] documented 200 body (summary + data row)", () => {
    const result =
      GoogleFlowCaptchaStatsResponseSchema.safeParse(captchaStatsDocBody);
    expect(result.success).toBe(true);
    const parsed =
      GoogleFlowCaptchaStatsResponseSchema.parse(captchaStatsDocBody);
    expect(parsed.total).toBe(42);
    expect(parsed.data).toHaveLength(1);
    const summary = parsed.summary as Record<string, unknown>;
    const rateByProvider = summary.success_rate_by_provider as Record<
      string,
      number
    >;
    expect(rateByProvider.CapSolver).toBe(73.2);
  });

  it("requires total (a summary-less body without it fails)", () => {
    expect(
      GoogleFlowCaptchaStatsResponseSchema.safeParse({ data: [] }).success
    ).toBe(false);
  });

  it("parses the anonymized/no-data shape (total + empty data, no summary)", () => {
    expect(
      GoogleFlowCaptchaStatsResponseSchema.safeParse({ total: 0, data: [] })
        .success
    ).toBe(true);
  });

  it("tolerates a novel tier/sku string in a data row (open vocabulary, AC9)", () => {
    const result = GoogleFlowCaptchaStatsResponseSchema.safeParse({
      total: 1,
      data: [
        {
          timestamp: "2026-02-03T10:30:00.000Z",
          provider: "AntiCaptcha",
          tier: "PAYGATE_TIER_FUTURE",
          sku: "G1_FUTURE",
          statusCode: 200,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("preserves an unknown top-level field via .passthrough()", () => {
    const parsed = GoogleFlowCaptchaStatsResponseSchema.parse({
      ...captchaStatsDocBody,
      generatedAt: "2026-07-24T00:00:00Z",
    }) as Record<string, unknown>;
    expect(parsed.generatedAt).toBe("2026-07-24T00:00:00Z");
  });
});
