import { z } from "zod";

export const GoogleFlowOptionsSchema = z.object({
  apiKey: z.string(),
  baseURL: z.string().url().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

// captchaToken/captchaRetry/captchaOrder are mutually exclusive upstream:
// token is a user-provided reCAPTCHA v3 Enterprise token (min 20 chars,
// single attempt), retry is the number of provider attempts (1-10, default
// 5), order is an explicit comma-separated provider sequence (max 10).
const GoogleFlowCaptchaFieldsSchema = {
  captchaToken: z.string().min(20).optional(),
  captchaRetry: z.number().int().min(1).max(10).optional(),
  captchaOrder: z.string().optional(),
};

export const GoogleFlowNoRequestSchema = z.object({}).passthrough();

// Required: email is the addressed resource, not an account hint. This schema
// backs GET/DELETE /accounts/{email}, where email is the URL path segment, and
// GET /characters, where the docs mark the email query parameter "required."
// There is no single-account fallback on any of them — omitting email cannot
// name a resource, so it is required rather than optional.
export const GoogleFlowEmailRequestSchema = z
  .object({
    email: z.string().min(1),
  })
  .passthrough();

export const GoogleFlowMediaGenerationIdRequestSchema = z
  .object({
    mediaGenerationId: z.string().min(1),
  })
  .passthrough();

export const GoogleFlowRefRequestSchema = z
  .object({
    ref: z.string().min(1),
  })
  .passthrough();

export const GoogleFlowJobIdRequestSchema = z
  .object({
    jobId: z.string().min(1),
  })
  .passthrough();

export const GoogleFlowAccountsCreateRequestSchema = z
  .object({
    cookies: z.string().min(1),
    // dryRun: true validates the cookies without adding the account (the
    // setup page's verify flow).
    dryRun: z.boolean().optional(),
  })
  .passthrough();

export const GoogleFlowCaptchaProvidersRequestSchema = z
  .object({
    CapSolver: z.string().optional(),
    AntiCaptcha: z.string().optional(),
    YesCaptcha: z.string().optional(),
    SolveCaptcha: z.string().optional(),
    "2Captcha": z.string().optional(),
    EzCaptcha: z.string().optional(),
    CapMonster: z.string().optional(),
  })
  .passthrough();

export const GoogleFlowCaptchaStatsRequestSchema = z
  .object({
    date: z.string().optional(),
    limit: z.number().int().positive().max(50000).optional(),
    provider: z
      .enum([
        "CapSolver",
        "AntiCaptcha",
        "YesCaptcha",
        "CapMonster",
        "SolveCaptcha",
        "2Captcha",
        "EzCaptcha",
        "UserProvided",
      ])
      .optional(),
    anonymized: z.boolean().optional(),
  })
  .passthrough();

export const GoogleFlowAssetUploadRequestSchema = z
  .object({
    body: z.custom<BodyInit>(),
    contentType: z.string().min(1),
    // Optional: the docs define both POST /assets and POST /assets/{email}.
    // With one account configured the API uses it automatically; with several,
    // omitting email triggers load balancing. The factory branches on this to
    // pick the path, so an absent email is a supported call, not an error.
    email: z.string().optional(),
  })
  .passthrough();

export const GoogleFlowCharactersCreateRequestSchema = z
  .object({
    displayName: z.string().min(1).max(200),
    imageReference_1: z.string().min(1),
    imageReference_2: z.string().optional(),
    personalityNotes: z.string().max(2000).optional(),
    voice: z.string().optional(),
  })
  .passthrough();

export const GoogleFlowCharactersListRequestSchema =
  GoogleFlowEmailRequestSchema;

// The 30 system voice presets accepted by POST /voices (case-sensitive).
export const GoogleFlowVoicePresetSchema = z.enum([
  "Achernar",
  "Achird",
  "Algenib",
  "Algieba",
  "Alnilam",
  "Aoede",
  "Autonoe",
  "Callirrhoe",
  "Charon",
  "Despina",
  "Enceladus",
  "Erinome",
  "Fenrir",
  "Gacrux",
  "Iapetus",
  "Kore",
  "Laomedeia",
  "Leda",
  "Orus",
  "Puck",
  "Pulcherrima",
  "Rasalgethi",
  "Sadachbia",
  "Sadaltager",
  "Schedar",
  "Sulafat",
  "Umbriel",
  "Vindemiatrix",
  "Zephyr",
  "Zubenelgenubi",
]);

export const GoogleFlowVoicesCreateRequestSchema = z
  .object({
    // Required: the docs state "email is required, the Google Flow account to
    // create the voice on." A custom voice is persisted on one specific
    // account, so unlike the generation endpoints there is nothing to load
    // balance across and no default account to fall back to.
    email: z.string().min(1),
    voice: GoogleFlowVoicePresetSchema,
    displayName: z.string().min(1).max(200),
    dialog: z.string().min(1).max(120),
    voicePerformance: z.string().min(1).max(120),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowVoicesListRequestSchema = z
  .object({
    // Required: the docs mark the email query parameter "required. Account
    // whose voices to list," and document a 400 "Parameter email is required"
    // when it is missing. Listing is scoped to one account's voices, so there
    // is no single-account fallback here even though POST /images and
    // POST /videos have one. AC-006 originally asked for this call to work
    // without `email`; the criterion was corrected on 2026-07-20 to match the
    // documented upstream contract.
    email: z.string().min(1),
    source: z.enum(["system", "user"]).optional(),
  })
  .passthrough();

// Upstream keeps accepting deprecated Veo aliases and ships new Veo point
// releases before this package's enum catches up, so the enums below are
// unioned with an alias escape hatch. A bare `.or(z.string())` used to be
// that hatch, but it accepted anything — `model: "veo-typo"` validated
// cleanly. The hatch is narrowed to versioned Veo identifiers:
// `veo-<version>` (dotted numeric) plus optional lowercase variant
// segments, e.g. veo-2, veo-3.0-fast, veo-3.1-lite-low-priority. Anything
// that is not a versioned Veo id — including typos and models from other
// families — must be added to the enum explicitly.
const GoogleFlowVeoModelAliasSchema = z
  .string()
  .regex(
    /^veo-\d+(?:\.\d+)*(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a versioned Veo alias (e.g. veo-3.1-fast)"
  );

export const GoogleFlowImagesRequestSchema = z
  .object({
    prompt: z.string().min(1),
    // Optional: email selects an account rather than naming a resource. One
    // account configured means it is used automatically; several means the
    // API load balances on image-generation stats; supplying reference_* also
    // pins the account the references were uploaded to.
    email: z.string().optional(),
    // Docs enumerate nano-banana-2-lite | nano-banana-2 | nano-banana-pro,
    // but deprecated aliases (nano-banana, imagen-4) are still accepted, so
    // the enum is unioned with string to stay resilient to upstream changes.
    model: z
      .enum(["nano-banana-2-lite", "nano-banana-2", "nano-banana-pro"])
      .or(z.string())
      .optional(),
    // Legacy aliases landscape (16:9) and portrait (9:16) are still accepted.
    aspectRatio: z
      .enum([
        "16:9",
        "4:3",
        "1:1",
        "3:4",
        "9:16",
        "auto",
        "landscape",
        "portrait",
      ])
      .optional(),
    count: z.number().int().min(1).max(4).optional(),
    seed: z.number().int().optional(),
    reference_1: z.string().optional(),
    reference_2: z.string().optional(),
    reference_3: z.string().optional(),
    reference_4: z.string().optional(),
    reference_5: z.string().optional(),
    reference_6: z.string().optional(),
    reference_7: z.string().optional(),
    reference_8: z.string().optional(),
    reference_9: z.string().optional(),
    reference_10: z.string().optional(),
    character_1: z.string().optional(),
    character_2: z.string().optional(),
    character_3: z.string().optional(),
    character_4: z.string().optional(),
    character_5: z.string().optional(),
    character_6: z.string().optional(),
    character_7: z.string().optional(),
    replyUrl: z.string().url().optional(),
    replyRef: z.string().optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowImagesUpscaleRequestSchema = z
  .object({
    mediaGenerationId: z.string().min(1),
    resolution: z.enum(["2k", "4k"]).optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowVideosRequestSchema = z
  .object({
    prompt: z.string().min(1),
    // Optional: same account-selection rule as POST /images, load balanced on
    // video-generation stats. The docs add that startImage, endImage,
    // referenceImage_*, or referenceVideo_1 let email be omitted outright —
    // the API reuses the account those references were uploaded to.
    email: z.string().optional(),
    model: z
      .enum([
        "veo-3.1-quality",
        "veo-3.1-fast",
        "veo-3.1-lite",
        "veo-3.1-lite-low-priority",
        "omni-flash",
      ])
      .or(GoogleFlowVeoModelAliasSchema)
      .optional(),
    // landscape/portrait for all models; Veo also accepts 1:1, 4:3, 3:4.
    // Unioned with string: upstream also accepts undocumented ratio aliases
    // (e.g. 16:9, exercised by the recorded i2v test).
    aspectRatio: z
      .enum(["landscape", "portrait", "1:1", "4:3", "3:4"])
      .or(z.string())
      .optional(),
    duration: z
      .union([z.literal(4), z.literal(6), z.literal(8), z.literal(10)])
      .optional(),
    count: z.number().int().min(1).max(4).optional(),
    seed: z.number().int().optional(),
    startImage: z.string().optional(),
    endImage: z.string().optional(),
    referenceImage_1: z.string().optional(),
    referenceImage_2: z.string().optional(),
    referenceImage_3: z.string().optional(),
    referenceImage_4: z.string().optional(),
    referenceImage_5: z.string().optional(),
    referenceImage_6: z.string().optional(),
    referenceImage_7: z.string().optional(),
    character_1: z.string().optional(),
    character_2: z.string().optional(),
    character_3: z.string().optional(),
    character_4: z.string().optional(),
    character_5: z.string().optional(),
    character_6: z.string().optional(),
    character_7: z.string().optional(),
    referenceAudio_1: z.string().optional(),
    referenceAudio_2: z.string().optional(),
    referenceAudio_3: z.string().optional(),
    referenceAudio_4: z.string().optional(),
    referenceAudio_5: z.string().optional(),
    referenceVideo_1: z.string().optional(),
    // Omni Flash V2V trim window on a 24 fps virtual timeline.
    startFrameIndex_1: z.number().int().min(0).max(239).optional(),
    endFrameIndex_1: z.number().int().min(1).max(240).optional(),
    async: z.boolean().optional(),
    replyUrl: z.string().url().optional(),
    replyRef: z.string().optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowVideosUpscaleRequestSchema = z
  .object({
    mediaGenerationId: z.string().min(1),
    resolution: z.enum(["1080p", "4K"]).optional(),
    async: z.boolean().optional(),
    replyUrl: z.string().url().optional(),
    replyRef: z.string().optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowVideosGifRequestSchema =
  GoogleFlowMediaGenerationIdRequestSchema;

export const GoogleFlowVideosExtendRequestSchema = z
  .object({
    mediaGenerationId: z.string().min(1),
    prompt: z.string().min(1),
    // Extend supports the Veo variants only (no omni-flash).
    model: z
      .enum([
        "veo-3.1-fast",
        "veo-3.1-quality",
        "veo-3.1-lite",
        "veo-3.1-lite-low-priority",
      ])
      .or(GoogleFlowVeoModelAliasSchema)
      .optional(),
    count: z.number().int().min(1).max(4).optional(),
    seed: z.number().int().optional(),
    async: z.boolean().optional(),
    replyUrl: z.string().url().optional(),
    replyRef: z.string().optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowVideosConcatenateRequestSchema = z
  .object({
    media: z
      .array(
        z
          .object({
            mediaGenerationId: z.string().min(1),
            trimStart: z.number().min(0).max(8).optional(),
            trimEnd: z.number().min(0).max(8).optional(),
          })
          .passthrough()
      )
      .min(2)
      .max(10),
  })
  .passthrough();

export const GoogleFlowJobsRequestSchema = z
  .object({
    options: z.enum(["summary", "executing", "history"]).optional(),
  })
  .passthrough();

// -- Response primitives ----------------------------------------------------
// Shared response sub-objects that later googleflow response-family slices
// (GF-S4..GF-S10) compose. They DESCRIBE upstream responses permissively
// (`.passthrough()` at every object level, optional-unless-documented fields,
// upstream-volatile string enums as `z.string()` with known values in comments
// only) rather than restrict them. The provider stays non-validating, so these
// are consumer metadata only, never runtime guards. Shapes confirmed against
// the useapi.net Model blocks (fetched 2026-07-22, curl + Chrome UA):
//   videos: https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
//   images: https://useapi.net/docs/api-google-flow-v1/post-google-flow-images

// Captcha result returned inside video/image responses. Documented in the
// videos/images Model -> "200 OK" blocks as the top-level `captcha` object:
//   { service, taskId, durationMs,
//     attempts: [{ service, taskId, durationMs, success }] }
// The docs show these only in JSON examples (never as always-present typed
// fields), so every field is optional except `attempt.success` (a boolean).
// `attempt.error` is kept independent of GoogleFlowApiErrorSchema (plan OQ-2)
// and permissive because the docs do not enumerate its shape.
// Docs: post-google-flow-videos / post-google-flow-images (Model -> 200 OK, `captcha`).
export const GoogleFlowCaptchaResultSchema = z
  .object({
    service: z.string().optional(),
    taskId: z.string().optional(),
    durationMs: z.number().optional(),
    attempts: z
      .array(
        z
          .object({
            service: z.string().optional(),
            taskId: z.string().optional(),
            durationMs: z.number().optional(),
            success: z.boolean(),
            error: z.unknown().optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

// Shared error / HTTP-429 envelope, documented in the videos/images
// Model -> "Error" blocks ("Error response structure (applies to both sync and
// async modes)"). The top-level `error` is documented as an always-present
// summary string, but captcha-provider failures prefix it
// (`captcha_quality:` = low reCAPTCHA score / rejected token;
// `Captcha service failed:` = provider outage, e.g.
// "Captcha service failed: ERROR_ZERO_BALANCE") and the structured
// `{ code, message, status, details? }` form also appears (the docs nest it
// under `response.error`; the requirements model it directly on `error`), so
// `error` accepts both the string and object forms.
// `retryAfter`, `skipReasons`, and `message` are the load-balancer empty-set
// 429 siblings (`error === "no_eligible_account"`). The docs give `retryAfter`
// as an ISO-8601 timestamp string and `skipReasons` as
// `Array<{ email, reason, model }>`; both are widened here to also accept the
// simpler number / string[] forms so callers on either shape parse. Every
// object level `.passthrough()`.
// Docs: post-google-flow-videos / post-google-flow-images (Model -> Error / 400 / 503).
export const GoogleFlowApiErrorSchema = z
  .object({
    error: z.union([
      z.string(),
      z
        .object({
          code: z.number().optional(),
          message: z.string().optional(),
          status: z.string().optional(),
          details: z.array(z.object({}).passthrough()).optional(),
        })
        .passthrough(),
    ]),
    // HTTP status-code sibling, e.g. `{ error: "Captcha service failed: ...",
    // code: 503 }`.
    code: z.number().optional(),
    message: z.string().optional(),
    retryAfter: z.union([z.string(), z.number()]).optional(),
    skipReasons: z
      .array(
        z.union([
          z.string(),
          z
            .object({
              email: z.string().optional(),
              reason: z.string().optional(),
              model: z.string().optional(),
            })
            .passthrough(),
        ])
      )
      .optional(),
  })
  .passthrough();

// Per-media generation status, documented in the videos Model -> "200 OK"
// block under `media[].mediaMetadata.mediaStatus`:
//   { mediaGenerationStatus: string, error?: { code, message } }
// `mediaGenerationStatus` is an upstream-volatile string enum, typed
// `z.string()` with known values in this comment only (never enforced):
//   MEDIA_GENERATION_STATUS_SUCCESSFUL | MEDIA_GENERATION_STATUS_FAILED
// plus any future MEDIA_GENERATION_STATUS_* value. `.passthrough()`.
// Docs: post-google-flow-videos (Model -> 200 OK, `mediaMetadata.mediaStatus`).
export const GoogleFlowMediaStatusSchema = z
  .object({
    mediaGenerationStatus: z.string(),
    error: z
      .object({
        code: z.number().optional(),
        message: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// Media visibility helper. The visibility flag ships under a different key per
// endpoint: video responses put `visibility` on `media[].mediaMetadata`
// (`"PRIVATE"`); image responses put `mediaVisibility` on
// `media[].image.generatedImage` (`"PRIVATE"`). Both are upstream-volatile
// strings (known values `PRIVATE` | `PUBLIC`), typed `z.string()` and listed
// here only. All fields optional and `.passthrough()`, so GF-S4/GF-S5 can
// compose this at whatever nesting level their endpoint uses.
// Docs: post-google-flow-videos (Model -> 200 OK, `mediaMetadata.visibility`) /
//       post-google-flow-images (Model -> 200 OK, `generatedImage.mediaVisibility`).
export const GoogleFlowMediaVisibilitySchema = z
  .object({
    visibility: z.string().optional(),
    mediaVisibility: z.string().optional(),
  })
  .passthrough();

export type GoogleFlowOptions = z.infer<typeof GoogleFlowOptionsSchema>;
export type GoogleFlowNoRequest = z.input<typeof GoogleFlowNoRequestSchema>;
export type GoogleFlowEmailRequest = z.input<
  typeof GoogleFlowEmailRequestSchema
>;
export type GoogleFlowMediaGenerationIdRequest = z.input<
  typeof GoogleFlowMediaGenerationIdRequestSchema
>;
export type GoogleFlowRefRequest = z.input<typeof GoogleFlowRefRequestSchema>;
export type GoogleFlowJobIdRequest = z.input<
  typeof GoogleFlowJobIdRequestSchema
>;
export type GoogleFlowAccountsCreateRequest = z.input<
  typeof GoogleFlowAccountsCreateRequestSchema
>;
export type GoogleFlowCaptchaProvidersRequest = z.input<
  typeof GoogleFlowCaptchaProvidersRequestSchema
>;
export type GoogleFlowCaptchaStatsRequest = z.input<
  typeof GoogleFlowCaptchaStatsRequestSchema
>;
export type GoogleFlowAssetUploadRequest = z.input<
  typeof GoogleFlowAssetUploadRequestSchema
>;
export type GoogleFlowCharactersCreateRequest = z.input<
  typeof GoogleFlowCharactersCreateRequestSchema
>;
export type GoogleFlowCharactersListRequest = z.input<
  typeof GoogleFlowCharactersListRequestSchema
>;
export type GoogleFlowVoicesCreateRequest = z.input<
  typeof GoogleFlowVoicesCreateRequestSchema
>;
export type GoogleFlowVoicesListRequest = z.input<
  typeof GoogleFlowVoicesListRequestSchema
>;
export type GoogleFlowImagesRequest = z.input<
  typeof GoogleFlowImagesRequestSchema
>;
export type GoogleFlowImagesUpscaleRequest = z.input<
  typeof GoogleFlowImagesUpscaleRequestSchema
>;
export type GoogleFlowVideosRequest = z.input<
  typeof GoogleFlowVideosRequestSchema
>;
export type GoogleFlowVideosUpscaleRequest = z.input<
  typeof GoogleFlowVideosUpscaleRequestSchema
>;
export type GoogleFlowVideosGifRequest = z.input<
  typeof GoogleFlowVideosGifRequestSchema
>;
export type GoogleFlowVideosExtendRequest = z.input<
  typeof GoogleFlowVideosExtendRequestSchema
>;
export type GoogleFlowVideosConcatenateRequest = z.input<
  typeof GoogleFlowVideosConcatenateRequestSchema
>;
export type GoogleFlowJobsRequest = z.input<typeof GoogleFlowJobsRequestSchema>;

// Response-primitive type aliases. `z.output` (not `z.input`) because these
// describe data the caller receives after parsing.
export type GoogleFlowCaptchaResult = z.output<
  typeof GoogleFlowCaptchaResultSchema
>;
export type GoogleFlowApiError = z.output<typeof GoogleFlowApiErrorSchema>;
export type GoogleFlowMediaStatus = z.output<
  typeof GoogleFlowMediaStatusSchema
>;
export type GoogleFlowMediaVisibility = z.output<
  typeof GoogleFlowMediaVisibilitySchema
>;
