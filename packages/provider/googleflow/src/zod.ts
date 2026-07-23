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

// Upstream ships new nano-banana point releases before this enum catches up,
// so the enum below is unioned with a versioned-family alias instead of a bare
// `.or(z.string())` (which accepted typos like "nano-banna-2"). The hatch
// matches `nano-banana` optionally followed by dotted-numeric version segments
// and lowercase variant segments, e.g. nano-banana-2, nano-banana-2-lite,
// nano-banana-3. Anything not structurally a nano-banana id — misspellings and
// other families — must be enumerated explicitly.
// [images] https://useapi.net/docs/api-googleflow-v1/post-google-flow-images
const GoogleFlowNanoBananaModelAliasSchema = z
  .string()
  .regex(
    /^nano-banana(?:-\d+(?:\.\d+)*)?(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a well-formed nano-banana alias (e.g. nano-banana-2)"
  );

export const GoogleFlowImagesRequestSchema = z
  .object({
    prompt: z.string().min(1),
    // Optional: email selects an account rather than naming a resource. One
    // account configured means it is used automatically; several means the
    // API load balances on image-generation stats; supplying reference_* also
    // pins the account the references were uploaded to.
    email: z.string().optional(),
    // Docs enumerate nano-banana-2-lite | nano-banana-2 | nano-banana-pro. Two
    // deprecated aliases are still accepted and stay enumerated for MCP
    // autocomplete: `nano-banana` (maps to nano-banana-2) and `imagen-4` (maps
    // to nano-banana-2-lite; Google removed Imagen from Flow in July 2026).
    // `imagen-4` does not match the nano-banana grammar, so it must be listed
    // explicitly.
    // [images] https://useapi.net/docs/api-googleflow-v1/post-google-flow-images
    model: z
      .enum([
        "nano-banana-2-lite",
        "nano-banana-2",
        "nano-banana-pro",
        "nano-banana", // deprecated alias → nano-banana-2
        "imagen-4", // deprecated alias → nano-banana-2-lite (Imagen removed 2026-07)
      ])
      .or(GoogleFlowNanoBananaModelAliasSchema)
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
    // Upstream documents seed as an integer >= 0. [images]
    seed: z.number().int().min(0).optional(),
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
  .passthrough()
  .superRefine((value, ctx) => {
    if (value.aspectRatio !== "auto") return;
    const hasReference = Object.entries(value).some(
      ([key, v]) =>
        (key.startsWith("reference_") || key.startsWith("character_")) &&
        typeof v === "string" &&
        v.length > 0
    );
    if (!hasReference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["aspectRatio"],
        // [images] "auto" is valid only for image-to-image (a reference input).
        message:
          'aspectRatio "auto" requires at least one reference_* or character_* input',
      });
    }
  });

export const GoogleFlowImagesUpscaleRequestSchema = z
  .object({
    mediaGenerationId: z.string().min(1),
    resolution: z.enum(["2k", "4k"]).optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

// -- POST /videos request: ordered per-model union -------------------------
// A single permissive object cannot express that (for example) only omni-flash
// accepts duration 10, that veo-3.1-quality has no reference-image mode, or
// that omni-flash forbids the numeric aspectRatio hatch. POST /videos is
// therefore an ORDERED z.union of per-model `.passthrough()` branches (first
// match wins), NOT a z.discriminatedUnion: a discriminated union needs a
// required literal discriminator on every branch, which is incompatible with
// the optional-`model` default branch and the regex-predicate alias fallback.
// Every branch stays `.passthrough()`, so unmodeled/forward-compatible fields
// keep flowing — the schema is consumer/MCP metadata only and the provider is
// non-validating on the wire.
// [videos] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos

// The five model ids that own a dedicated branch. The alias fallback refines
// its `model` to EXCLUDE these so a request such as
// `{ model: "veo-3.1-fast", duration: 10 }` cannot fail the fast branch and
// then launder through the permissive fallback (the exclusion refine is
// load-bearing — routing invariant 2).
const VIDEOS_ENUMERATED_MODELS = [
  "veo-3.1-fast",
  "veo-3.1-quality",
  "veo-3.1-lite",
  "veo-3.1-lite-low-priority",
  "omni-flash",
] as const;

// Model-agnostic fields shared by every branch; only model, aspectRatio,
// duration, and the reference/keyframe slots differ per model. They are grouped
// (head / count-seed / tail) and each branch composes them in the SAME field
// order as the pre-GF-S3 single object, so `safeParse` (which the factory runs
// via jsonBody) re-serializes request bodies byte-identically and the committed
// recordings replay without a re-record.
//
// Leading fields: `prompt` stays a plain non-empty string — inline
// `@character_N` / `@referenceImage_N` / `@referenceAudio_N` markers inside the
// prompt text are not schema-expressible.
const videosHeadFields = {
  prompt: z.string().min(1),
  // Optional: same account-selection rule as POST /images, load balanced on
  // video-generation stats. startImage/endImage/referenceImage_*/
  // referenceVideo_1 also let email be omitted (the API reuses the account the
  // references were uploaded to).
  email: z.string().optional(),
};

// Fields declared just after duration in the original object order.
const videosCountSeedFields = {
  count: z.number().int().min(1).max(4).optional(),
  seed: z.number().int().optional(),
};

// Trailing fields (async + reply callbacks + captcha), declared last in the
// original object order.
const videosTailFields = {
  async: z.boolean().optional(),
  replyUrl: z.string().url().optional(),
  replyRef: z.string().optional(),
  ...GoogleFlowCaptchaFieldsSchema,
};

// startImage/endImage keyframes, on every Veo and omni branch (both recorded
// POST /videos requests carry startImage).
const videosKeyframeFields = {
  startImage: z.string().optional(),
  endImage: z.string().optional(),
};

// referenceAudio slots stay bare strings: the 30 system-voice presets are
// documentation-volatile, so they are not enumerated here (OQ-4).
// [videos §Reference Audio] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
const videosReferenceAudioFields = {
  referenceAudio_1: z.string().optional(),
  referenceAudio_2: z.string().optional(),
  referenceAudio_3: z.string().optional(),
  referenceAudio_4: z.string().optional(),
  referenceAudio_5: z.string().optional(),
};

// Fast-family reference slots: referenceImage_1..3 / character_1..3. Declaring
// only 1..3 does NOT by itself reject referenceImage_4 (every branch is
// `.passthrough()`); the slot budget is enforced by the branch superRefine.
// [videos §Reference Images] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
const videosFastReferenceFields = {
  referenceImage_1: z.string().optional(),
  referenceImage_2: z.string().optional(),
  referenceImage_3: z.string().optional(),
  character_1: z.string().optional(),
  character_2: z.string().optional(),
  character_3: z.string().optional(),
};

// omni-flash reference slots: referenceImage_1..7 / character_1..7. Same
// passthrough caveat as the fast family — the 1..7 budget is enforced by the
// branch superRefine, not by these declarations.
// [videos §Reference Images] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
const videosOmniReferenceFields = {
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
};

// aspectRatio for the Veo branches: documented named/numeric ratios plus a
// numeric hatch so undocumented ratios (e.g. 16:9, exercised by the recorded
// i2v request) keep parsing while free-text typos ("landscap") are rejected.
// [videos §Aspect Ratio] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
const veoAspectRatioSchema = z
  .enum(["landscape", "portrait", "1:1", "4:3", "3:4"])
  .or(z.string().regex(/^\d+:\d+$/));

// Veo fast family (fast/lite/lite-low-priority) duration: 8 s default; 4 s and
// 6 s are Ultra-plan-gated upstream but accepted here (plan gating is NOT
// schema-enforced — comment only, REQ-010).
// [videos §Model Capabilities] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
const veoFastDurationSchema = z
  .union([z.literal(4), z.literal(6), z.literal(8)])
  .optional();

// omni-flash / alias-fallback duration: 4/6/8/10 (10 s is omni-only among the
// enumerated models; the fallback keeps today's permissive 4|6|8|10 domain).
// [videos §Model Capabilities] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
const videosWideDurationSchema = z
  .union([z.literal(4), z.literal(6), z.literal(8), z.literal(10)])
  .optional();

// Branch superRefine helpers (pure). Because every branch is `.passthrough()`,
// slot budgets and mode constraints must be enforced explicitly here, not by
// which optional keys a branch declares (plan-review finding F1). Each issue
// carries an explicit `path` so error paths stay precise under the union.
interface VideosRefinementIssue {
  path: string[];
  message: string;
}

// Present referenceImage_N / character_N slots whose index exceeds `maxIndex`
// (maxIndex 0 = the branch has no reference-image mode at all).
function overBudgetReferenceSlotIssues(
  value: Record<string, unknown>,
  maxIndex: number,
  message: string
): VideosRefinementIssue[] {
  const issues: VideosRefinementIssue[] = [];
  for (const prefix of ["referenceImage_", "character_"]) {
    for (const [key, v] of Object.entries(value)) {
      if (!key.startsWith(prefix) || v === undefined) continue;
      const index = Number(key.slice(prefix.length));
      if (Number.isInteger(index) && index > maxIndex) {
        issues.push({ path: [key], message });
      }
    }
  }
  return issues;
}

// Whether any in-budget (index 1..maxIndex) referenceImage_* or character_*
// slot is present.
function hasInBudgetReference(
  value: Record<string, unknown>,
  maxIndex: number
): boolean {
  for (const prefix of ["referenceImage_", "character_"]) {
    for (const [key, v] of Object.entries(value)) {
      if (!key.startsWith(prefix) || v === undefined) continue;
      const index = Number(key.slice(prefix.length));
      if (Number.isInteger(index) && index >= 1 && index <= maxIndex) {
        return true;
      }
    }
  }
  return false;
}

// endImage requires startImage; referenceImage_* is mutually exclusive with the
// startImage/endImage keyframes (reference-to-video vs keyframe modes).
function videosKeyframeIssues(
  value: Record<string, unknown>
): VideosRefinementIssue[] {
  const issues: VideosRefinementIssue[] = [];
  const hasStart = value.startImage !== undefined;
  const hasEnd = value.endImage !== undefined;
  if (hasEnd && !hasStart) {
    issues.push({
      path: ["endImage"],
      message: "endImage requires startImage",
    });
  }
  const hasReferenceImage = Object.entries(value).some(
    ([key, v]) => key.startsWith("referenceImage_") && v !== undefined
  );
  if (hasReferenceImage && (hasStart || hasEnd)) {
    issues.push({
      path: ["referenceImage_1"],
      message:
        "referenceImage_* cannot be combined with startImage/endImage keyframes",
    });
  }
  return issues;
}

// Fast-family (veo-3.1-fast / -lite / -lite-low-priority) branch constraints:
// referenceImage_1..3 / character_1..3 budget, plus reference-to-video duration.
function veoFastFamilyIssues(
  value: Record<string, unknown>
): VideosRefinementIssue[] {
  const issues = overBudgetReferenceSlotIssues(
    value,
    3,
    "veo-3.1 fast/lite models accept at most referenceImage_1..3 / character_1..3"
  );
  // Reference-to-video (REQ-005/006, F2): with an in-budget reference present,
  // an explicitly-set duration must be 8. An ABSENT duration is valid — upstream
  // defaults it to 8, so the refine must NOT reject an omitted duration.
  if (
    hasInBudgetReference(value, 3) &&
    value.duration !== undefined &&
    value.duration !== 8
  ) {
    issues.push({
      path: ["duration"],
      message: "reference-to-video generation only supports duration 8",
    });
  }
  issues.push(...videosKeyframeIssues(value));
  return issues;
}

// omni-flash video-to-video (referenceVideo_1) constraints: no explicit
// duration alongside a source video (upstream derives it from the trim window);
// the frame-index window is valid only alongside referenceVideo_1, with end
// strictly after start (field-level min/max already bound 0-239 / 1-240).
// [videos §Video-to-Video] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
function omniV2VIssues(
  value: Record<string, unknown>
): VideosRefinementIssue[] {
  const issues: VideosRefinementIssue[] = [];
  const hasSourceVideo = value.referenceVideo_1 !== undefined;
  if (hasSourceVideo && value.duration !== undefined) {
    issues.push({
      path: ["duration"],
      message:
        "omni-flash video-to-video (referenceVideo_1) does not accept an explicit duration",
    });
  }
  const hasStartFrame = value.startFrameIndex_1 !== undefined;
  const hasEndFrame = value.endFrameIndex_1 !== undefined;
  if ((hasStartFrame || hasEndFrame) && !hasSourceVideo) {
    issues.push({
      path: [hasStartFrame ? "startFrameIndex_1" : "endFrameIndex_1"],
      message: "startFrameIndex_1/endFrameIndex_1 require referenceVideo_1",
    });
  }
  if (
    typeof value.startFrameIndex_1 === "number" &&
    typeof value.endFrameIndex_1 === "number" &&
    value.endFrameIndex_1 <= value.startFrameIndex_1
  ) {
    issues.push({
      path: ["endFrameIndex_1"],
      message: "endFrameIndex_1 must be greater than startFrameIndex_1",
    });
  }
  return issues;
}

// Branch 1 (default): only this branch makes `model` optional, so an omitted
// model routes solely here (routing invariant 1).
const veoFastVideosSchema = z
  .object({
    ...videosHeadFields,
    model: z.literal("veo-3.1-fast").optional(),
    aspectRatio: veoAspectRatioSchema.optional(),
    duration: veoFastDurationSchema,
    ...videosCountSeedFields,
    ...videosKeyframeFields,
    ...videosFastReferenceFields,
    ...videosReferenceAudioFields,
    ...videosTailFields,
  })
  .passthrough()
  .superRefine((value, ctx) => {
    for (const issue of veoFastFamilyIssues(value as Record<string, unknown>)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    }
  });

// Branch 2: veo-3.1-quality renders 8 s clips only and has no reference-image
// mode. Model required.
const veoQualityVideosSchema = z
  .object({
    ...videosHeadFields,
    model: z.literal("veo-3.1-quality"),
    aspectRatio: veoAspectRatioSchema.optional(),
    // veo-3.1-quality: 8 s only. [videos §Model Capabilities]
    duration: z.literal(8).optional(),
    ...videosCountSeedFields,
    ...videosKeyframeFields,
    ...videosTailFields,
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const record = value as Record<string, unknown>;
    const issues = [
      ...overBudgetReferenceSlotIssues(
        record,
        0,
        "veo-3.1-quality does not support referenceImage_*/character_* inputs"
      ),
      ...videosKeyframeIssues(record),
    ];
    for (const issue of issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    }
  });

// Branch 3: veo-3.1-lite. Same shape/constraints as the fast branch; model
// required.
const veoLiteVideosSchema = z
  .object({
    ...videosHeadFields,
    model: z.literal("veo-3.1-lite"),
    aspectRatio: veoAspectRatioSchema.optional(),
    duration: veoFastDurationSchema,
    ...videosCountSeedFields,
    ...videosKeyframeFields,
    ...videosFastReferenceFields,
    ...videosReferenceAudioFields,
    ...videosTailFields,
  })
  .passthrough()
  .superRefine((value, ctx) => {
    for (const issue of veoFastFamilyIssues(value as Record<string, unknown>)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    }
  });

// Branch 4: veo-3.1-lite-low-priority (Ultra-$199 gated upstream — gating is
// comment-only, REQ-010). Same shape/constraints as the fast branch; model
// required.
const veoLiteLowPriorityVideosSchema = z
  .object({
    ...videosHeadFields,
    model: z.literal("veo-3.1-lite-low-priority"),
    aspectRatio: veoAspectRatioSchema.optional(),
    duration: veoFastDurationSchema,
    ...videosCountSeedFields,
    ...videosKeyframeFields,
    ...videosFastReferenceFields,
    ...videosReferenceAudioFields,
    ...videosTailFields,
  })
  .passthrough()
  .superRefine((value, ctx) => {
    for (const issue of veoFastFamilyIssues(value as Record<string, unknown>)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    }
  });

// Branch 5: omni-flash. CLOSED aspectRatio enum (no numeric hatch, rejects
// "1:1"), 4/6/8/10 duration, referenceImage_1..7, and the V2V trim window.
const omniFlashVideosSchema = z
  .object({
    ...videosHeadFields,
    model: z.literal("omni-flash"),
    // omni-flash: closed aspect-ratio enum, no numeric hatch.
    // [videos §Aspect Ratio]
    aspectRatio: z.enum(["landscape", "portrait"]).optional(),
    duration: videosWideDurationSchema,
    ...videosCountSeedFields,
    ...videosKeyframeFields,
    ...videosOmniReferenceFields,
    ...videosReferenceAudioFields,
    referenceVideo_1: z.string().optional(),
    // Omni Flash V2V trim window on a 24 fps virtual timeline.
    // [videos §Video-to-Video]
    startFrameIndex_1: z.number().int().min(0).max(239).optional(),
    endFrameIndex_1: z.number().int().min(1).max(240).optional(),
    ...videosTailFields,
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const record = value as Record<string, unknown>;
    const issues = [
      ...overBudgetReferenceSlotIssues(
        record,
        7,
        "omni-flash accepts at most referenceImage_1..7 / character_1..7"
      ),
      ...omniV2VIssues(record),
      ...videosKeyframeIssues(record),
    ];
    for (const issue of issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    }
  });

// Branch 6 (alias fallback): forward-compatible for unlisted Veo point
// releases. `model` is REQUIRED (routing invariant 1) and must be a well-formed
// Veo alias that is NOT one of the five enumerated ids (routing invariant 2).
// Otherwise permissive — today's domain: 4/6/8/10 duration, string aspectRatio,
// passthrough everything.
const videosAliasFallbackSchema = z
  .object({
    ...videosHeadFields,
    model: GoogleFlowVeoModelAliasSchema.refine(
      (m) => !(VIDEOS_ENUMERATED_MODELS as readonly string[]).includes(m),
      { message: "enumerated models are validated by their own branch" }
    ),
    aspectRatio: z
      .enum(["landscape", "portrait", "1:1", "4:3", "3:4"])
      .or(z.string())
      .optional(),
    duration: videosWideDurationSchema,
    ...videosCountSeedFields,
    ...videosKeyframeFields,
    ...videosOmniReferenceFields,
    ...videosReferenceAudioFields,
    referenceVideo_1: z.string().optional(),
    ...videosTailFields,
  })
  .passthrough();

// Ordered union: first match wins. Only the fast (default) branch makes `model`
// optional, so an omitted model routes solely to veo-3.1-fast.
export const GoogleFlowVideosRequestSchema = z.union([
  veoFastVideosSchema,
  veoQualityVideosSchema,
  veoLiteVideosSchema,
  veoLiteLowPriorityVideosSchema,
  omniFlashVideosSchema,
  videosAliasFallbackSchema,
]);

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

// -- Video response family (GF-S4) -----------------------------------------
// Typed, permissive (describe-never-restrict) views of the video-generation
// SYNC response bodies for POST /videos, /videos/upscale, and /videos/extend.
// Every object level is `.passthrough()`; every field is optional unless the
// useapi.net Model block marks it always-present (only media[].mediaGenerationId
// and the reused mediaStatus.mediaGenerationStatus stay required); internal
// model ids and volatile status/aspect enums are plain `z.string()` with known
// values in comments only. These DESCRIBE received data and never guard the
// wire — the provider stays non-validating and endpoint return types remain
// Promise<GoogleFlowResponse>; the schemas are consumer/MCP metadata only.
// Shapes confirmed against the useapi.net Model blocks (fetched 2026-07-22,
// curl + Chrome UA):
//   [videos]      https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
//   [vid-upscale] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-upscale
//   [extend]      https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-extend

// One entry of the videos `media[]` array. Composes the GF-S1
// GoogleFlowMediaStatusSchema primitive for mediaMetadata.mediaStatus (never
// redefines it). The stub-only `media[].url` key (present in the committed
// recordings, absent from the docs) is NOT declared — it survives parsing via
// `.passthrough()`. Only mediaGenerationId is required on the entry; every other
// field/object is optional (OQ-1/A1). `generatedVideo.model` and the volatile
// aspectRatio/status strings are plain `z.string()` (REQ-007), never a
// `.or(z.string())` open-enum union — these are describe-only response ids, not
// the POST /videos request model registry.
// [videos] Model -> 200 OK, `media[]`.
export const GoogleFlowVideoMediaEntrySchema = z
  .object({
    name: z.string().optional(),
    projectId: z.string().optional(),
    workflowId: z.string().optional(),
    workflowStepId: z.string().optional(),
    mediaMetadata: z
      .object({
        createTime: z.string().optional(),
        mediaTitle: z.string().optional(),
        requestData: z.object({}).passthrough().optional(),
        mediaStatus: GoogleFlowMediaStatusSchema.optional(),
        // known values: PRIVATE | PUBLIC (see GoogleFlowMediaVisibilitySchema).
        visibility: z.string().optional(),
      })
      .passthrough()
      .optional(),
    video: z
      .object({
        generatedVideo: z
          .object({
            seed: z.number().optional(),
            prompt: z.string().optional(),
            // Internal, upstream-volatile snake_case model id (describe-only).
            // known values: veo_3_1_t2v, veo_3_1_upsampler_1080p (plus other
            // veo_3_1_* generation / upsampler ids).
            model: z.string().optional(),
            baseImageMediaGenerationId: z.string().optional(),
            isLooped: z.boolean().optional(),
            // known values: VIDEO_ASPECT_RATIO_LANDSCAPE | *_PORTRAIT | ...
            aspectRatio: z.string().optional(),
            upsampleMetadata: z.object({}).passthrough().optional(),
          })
          .passthrough()
          .optional(),
        dimensions: z
          .object({
            // e.g. "8s", "0s".
            length: z.string().optional(),
          })
          .passthrough()
          .optional(),
        operation: z
          .object({
            name: z.string().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
    mediaGenerationId: z.string(),
    videoUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  })
  .passthrough();

// POST /videos sync 200 body. `jobId` and `media` are the only always-present
// top-level fields (every doc example and committed stub carries both, A2);
// `remainingCredits` and `captcha` are independently optional (OQ-2). Reuses the
// GF-S1 GoogleFlowCaptchaResultSchema primitive for `captcha`.
// [videos] Model -> 200 OK.
export const GoogleFlowVideosResponseSchema = z
  .object({
    jobId: z.string(),
    media: z.array(GoogleFlowVideoMediaEntrySchema),
    remainingCredits: z.number().optional(),
    captcha: GoogleFlowCaptchaResultSchema.optional(),
  })
  .passthrough();

// POST /videos/upscale sync 200 body: the /videos fields (spread from
// GoogleFlowVideosResponseSchema.shape) PLUS the still-populated legacy
// `operations[]` array — the docs return both `operations[]` (legacy, with
// fifeUrl) and `media[]` (current, with videoUrl). The inner
// operation.metadata.video object stays `.passthrough()` + all-optional (A3), so
// its undeclared keys (seed, model, mediaGenerationId, ...) flow through.
// [vid-upscale] Model -> 200 OK, `operations[]`.
export const GoogleFlowVideosUpscaleResponseSchema = z
  .object({
    ...GoogleFlowVideosResponseSchema.shape,
    operations: z
      .array(
        z
          .object({
            operation: z
              .object({
                metadata: z
                  .object({
                    video: z
                      .object({
                        fifeUrl: z.string().optional(),
                        servingBaseUri: z.string().optional(),
                        upsampleResolution: z.string().optional(),
                      })
                      .passthrough(),
                  })
                  .passthrough(),
                name: z.string().optional(),
              })
              .passthrough(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

// POST /videos/extend sync 200 body. The [extend] Model block is field-identical
// to [videos] today (same jobId / media[] / remainingCredits / captcha shape),
// so this is a deliberate direct alias, not a duplicate object (OQ-3). If a
// future doc revision adds extend-only fields, split it into its own schema then.
// [extend] Model -> 200 OK.
export const GoogleFlowVideosExtendResponseSchema =
  GoogleFlowVideosResponseSchema;

// -- Image response family (GF-S5) ------------------------------------------
// Typed, permissive (describe-never-restrict) view of the image-generation SYNC
// response body for POST /images. The symmetric image half of the GF-S4 video
// family: every object level is `.passthrough()`; every field is optional unless
// the useapi.net Model block marks it always-present (only the top-level jobId
// and media[] are required); internal response model ids and volatile
// visibility/aspect enums are plain `z.string()` with known values in comments
// only. These DESCRIBE received data and never guard the wire — the provider
// stays non-validating and endpoint return types remain
// Promise<GoogleFlowResponse>; the schemas are consumer/MCP metadata only.
// Shape confirmed against the useapi.net Model block (fetched 2026-07-22,
// curl + Chrome UA):
//   [images] https://useapi.net/docs/api-google-flow-v1/post-google-flow-images

// One entry of the images `media[]` array. The generated-image payload nests
// under `image.generatedImage`; every object level is `.passthrough()` and every
// field is optional (OQ-3 default — the [images] Model block shows the fields in
// its 200 OK example but never marks them always-present, so nothing inside the
// entry is required). `modelNameType` is an internal, upstream-volatile response
// model id typed plain `z.string()` (describe-only) — never a closed `z.enum` and
// never a `.or(z.string())` open-enum union; that guard belongs to the
// POST /images request model registry, not this response id. `mediaVisibility` is
// likewise a plain `z.string()` (see GoogleFlowMediaVisibilitySchema). Composes
// no GF-S1 primitive at the entry level; reuses none redefined.
// [images] Model -> 200 OK, `media[]`.
export const GoogleFlowImageMediaEntrySchema = z
  .object({
    name: z.string().optional(),
    workflowId: z.string().optional(),
    image: z
      .object({
        generatedImage: z
          .object({
            seed: z.number().optional(),
            mediaGenerationId: z.string().optional(),
            // known values: PRIVATE | PUBLIC (see GoogleFlowMediaVisibilitySchema).
            mediaVisibility: z.string().optional(),
            prompt: z.string().optional(),
            // Internal, upstream-volatile response model id (describe-only).
            // known values: HARBOR_SEAL | GEM_PIX_2 | NARWHAL (current), plus
            // IMAGEN_3_5 | R2I | GEM_PIX on older jobs.
            modelNameType: z.string().optional(),
            workflowId: z.string().optional(),
            fifeUrl: z.string().optional(),
            // known values: IMAGE_ASPECT_RATIO_LANDSCAPE | *_PORTRAIT | ...
            aspectRatio: z.string().optional(),
            requestData: z.object({}).passthrough().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// POST /images sync 200 body. `jobId` and `media` are the only always-present
// top-level fields (mirroring the GF-S4 A2 decision); `captcha` is optional and
// reuses the GF-S1 GoogleFlowCaptchaResultSchema primitive rather than redefining
// it. The [images] doc example carries no `remainingCredits` (unlike [videos]),
// so it is not declared — `.passthrough()` preserves it if a future response ever
// adds it (OQ-2).
// [images] Model -> 200 OK.
export const GoogleFlowImagesResponseSchema = z
  .object({
    jobId: z.string(),
    media: z.array(GoogleFlowImageMediaEntrySchema),
    captcha: GoogleFlowCaptchaResultSchema.optional(),
  })
  .passthrough();

// -- Encoded-payload response family (GF-S6) --------------------------------
// Typed, permissive (describe-never-restrict) views of the three synchronous
// googleflow endpoints whose 200 body is a small base64-encoded media payload
// rather than a `media[]` array: POST /images/upscale (`encodedImage`),
// POST /videos/gif (`encodedGif`), and POST /videos/concatenate
// (`encodedVideo`). Completes the response-family coverage begun by GF-S4
// (video media[]) and GF-S5 (image media[]). Every object level is
// `.passthrough()`; a field is required only where the useapi.net Model block
// marks it always-present. These DESCRIBE received data and never guard the
// wire — the provider stays non-validating and endpoint return types remain
// Promise<GoogleFlowResponse>; the schemas are consumer/MCP metadata only.
// Shapes confirmed against the useapi.net Model blocks (fetched 2026-07-22,
// curl + Chrome UA):
//   [images/upscale]     https://useapi.net/docs/api-google-flow-v1/post-google-flow-images-upscale
//   [videos/gif]         https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-gif
//   [videos/concatenate] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-concatenate

// POST /images/upscale sync 200 body: base64 image payload. `encodedImage` is
// the only always-present field; `captcha` is optional and reuses the GF-S1
// GoogleFlowCaptchaResultSchema primitive (never redefined), so its nested
// attempts[] passthrough carries through. `.passthrough()` preserves any
// undocumented top-level extra.
// [images/upscale] Model -> 200 OK.
export const GoogleFlowImagesUpscaleResponseSchema = z
  .object({
    encodedImage: z.string(),
    captcha: GoogleFlowCaptchaResultSchema.optional(),
  })
  .passthrough();

// POST /videos/gif sync 200 body: base64 GIF payload. `encodedGif` is the sole
// always-present field; the doc Model also lists an optional `error?` envelope
// which is not declared (OQ-1 — GF-S4/GF-S5 precedent; the GF-S1
// GoogleFlowApiErrorSchema models the error envelope and `.passthrough()`
// preserves an inline `error` regardless).
// [videos/gif] Model -> 200 OK.
export const GoogleFlowVideosGifResponseSchema = z
  .object({
    encodedGif: z.string(),
  })
  .passthrough();

// POST /videos/concatenate sync 200 body: base64 MP4 payload. All four fields
// are always-present per the doc Model. `status` is a plain `z.string()`
// describe-only response lifecycle string, not a request model registry, so a
// novel MEDIA_GENERATION_STATUS_* parses — never a closed z.enum and never a
// `.or(z.string())` open-enum union. `.passthrough()` preserves any undocumented
// top-level extra (the doc Model also lists an optional `error?` envelope,
// undeclared per OQ-1).
// [videos/concatenate] Model -> 200 OK.
export const GoogleFlowVideosConcatenateResponseSchema = z
  .object({
    jobId: z.string(),
    // known values: MEDIA_GENERATION_STATUS_SUCCESSFUL |
    // MEDIA_GENERATION_STATUS_FAILED, plus future MEDIA_GENERATION_STATUS_*
    status: z.string(),
    inputsCount: z.number(),
    encodedVideo: z.string(),
  })
  .passthrough();

// -- Jobs & async-job response family (GF-S7) -------------------------------
// Typed, permissive (describe-never-restrict) views of the googleflow
// asynchronous JOB surface: the GET /jobs/:jobid job record, the POST
// /videos|/videos/extend|/videos/upscale async 201-created body, and the
// GET /jobs?options= load-balancer stats block. Every object level is
// `.passthrough()`; a field is required only where the useapi.net Model block
// marks it always-present. The only closed enums in the family are the job
// record's `type` and `status` (DP-1 / REQ-006) — every other volatile string
// (response ids, per-operation status, ...) stays plain `z.string()`, never a
// `.or(z.string())` open-enum union, because these are describe-only RESPONSE
// fields, not request model registries. These DESCRIBE received data and never
// guard the wire — the jobs endpoints stay non-validating (`get.v1.jobs` /
// `get.v1.jobs.retrieve` keep returning Promise<GoogleFlowResponse>); the
// schemas are consumer/MCP metadata only. Shapes confirmed against the
// useapi.net Model blocks (fetched 2026-07-22, curl + Chrome UA):
//   [jobs]        https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs
//   [jobs-id]     https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs-jobid
//   [videos]      https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
//   [extend]      https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-extend
//   [vid-upscale] https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-upscale

// One persisted job record, returned by GET /jobs/:jobid (and echoed by the
// async 201 body — see GoogleFlowJobCreatedResponseSchema). `jobid` (lowercase,
// NOT `jobId`) is the one always-present identity field. `type` and `status`
// are the only closed enums: `type` is z.enum(["video","image"]) (DP-1) and
// `status` is z.enum(["created","started","completed","failed"]) (REQ-006) — a
// value outside either set fails to parse even though the surrounding object
// stays `.passthrough()`. `request` is a permissive echo of the submitted fields
// (keys not enumerated, OQ-1). `response.media[]` reuses the GF-S4 video / GF-S5
// image media-entry schemas (video-first union; both members are permissive so
// this is reuse/documentation, not strict discrimination — an image entry lacks
// the top-level mediaGenerationId the video member requires, so it falls through
// to the image shape) and `response.captcha` reuses the GF-S1 captcha primitive;
// none redefined (AC-5). `updated`, `response`, `remainingCredits`, `error`,
// `errorDetails`, and `code` all stay optional (OQ-3).
// [jobs-id] Model -> 200 OK (Video Job / Image Job); [jobs] Model.
export const GoogleFlowJobRecordSchema = z
  .object({
    jobid: z.string(),
    type: z.enum(["video", "image"]),
    status: z.enum(["created", "started", "completed", "failed"]),
    created: z.string(),
    updated: z.string().optional(),
    // Permissive echo of the submitted request fields; keys are not enumerated
    // so any submitted shape (video or image request) survives (OQ-1).
    request: z.object({}).passthrough(),
    response: z
      .object({
        // Video entries resolve to the GF-S4 schema (top-level mediaGenerationId
        // required); image entries fall through to the all-optional GF-S5 schema.
        media: z
          .array(
            z.union([
              GoogleFlowVideoMediaEntrySchema,
              GoogleFlowImageMediaEntrySchema,
            ])
          )
          .optional(),
        // A completed record may still echo the legacy pending operations array.
        operations: z.array(z.object({}).passthrough()).optional(),
        remainingCredits: z.number().optional(),
        captcha: GoogleFlowCaptchaResultSchema.optional(),
        // The docs nest the structured failure under `response.error`
        // ({ code, message, status }); kept permissive here.
        error: z.unknown().optional(),
      })
      .passthrough()
      .optional(),
    // Top-level failure summary. Reuses the GF-S1 string|object union so both the
    // documented "API error: 500" string and the structured object form parse.
    error: GoogleFlowApiErrorSchema.shape.error.optional(),
    // Documented as a string ("Additional error details"); kept permissive.
    errorDetails: z.unknown().optional(),
    // Documented as a number (HTTP status when failed); widened to also accept a
    // string form defensively.
    code: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

// A single pending async operation, present in the 201-created
// `response.operations[]` while generation runs in the background. Every field
// is optional + `.passthrough()`; `status` is the describe-only pending marker
// (known value MEDIA_GENERATION_STATUS_PENDING), a plain `z.string()`.
const GoogleFlowPendingOperationSchema = z
  .object({
    operation: z
      .object({
        name: z.string().optional(),
        metadata: z.object({}).passthrough().optional(),
      })
      .passthrough()
      .optional(),
    sceneId: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();

// POST /videos|/videos/extend|/videos/upscale async 201-created body. A single
// permissive shape covers all three async 201 tabs (OQ-2). The live 201 body is
// itself a job record (jobid / type / status:"created" / created / request /
// response) whose still-pending work sits under `response.operations[]` (each
// carrying a per-scene MEDIA_GENERATION_STATUS_PENDING status) with NO finished
// `response.media`; the extend/upscale 201s carry only `response.captcha`.
// Because operations is not present on every tab, nothing is required here —
// every field is optional + `.passthrough()`, and `response.captcha` reuses the
// GF-S1 primitive. (The plan's suggested flat top-level `operations` is also
// tolerated as an optional field, but the confirmed useapi.net Model nests it
// under `response`.)
// [videos]/[extend]/[vid-upscale] Model -> 201 Created.
export const GoogleFlowJobCreatedResponseSchema = z
  .object({
    jobid: z.string().optional(),
    // camelCase variant tolerated defensively.
    jobId: z.string().optional(),
    // known values: video | image (the closed enum lives on
    // GoogleFlowJobRecordSchema; kept permissive here).
    type: z.string().optional(),
    // known value at creation: "created" (the closed lifecycle enum lives on
    // GoogleFlowJobRecordSchema); plain here to describe every 201 variant.
    status: z.string().optional(),
    created: z.string().optional(),
    updated: z.string().optional(),
    request: z.object({}).passthrough().optional(),
    response: z
      .object({
        operations: z.array(GoogleFlowPendingOperationSchema).optional(),
        captcha: GoogleFlowCaptchaResultSchema.optional(),
      })
      .passthrough()
      .optional(),
    // Tolerated flat placement (see comment above); the live Model nests these
    // under `response.operations`.
    operations: z.array(GoogleFlowPendingOperationSchema).optional(),
  })
  .passthrough();

// Per-account counters inside a stats `summary` map, keyed by account email.
// All six documented fields are numbers; the record stays `.passthrough()` so a
// future counter survives (OQ-4).
const GoogleFlowJobsStatsPerEmailCountersSchema = z
  .object({
    executing: z.number().optional(),
    completed: z.number().optional(),
    failed: z.number().optional(),
    rateLimited: z.number().optional(),
    avgResponseTime: z.number().optional(),
    score: z.number().optional(),
  })
  .passthrough();

// One media-kind stats group (videos | images | combined). `summary` is the
// always-present per-email counter map; `executing` and `history` are populated
// only for options=executing / options=history (both keyed by jobId). Volatile
// string fields (email, elapsed) stay `z.string()`; the numeric fields are typed
// but every record object stays `.passthrough()` (OQ-4).
const GoogleFlowJobsStatsGroupSchema = z
  .object({
    summary: z.record(z.string(), GoogleFlowJobsStatsPerEmailCountersSchema),
    executing: z
      .record(
        z.string(),
        z
          .object({
            email: z.string().optional(),
            timestamp: z.number().optional(),
            elapsed: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
    history: z
      .record(
        z.string(),
        z
          .object({
            email: z.string().optional(),
            timestamp: z.number().optional(),
            httpStatus: z.number().optional(),
            responseTime: z.number().optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

// GET /jobs?options=summary|executing|history load-balancer stats block. The
// top-level object carries `emails` (all healthy account emails) plus the three
// media-kind groups `videos` / `images` / `combined`, each the shared stats-group
// shape above. A single schema with all groups optional parses every `options=`
// variant (they differ only in which sub-fields — summary / executing / history
// — are populated). `.passthrough()` at every level. (Reconciling the request
// `options` enum with these response groups is A2 backlog, not GF-S7.)
// [jobs] Model -> 200 OK (options= stats block).
export const GoogleFlowJobsStatsResponseSchema = z
  .object({
    emails: z.array(z.string()).optional(),
    videos: GoogleFlowJobsStatsGroupSchema.optional(),
    images: GoogleFlowJobsStatsGroupSchema.optional(),
    combined: GoogleFlowJobsStatsGroupSchema.optional(),
  })
  .passthrough();

// -- Assets response family (GF-S8) -----------------------------------------
// Typed, permissive (describe-never-restrict) views of the googleflow ASSETS
// surface: the two documented POST /assets upload 200 bodies (image upload and
// the DISTINCT video upload) and the GET /assets/:mediaGenerationId retrieve 200
// body. Every object level is `.passthrough()`; a field is required only where
// the useapi.net Model block marks it always-present. These DESCRIBE received
// data and never guard the wire — the assets endpoints stay non-validating
// (`post.v1.assets` / `get.v1.assets.retrieve` keep returning
// Promise<GoogleFlowResponse>); the schemas are consumer/MCP metadata only.
// Shapes confirmed against the useapi.net Model blocks (fetched 2026-07-22,
// curl + Chrome UA):
//   [assets]    https://useapi.net/docs/api-google-flow-v1/post-google-flow-assets-email
//   [assets-dl] https://useapi.net/docs/api-google-flow-v1/get-google-flow-assets-mediagenerationid
//
// Stub-vs-docs divergence (REQ-005): the committed i2v stub recording returns
// `{"media":[{"mediaGenerationId":{"mediaGenerationId":"..."}}]}` for
// POST /assets — a `media[]` ARRAY wrapper the docs never describe. The docs
// win: `media` is typed as an OBJECT and the top-level `mediaGenerationId` is a
// `{ mediaGenerationId }` object, so the stub's array form is never a typed
// field; it would only ever survive as untyped `.passthrough()` data. No live
// POST /assets account was configured at implementation time (autonomous
// headless run, OQ-1), so the two upload schemas are pinned straight from the
// docs and tagged `doc-derived, not yet live-verified`; the existing i2v /
// omni-i2v stub recordings are left untouched (no wire change in this slice).

// POST /assets image-upload 200 body. Returned when Content-Type is
// image/png | image/jpeg | image/webp. Per the [assets] image Model the
// always-present fields are `media` (full Google Flow media object, image{}
// sub-object), the top-level `mediaGenerationId: { mediaGenerationId }` object
// (the reference id for subsequent calls), `width`, `height`, and `email`;
// `workflow` is the one documented-optional field. `.passthrough()` at every
// level preserves the doc's deep `media`/`workflow` sub-objects and any
// undocumented top-level extra (including the divergent stub `media[]` wrapper)
// without typing them.
// [assets] Model -> 200 OK (image upload). doc-derived, not yet live-verified.
export const GoogleFlowAssetsUploadImageResponseSchema = z
  .object({
    media: z.object({}).passthrough(),
    workflow: z.object({}).passthrough().optional(),
    mediaGenerationId: z
      .object({ mediaGenerationId: z.string() })
      .passthrough(),
    width: z.number(),
    height: z.number(),
    email: z.string(),
  })
  .passthrough();

// POST /assets video-upload 200 body. Returned when Content-Type is video/mp4.
// A DISTINCT shape from the image upload (OQ-2): only `mediaGenerationId`
// (`{ mediaGenerationId }`, reused as referenceVideo_1 on POST /videos) and
// `email` are always-present per the [assets] video Model; `media` (mirrors the
// image object with a video{} sub-object instead of image{}), `durationSeconds`,
// `width`, and `height` are all documented-optional. It carries no `workflow`
// field, so it is modeled as its own `.passthrough()` object rather than sharing
// the image schema.
// [assets] Model -> 200 OK (video upload). doc-derived, not yet live-verified.
export const GoogleFlowAssetsUploadVideoResponseSchema = z
  .object({
    media: z.object({}).passthrough().optional(),
    mediaGenerationId: z
      .object({ mediaGenerationId: z.string() })
      .passthrough(),
    durationSeconds: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    email: z.string(),
  })
  .passthrough();

// GET /assets/:mediaGenerationId retrieve 200 body: resolves a signed Google
// Cloud Storage download URL for a previously uploaded asset. Per the
// [assets-dl] Model both fields are always-present — `url` (signed GCS URL,
// valid ~6h) and `mediaGenerationId` (a plain string echo of the request path
// parameter, NOT the nested `{ mediaGenerationId }` object of the upload
// responses). `.passthrough()` preserves any undocumented extra.
// [assets-dl] Model -> 200 OK.
export const GoogleFlowAssetsRetrieveResponseSchema = z
  .object({
    url: z.string(),
    mediaGenerationId: z.string(),
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
export type GoogleFlowVideoMediaEntry = z.output<
  typeof GoogleFlowVideoMediaEntrySchema
>;
export type GoogleFlowVideosResponse = z.output<
  typeof GoogleFlowVideosResponseSchema
>;
export type GoogleFlowVideosUpscaleResponse = z.output<
  typeof GoogleFlowVideosUpscaleResponseSchema
>;
export type GoogleFlowVideosExtendResponse = z.output<
  typeof GoogleFlowVideosExtendResponseSchema
>;
export type GoogleFlowImageMediaEntry = z.output<
  typeof GoogleFlowImageMediaEntrySchema
>;
export type GoogleFlowImagesResponse = z.output<
  typeof GoogleFlowImagesResponseSchema
>;
export type GoogleFlowImagesUpscaleResponse = z.output<
  typeof GoogleFlowImagesUpscaleResponseSchema
>;
export type GoogleFlowVideosGifResponse = z.output<
  typeof GoogleFlowVideosGifResponseSchema
>;
export type GoogleFlowVideosConcatenateResponse = z.output<
  typeof GoogleFlowVideosConcatenateResponseSchema
>;
export type GoogleFlowJobRecord = z.output<typeof GoogleFlowJobRecordSchema>;
export type GoogleFlowJobCreatedResponse = z.output<
  typeof GoogleFlowJobCreatedResponseSchema
>;
export type GoogleFlowJobsStatsResponse = z.output<
  typeof GoogleFlowJobsStatsResponseSchema
>;
export type GoogleFlowAssetsUploadImageResponse = z.output<
  typeof GoogleFlowAssetsUploadImageResponseSchema
>;
export type GoogleFlowAssetsUploadVideoResponse = z.output<
  typeof GoogleFlowAssetsUploadVideoResponseSchema
>;
export type GoogleFlowAssetsRetrieveResponse = z.output<
  typeof GoogleFlowAssetsRetrieveResponseSchema
>;
