import { describe, it, expect } from "vitest";

import {
  XaiResponseRequestSchema,
  XaiVideoGenerateRequestSchema,
  XaiVideoReferenceAudioSchema,
  collectXaiVideoReferenceIssues,
  isXaiGrokImagineVideo15LiteModel,
  isXaiGrokImagineVideo15Model,
  isXaiGrokImagineVideoLegacyModel,
  type XaiVideoGenerateRequest,
} from "../../packages/provider/xai/src/zod";

// xAI's reference-to-video doc allows 14 reference images per request on the
// grok-imagine-video-1.5 family and 7 on grok-imagine-video; legacy
// grok-imagine-video references retain a 10-second duration cap.
const REFERENCE_IMAGE_MAX = 14;
const LEGACY_REFERENCE_IMAGE_MAX = 7;
const REFERENCE_AUDIO_MAX = 3;
const LEGACY_MODELS = ["grok-imagine-video", "grok-imagine-video-2026-01-01"];
const FRAME_MODELS = [
  undefined,
  "grok-imagine-video-1.5",
  "grok-imagine-video-1.5-preview",
  "grok-imagine-video-1.5-2026-05-30",
];

const reference = (index: number) => ({
  url: `https://example.com/reference-${index}.png`,
});

const fileId = (index: number) => `file-${index}`;

describe("XaiVideoGenerateRequestSchema reference constraints", () => {
  describe("reference_images", () => {
    it.each(FRAME_MODELS)(
      "accepts the documented maximum reference images on %s",
      (model) => {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a cat riding a skateboard",
          model,
          reference_images: Array.from(
            { length: REFERENCE_IMAGE_MAX },
            (_, i) => reference(i)
          ),
        });

        expect(result.success).toBe(true);
      }
    );

    it.each([undefined, "grok-imagine-video-1.5", ...LEGACY_MODELS])(
      "rejects fifteen reference images on %s",
      (model) => {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a cat riding a skateboard",
          model,
          reference_images: Array.from({ length: 15 }, (_, i) => reference(i)),
        });

        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some((issue) =>
            issue.path.includes("reference_images")
          )
        ).toBe(true);
      }
    );

    it("accepts eight reference images on the 1.5 family and with no model", () => {
      for (const model of [undefined, "grok-imagine-video-1.5-preview"]) {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a cat riding a skateboard",
          model,
          reference_images: Array.from({ length: 8 }, (_, i) => reference(i)),
        });
        expect(result.success, model).toBe(true);
      }
    });

    it.each(LEGACY_MODELS)("caps %s at seven reference images", (model) => {
      const at = (length: number) =>
        XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a cat riding a skateboard",
          model,
          reference_images: Array.from({ length }, (_, i) => reference(i)),
        });

      expect(at(LEGACY_REFERENCE_IMAGE_MAX).success).toBe(true);
      expect(at(LEGACY_REFERENCE_IMAGE_MAX + 1).error?.issues).toContainEqual(
        expect.objectContaining({
          path: ["reference_images"],
          message:
            "reference_images must contain at most 7 items on grok-imagine-video",
        })
      );
    });

    it("accepts ordered mixed URL, data-URI, and file-ID references", () => {
      const reference_images = [
        { url: "https://example.com/reference.png" },
        { url: "data:image/png;base64,AAAA" },
        { file_id: "file_reference" },
      ];
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        reference_images,
      });

      expect(result.success).toBe(true);
      expect(result.success && result.data.reference_images).toEqual(
        reference_images
      );
    });
  });

  describe("reference_image_file_ids", () => {
    it.each(FRAME_MODELS)(
      "accepts the documented maximum reference image file ids on %s",
      (model) => {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a cat riding a skateboard",
          model,
          reference_image_file_ids: Array.from(
            { length: REFERENCE_IMAGE_MAX },
            (_, i) => fileId(i)
          ),
        });

        expect(result.success).toBe(true);
      }
    );

    it.each([...FRAME_MODELS, ...LEGACY_MODELS])(
      "rejects fifteen reference image file ids on %s",
      (model) => {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a cat riding a skateboard",
          model,
          reference_image_file_ids: Array.from({ length: 15 }, (_, i) =>
            fileId(i)
          ),
        });

        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some((issue) =>
            issue.path.includes("reference_image_file_ids")
          )
        ).toBe(true);
      }
    );

    it.each(LEGACY_MODELS)("caps %s at seven reference file ids", (model) => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        model,
        reference_image_file_ids: Array.from({ length: 8 }, (_, i) =>
          fileId(i)
        ),
      });

      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          path: ["reference_image_file_ids"],
          message:
            "reference_image_file_ids must contain at most 7 items on grok-imagine-video",
        })
      );
    });
  });

  describe("duration", () => {
    it("accepts a 12-second generation duration without references", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 12,
      });

      expect(result.success).toBe(true);
    });

    it("accepts the 10-second reference-image maximum", () => {
      const urlResult = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 10,
        reference_images: [reference(0)],
      });
      const fileResult = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 10,
        reference_image_file_ids: [fileId(0)],
      });

      expect(urlResult.success).toBe(true);
      expect(fileResult.success).toBe(true);
    });

    it("accepts 15 seconds with model-less 1.5 reference images", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 15,
        reference_images: [reference(0)],
      });

      expect(result.success).toBe(true);
    });

    it.each(LEGACY_MODELS)(
      "retains the 10-second cap for legacy reference images on %s",
      (model) => {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a cat riding a skateboard",
          duration: 11,
          model,
          reference_image_file_ids: [fileId(0)],
        });

        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some((issue) => issue.path.includes("duration"))
        ).toBe(true);
      }
    );

    it("never applies the legacy caps to a grok-imagine-video-1.5 id", () => {
      for (const model of [
        "grok-imagine-video-1.5",
        "grok-imagine-video-1.5-2026-05-30",
      ]) {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a cat riding a skateboard",
          duration: 15,
          model,
          reference_images: Array.from({ length: 8 }, (_, i) => reference(i)),
        });
        expect(result.success, model).toBe(true);
      }
    });

    it("names the legacy family", () => {
      expect(isXaiGrokImagineVideoLegacyModel("grok-imagine-video")).toBe(true);
      expect(
        isXaiGrokImagineVideoLegacyModel("grok-imagine-video-2026-01-01")
      ).toBe(true);
      for (const model of [
        "grok-imagine-video-1.5",
        "grok-imagine-video-1.5-preview",
        "grok-imagine-video-1.5-lite",
        "grok-imagine-video-1.5-2026-05-30",
        "grok-imagine-video-2",
        "grok-imagine-video-preview",
      ]) {
        expect(isXaiGrokImagineVideoLegacyModel(model), model).toBe(false);
      }
    });

    it("rejects a duration above the documented 15-second range", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a cat riding a skateboard",
        duration: 16,
      });

      expect(result.success).toBe(false);
    });
  });

  // The lite model page lists text and image to video only, so lite takes no
  // reference images (mayor ruling on ac-p5g552; no probe).
  describe("reference images on grok-imagine-video-1.5-lite", () => {
    const LITE_MESSAGE =
      "reference images are not supported on grok-imagine-video-1.5-lite, which takes text and image to video only";

    it.each([
      ["reference_images", { reference_images: [reference(0)] }],
      ["reference_image_file_ids", { reference_image_file_ids: ["file_1"] }],
    ])("rejects %s on lite and its snapshots", (_label, body) => {
      for (const model of [
        "grok-imagine-video-1.5-lite",
        "grok-imagine-video-1.5-lite-2026-10-01",
      ]) {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a dancer in a sunlit loft",
          model,
          ...body,
        });
        expect(result.success, model).toBe(false);
        expect(result.error?.issues, model).toContainEqual(
          expect.objectContaining({ path: ["model"], message: LITE_MESSAGE })
        );
      }
    });

    it.each([
      "grok-imagine-video",
      "grok-imagine-video-1.5",
      "grok-imagine-video-1.5-preview",
    ])("keeps reference images on %s", (model) => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a dancer in a sunlit loft",
        model,
        reference_images: [reference(0)],
      });
      expect(result.success).toBe(true);
    });

    it("keeps text and image to video on lite", () => {
      for (const body of [{}, { image: { url: "https://x/still.png" } }]) {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a dancer in a sunlit loft",
          model: "grok-imagine-video-1.5-lite",
          ...body,
        });
        expect(result.success).toBe(true);
      }
    });

    it("names the lite family", () => {
      expect(
        isXaiGrokImagineVideo15LiteModel("grok-imagine-video-1.5-lite")
      ).toBe(true);
      expect(
        isXaiGrokImagineVideo15LiteModel(
          "grok-imagine-video-1.5-lite-2026-10-01"
        )
      ).toBe(true);
      expect(isXaiGrokImagineVideo15LiteModel("grok-imagine-video-1.5")).toBe(
        false
      );
      expect(isXaiGrokImagineVideo15Model("grok-imagine-video-1.5-lite")).toBe(
        false
      );
    });
  });

  describe("reference_audios", () => {
    it("accepts zero through three open, mixed-case voice identifiers", () => {
      for (let count = 0; count <= REFERENCE_AUDIO_MAX; count++) {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a singer walks onto a stage",
          reference_audios: Array.from({ length: count }, (_, index) => ({
            voice_id: index === 0 ? "Eve" : `voice-${index}`,
          })),
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects four voice references", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a singer walks onto a stage",
        reference_audios: Array.from({ length: 4 }, (_, index) => ({
          voice_id: `voice-${index}`,
        })),
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((issue) =>
          issue.path.includes("reference_audios")
        )
      ).toBe(true);
    });

    it.each(["", "   ", "\n\t"])(
      "rejects a blank voice identifier %j",
      (voice_id) => {
        const result = XaiVideoGenerateRequestSchema.safeParse({
          prompt: "a singer walks onto a stage",
          reference_audios: [{ voice_id }],
        });

        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some(
            (issue) =>
              issue.path.includes("reference_audios") &&
              issue.path.includes("voice_id")
          )
        ).toBe(true);
      }
    );

    // docs.x.ai documents reference_audios on grok-imagine-video-1.5 only;
    // 1.5-lite is its own model with text and image to video.
    it.each([
      "grok-imagine-video-1.5",
      "grok-imagine-video-1.5-preview",
      "grok-imagine-video-1.5-2026-05-30",
    ])("accepts reference_audios on %s", (model) => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a singer walks onto a stage",
        model,
        reference_audios: [{ voice_id: "eve" }],
      });
      expect(result.success).toBe(true);
    });

    it.each([
      "grok-imagine-video-1.5-lite",
      "grok-imagine-video-1.5-lite-2026-10-01",
      "grok-imagine-video",
    ])("rejects reference_audios on %s", (model) => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "a singer walks onto a stage",
        model,
        reference_audios: [{ voice_id: "eve" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          path: ["model"],
          message:
            "reference_audios requires the grok-imagine-video-1.5 model family",
        })
      );
    });

    it("keeps 1.5-lite and its snapshots out of the 1.5 family", () => {
      expect(isXaiGrokImagineVideo15Model("grok-imagine-video-1.5")).toBe(true);
      expect(
        isXaiGrokImagineVideo15Model("grok-imagine-video-1.5-preview")
      ).toBe(true);
      expect(isXaiGrokImagineVideo15Model("grok-imagine-video-1.5-lite")).toBe(
        false
      );
      expect(
        isXaiGrokImagineVideo15Model("grok-imagine-video-1.5-lite-2026-10-01")
      ).toBe(false);
      expect(isXaiGrokImagineVideo15Model("grok-imagine-video-1.5lite")).toBe(
        false
      );
    });

    it("exposes the standalone public voice-reference schema", () => {
      expect(
        XaiVideoReferenceAudioSchema.safeParse({ voice_id: "EVE" }).success
      ).toBe(true);
    });
  });

  // grok-imagine-video-1.5 pins frames: "`image` as the first frame alongside
  // references, `last_frame`, and up to **4** `keyframes`" (reference-to-video
  // doc, read 2026-11-01).
  describe("pinned frames", () => {
    const keyframe = (timestamp_s: number) => ({
      image: { url: `https://example.com/key-${timestamp_s}.png` },
      timestamp_s,
    });
    // The pre-fetch guard throws on any issue the shared helper reports.
    const verdicts = (body: Record<string, unknown>) => {
      const result = XaiVideoGenerateRequestSchema.safeParse(body);
      const issues = result.error?.issues ?? [];
      const keys = issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      expect(new Set(keys).size, "each violation once").toBe(keys.length);
      return {
        schema: result.success,
        guard:
          collectXaiVideoReferenceIssues(body as XaiVideoGenerateRequest)
            .length === 0,
      };
    };

    it("types a request with pinned frames and no prompt", () => {
      const pinned: XaiVideoGenerateRequest = {
        image: { url: "https://example.com/first.png" },
        last_frame: { url: "https://example.com/last.png" },
      };
      expect(verdicts(pinned)).toEqual({ schema: true, guard: true });
    });

    it.each([
      ["one keyframe", [keyframe(2)], undefined, true],
      ["four keyframes", [1, 2, 3, 4].map(keyframe), undefined, true],
      ["five keyframes", [1, 2, 3, 4, 5].map(keyframe), undefined, false],
      ["a keyframe at 0", [keyframe(0)], undefined, false],
      ["a keyframe at -1", [keyframe(-1)], undefined, false],
      ["3.6 s in a 4 s clip", [keyframe(3.6)], 4, true],
      ["4 s in a 4 s clip", [keyframe(4)], 4, false],
      ["7.6 s at the 8 s default", [keyframe(7.6)], undefined, true],
      ["8 s at the 8 s default", [keyframe(8)], undefined, false],
      [
        "2.0 and 2.1 (one slot)",
        [keyframe(2), keyframe(2.1)],
        undefined,
        false,
      ],
      ["1.0 and 1.2", [keyframe(1), keyframe(1.2)], undefined, true],
      ["2.0 and 2.34", [keyframe(2), keyframe(2.34)], undefined, true],
    ] as const)(
      "gives %s the same verdict in the schema and the guard",
      (_label, keyframes, duration, valid) => {
        expect(
          verdicts({
            keyframes,
            ...(duration === undefined ? {} : { duration }),
          })
        ).toEqual({ schema: valid, guard: valid });
      }
    );

    it("names the slot shared by two keyframes", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        keyframes: [keyframe(2), keyframe(2.1)],
      });
      expect(result.error?.issues).toEqual([
        expect.objectContaining({
          path: ["keyframes", 1, "timestamp_s"],
          message:
            "keyframes 0 and 1 round to the same 1/3-second slot; keep keyframes at least 1/3 s apart",
        }),
      ]);
    });

    it.each([
      ["last_frame", { last_frame: { url: "https://example.com/last.png" } }],
      ["last_frame_file_id", { last_frame_file_id: "file_last" }],
      ["keyframes", { keyframes: [keyframe(2)] }],
    ])("refuses %s outside the 1.5 family", (field, body) => {
      for (const model of [
        ...LEGACY_MODELS,
        "grok-imagine-video-1.5-lite",
        "some-other-video-model",
      ]) {
        const request = { model, ...body };
        expect(verdicts(request), model).toEqual({
          schema: false,
          guard: false,
        });
        expect(
          XaiVideoGenerateRequestSchema.safeParse(request).error?.issues,
          model
        ).toContainEqual(
          expect.objectContaining({
            path: ["model"],
            message: `${field} requires the grok-imagine-video-1.5 model family`,
          })
        );
      }
    });

    it("accepts every pin with references and voices on the 1.5 family", () => {
      for (const model of FRAME_MODELS) {
        expect(
          verdicts({
            model,
            image: { url: "https://example.com/first.png" },
            keyframes: [keyframe(2), keyframe(4)],
            last_frame: { url: "https://example.com/last.png" },
            reference_images: [reference(0)],
            reference_audios: [{ voice_id: "eve" }],
          }),
          model
        ).toEqual({ schema: true, guard: true });
      }
    });
  });
});

// xAI retired Live Search. Probed live on 2026-07-20 with a valid key:
// `search_parameters` returns HTTP 410 ("Live search is deprecated. Please
// switch to the Agent Tools API") from both POST /v1/chat/completions and
// POST /v1/responses, while the same requests without it return 200. The
// field is therefore rejected outright rather than having its members
// tightened. See packages/provider/xai/src/zod.ts.

const base = {
  model: "grok-4-fast",
  input: "What is AI?",
};

describe("XaiResponseReasoningSchema effort vocabulary", () => {
  it("accepts xhigh reasoning effort", () => {
    const result = XaiResponseRequestSchema.safeParse({
      model: "grok-4.6",
      input: "ping",
      reasoning: { effort: "xhigh" },
    });

    expect(result.success).toBe(true);
  });

  it("rejects reasoning effort outside the closed vocabulary", () => {
    const result = XaiResponseRequestSchema.safeParse({
      model: "grok-4.6",
      input: "ping",
      reasoning: { effort: "ultra" },
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue) =>
          issue.path.includes("reasoning") && issue.path.includes("effort")
      )
    ).toBe(true);
  });
});

describe("XaiResponseRequestSchema search contract", () => {
  describe("search_parameters is retired", () => {
    it("accepts a request that omits search_parameters", () => {
      const result = XaiResponseRequestSchema.safeParse(base);

      expect(result.success).toBe(true);
    });

    it("accepts an explicit undefined search_parameters", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        search_parameters: undefined,
      });

      expect(result.success).toBe(true);
    });

    it("rejects a previously valid search_parameters object", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        search_parameters: { mode: "auto", max_search_results: 5 },
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((issue) =>
          issue.path.includes("search_parameters")
        )
      ).toBe(true);
    });

    it("names the Agent Tools API replacement in the error message", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        search_parameters: { mode: "auto" },
      });

      const message = result.error?.issues.find((issue) =>
        issue.path.includes("search_parameters")
      )?.message;

      expect(message).toContain("410");
      expect(message).toContain("web_search");
    });

    // The previously loose members are the reason WI-18 existed. Each is now
    // rejected by the parent field rather than validated individually, which
    // is strictly stronger than the enum/date tightening the plan proposed.
    it.each([
      ["sources as bare strings", { sources: ["web", "x"] }],
      ["sources as objects", { sources: [{ type: "web" }] }],
      ["from_date", { from_date: "2026-01-01" }],
      ["to_date", { to_date: "not-a-date" }],
      ["return_citations", { return_citations: true }],
    ])("rejects search_parameters carrying %s", (_label, value) => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        search_parameters: value,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("the replacement contract still validates", () => {
    it("accepts tools: [{ type: 'web_search' }]", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        tools: [{ type: "web_search" }],
      });

      expect(result.success).toBe(true);
    });

    it("accepts tools: [{ type: 'web_search_preview' }]", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        tools: [{ type: "web_search_preview" }],
      });

      expect(result.success).toBe(true);
    });

    it("rejects an unknown tool type", () => {
      const result = XaiResponseRequestSchema.safeParse({
        ...base,
        tools: [{ type: "live_search" }],
      });

      expect(result.success).toBe(false);
    });
  });
});
