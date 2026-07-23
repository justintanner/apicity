import { describe, it, expect } from "vitest";

import {
  GoogleFlowApiErrorSchema,
  GoogleFlowCaptchaResultSchema,
  GoogleFlowMediaStatusSchema,
  GoogleFlowMediaVisibilitySchema,
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
