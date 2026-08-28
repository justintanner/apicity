import { describe, expect, it } from "vitest";

import {
  CreateTaskRequestSchema,
  FluxKontextGenerateRequestSchema,
  KIE_MEDIA_MODELS,
  KieClaudeRequestSchema,
  KieApiResponsesRequestSchema,
  KieGrokResponsesRequestSchema,
  KieMediaModelSchema,
  KieResponsesRequestSchema,
  MiniMaxH3ImageToVideoRequestSchema,
  MiniMaxH3ReferenceToVideoRequestSchema,
  Seedance2FastInputSchema,
  Seedance2InputSchema,
  Seedance2MiniInputSchema,
  Seedance2RequestSchema,
  Seedance25InputSchema,
  Seedance25RequestSchema,
  SunoGenerateRequestSchema,
  VeoExtendRequestSchema,
  VeoGenerateRequestSchema,
} from "@apicity/kie/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../packages/mcp-server/src/schema";

const HTTPS_URL = "https://example.com/image.png";
const LOCAL_PATH = "@asset/photo.png";
const SEEDANCE25_MODEL = "bytedance/seedance-2-5" as const;
const SEEDANCE25_PROMPT = "A quiet city street at sunrise.";
const SEEDANCE25_MEDIA = "https://example.com/media.bin";

function urlIssueMessages(
  result:
    | ReturnType<typeof Seedance2MiniInputSchema.safeParse>
    | ReturnType<typeof Seedance2InputSchema.safeParse>
    | ReturnType<typeof Seedance2FastInputSchema.safeParse>
): string[] {
  return (result.error?.issues ?? [])
    .filter((issue) => issue.path.includes("reference_image_urls"))
    .map((issue) => issue.message);
}

// All three seedance variants share the `.max(9)` cap, so that is asserted
// across the family. Media elements are plain strings family-wide: schemas
// validate the construction boundary, where fields may still hold local
// slugs such as `@asset/photo.png` (URL reachability is kie.ai's job at
// task-creation time). The presence axis differs: mini defaults to `[]`,
// the siblings stay `.optional()`.
const VARIANTS = [
  {
    name: "bytedance/seedance-2-mini",
    schema: Seedance2MiniInputSchema,
    base: {},
  },
  {
    name: "bytedance/seedance-2",
    schema: Seedance2InputSchema,
    base: { prompt: "a cinematic drone shot over a canyon" },
  },
  {
    name: "bytedance/seedance-2-fast",
    schema: Seedance2FastInputSchema,
    base: { prompt: "a cinematic drone shot over a canyon" },
  },
] as const;

describe("KIE Zod schema validation", () => {
  describe.each(VARIANTS)(
    "$name reference_image_urls cap",
    ({ schema, base }) => {
      it("accepts an at-cap array of 9 URLs", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: Array(9).fill(HTTPS_URL),
        });
        expect(result.success).toBe(true);
      });

      it("rejects an over-cap array of 10 URLs", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: Array(10).fill(HTTPS_URL),
        });
        expect(result.success).toBe(false);
        expect(urlIssueMessages(result).length).toBeGreaterThan(0);
      });
    }
  );

  // Review finding R-2: an earlier revision tightened `.url()` onto reference
  // elements, which is breaking for callers currently passing non-URL strings
  // (e.g. not-yet-uploaded local slugs). Pinned family-wide so the tightening
  // cannot return without its own requirement.
  describe.each(VARIANTS)(
    "$name accepts non-URL strings",
    ({ schema, base }) => {
      it("does not enforce a URL shape on reference_image_urls", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: [LOCAL_PATH],
        });
        expect(result.success).toBe(true);
      });
    }
  );

  describe("bytedance/seedance-2-mini local slug acceptance", () => {
    it("accepts local slugs in all three reference arrays", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: ["@img-ref-1"],
        reference_video_urls: ["@vid-ref-1"],
        reference_audio_urls: ["not-a-url"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts a valid HTTPS URL", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: [HTTPS_URL],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("seedance reference_image_urls presence semantics", () => {
    it("defaults mini's reference_image_urls to an empty array", () => {
      const result = Seedance2MiniInputSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.reference_image_urls).toEqual([]);
    });

    it("leaves the siblings' reference_image_urls absent when omitted", () => {
      const result = Seedance2InputSchema.safeParse({
        prompt: "a cinematic drone shot over a canyon",
      });
      expect(result.success).toBe(true);
      expect(result.data?.reference_image_urls).toBeUndefined();
    });
  });

  describe("bytedance/seedance-2-5", () => {
    it("accepts every documented field and enum member", () => {
      const result = Seedance25RequestSchema.safeParse({
        model: SEEDANCE25_MODEL,
        callBackUrl: "https://example.com/callback",
        input: {
          prompt: SEEDANCE25_PROMPT,
          first_frame_url: SEEDANCE25_MEDIA,
          last_frame_url: "asset://last-frame",
          return_last_frame: true,
          generate_audio: false,
          resolution: "480p",
          aspect_ratio: "21:9",
          duration: 30,
          output_format: "mov",
          web_search: true,
          nsfw_checker: true,
        },
      });

      expect(result.success).toBe(true);
      if (!result.success) throw result.error;
      expect(result.data.input).toMatchObject({
        prompt: SEEDANCE25_PROMPT,
        first_frame_url: SEEDANCE25_MEDIA,
        last_frame_url: "asset://last-frame",
        return_last_frame: true,
        generate_audio: false,
        resolution: "480p",
        aspect_ratio: "21:9",
        duration: 30,
        output_format: "mov",
        web_search: true,
        nsfw_checker: true,
      });
    });

    it("applies documented defaults while preserving text-only input", () => {
      const result = Seedance25RequestSchema.safeParse({
        model: SEEDANCE25_MODEL,
        input: { prompt: SEEDANCE25_PROMPT },
      });

      expect(result.success).toBe(true);
      if (!result.success) throw result.error;
      expect(result.data.input).toMatchObject({
        return_last_frame: false,
        generate_audio: true,
        resolution: "720p",
        aspect_ratio: "adaptive",
        duration: 5,
        output_format: "mp4",
        nsfw_checker: false,
      });
      expect(result.data.input.web_search).toBeUndefined();
    });

    it.each([-1, 4, 30])("accepts duration boundary %s", (duration) => {
      expect(Seedance25InputSchema.safeParse({ duration }).success).toBe(true);
    });

    it.each([3, 31, 4.5, "5"])("rejects duration %j", (duration) => {
      const result = Seedance25InputSchema.safeParse({ duration });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["duration"] }),
        ])
      );
    });

    it.each([
      ["reference_image_urls", 30],
      ["reference_video_urls", 10],
      ["reference_audio_urls", 10],
    ] as const)("accepts %s at its count boundary", (field, count) => {
      expect(
        Seedance25InputSchema.safeParse({
          [field]: Array(count).fill(SEEDANCE25_MEDIA),
        }).success
      ).toBe(true);
    });

    it.each([
      ["reference_image_urls", 31],
      ["reference_video_urls", 11],
      ["reference_audio_urls", 11],
    ] as const)("rejects %s over its count boundary", (field, count) => {
      const result = Seedance25InputSchema.safeParse({
        [field]: Array(count).fill(SEEDANCE25_MEDIA),
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: [field] })])
      );
    });

    it("allows empty reference arrays with frame mode", () => {
      const result = Seedance25RequestSchema.safeParse({
        model: SEEDANCE25_MODEL,
        input: {
          first_frame_url: SEEDANCE25_MEDIA,
          reference_image_urls: [],
          reference_video_urls: [],
          reference_audio_urls: [],
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts multimodal reference mode without frame URLs", () => {
      const result = Seedance25RequestSchema.safeParse({
        model: SEEDANCE25_MODEL,
        input: {
          prompt: SEEDANCE25_PROMPT,
          reference_image_urls: [SEEDANCE25_MEDIA],
          reference_video_urls: ["asset://reference-video"],
          reference_audio_urls: ["https://example.com/reference.wav"],
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects last-frame-only mode at the last_frame_url path", () => {
      const result = Seedance25RequestSchema.safeParse({
        model: SEEDANCE25_MODEL,
        input: { last_frame_url: SEEDANCE25_MEDIA },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["input", "last_frame_url"] }),
        ])
      );
    });

    it.each([
      "reference_image_urls",
      "reference_video_urls",
      "reference_audio_urls",
    ] as const)(
      "reports a field-specific issue when %s mixes with frames",
      (field) => {
        const result = Seedance25RequestSchema.safeParse({
          model: SEEDANCE25_MODEL,
          input: {
            first_frame_url: SEEDANCE25_MEDIA,
            [field]: [SEEDANCE25_MEDIA],
          },
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ["input", field] }),
          ])
        );
      }
    );

    it.each([
      "first_frame_url",
      "last_frame_url",
      "reference_image_urls",
      "reference_video_urls",
      "reference_audio_urls",
    ] as const)("rejects an empty asset:// value in %s", (field) => {
      const value = field.startsWith("reference_") ? ["asset://"] : "asset://";
      const result = Seedance25InputSchema.safeParse({ [field]: value });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: field.startsWith("reference_") ? [field, 0] : [field],
          }),
        ])
      );
    });

    it("keeps descriptor fields and the createTask guard in parity", () => {
      const fields = modelInputSchemas[SEEDANCE25_MODEL].fields;
      expect(Object.keys(fields).sort()).toEqual(
        [
          "aspect_ratio",
          "duration",
          "first_frame_url",
          "generate_audio",
          "last_frame_url",
          "nsfw_checker",
          "output_format",
          "prompt",
          "reference_audio_urls",
          "reference_image_urls",
          "reference_video_urls",
          "return_last_frame",
          "resolution",
          "web_search",
        ].sort()
      );
      expect(fields.duration).toMatchObject({
        type: "integer",
        enum: [-1, ...Array.from({ length: 27 }, (_, index) => index + 4)],
        default: 5,
      });
      expect(fields.resolution).toMatchObject({
        type: "string",
        enum: ["480p", "720p", "1080p"],
        default: "720p",
      });
      for (const resolution of fields.resolution.enum ?? []) {
        expect(Seedance25InputSchema.safeParse({ resolution }).success).toBe(
          true
        );
      }
      expect(fields.reference_image_urls.maxItems).toBe(30);
      expect(fields.reference_video_urls.maxItems).toBe(10);
      expect(fields.reference_audio_urls.maxItems).toBe(10);
      expect(CREATE_TASK_GUARDS[SEEDANCE25_MODEL]).toBe(
        Seedance25RequestSchema
      );
    });
  });

  describe("bytedance/seedance-2-5 resolution vocabulary", () => {
    const requestWith = (resolution?: string) => ({
      model: SEEDANCE25_MODEL,
      input: {
        prompt: SEEDANCE25_PROMPT,
        ...(resolution === undefined ? {} : { resolution }),
      },
    });

    it.each(["480p", "720p", "1080p"])(
      "accepts and round-trips %s",
      (resolution) => {
        const result = Seedance25RequestSchema.safeParse(
          requestWith(resolution)
        );
        expect(result.success).toBe(true);
        expect(result.data?.input.resolution).toBe(resolution);
      }
    );

    it.each(["1080P", "4k", "2160p", "720"])(
      "rejects %s as an out-of-vocabulary resolution",
      (resolution) => {
        const result = Seedance25RequestSchema.safeParse(
          requestWith(resolution)
        );
        expect(result.success).toBe(false);
        expect(
          (result.error?.issues ?? []).some((issue) =>
            issue.path.includes("resolution")
          )
        ).toBe(true);
      }
    );

    it("defaults an omitted resolution to 720p", () => {
      const result = Seedance25RequestSchema.safeParse(requestWith());
      expect(result.success).toBe(true);
      expect(result.data?.input.resolution).toBe("720p");
    });
  });

  // The 4K member's exact spelling is load-bearing on both sides. Upstream
  // takes only lowercase "4k" per
  // https://docs.kie.ai/market/bytedance/seedance-2 — uppercase "4K" answered
  // {"code":422,"msg":"Invalid resolution"} when it was tried live on
  // 2026-08-06 (ac-8cfo6r WI-4, first attempt; not retained as a committed
  // fixture) — and @apicity/cost keys the tier off case-sensitive
  // "4k|i2v" / "4k|t2v"
  // (packages/provider/cost/src/pricing/kie.ts), so a drift to "4K" would
  // either be refused on the wire or miss the rate table and quote $0. Pin the
  // spelling against the request schema CREATE_TASK_GUARDS actually enforces.
  // The end-to-end half of this pin — schema-valid payload reaches the rate
  // keys — lives in tests/unit/cost-pricing.test.ts.
  describe("bytedance/seedance-2 resolution 4k spelling", () => {
    const requestWith = (resolution?: string) => ({
      model: "bytedance/seedance-2",
      input: {
        prompt: "a cinematic drone shot over a canyon",
        ...(resolution === undefined ? {} : { resolution }),
      },
    });

    it('accepts the lowercase "4k" member', () => {
      const result = Seedance2RequestSchema.safeParse(requestWith("4k"));
      expect(result.success).toBe(true);
      expect(result.data?.input.resolution).toBe("4k");
    });

    it.each(["4K", "2160p"])(
      "rejects %s as an out-of-vocabulary resolution",
      (resolution) => {
        const result = Seedance2RequestSchema.safeParse(
          requestWith(resolution)
        );
        expect(result.success).toBe(false);
        expect(
          (result.error?.issues ?? []).some((issue) =>
            issue.path.includes("resolution")
          )
        ).toBe(true);
      }
    );

    it("still accepts a payload that omits resolution", () => {
      const result = Seedance2RequestSchema.safeParse(requestWith());
      expect(result.success).toBe(true);
      expect(result.data?.input.resolution).toBeUndefined();
    });
  });

  describe("MiniMax H3 request schemas", () => {
    it.each([
      {
        model: "minimax-h3/text-to-video",
        input: {
          prompt: "A lighthouse sweeps across a moonlit sea.",
          aspect_ratio: "16:9",
          duration: 4,
          resolution: "768P",
        },
      },
      {
        model: "minimax-h3/image-to-video",
        input: {
          prompt: "Animate the final frame with a slow camera move.",
          last_frame_url: "oss://examples/final-frame.png",
          duration: 15,
          resolution: "2K",
        },
      },
      {
        model: "minimax-h3/reference-to-video",
        input: {
          prompt: "Match the reference motion and ambient sound.",
          reference_video_urls: ["http://example.com/reference.mp4"],
          reference_audio_urls: ["https://example.com/reference.mp3"],
          aspect_ratio: "adaptive",
          duration: 4,
        },
      },
    ])("accepts and preserves $model through createTask", (request) => {
      const result = CreateTaskRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(request);
    });

    it("rejects image-to-video without either boundary frame", () => {
      const result = MiniMaxH3ImageToVideoRequestSchema.safeParse({
        model: "minimax-h3/image-to-video",
        input: { prompt: "Animate this scene.", duration: 4 },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["input", "first_frame_url"],
          }),
        ])
      );
    });

    it("rejects audio-only reference-to-video", () => {
      const result = MiniMaxH3ReferenceToVideoRequestSchema.safeParse({
        model: "minimax-h3/reference-to-video",
        input: {
          prompt: "Use this soundtrack.",
          reference_audio_urls: ["https://example.com/reference.mp3"],
          duration: 4,
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["input", "reference_image_urls"],
          }),
        ])
      );
    });

    it.each([
      {
        model: "minimax-h3/text-to-video",
        input: {
          prompt: "Strict text request.",
          aspect_ratio: "16:9",
          duration: 4,
          first_frame_url: "https://example.com/frame.png",
        },
      },
      {
        model: "minimax-h3/image-to-video",
        input: {
          prompt: "Strict image request.",
          first_frame_url: "https://example.com/frame.png",
          aspect_ratio: "16:9",
          duration: 4,
        },
      },
    ])("rejects cross-mode fields for $model", (request) => {
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(false);
    });

    it("rejects unsupported media-address protocols", () => {
      expect(
        MiniMaxH3ImageToVideoRequestSchema.safeParse({
          model: "minimax-h3/image-to-video",
          input: {
            prompt: "Animate this frame.",
            first_frame_url: "ftp://example.com/frame.png",
            duration: 4,
          },
        }).success
      ).toBe(false);
    });
  });

  // pixverse-v6/text-to-video keeps `prompt`, `aspect_ratio`, `quality`, and
  // `duration` required even though the upstream spec documents defaults
  // (16:9 / 720p / 5) — the documented-defaults trap seedream/seedance
  // already hit, so the server never applies them and neither do we. Every
  // case goes through CreateTaskRequestSchema, the same createTask boundary
  // the kie.ts guard runs, which also proves the request schema is wired
  // into the MediaGenerationRequestSchema union (BR-3).
  describe("pixverse-v6/text-to-video", () => {
    const SPEC_PROMPT =
      "A cinematic sunrise illuminates a mist-shrouded mountain lake; the " +
      "camera slowly sweeps across the water's surface as a flock of birds " +
      "flies overhead.";
    const specRequest = {
      model: "pixverse-v6/text-to-video",
      input: {
        prompt: SPEC_PROMPT,
        aspect_ratio: "16:9",
        quality: "720p",
        duration: 5,
        generate_audio_switch: false,
        generate_multi_clip_switch: false,
        seed: 123456789,
      },
    };

    it("parses and round-trips the spec example payload", () => {
      const parsed = CreateTaskRequestSchema.safeParse(specRequest);
      expect(parsed.success).toBe(true);
      expect(parsed.data).toEqual(specRequest);
    });

    it("defaults both generate switches to false when omitted", () => {
      const input: Record<string, unknown> = { ...specRequest.input };
      delete input.generate_audio_switch;
      delete input.generate_multi_clip_switch;
      const parsed = CreateTaskRequestSchema.safeParse({
        ...specRequest,
        input,
      });
      expect(parsed.success).toBe(true);
      expect(parsed.data?.input).toMatchObject({
        generate_audio_switch: false,
        generate_multi_clip_switch: false,
      });
    });

    it.each(["prompt", "aspect_ratio", "quality", "duration"])(
      "rejects a payload missing the required %s",
      (field) => {
        const input: Record<string, unknown> = { ...specRequest.input };
        delete input[field];
        expect(
          CreateTaskRequestSchema.safeParse({ ...specRequest, input }).success
        ).toBe(false);
      }
    );

    it.each(["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"])(
      "accepts aspect_ratio %s",
      (aspect_ratio) => {
        expect(
          CreateTaskRequestSchema.safeParse({
            ...specRequest,
            input: { ...specRequest.input, aspect_ratio },
          }).success
        ).toBe(true);
      }
    );

    it.each(["4:5", "16:10"])("rejects aspect_ratio %s", (aspect_ratio) => {
      expect(
        CreateTaskRequestSchema.safeParse({
          ...specRequest,
          input: { ...specRequest.input, aspect_ratio },
        }).success
      ).toBe(false);
    });

    it.each(["360p", "540p", "720p", "1080p"])(
      "accepts quality %s",
      (quality) => {
        expect(
          CreateTaskRequestSchema.safeParse({
            ...specRequest,
            input: { ...specRequest.input, quality },
          }).success
        ).toBe(true);
      }
    );

    it.each(["480p", "2160p"])("rejects quality %s", (quality) => {
      expect(
        CreateTaskRequestSchema.safeParse({
          ...specRequest,
          input: { ...specRequest.input, quality },
        }).success
      ).toBe(false);
    });

    it.each([1, 15])(
      "accepts duration at the inclusive boundary %s",
      (duration) => {
        expect(
          CreateTaskRequestSchema.safeParse({
            ...specRequest,
            input: { ...specRequest.input, duration },
          }).success
        ).toBe(true);
      }
    );

    it.each([0, 16])("rejects duration %s", (duration) => {
      expect(
        CreateTaskRequestSchema.safeParse({
          ...specRequest,
          input: { ...specRequest.input, duration },
        }).success
      ).toBe(false);
    });

    it.each([0, 2147483647])(
      "accepts seed at the inclusive boundary %s",
      (seed) => {
        expect(
          CreateTaskRequestSchema.safeParse({
            ...specRequest,
            input: { ...specRequest.input, seed },
          }).success
        ).toBe(true);
      }
    );

    it.each([-1, 2147483648])("rejects seed %s", (seed) => {
      expect(
        CreateTaskRequestSchema.safeParse({
          ...specRequest,
          input: { ...specRequest.input, seed },
        }).success
      ).toBe(false);
    });
  });

  // ------------------------------------------------------------------------
  // The four remaining PixVerse V6 models (REQ-002..REQ-005)
  // ------------------------------------------------------------------------
  //
  // Same boundary as the text-to-video block above — CreateTaskRequestSchema,
  // not the per-model schema — so each of the four is proven joined into the
  // MediaGenerationRequest union and reachable through the id the caller
  // actually sends (BR-1). Required-field, quality, duration, seed, and prompt
  // behaviour is identical family-wide and is table-driven here; the fields
  // only one model declares (image_urls, image_references, aspect_ratio) and
  // the two exclusivity rules get their own blocks below.

  const PIXVERSE_PROMPT =
    "The subject walks through the neon-lit alley as rain begins to fall.";
  const PIXVERSE_QUALITIES = ["360p", "540p", "720p", "1080p"];
  const PIXVERSE_ASPECT_RATIOS = [
    "16:9",
    "4:3",
    "1:1",
    "3:4",
    "9:16",
    "2:3",
    "3:2",
    "21:9",
  ];
  const FRAME_URL = "https://example.com/frame.png";
  const REFERENCE_URL = "https://example.com/subject.png";

  // CreateTaskRequestSchema's output is a union of ~50 per-model shapes, so a
  // model-specific field is not readable off it without widening. The
  // assertions below are the point; the static type of the union is not.
  function parsedInput(result: {
    data?: { input: unknown };
  }): Record<string, unknown> {
    return (result.data?.input ?? {}) as Record<string, unknown>;
  }

  interface NestedIssue {
    readonly path?: readonly PropertyKey[];
    readonly message?: string;
    readonly errors?: readonly (readonly NestedIssue[])[];
  }

  // A failed union is reported one of two ways: as the issues of the single
  // branch zod judged the intended match, or — when no branch is a clear
  // match — as one `invalid_union` issue carrying every branch's issues nested
  // under `errors`. Which one comes back depends on the payload, so flatten to
  // leaves rather than writing assertions against one shape.
  function issueLeaves(issues: readonly NestedIssue[] = []): NestedIssue[] {
    return issues.flatMap((issue) =>
      issue.errors ? issueLeaves(issue.errors.flat()) : [issue]
    );
  }

  const issueMessages = (result: {
    error?: { issues: readonly NestedIssue[] };
  }) => issueLeaves(result.error?.issues).map((issue) => issue.message);

  const issuePaths = (result: { error?: { issues: readonly NestedIssue[] } }) =>
    issueLeaves(result.error?.issues).map((issue) => issue.path ?? []);

  interface PixverseFamilyCase {
    readonly model: string;
    readonly input: Record<string, unknown>;
    readonly required: readonly string[];
  }

  const PIXVERSE_V6_MODELS: readonly PixverseFamilyCase[] = [
    {
      model: "pixverse-v6/image-to-video",
      input: {
        prompt: PIXVERSE_PROMPT,
        image_urls: [FRAME_URL],
        quality: "720p",
        duration: 5,
      },
      // `duration` is deliberately absent: it is required only in the sense
      // that exactly one of duration/template_id must be present, which the
      // exclusivity block below owns.
      required: ["prompt", "image_urls", "quality"],
    },
    {
      model: "pixverse-v6/transition",
      input: {
        prompt: PIXVERSE_PROMPT,
        first_frame_image_url: "https://example.com/first.png",
        last_frame_image_url: "https://example.com/last.png",
        quality: "720p",
        duration: 5,
      },
      required: [
        "prompt",
        "first_frame_image_url",
        "last_frame_image_url",
        "quality",
        "duration",
      ],
    },
    {
      model: "pixverse-v6/extend",
      input: {
        prompt: PIXVERSE_PROMPT,
        duration: 5,
        quality: "720p",
        video_url: "https://example.com/clip.mp4",
      },
      // Likewise: taskId/video_url is an exclusivity rule, not a plain
      // required field.
      required: ["prompt", "duration", "quality"],
    },
    {
      model: "pixverse-v6/reference-to-video",
      input: {
        prompt: PIXVERSE_PROMPT,
        image_references: [{ image_url: REFERENCE_URL }],
        aspect_ratio: "16:9",
        quality: "720p",
        duration: 5,
      },
      required: [
        "prompt",
        "image_references",
        "aspect_ratio",
        "quality",
        "duration",
      ],
    },
  ];

  describe.each(PIXVERSE_V6_MODELS)("$model", ({ model, input, required }) => {
    const parse = (patch: Record<string, unknown>) =>
      CreateTaskRequestSchema.safeParse({
        model,
        input: { ...input, ...patch },
      });

    it("accepts the documented payload", () => {
      expect(parse({}).success).toBe(true);
    });

    it.each(required)("rejects a payload missing the required %s", (field) => {
      const partial: Record<string, unknown> = { ...input };
      delete partial[field];
      expect(
        CreateTaskRequestSchema.safeParse({ model, input: partial }).success
      ).toBe(false);
    });

    it.each(PIXVERSE_QUALITIES)("accepts quality %s", (quality) => {
      expect(parse({ quality }).success).toBe(true);
    });

    it.each(["480p", "2160p"])("rejects quality %s", (quality) => {
      expect(parse({ quality }).success).toBe(false);
    });

    it.each([1, 15])(
      "accepts duration at the inclusive boundary %s",
      (duration) => {
        expect(parse({ duration }).success).toBe(true);
      }
    );

    it.each([0, 16])("rejects duration %s", (duration) => {
      expect(parse({ duration }).success).toBe(false);
    });

    it.each([0, 2147483647])(
      "accepts seed at the inclusive boundary %s",
      (seed) => {
        expect(parse({ seed }).success).toBe(true);
      }
    );

    it.each([-1, 2147483648])("rejects seed %s", (seed) => {
      expect(parse({ seed }).success).toBe(false);
    });

    it.each([3, 5000])("accepts a prompt of %s characters", (length) => {
      expect(parse({ prompt: "p".repeat(length) }).success).toBe(true);
    });

    it.each([2, 5001])("rejects a prompt of %s characters", (length) => {
      expect(parse({ prompt: "p".repeat(length) }).success).toBe(false);
    });
  });

  // BR-3/BR-4. image_urls is 1..2 (upstream states "up to 2" in prose only),
  // duration is exclusive with template_id because a template fixes the
  // duration, and there is no aspect_ratio on this model at all.
  describe("pixverse-v6/image-to-video cardinality and exclusivity", () => {
    const base = {
      prompt: PIXVERSE_PROMPT,
      image_urls: [FRAME_URL],
      quality: "720p",
    };
    const parseInput = (patch: Record<string, unknown>) =>
      CreateTaskRequestSchema.safeParse({
        model: "pixverse-v6/image-to-video",
        input: { ...base, duration: 5, ...patch },
      });

    it.each([1, 2])("accepts %s image_urls", (count) => {
      expect(
        parseInput({ image_urls: Array(count).fill(FRAME_URL) }).success
      ).toBe(true);
    });

    it.each([0, 3])("rejects %s image_urls", (count) => {
      expect(
        parseInput({ image_urls: Array(count).fill(FRAME_URL) }).success
      ).toBe(false);
    });

    it.each([
      ["duration alone", { duration: 5 }],
      ["template_id alone", { template_id: "t-neon-rain" }],
    ])("accepts a payload carrying %s", (_label, patch) => {
      expect(
        CreateTaskRequestSchema.safeParse({
          model: "pixverse-v6/image-to-video",
          input: { ...base, ...patch },
        }).success
      ).toBe(true);
    });

    it.each([
      ["both duration and template_id", { duration: 5, template_id: "t-1" }],
      ["neither duration nor template_id", {}],
    ])("rejects a payload carrying %s", (_label, patch) => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "pixverse-v6/image-to-video",
        input: { ...base, ...patch },
      });

      expect(result.success).toBe(false);
      expect(issueMessages(result)).toContain(
        "pixverse-v6/image-to-video requires exactly one of duration or template_id"
      );
    });

    // BR-3: no aspect_ratio field upstream. A caller who copies the
    // text-to-video payload gets it dropped rather than silently honoured.
    it("carries no aspect_ratio field — a supplied one is stripped", () => {
      const result = parseInput({ aspect_ratio: "16:9" });

      expect(result.success).toBe(true);
      expect(parsedInput(result)).not.toHaveProperty("aspect_ratio");
    });
  });

  // BR-6. Upstream models `input` as a two-variant anyOf keyed on the source
  // field; the schema's superRefine is that rule, stated once.
  describe("pixverse-v6/extend source exclusivity", () => {
    const base = { prompt: PIXVERSE_PROMPT, duration: 5, quality: "720p" };
    const parseInput = (patch: Record<string, unknown>) =>
      CreateTaskRequestSchema.safeParse({
        model: "pixverse-v6/extend",
        input: { ...base, ...patch },
      });

    it.each([
      ["taskId", { taskId: "task-abc123" }],
      ["video_url", { video_url: "https://example.com/clip.mp4" }],
    ])("accepts a payload sourced by %s alone", (_label, patch) => {
      expect(parseInput(patch).success).toBe(true);
    });

    it.each([
      [
        "both taskId and video_url",
        { taskId: "task-abc123", video_url: "https://example.com/clip.mp4" },
      ],
      ["neither taskId nor video_url", {}],
    ])("rejects a payload carrying %s", (_label, patch) => {
      const result = parseInput(patch);

      expect(result.success).toBe(false);
      expect(issueMessages(result)).toContain(
        "pixverse-v6/extend requires exactly one of taskId or video_url"
      );
    });
  });

  // BR-7. 1..7 references, each an object with a required image_url plus an
  // optional type (defaulting to subject) and an optional 1..30 char ref_name
  // that must be unique across the list.
  describe("pixverse-v6/reference-to-video image_references", () => {
    const base = {
      prompt: PIXVERSE_PROMPT,
      aspect_ratio: "16:9",
      quality: "720p",
      duration: 5,
    };
    const parseReferences = (image_references: unknown) =>
      CreateTaskRequestSchema.safeParse({
        model: "pixverse-v6/reference-to-video",
        input: { ...base, image_references },
      });
    const references = (count: number) =>
      Array.from({ length: count }, (_unused, index) => ({
        image_url: `https://example.com/reference-${index}.png`,
      }));

    it.each([1, 7])("accepts %s image_references", (count) => {
      expect(parseReferences(references(count)).success).toBe(true);
    });

    it.each([0, 8])("rejects %s image_references", (count) => {
      expect(parseReferences(references(count)).success).toBe(false);
    });

    it("rejects a reference that omits image_url", () => {
      const result = parseReferences([{ type: "subject", ref_name: "hero" }]);

      expect(result.success).toBe(false);
      expect(
        issuePaths(result).some((path) => path.includes("image_url"))
      ).toBe(true);
    });

    it("accepts a background reference with a 30-character ref_name", () => {
      const ref_name = "r".repeat(30);
      const result = parseReferences([
        { image_url: REFERENCE_URL, type: "background", ref_name },
      ]);

      expect(result.success).toBe(true);
      expect(parsedInput(result).image_references).toEqual([
        { image_url: REFERENCE_URL, type: "background", ref_name },
      ]);
    });

    it("rejects a ref_name of 31 characters", () => {
      expect(
        parseReferences([
          { image_url: REFERENCE_URL, ref_name: "r".repeat(31) },
        ]).success
      ).toBe(false);
    });

    it("defaults an omitted reference type to subject", () => {
      const result = parseReferences([{ image_url: REFERENCE_URL }]);

      expect(result.success).toBe(true);
      expect(parsedInput(result).image_references).toEqual([
        { image_url: REFERENCE_URL, type: "subject" },
      ]);
    });

    // Upstream: "ref_name must be unique within the same list" — a duplicate
    // makes an `@name` mention in the prompt ambiguous. Unnamed references are
    // exempt, so two of them are not a collision.
    it("rejects duplicate ref_name values", () => {
      const result = parseReferences([
        { image_url: REFERENCE_URL, ref_name: "hero" },
        { image_url: FRAME_URL, ref_name: "hero" },
      ]);

      expect(result.success).toBe(false);
      expect(issueMessages(result)).toContain(
        "pixverse-v6/reference-to-video requires unique ref_name values within image_references (duplicate: hero)"
      );
    });

    it("accepts several references that all omit ref_name", () => {
      expect(parseReferences(references(3)).success).toBe(true);
    });

    it.each(PIXVERSE_ASPECT_RATIOS)(
      "accepts aspect_ratio %s",
      (aspect_ratio) => {
        expect(
          CreateTaskRequestSchema.safeParse({
            model: "pixverse-v6/reference-to-video",
            input: {
              ...base,
              aspect_ratio,
              image_references: references(1),
            },
          }).success
        ).toBe(true);
      }
    );

    it.each(["4:5", "16:10"])("rejects aspect_ratio %s", (aspect_ratio) => {
      expect(
        CreateTaskRequestSchema.safeParse({
          model: "pixverse-v6/reference-to-video",
          input: {
            ...base,
            aspect_ratio,
            image_references: references(1),
          },
        }).success
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Model-enum escape hatches (TRI-002…TRI-008)
// ---------------------------------------------------------------------------
//
// CLAUDE.md -> Code Conventions -> "Model-identifier enums stay open": a field
// naming an upstream *model registry* is `z.enum([...known]).or(<alias>)`,
// where the alias is a named `z.string().regex(...)` matching that vendor's
// real id grammar — never a bare `.or(z.string())`, which accepts typos. The
// known ids stay enumerated so MCP clients keep autocomplete.
//
// Each opened field is asserted along four axes: BR-1 every listed id still
// parses, BR-2 a plausible not-yet-listed id that matches the family grammar
// parses, BR-3/BR-4 near-miss typos and foreign-family ids are rejected, and
// BR-6 the enum branch survives conversion to MCP tool input JSON Schema.

interface ModelParseOutcome {
  success: boolean;
  flagsModel: boolean;
}

function modelOutcome(result: {
  success: boolean;
  error?: { issues: readonly { path: readonly PropertyKey[] }[] };
}): ModelParseOutcome {
  return {
    success: result.success,
    flagsModel: (result.error?.issues ?? []).some((issue) =>
      issue.path.includes("model")
    ),
  };
}

function modelBranches(schema: JsonSchema): JsonSchema[] {
  const properties = schema.properties as Record<string, JsonSchema>;
  return properties.model.anyOf as JsonSchema[];
}

const CLAUDE_MESSAGES = [{ role: "user", content: "Hello" }];

const OPENED_MODEL_FIELDS = [
  {
    triage: "TRI-002",
    label: "FluxKontextGenerateRequestSchema.model",
    listed: ["flux-kontext-pro", "flux-kontext-max"],
    // A future Flux Kontext tier: same family prefix, new variant segment.
    aliases: ["flux-kontext-ultra"],
    // BR-3 bare family name and casing typo; BR-4 a sibling Flux family and a
    // missing separator.
    rejected: [
      "flux-kontext",
      "flux-pro",
      "fluxkontext-pro",
      "FLUX-KONTEXT-PRO",
    ],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        FluxKontextGenerateRequestSchema.safeParse({
          prompt: "a paper boat crossing a quiet pond",
          model,
        })
      ),
    jsonSchema: (): JsonSchema =>
      zodToJsonSchema(FluxKontextGenerateRequestSchema),
  },
  {
    triage: "TRI-003",
    label: "KieResponsesRequestSchema.model",
    listed: [
      "gpt-5-4",
      "gpt-5-5",
      "gpt-5-6-luna",
      "gpt-5-6-sol",
      "gpt-5-6-terra",
    ],
    aliases: ["gpt-6", "gpt-5-5-mini"],
    // BR-3 bare family and spelled-out/truncated versions; BR-4 a Grok id on
    // the OpenAI-only field.
    rejected: ["gpt", "gpt-five", "gpt-", "grok-4-5"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        KieResponsesRequestSchema.safeParse({
          model,
          input: "summarize this thread",
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(KieResponsesRequestSchema),
  },
  {
    triage: "TRI-004",
    label: "KieGrokResponsesRequestSchema.model",
    listed: ["grok-4-5", "grok-4-6"],
    aliases: ["grok-5", "grok-4-5-fast"],
    // BR-4 `gpt-5-5` is the sibling endpoint's listed id and must not cross.
    rejected: ["grok", "grok-four", "gpt-5-5"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        KieGrokResponsesRequestSchema.safeParse({
          model,
          input: "summarize this thread",
        })
      ),
    jsonSchema: (): JsonSchema =>
      zodToJsonSchema(KieGrokResponsesRequestSchema),
  },
  {
    triage: "TRI-004b",
    label: "KieApiResponsesRequestSchema.model",
    listed: [
      "gpt-5-codex",
      "gpt-5.1-codex",
      "gpt-5.2-codex",
      "gpt-5.3-codex",
      "gpt-5.4-codex",
    ],
    aliases: ["gpt-5.5-codex", "gpt-6-codex"],
    // BR-3 bare family / missing -codex suffix; BR-4 sibling gpt-5-5 and grok.
    rejected: ["gpt", "gpt-5", "gpt-5-5", "gpt-5-codex-extra!", "grok-4-5"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        KieApiResponsesRequestSchema.safeParse({
          model,
          input: "summarize this thread",
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(KieApiResponsesRequestSchema),
  },
  {
    triage: "TRI-005",
    label: "VeoGenerateRequestSchema.model",
    listed: ["veo3", "veo3_fast", "veo3_lite"],
    aliases: ["veo4_fast"],
    // BR-3 kie's Veo grammar is underscored, so the hyphenated `veo3-fast` and
    // googleflow's dotted `veo-3.1-fast` are both typos here; BR-4 `gpt-4o`.
    rejected: ["veo3-fast", "veo-3.1-fast", "veo", "gpt-4o"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        VeoGenerateRequestSchema.safeParse({
          prompt: "a cat playing piano",
          model,
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(VeoGenerateRequestSchema),
  },
  {
    triage: "TRI-006",
    label: "SunoGenerateRequestSchema.model",
    listed: ["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"],
    aliases: ["V6", "V5_5PLUS"],
    // BR-3 wrong case and wrong separator on listed ids; BR-4 an ElevenLabs
    // style music id.
    rejected: ["v5", "V", "V4-5", "V4_5plus", "music_v1"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        SunoGenerateRequestSchema.safeParse({
          prompt: "a happy pop song about summer",
          model,
          instrumental: false,
          customMode: true,
          callBackUrl: "https://example.com/cb",
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(SunoGenerateRequestSchema),
  },
  {
    triage: "TRI-007",
    label: "KieClaudeRequestSchema.model",
    listed: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-5"],
    aliases: ["claude-opus-5-0"],
    // BR-3 versionless and familyless near-misses of a listed id; BR-4 a GPT
    // id on a Claude-only field.
    rejected: ["claude-sonnet", "claude-4-6", "claude", "gpt-5-5"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        KieClaudeRequestSchema.safeParse({
          model,
          messages: CLAUDE_MESSAGES,
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(KieClaudeRequestSchema),
  },
] as const;

describe.each(OPENED_MODEL_FIELDS)(
  "$triage $label",
  ({ listed, aliases, rejected, parse, jsonSchema }) => {
    it.each(listed)("accepts the listed model %s", (model) => {
      expect(parse(model).success).toBe(true);
    });

    it.each(aliases)("accepts the alias %s", (model) => {
      expect(parse(model).success).toBe(true);
    });

    it.each(rejected)("rejects the model %j", (model) => {
      const outcome = parse(model);
      expect(outcome.success).toBe(false);
      expect(outcome.flagsModel).toBe(true);
    });

    it("rejects a non-string model", () => {
      expect(parse(42).success).toBe(false);
    });

    // BR-6. Every listed id also matches the alias regex — checked here rather
    // than by eye — so the enum branch carries zero validation weight and
    // exists only for MCP client autocomplete. Nothing else pins it, so a
    // "dead code" cleanup could delete it while the suite stayed green. This
    // is that pin.
    it("keeps every listed id in the enum branch of the MCP JSON Schema", () => {
      const branches = modelBranches(jsonSchema());

      expect(branches).toHaveLength(2);
      expect(branches[0]).toMatchObject({
        type: "string",
        enum: [...listed],
      });

      const alias = new RegExp(String(branches[1].pattern));
      expect(branches[1].type).toBe("string");
      expect(listed.filter((id) => !alias.test(id))).toEqual([]);
    });
  }
);

// TRI-008. `fast | quality` is a rendering-tier vocabulary, not a model
// registry — the counterexample class CLAUDE.md names alongside `quality` and
// SimpleFunctionsModelSchema. BR-5: opening the sibling Veo generate field
// must not loosen this one, directly or through a shared alias.
describe("TRI-008 VeoExtendRequestSchema.model stays a closed set", () => {
  const extendBase = { taskId: "task-123", prompt: "extend the video" };

  it.each(["fast", "quality"])("accepts the listed tier %s", (model) => {
    const result = VeoExtendRequestSchema.safeParse({ ...extendBase, model });
    expect(result.success).toBe(true);
  });

  it.each(["veo3", "veo3_fast", "veo4_fast", "medium", "invalid"])(
    "still rejects %j",
    (model) => {
      const outcome = modelOutcome(
        VeoExtendRequestSchema.safeParse({ ...extendBase, model })
      );
      expect(outcome.success).toBe(false);
      expect(outcome.flagsModel).toBe(true);
    }
  );

  it("emits a bare enum, not an anyOf hatch, in the MCP JSON Schema", () => {
    const properties = zodToJsonSchema(VeoExtendRequestSchema)
      .properties as Record<string, JsonSchema>;

    expect(properties.model.anyOf).toBeUndefined();
    expect(properties.model).toMatchObject({
      type: "string",
      enum: ["fast", "quality"],
    });
  });
});

// ---------------------------------------------------------------------------
// TRI-001 KieMediaModelSchema — one escape hatch per vendor family
// ---------------------------------------------------------------------------
//
// KieMediaModelSchema is kie's aggregator catalogue: 120 ids drawn from a dozen
// unrelated vendors behind one `createTask` endpoint. REQ-006 forbids opening
// it with a single catch-all regex, so it carries one alias per vendor family
// while singletons and fixed-product sets (omnihuman + sub-tasks, volcengine,
// gemini-omni, sora-watermark, recraft, topaz, infinitalk, z-image), Flux-2
// (four exact modes), Ideogram (six exact modes), Hailuo (six exact modes),
// the three exact MiniMax H3 modes, the Google market enum set (two TTS + five
// Imagen/Nano Banana), and unversioned Qwen v1 stay enumerated with no alias
// at all.
//
// BR-4 needs care here that the single-family schemas above do not. A foreign
// *catalogue* id — `happyhorse/video-edit` on the Kling family — is accepted by
// KieMediaModelSchema, through the enum branch, and always was: the whole point
// of the aggregator is that all 120 are valid. So cross-family leakage cannot be
// asserted with safeParse; it is asserted structurally instead, against the
// alias patterns themselves ("partitions the catalogue" below). The per-family
// `rejected` lists therefore carry BR-3 near-miss typos plus BR-4 ids from
// vendors kie fronts on *other* surfaces (`grok-4-5`, `gpt-5-5`) or under other
// providers' grammars (`wan2.7-i2v`, `qwen-image-2.0`, `eleven_flash_v3`),
// none of which is a member of this catalogue.

const MEDIA_MODEL_FAMILIES = [
  {
    family: "Kling",
    listed: [
      "kling-3.0/video",
      "kling-3.0/motion-control",
      "kling/v3-turbo-image-to-video",
      "kling/v3-turbo-text-to-video",
      "kling-2.6/image-to-video",
      "kling-2.6/motion-control",
      "kling-2.6/text-to-video",
      "kling/ai-avatar-pro",
      "kling/ai-avatar-standard",
      "kling/v2-1-master-image-to-video",
      "kling/v2-1-master-text-to-video",
      "kling/v2-1-pro",
      "kling/v2-1-standard",
      "kling/v2-5-turbo-image-to-video-pro",
      "kling/v2-5-turbo-text-to-video-pro",
    ],
    aliases: ["kling-3.5/video", "kling/v4-turbo-text-to-video"],
    rejected: ["kling", "kling-3.0", "kling3.0/video", "Kling-3.0/video"],
  },
  {
    family: "Kling Omni",
    listed: [
      "kling-3.0-omni/text-to-video",
      "kling-3.0-omni/image-to-video",
      "kling-3.0-omni/reference-to-video",
      "kling-3.0-omni/transformation",
    ],
    aliases: ["kling-3.5-omni/text-to-video", "kling-3.0-omni/video-edit"],
    rejected: [
      "kling-3.0-omni",
      "kling3.0-omni/text-to-video",
      "kling-omni/text-to-video",
      "Kling-3.0-Omni/text-to-video",
    ],
  },
  {
    family: "Grok Imagine",
    listed: [
      "grok-imagine/text-to-image",
      "grok-imagine/image-to-image",
      "grok-imagine/text-to-video",
      "grok-imagine/image-to-video",
      "grok-imagine/extend",
      "grok-imagine/upscale",
      "grok-imagine-video-1-5-preview",
    ],
    aliases: ["grok-imagine/text-to-audio", "grok-imagine-video-2-0-preview"],
    // `grok-4-5` is kie's own Grok *responses* id — a different surface, and
    // not a media model.
    rejected: ["grok-imagine", "grokimagine/extend", "grok-4-5"],
  },
  {
    family: "Nano Banana",
    listed: ["nano-banana-pro", "nano-banana-2", "nano-banana-2-lite"],
    aliases: ["nano-banana-3", "nano-banana-pro-max"],
    rejected: ["nano-banana", "nanobanana-2", "nano_banana_2", "NANO-BANANA-2"],
  },
  {
    family: "GPT Image",
    listed: [
      "gpt-image/1.5-image-to-image",
      "gpt-image/1.5-text-to-image",
      "gpt-image-2-image-to-image",
      "gpt-image-2-text-to-image",
    ],
    aliases: ["gpt-image-3-text-to-image", "gpt-image/2.5-image-to-image"],
    rejected: [
      "gpt-image",
      "gpt-image-2",
      "gptimage-2-text-to-image",
      "gpt-5-5",
    ],
  },
  {
    family: "Seedream",
    listed: [
      "seedream/5-lite-image-to-image",
      "seedream/5-lite-text-to-image",
      "seedream/5-pro-image-to-image",
      "seedream/5-pro-text-to-image",
      "seedream/5-pro-layer-decomposition",
      "seedream/4.5-text-to-image",
      "seedream/4.5-edit",
    ],
    aliases: [
      "seedream/6-pro-text-to-image",
      "seedream/5.5-lite-text-to-image",
    ],
    rejected: [
      "seedream/5",
      "seedream",
      "seedream-5-pro-text-to-image",
      "seedream/pro-text-to-image",
    ],
  },
  {
    family: "Qwen",
    // Versioned `qwenN/*` only — unversioned `qwen/*` is enum-only (ac-7hi3xx)
    // and lives outside this family's alias partition.
    listed: [
      "qwen2/text-to-image",
      "qwen2/image-edit",
      "qwen3/text-to-image",
      "qwen3/image-to-image",
      "qwen3/pro-text-to-image",
      "qwen3/pro-image-to-image",
    ],
    aliases: ["qwen4/text-to-image", "qwen2.5/image-edit"],
    // `qwen-image-2.0` / `qwen-image-edit` are Alibaba's first-party grammar
    // for a different product line, not kie media ids. Bare `qwen2` and
    // underscore typos stay rejected; unversioned catalogue ids are covered
    // by QWEN_V1_EXACT_ONLY_MODELS below.
    rejected: [
      "qwen2",
      "qwen/text_to_image",
      "qwen-image-2.0",
      "qwen-image-edit",
    ],
  },
  {
    family: "Seedance",
    listed: [
      "bytedance/seedance-2-fast",
      "bytedance/seedance-2",
      "bytedance/seedance-2-mini",
      "bytedance/seedance-1.5-pro",
    ],
    aliases: ["bytedance/seedance-3", "bytedance/seedance-2-pro"],
    rejected: [
      "bytedance/seedance",
      "seedance-2",
      "bytedance/seedream-5",
      "bytedance/seedance-2-",
    ],
  },
  {
    family: "Wan",
    listed: [
      "wan/3-0-video",
      "wan/3-0-video-prime",
      "wan/2-7-image-to-video",
      "wan/2-7-text-to-video",
      "wan/2-7-r2v",
      "wan/2-7-videoedit",
      "wan/2-7-image",
      "wan/2-7-image-pro",
      "wan/2-2-a14b-image-to-video-turbo",
      "wan/2-2-a14b-speech-to-video-turbo",
      "wan/2-2-a14b-text-to-video-turbo",
      "wan/2-2-animate-move",
      "wan/2-2-animate-replace",
      "wan/2-5-image-to-video",
      "wan/2-5-text-to-video",
      "wan/2-6-flash-image-to-video",
      "wan/2-6-flash-video-to-video",
      "wan/2-6-image-to-video",
      "wan/2-6-text-to-video",
      "wan/2-6-video-to-video",
    ],
    // Future family members the alias admits ahead of the catalogue: every
    // documented wan id with a per-model createTask schema is catalogued now.
    aliases: ["wan/2-8-image-to-video", "wan/3-0-r2v"],
    // `wan2.7-i2v` is Alibaba's dotted, un-namespaced grammar for the same
    // upstream family — a foreign id on this field.
    rejected: ["wan/2-7", "wan", "wan/image-to-video", "wan2.7-i2v"],
  },
  {
    family: "HappyHorse",
    listed: [
      "happyhorse/text-to-video",
      "happyhorse/image-to-video",
      "happyhorse/reference-to-video",
      "happyhorse/video-edit",
      "happyhorse-1-1/text-to-video",
      "happyhorse-1-1/image-to-video",
      "happyhorse-1-1/reference-to-video",
    ],
    aliases: ["happyhorse-2-0/text-to-video", "happyhorse/audio-to-video"],
    rejected: [
      "happyhorse",
      "happyhorse-1-1",
      "happyhorse1-1/text-to-video",
      "happyhorse/Video-Edit",
    ],
  },
  {
    family: "ElevenLabs",
    listed: [
      "elevenlabs/audio-isolation",
      "elevenlabs/text-to-dialogue-v3",
      "elevenlabs/text-to-speech-multilingual-v2",
      "elevenlabs/text-to-speech-turbo-2-5",
      "elevenlabs/sound-effect-v2",
    ],
    aliases: ["elevenlabs/text-to-speech-flash-v3", "elevenlabs/music-v2"],
    // `eleven_flash_v3` is ElevenLabs' own underscored grammar, which the
    // @apicity/elevenlabs provider validates. It is not a kie media id.
    rejected: [
      "elevenlabs",
      "eleven_flash_v3",
      "ElevenLabs/audio-isolation",
      "elevenlabs/Sound-Effect-v2",
    ],
  },
  {
    family: "PixVerse",
    listed: [
      "pixverse-v6/text-to-video",
      "pixverse-v6/image-to-video",
      "pixverse-v6/transition",
      "pixverse-v6/extend",
      "pixverse-v6/reference-to-video",
    ],
    aliases: [
      "pixverse-v6/motion-brush",
      "pixverse-v7/text-to-video",
      "pixverse-v6.5/image-to-video",
    ],
    rejected: [
      "pixverse",
      "pixverse-v6",
      "pixverse-v6/",
      "pixverse6/text-to-video",
      "pixverse/text-to-video",
      "PixVerse-V6/text-to-video",
    ],
  },
] as const;

// The four ids that deliberately carry no alias: each is the only model kie
// lists for its vendor, and one sample cannot establish a family grammar.
const MEDIA_SINGLETON_MODELS = [
  "omnihuman-1-5",
  "volcengine/video-to-video-lip-sync",
  "gemini-omni-video",
  "sora-watermark-remover",
  "recraft/crisp-upscale",
  "recraft/remove-background",
  "infinitalk/from-audio",
  "z-image",
] as const;

const MINIMAX_H3_EXACT_ONLY_MODELS = [
  "minimax-h3/text-to-video",
  "minimax-h3/image-to-video",
  "minimax-h3/reference-to-video",
] as const;

const MINIMAX_H3_REJECTED_MODELS = [
  "minimax-h4/text-to-video",
  "minimax-h3/audio-to-video",
  "minimaxh3/text-to-video",
  "minimax_h3/text_to_video",
  "MINIMAX-H3/TEXT-TO-VIDEO",
] as const;

const GOOGLE_GEMINI_TTS_EXACT_ONLY_MODELS = [
  "google/gemini-2-5-pro-tts",
  "google/gemini-3-1-flash-tts",
] as const;

const GOOGLE_GEMINI_TTS_REJECTED_MODELS = [
  "google/gemini-2-5-flash-tts",
  "google/gemini-3-1-pro-tts",
  "google-gemini-2-5-pro-tts",
  "GOOGLE/GEMINI-2-5-PRO-TTS",
] as const;

// Google Imagen 4 + namespaced Nano Banana: five exact market ids, no open
// google/ alias hatch (product segments are not a version grammar).
const GOOGLE_IMAGEN_NANO_BANANA_EXACT_ONLY_MODELS = [
  "google/imagen4",
  "google/imagen4-fast",
  "google/imagen4-ultra",
  "google/nano-banana",
  "google/nano-banana-edit",
] as const;

const GOOGLE_IMAGEN_NANO_BANANA_REJECTED_MODELS = [
  "google/imagen4-pro",
  "google/imagen-4",
  "google/nano-banana-pro",
  "google-imagen4",
  "GOOGLE/IMAGEN4",
  "google/nano_banana",
] as const;

// Topaz is enum-only like MiniMax H3: two task variants under one vendor, no
// open alias hatch (the task segment is not a version grammar).
const TOPAZ_EXACT_ONLY_MODELS = [
  "topaz/image-upscale",
  "topaz/video-upscale",
] as const;

const TOPAZ_REJECTED_MODELS = [
  "topaz",
  "topaz/image",
  "topaz/video",
  "topaz-image-upscale",
  "topaz/image_upscale",
  "Topaz/image-upscale",
  "topaz/audio-upscale",
] as const;

// Flux-2 is enum-only like Topaz: four task variants under one vendor, no
// open alias hatch (the task segment is not a version grammar).
const FLUX2_EXACT_ONLY_MODELS = [
  "flux-2/flex-image-to-image",
  "flux-2/flex-text-to-image",
  "flux-2/pro-image-to-image",
  "flux-2/pro-text-to-image",
] as const;

const FLUX2_REJECTED_MODELS = [
  "flux-2",
  "flux-2/",
  "flux2/pro-text-to-image",
  "flux-2/pro",
  "flux-2/pro_text_to_image",
  "Flux-2/pro-text-to-image",
  "flux-2/max-text-to-image",
] as const;

// Ideogram is enum-only: six discrete task slugs, no open alias hatch.
const IDEOGRAM_EXACT_ONLY_MODELS = [
  "ideogram/character",
  "ideogram/character-edit",
  "ideogram/character-remix",
  "ideogram/v3-edit",
  "ideogram/v3-remix",
  "ideogram/v3-text-to-image",
] as const;

const IDEOGRAM_REJECTED_MODELS = [
  "ideogram",
  "ideogram/v3",
  "ideogram/text-to-image",
  "ideogram-v3-text-to-image",
  "ideogram/v3_text_to_image",
  "Ideogram/v3-text-to-image",
  "ideogram/v4-text-to-image",
] as const;

// Hailuo is enum-only: six task+tier variants, no open alias hatch.
const HAILUO_EXACT_ONLY_MODELS = [
  "hailuo/02-image-to-video-pro",
  "hailuo/02-image-to-video-standard",
  "hailuo/02-text-to-video-pro",
  "hailuo/02-text-to-video-standard",
  "hailuo/2-3-image-to-video-pro",
  "hailuo/2-3-image-to-video-standard",
] as const;

const HAILUO_REJECTED_MODELS = [
  "hailuo",
  "hailuo/",
  "hailuo/02",
  "hailuo/02-text-to-video",
  "hailuo/2-3-text-to-video-pro",
  "Hailuo/02-text-to-video-pro",
  "hailuo/02_text_to_video_pro",
] as const;

// Grok Imagine Image 2.0 is enum-only: the existing Grok Imagine alias owns
// one slash after `grok-imagine` or a fully dashed id, but not a dashed product
// id followed by a second slash and discrete task slug.
const GROK_IMAGINE_IMAGE_2_EXACT_ONLY_MODELS = [
  "grok-imagine-image-2-0/text-to-image",
  "grok-imagine-image-2-0/segment-map",
  "grok-imagine-image-2-0/image-edit",
] as const;

const GROK_IMAGINE_IMAGE_2_REJECTED_MODELS = [
  "grok-imagine-image-2.0/text-to-image",
  "grok-imagine-image-2-0/segment_map",
  "grok-imagine-image-2-0/",
  "GROK-IMAGINE-IMAGE-2-0/TEXT-TO-IMAGE",
] as const;

// Unversioned Qwen v1 is enum-only: the Qwen family alias requires a digit
// before `/` (`qwen2/*`), and operator ruling ac-ly4x9j forbids widening it.
const QWEN_V1_EXACT_ONLY_MODELS = [
  "qwen/text-to-image",
  "qwen/image-edit",
  "qwen/image-to-image",
] as const;

const QWEN_V1_REJECTED_MODELS = [
  "qwen",
  "qwen/text",
  "qwen/image",
  "qwen-text-to-image",
  "qwen/text_to_image",
  "Qwen/text-to-image",
  "qwen/text-to-video",
] as const;

// `.or()` chaining nests left, so the emitted JSON Schema is a left-deep tree
// of two-branch `anyOf`s rather than one flat list. Flatten it to leaves.
function anyOfLeaves(schema: JsonSchema): JsonSchema[] {
  const branches = schema.anyOf as JsonSchema[] | undefined;
  return branches ? branches.flatMap(anyOfLeaves) : [schema];
}

const mediaLeaves = anyOfLeaves(zodToJsonSchema(KieMediaModelSchema));
const mediaEnumLeaves = mediaLeaves.filter((leaf) => Array.isArray(leaf.enum));
const mediaAliasPatterns = mediaLeaves
  .filter((leaf) => typeof leaf.pattern === "string")
  .map((leaf) => new RegExp(String(leaf.pattern)));

describe("TRI-001 KieMediaModelSchema", () => {
  // BR-6, and AC-05's no-id-removed-renamed-or-reordered check in executable
  // form: the enum branch must still be the catalogue, in order.
  it("keeps the whole catalogue in the enum branch of the MCP JSON Schema", () => {
    expect(mediaEnumLeaves).toHaveLength(1);
    expect(mediaEnumLeaves[0]).toMatchObject({
      type: "string",
      enum: [...KIE_MEDIA_MODELS],
    });
  });

  // AC-07: opened per vendor family, never by one catch-all regex.
  it("opens the catalogue with one alias per vendor family", () => {
    expect(mediaAliasPatterns).toHaveLength(MEDIA_MODEL_FAMILIES.length);
  });

  it.each(MEDIA_SINGLETON_MODELS)(
    "keeps the singleton %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );

  it.each(MINIMAX_H3_EXACT_ONLY_MODELS)(
    "keeps MiniMax H3 model %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );

  it.each(MINIMAX_H3_REJECTED_MODELS)(
    "rejects the out-of-scope MiniMax model %j",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    }
  );

  it.each(GOOGLE_GEMINI_TTS_EXACT_ONLY_MODELS)(
    "keeps Google Gemini TTS model %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );

  it.each(GOOGLE_GEMINI_TTS_REJECTED_MODELS)(
    "rejects the out-of-scope Google Gemini TTS model %j",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    }
  );

  it.each(GOOGLE_IMAGEN_NANO_BANANA_EXACT_ONLY_MODELS)(
    "keeps Google Imagen/Nano Banana model %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );

  it.each(GOOGLE_IMAGEN_NANO_BANANA_REJECTED_MODELS)(
    "rejects the out-of-scope Google Imagen/Nano Banana model %j",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    }
  );

  it.each(TOPAZ_EXACT_ONLY_MODELS)(
    "keeps Topaz model %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );

  it.each(TOPAZ_REJECTED_MODELS)(
    "rejects the out-of-scope Topaz model %j",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    }
  );

  it.each(FLUX2_EXACT_ONLY_MODELS)(
    "keeps Flux-2 model %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );

  it.each(FLUX2_REJECTED_MODELS)(
    "rejects the out-of-scope Flux-2 model %j",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    }
  );

  it.each(IDEOGRAM_EXACT_ONLY_MODELS)(
    "keeps Ideogram model %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );

  it.each(IDEOGRAM_REJECTED_MODELS)(
    "rejects the out-of-scope Ideogram model %j",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    }
  );

  it.each(HAILUO_EXACT_ONLY_MODELS)(
    "keeps Hailuo model %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );

  it.each(HAILUO_REJECTED_MODELS)(
    "rejects the out-of-scope Hailuo model %j",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    }
  );

  it.each(GROK_IMAGINE_IMAGE_2_EXACT_ONLY_MODELS)(
    "keeps Grok Imagine Image 2.0 model %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );

  it.each(GROK_IMAGINE_IMAGE_2_REJECTED_MODELS)(
    "rejects the out-of-scope Grok Imagine Image 2.0 model %j",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    }
  );

  it("keeps the bare Grok Imagine Image 2.0 id alias-accepted", () => {
    const model = "grok-imagine-image-2-0";
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
    expect(mediaAliasPatterns.filter((re) => re.test(model))).toHaveLength(1);
  });

  it.each(QWEN_V1_EXACT_ONLY_MODELS)(
    "keeps unversioned Qwen model %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );

  it.each(QWEN_V1_REJECTED_MODELS)(
    "rejects the out-of-scope unversioned Qwen model %j",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    }
  );
});

describe.each(MEDIA_MODEL_FAMILIES)(
  "TRI-001 KieMediaModelSchema $family family",
  ({ listed, aliases, rejected }) => {
    it.each(listed)("accepts the listed model %s", (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
    });

    it.each(aliases)("accepts the alias %s", (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
    });

    it.each(rejected)("rejects the model %j", (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    });

    // The cross-family check safeParse cannot make: this family's alias owns
    // exactly its own ids. If any alias ever widened toward `.*` it would start
    // matching another vendor's ids here, long before it matched anything
    // outside the catalogue.
    it("partitions the catalogue — one alias owns exactly this family", () => {
      const family = listed as readonly string[];
      const owners = family.map((id) =>
        mediaAliasPatterns.findIndex((re) => re.test(id))
      );

      expect(owners).not.toContain(-1);
      expect(new Set(owners).size).toBe(1);
      for (const id of family) {
        expect(mediaAliasPatterns.filter((re) => re.test(id))).toHaveLength(1);
      }

      const owner = mediaAliasPatterns[owners[0]];
      const foreign = KIE_MEDIA_MODELS.filter((id) => !family.includes(id));
      expect(foreign.filter((id) => owner.test(id))).toEqual([]);
    });
  }
);

// The single biggest hazard in opening this schema is invisible to `tsc`:
// `KieMediaModel` keys `Record<KieMediaModel, ModelInputSchema>`, and inferring
// it off the now-open schema widens it to `string`, which stops that Record
// requiring an entry per model and stops it rejecting a typo'd key. zod.ts
// pins that at compile time (KieMediaModelStaysLiteral); this is the runtime
// half.
describe("TRI-001 KieMediaModel stays the literal catalogue", () => {
  it("has exactly one modelInputSchemas entry per listed model", () => {
    expect(Object.keys(modelInputSchemas).sort()).toEqual(
      [...KIE_MEDIA_MODELS].sort()
    );
  });

  it("yields undefined metadata for a hatched id rather than throwing", () => {
    const hatched = "kling-3.5/video";
    expect(KieMediaModelSchema.safeParse(hatched).success).toBe(true);
    // modelInputSchemas is provider *metadata* (kie.ts) — nothing dispatches on
    // it — so an id that arrives through the hatch is simply undocumented, not
    // a runtime failure.
    expect(
      (modelInputSchemas as Record<string, unknown>)[hatched]
    ).toBeUndefined();
  });

  // BR-5. Opening the envelope's `model` must not loosen the per-model input
  // contract: CreateTaskRequestSchema pipes the envelope into a union with one
  // member per *listed* model, so a hatched id still fails there. Same payload,
  // only the model differs, so the rejection is the model and nothing else.
  it("still rejects a hatched id at the createTask input contract", () => {
    const input = { duration: "5", mode: "std", multi_shots: false };

    expect(
      CreateTaskRequestSchema.safeParse({ model: "kling-3.0/video", input })
        .success
    ).toBe(true);
    expect(
      CreateTaskRequestSchema.safeParse({ model: "kling-3.5/video", input })
        .success
    ).toBe(false);
  });
});

describe("WI-3 Kie createTask registry parity", () => {
  it("keeps the public catalogue, descriptors, and runtime guards aligned", () => {
    const expectedModels = [...KIE_MEDIA_MODELS].sort();

    expect(Object.keys(modelInputSchemas).sort()).toEqual(expectedModels);
    expect(Object.keys(CREATE_TASK_GUARDS).sort()).toEqual(expectedModels);
  });

  it("provides a guard and descriptor for every catalogued model", () => {
    for (const model of KIE_MEDIA_MODELS) {
      expect(CREATE_TASK_GUARDS[model]).toBeDefined();
      expect(modelInputSchemas[model]).toBeDefined();
    }
  });
});
