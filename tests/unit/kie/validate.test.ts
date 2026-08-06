import { describe, it, expect } from "vitest";

import {
  CreateTaskRequestSchema,
  DownloadUrlRequestSchema,
  UploadMediaRequestSchema,
  FileUrlUploadRequestSchema,
  FileBase64UploadRequestSchema,
  VeoGenerateRequestSchema,
  VeoExtendRequestSchema,
  SunoGenerateRequestSchema,
  KieChatRequestSchema,
  KieClaudeRequestSchema,
  GrokImageToVideoDurationSchema,
  GrokImageToVideoRequestSchema,
  type GrokImageToVideoRequestInput,
  GrokTextToImageRequestSchema,
  GrokTextToVideoDurationSchema,
  GrokTextToVideoRequestSchema,
  type GrokTextToVideoRequestInput,
  GrokVideo15PreviewRequestSchema,
  type GrokVideo15PreviewRequestInput,
  GptImage2ImageToImageRequestSchema,
  GptImage2TextToImageRequestSchema,
  KlingV3TurboImageToVideoRequestSchema,
  KlingV3TurboTextToVideoRequestSchema,
  MediaGenerationRequestSchema,
  type MediaGenerationRequest,
  HappyHorseImageToVideoRequestSchema,
  HappyHorseTextToVideoRequestSchema,
  HappyHorse11CreateTaskResponseSchema,
  HappyHorse11ImageToVideoRequestSchema,
  HappyHorse11ReferenceToVideoRequestSchema,
  HappyHorse11TextToVideoRequestSchema,
  VolcengineVideoToVideoLipSyncRequestSchema,
  TopazImageUpscaleRequestSchema,
  TopazVideoUpscaleRequestSchema,
  QwenTextToImageRequestSchema,
  QwenImageEditRequestSchema,
  QwenImageToImageRequestSchema,
  Seedream45TextToImageRequestSchema,
  Seedream45EditRequestSchema,
  InfinitalkFromAudioRequestSchema,
  ZImageRequestSchema,
  ElevenLabsTextToSpeechTurbo25RequestSchema,
  ElevenLabsTextToSpeechMultilingualV2RequestSchema,
  ElevenLabsTextToDialogueV3RequestSchema,
  ElevenLabsSoundEffectV2RequestSchema,
  ElevenLabsAudioIsolationRequestSchema,
  GeminiOmniVideoRequestSchema,
  GeminiOmniAudioCreateRequestSchema,
  GeminiOmniCharacterCreateRequestSchema,
  GeminiOmniCharacterCreateResponseSchema,
} from "../../../packages/provider/kie/src/zod";

const grokSevenImageUrls = Array.from(
  { length: 7 },
  (_, index) => `https://example.com/reference-${index + 1}.jpg`
);

const grokTextToVideo1080pRequest = {
  model: "grok-imagine/text-to-video",
  input: {
    prompt: "A neon train moving through a rain-soaked city at night",
    resolution: "1080p",
  },
} satisfies GrokTextToVideoRequestInput;

const grokImageToVideo1080pRequest = {
  model: "grok-imagine/image-to-video",
  input: {
    image_urls: ["https://example.com/reference.webp"],
    resolution: "1080p",
  },
} satisfies GrokImageToVideoRequestInput;

const grokCurrent1080pMediaRequests = [
  grokTextToVideo1080pRequest,
  grokImageToVideo1080pRequest,
] satisfies MediaGenerationRequest[];

const grokPreview1080pRequest = {
  model: "grok-imagine-video-1-5-preview",
  input: {
    image_urls: ["https://example.com/reference.png"],
    // @ts-expect-error 1080p is intentionally unavailable on the legacy slug.
    resolution: "1080p",
  },
} satisfies GrokVideo15PreviewRequestInput;

describe("kie Zod schema validation", () => {
  describe("basic validation", () => {
    it("should reject non-object payload", () => {
      const result = CreateTaskRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should reject array as payload", () => {
      const result = CreateTaskRequestSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it("should reject string as payload", () => {
      const result = CreateTaskRequestSchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });

    it("should reject number as payload", () => {
      const result = CreateTaskRequestSchema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it("should reject boolean as payload", () => {
      const result = CreateTaskRequestSchema.safeParse(true);
      expect(result.success).toBe(false);
    });
  });

  describe("required field validation", () => {
    it("should reject missing required model field", () => {
      const result = CreateTaskRequestSchema.safeParse({
        input: { prompt: "test" },
        // Missing required 'model' field
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject missing required input field", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "nano-banana-pro",
        // Missing required 'input' field
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
        true
      );
    });

    it("should reject null for required field", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: null,
        input: {},
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should accept payload with all required fields", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "nano-banana-pro",
        input: { prompt: "test" },
      });
      expect(result.success).toBe(true);
    });

    it("should accept undefined for optional fields", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "nano-banana-pro",
        input: { prompt: "test" },
        callBackUrl: undefined,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("grok imagine 1.5 current suite slugs", () => {
    it("should accept and preserve 1080p for current text-to-video", () => {
      const direct = GrokTextToVideoRequestSchema.safeParse(
        grokTextToVideo1080pRequest
      );
      const media = MediaGenerationRequestSchema.safeParse(
        grokTextToVideo1080pRequest
      );

      expect(direct.success).toBe(true);
      expect(media.success).toBe(true);
      if (!direct.success || !media.success) return;
      expect(direct.data.input.resolution).toBe("1080p");
      expect(media.data).toMatchObject({ input: { resolution: "1080p" } });
    });

    it("should accept the current image-to-video sample with three images", () => {
      const request = {
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: [
            "https://tempfileb.aiquickdraw.com/kieai/market/1782021652978_JJVOCSKk.jpg",
            "https://tempfileb.aiquickdraw.com/kieai/market/1782021652866_7WyovwDT.jpeg",
            "https://tempfileb.aiquickdraw.com/kieai/market/1782021653019_DJmk5khc.jpeg",
          ],
          index: 0,
          prompt:
            "the thai sergent arrests the tourist for petting the cat wrong",
          aspect_ratio: "16:9",
          mode: "normal",
          duration: 8,
          resolution: "480p",
          nsfw_checker: true,
        },
      };

      const result = GrokImageToVideoRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.input.image_urls).toEqual(request.input.image_urls);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    });

    it("should accept 1080p image-to-video with one image or task_id", () => {
      const taskIdRequest = {
        model: "grok-imagine/image-to-video",
        input: {
          task_id: "grok-image-task",
          resolution: "1080p",
        },
      } satisfies GrokImageToVideoRequestInput;

      for (const request of [grokImageToVideo1080pRequest, taskIdRequest]) {
        const direct = GrokImageToVideoRequestSchema.safeParse(request);
        const media = MediaGenerationRequestSchema.safeParse(request);

        expect(direct.success).toBe(true);
        expect(media.success).toBe(true);
        if (!direct.success || !media.success) continue;
        expect(direct.data.input.resolution).toBe("1080p");
        expect(media.data).toMatchObject({ input: { resolution: "1080p" } });
      }
    });

    it("should accept typed current 1080p requests through the media union", () => {
      for (const request of grokCurrent1080pMediaRequests) {
        expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
          true
        );
      }
    });

    it("should apply current image-to-video defaults", () => {
      const result = GrokImageToVideoRequestSchema.safeParse({
        model: "grok-imagine/image-to-video",
        input: {
          task_id: "grok-image-task",
        },
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.input.index).toBe(0);
      expect(result.data.input.mode).toBe("normal");
      expect(result.data.input.duration).toBe(6);
      expect(result.data.input.resolution).toBe("480p");
      expect(result.data.input.aspect_ratio).toBe("16:9");
      expect(result.data.input.nsfw_checker).toBe(false);
    });

    it("should preserve bounded numeric and canonical-string durations", () => {
      const durationSchemas = [
        GrokTextToVideoDurationSchema,
        GrokImageToVideoDurationSchema,
      ];

      for (const schema of durationSchemas) {
        for (const duration of [6, 30, "6", "30"] as const) {
          const result = schema.safeParse(duration);
          expect(result.success).toBe(true);
          if (!result.success) continue;
          expect(result.data).toBe(duration);
        }
      }
    });

    it("should reject invalid Grok durations in both exported schemas", () => {
      const durationSchemas = [
        GrokTextToVideoDurationSchema,
        GrokImageToVideoDurationSchema,
      ];
      const invalidDurations = [
        5,
        31,
        6.5,
        "5",
        "31",
        "6.5",
        "06",
        " 6",
        "six",
      ] as const;

      for (const schema of durationSchemas) {
        for (const duration of invalidDurations) {
          expect(schema.safeParse(duration).success).toBe(false);
        }
      }
    });

    it("should preserve Grok durations through the media request union", () => {
      const models = [
        "grok-imagine/text-to-video",
        "grok-imagine/image-to-video",
      ] as const;

      for (const model of models) {
        for (const duration of [6, 30, "6", "30"] as const) {
          const request =
            model === "grok-imagine/text-to-video"
              ? { model, input: { prompt: "Animate this", duration } }
              : { model, input: { task_id: "grok-image-task", duration } };
          const result = MediaGenerationRequestSchema.safeParse(request);

          expect(result.success).toBe(true);
          if (!result.success) continue;
          expect(
            (result.data as { input: { duration: number | string } }).input
              .duration
          ).toBe(duration);
        }
      }
    });

    it("should reject invalid Grok durations through the media request union", () => {
      const models = [
        "grok-imagine/text-to-video",
        "grok-imagine/image-to-video",
      ] as const;
      const invalidDurations = [
        5,
        31,
        6.5,
        "5",
        "31",
        "6.5",
        "06",
        " 6",
        "six",
      ] as const;

      for (const model of models) {
        for (const duration of invalidDurations) {
          const request =
            model === "grok-imagine/text-to-video"
              ? { model, input: { prompt: "Animate this", duration } }
              : { model, input: { task_id: "grok-image-task", duration } };
          const result = MediaGenerationRequestSchema.safeParse(request);

          expect(result.success).toBe(false);
        }
      }
    });

    it("should keep text-to-video duration and resolution optional", () => {
      const result = GrokTextToVideoRequestSchema.safeParse({
        model: "grok-imagine/text-to-video",
        input: { prompt: "Animate this" },
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(Object.hasOwn(result.data.input, "duration")).toBe(false);
      expect(Object.hasOwn(result.data.input, "resolution")).toBe(false);
    });

    it("should validate external image URLs and image formats", () => {
      const exactlySeven = GrokImageToVideoRequestSchema.safeParse({
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: [
            "https://example.com/first.jpg",
            "https://example.com/second.jpeg",
            "https://example.com/third.png",
            "https://example.com/fourth.webp",
            "https://example.com/fifth.jpg",
            "https://example.com/sixth.jpeg",
            "https://example.com/seventh.png",
          ],
        },
      });
      const notUrl = GrokImageToVideoRequestSchema.safeParse({
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: ["not-a-url.png"],
        },
      });
      const unsupportedFormat = GrokImageToVideoRequestSchema.safeParse({
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: ["https://example.com/reference.gif"],
        },
      });
      const tooMany = GrokImageToVideoRequestSchema.safeParse({
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: [
            "https://example.com/1.jpg",
            "https://example.com/2.jpg",
            "https://example.com/3.jpg",
            "https://example.com/4.jpg",
            "https://example.com/5.jpg",
            "https://example.com/6.jpg",
            "https://example.com/7.jpg",
            "https://example.com/8.jpg",
          ],
        },
      });

      expect(exactlySeven.success).toBe(true);
      expect(notUrl.success).toBe(false);
      expect(unsupportedFormat.success).toBe(false);
      expect(tooMany.success).toBe(false);
      expect(
        tooMany.error?.issues.some((i) =>
          i.message.includes("at most 7 image_urls")
        )
      ).toBe(true);
    });

    it("should keep one through seven images valid below 1080p", () => {
      for (const resolution of ["480p", "720p"] as const) {
        for (const image_urls of [
          grokSevenImageUrls.slice(0, 1),
          grokSevenImageUrls,
        ]) {
          expect(
            GrokImageToVideoRequestSchema.safeParse({
              model: "grok-imagine/image-to-video",
              input: { image_urls, resolution },
            }).success
          ).toBe(true);
        }
      }

      const omittedResolution = GrokImageToVideoRequestSchema.safeParse({
        model: "grok-imagine/image-to-video",
        input: { image_urls: grokSevenImageUrls },
      });
      expect(omittedResolution.success).toBe(true);
      if (!omittedResolution.success) return;
      expect(omittedResolution.data.input.resolution).toBe("480p");
    });

    it("should reject multiple external images at 1080p", () => {
      for (const image_urls of [
        grokSevenImageUrls.slice(0, 2),
        grokSevenImageUrls,
      ]) {
        const result = GrokImageToVideoRequestSchema.safeParse({
          model: "grok-imagine/image-to-video",
          input: { image_urls, resolution: "1080p" },
        });

        expect(result.success).toBe(false);
        if (result.success) continue;
        expect(
          result.error.issues.some(
            (issue) => issue.path.join(".") === "input.image_urls"
          )
        ).toBe(true);
      }
    });

    it.each(["2160p", "cinema"])(
      "should reject unknown current resolution %s directly and in the media union",
      (resolution) => {
        const textRequest = {
          model: "grok-imagine/text-to-video",
          input: { prompt: "Animate this", resolution },
        };
        const imageRequest = {
          model: "grok-imagine/image-to-video",
          input: {
            image_urls: ["https://example.com/reference.png"],
            resolution,
          },
        };

        expect(
          GrokTextToVideoRequestSchema.safeParse(textRequest).success
        ).toBe(false);
        expect(
          GrokImageToVideoRequestSchema.safeParse(imageRequest).success
        ).toBe(false);
        expect(
          MediaGenerationRequestSchema.safeParse(textRequest).success
        ).toBe(false);
        expect(
          MediaGenerationRequestSchema.safeParse(imageRequest).success
        ).toBe(false);
      }
    );

    it("should accept task_id plus index instead of image_urls", () => {
      const request = {
        model: "grok-imagine/image-to-video",
        input: {
          task_id: "grok-image-task",
          index: 2,
          prompt: "Animate this generated image",
          duration: 6,
        },
      };

      expect(GrokImageToVideoRequestSchema.safeParse(request).success).toBe(
        true
      );
    });

    it("should reject spicy mode with external image URLs", () => {
      const result = GrokImageToVideoRequestSchema.safeParse({
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: ["https://example.com/reference.webp"],
          mode: "spicy",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("mode"))).toBe(
        true
      );
    });

    it("should reject missing or conflicting image references", () => {
      const missingReference = GrokImageToVideoRequestSchema.safeParse({
        model: "grok-imagine/image-to-video",
        input: { prompt: "Animate this" },
      });
      const conflictingReference = GrokImageToVideoRequestSchema.safeParse({
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: ["https://example.com/reference.png"],
          task_id: "grok-image-task",
        },
      });

      expect(missingReference.success).toBe(false);
      expect(conflictingReference.success).toBe(false);
    });

    it("should retain the earlier preview slug for compatibility", () => {
      const request = {
        model: "grok-imagine-video-1-5-preview",
        input: {
          image_urls: ["https://example.com/reference.png"],
          duration: 8,
          resolution: "480p",
          nsfw_checker: true,
        },
      };

      expect(GrokVideo15PreviewRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(
        GrokVideo15PreviewRequestSchema.safeParse(grokPreview1080pRequest)
          .success
      ).toBe(false);
    });

    it("should keep resolution absent from text-to-image input", () => {
      const result = GrokTextToImageRequestSchema.safeParse({
        model: "grok-imagine/text-to-image",
        input: {
          prompt: "A neon train at night",
          resolution: "1080p",
        },
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(Object.hasOwn(result.data.input, "resolution")).toBe(false);
    });

    it("should not invent a stable 1.5 slug absent from KIE docs", () => {
      const request = {
        model: "grok-imagine-video-1-5",
        input: {
          image_urls: ["https://example.com/reference.png"],
          duration: 8,
        },
      };

      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        false
      );
    });
  });

  describe("type checking", () => {
    it("should reject wrong string type for model", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: 123, // Should be string
        input: {},
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject wrong object type for input", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "nano-banana-pro",
        input: "should-be-object", // Should be object
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
        true
      );
    });

    it("should reject array when object expected for input", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: "nano-banana-pro",
        input: [], // Array is not a plain object
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
        true
      );
    });
  });

  describe("gpt-image-2 text-to-image", () => {
    it("should apply documented defaults", () => {
      const result = GptImage2TextToImageRequestSchema.safeParse({
        model: "gpt-image-2-text-to-image",
        input: {
          prompt: "Generate an image of a glass building at sunrise.",
        },
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.input.aspect_ratio).toBe("auto");
      expect(result.data.input.resolution).toBe("1K");
    });

    it("should accept the documented aspect ratios", () => {
      const aspectRatios = [
        "auto",
        "1:1",
        "3:2",
        "2:3",
        "4:3",
        "3:4",
        "5:4",
        "4:5",
        "16:9",
        "9:16",
        "2:1",
        "1:2",
        "3:1",
        "1:3",
        "21:9",
        "9:21",
      ];

      for (const aspect_ratio of aspectRatios) {
        const result = GptImage2TextToImageRequestSchema.safeParse({
          model: "gpt-image-2-text-to-image",
          input: {
            prompt: "Generate an image of a glass building at sunrise.",
            aspect_ratio,
            resolution: "1K",
          },
        });

        expect(result.success, `${aspect_ratio} should be accepted`).toBe(true);
      }
    });
  });

  describe("gpt-image-2 image-to-image", () => {
    it("should apply documented defaults", () => {
      const result = GptImage2ImageToImageRequestSchema.safeParse({
        model: "gpt-image-2-image-to-image",
        input: {
          prompt: "Turn this product photo into a studio advertisement.",
          input_urls: ["https://example.com/input.png"],
        },
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.input.aspect_ratio).toBe("auto");
      expect(result.data.input.resolution).toBe("1K");
    });

    it("should accept the documented aspect ratios", () => {
      const aspectRatios = [
        "auto",
        "1:1",
        "5:4",
        "9:16",
        "21:9",
        "16:9",
        "4:3",
        "3:2",
        "4:5",
        "3:4",
        "2:3",
      ];

      for (const aspect_ratio of aspectRatios) {
        const result = GptImage2ImageToImageRequestSchema.safeParse({
          model: "gpt-image-2-image-to-image",
          input: {
            prompt: "Turn this product photo into a studio advertisement.",
            input_urls: ["https://example.com/input.png"],
            aspect_ratio,
            resolution: "1K",
          },
        });

        expect(result.success, `${aspect_ratio} should be accepted`).toBe(true);
      }
    });
  });

  describe("kling 3.0 turbo", () => {
    it("should accept the documented image-to-video request", () => {
      const request = {
        model: "kling/v3-turbo-image-to-video",
        input: {
          prompt: "A slow push-in on a studio product photo.",
          image_urls: ["https://example.com/product.png"],
          duration: "5",
          resolution: "1080p",
        },
      };

      expect(
        KlingV3TurboImageToVideoRequestSchema.safeParse(request).success
      ).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    });

    it("should reject image-to-video requests with more than one image", () => {
      const result = KlingV3TurboImageToVideoRequestSchema.safeParse({
        model: "kling/v3-turbo-image-to-video",
        input: {
          prompt: "Animate both photos.",
          image_urls: [
            "https://example.com/first.png",
            "https://example.com/second.png",
          ],
          duration: "5",
          resolution: "720p",
        },
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("image_urls"))
      ).toBe(true);
    });

    it("should accept the documented text-to-video request", () => {
      const request = {
        model: "kling/v3-turbo-text-to-video",
        input: {
          prompt: "A cinematic drone shot over glass towers at sunrise.",
          duration: "5",
          aspect_ratio: "16:9",
          resolution: "720p",
        },
      };

      expect(
        KlingV3TurboTextToVideoRequestSchema.safeParse(request).success
      ).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    });

    it("should apply text-to-video defaults from KIE docs", () => {
      const result = KlingV3TurboTextToVideoRequestSchema.safeParse({
        model: "kling/v3-turbo-text-to-video",
        input: {
          prompt: "A cinematic drone shot over glass towers at sunrise.",
        },
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.input.duration).toBe("5");
      expect(result.data.input.aspect_ratio).toBe("16:9");
      expect(result.data.input.resolution).toBe("720p");
      expect(MediaGenerationRequestSchema.safeParse(result.data).success).toBe(
        true
      );
    });

    it("should accept string durations from KIE docs examples", () => {
      expect(
        KlingV3TurboImageToVideoRequestSchema.safeParse({
          model: "kling/v3-turbo-image-to-video",
          input: {
            prompt: "A slow push-in on a studio product photo.",
            image_urls: ["https://example.com/product.png"],
            duration: "5",
            resolution: "1080p",
          },
        }).success
      ).toBe(true);
      expect(
        KlingV3TurboTextToVideoRequestSchema.safeParse({
          model: "kling/v3-turbo-text-to-video",
          input: {
            prompt: "A cinematic drone shot over glass towers at sunrise.",
            duration: "5",
            aspect_ratio: "16:9",
            resolution: "720p",
          },
        }).success
      ).toBe(true);
    });

    it("should enforce text-to-video prompt and duration bounds", () => {
      const result = KlingV3TurboTextToVideoRequestSchema.safeParse({
        model: "kling/v3-turbo-text-to-video",
        input: {
          prompt: "x".repeat(2501),
          duration: "16",
          aspect_ratio: "16:9",
          resolution: "720p",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
      expect(
        result.error?.issues.some((i) => i.path.includes("duration"))
      ).toBe(true);
    });

    it("should reject text-to-video requests with unsupported aspect ratios", () => {
      const result = KlingV3TurboTextToVideoRequestSchema.safeParse({
        model: "kling/v3-turbo-text-to-video",
        input: {
          prompt: "A cinematic drone shot over glass towers at sunrise.",
          duration: "5",
          aspect_ratio: "4:3",
          resolution: "720p",
        },
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("aspect_ratio"))
      ).toBe(true);
    });
  });

  describe("happyhorse text-to-video", () => {
    it("should accept the documented text-to-video request", () => {
      const request = {
        model: "happyhorse/text-to-video",
        input: {
          prompt:
            "A Pixar-style short about a nervous little traffic cone who dreams of being a finish line pylon at a major race. Other cones mock its ambitions. A construction worker accidentally places it at a marathon finish line. The cone's painted face shifts from terror to joy as runners pass. Confetti falls on its cone head. Other cones watch on TV, inspired. Audio: Traffic sounds becoming crowd cheers, inspirational swelling music.",
          resolution: "1080p",
          aspect_ratio: "16:9",
          duration: 5,
          seed: 42,
        },
      };

      expect(
        HappyHorseTextToVideoRequestSchema.safeParse(request).success
      ).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    });

    it("should enforce documented duration bounds", () => {
      const result = HappyHorseTextToVideoRequestSchema.safeParse({
        model: "happyhorse/text-to-video",
        input: {
          prompt: "A short video prompt.",
          duration: 16,
        },
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("duration"))
      ).toBe(true);
    });
  });

  describe("happyhorse image-to-video", () => {
    it("should accept the documented image-to-video request", () => {
      const request = {
        model: "happyhorse/image-to-video",
        input: {
          prompt:
            "Tracking shot as the girl walks gracefully through the meadow. Her dress and hair flutter in the wind, and clouds drift slowly. Cinematic audio of soft footsteps on grass, rustling summer wind, and melodic bird calls.",
          image_urls: [
            "https://static.aiquickdraw.com/tools/example/1777359961666_Z3je05MP.png",
          ],
          resolution: "1080p",
          duration: 5,
          seed: 42,
        },
      };

      expect(
        HappyHorseImageToVideoRequestSchema.safeParse(request).success
      ).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    });

    it("should require exactly one image URL", () => {
      const result = HappyHorseImageToVideoRequestSchema.safeParse({
        model: "happyhorse/image-to-video",
        input: {
          image_urls: [
            "https://example.com/first.png",
            "https://example.com/second.png",
          ],
        },
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("image_urls"))
      ).toBe(true);
    });
  });

  describe("happyhorse 1.1 text-to-video", () => {
    it("should accept the documented text-to-video request and apply defaults", () => {
      const result = HappyHorse11TextToVideoRequestSchema.safeParse({
        model: "happyhorse-1-1/text-to-video",
        input: {
          prompt: "A dog running on the earth",
        },
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.input.resolution).toBe("1080p");
      expect(result.data.input.aspect_ratio).toBe("16:9");
      expect(result.data.input.duration).toBe(5);
      expect(MediaGenerationRequestSchema.safeParse(result.data).success).toBe(
        true
      );
    });

    it("should reject unsupported aspect ratios and duration bounds", () => {
      const result = HappyHorse11TextToVideoRequestSchema.safeParse({
        model: "happyhorse-1-1/text-to-video",
        input: {
          prompt: "A short video prompt.",
          aspect_ratio: "2:3",
          duration: 16,
        },
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("aspect_ratio"))
      ).toBe(true);
      expect(
        result.error?.issues.some((i) => i.path.includes("duration"))
      ).toBe(true);
    });
  });

  describe("happyhorse 1.1 image-to-video", () => {
    it("should require exactly one image URL and parse defaults", () => {
      const result = HappyHorse11ImageToVideoRequestSchema.safeParse({
        model: "happyhorse-1-1/image-to-video",
        input: {
          image_urls: ["https://example.com/first-frame.png"],
          duration: 3,
        },
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.input.prompt).toBe("");
      expect(result.data.input.resolution).toBe("1080p");
      expect(MediaGenerationRequestSchema.safeParse(result.data).success).toBe(
        true
      );
    });

    it("should reject missing, non-URL, and too many image URLs", () => {
      const missing = HappyHorse11ImageToVideoRequestSchema.safeParse({
        model: "happyhorse-1-1/image-to-video",
        input: {},
      });
      const badUrl = HappyHorse11ImageToVideoRequestSchema.safeParse({
        model: "happyhorse-1-1/image-to-video",
        input: {
          image_urls: ["not-a-url"],
        },
      });
      const tooMany = HappyHorse11ImageToVideoRequestSchema.safeParse({
        model: "happyhorse-1-1/image-to-video",
        input: {
          image_urls: [
            "https://example.com/first.png",
            "https://example.com/second.png",
          ],
        },
      });

      for (const result of [missing, badUrl, tooMany]) {
        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some((i) => i.path.includes("image_urls"))
        ).toBe(true);
      }
    });

    it("should reject invalid resolution and non-integer duration", () => {
      const result = HappyHorse11ImageToVideoRequestSchema.safeParse({
        model: "happyhorse-1-1/image-to-video",
        input: {
          image_urls: ["https://example.com/first-frame.png"],
          resolution: "4k",
          duration: 3.5,
        },
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("resolution"))
      ).toBe(true);
      expect(
        result.error?.issues.some((i) => i.path.includes("duration"))
      ).toBe(true);
    });
  });

  describe("happyhorse 1.1 reference-to-video", () => {
    it("should accept the documented reference-to-video request", () => {
      const result = HappyHorse11ReferenceToVideoRequestSchema.safeParse({
        model: "happyhorse-1-1/reference-to-video",
        input: {
          reference_image: ["https://example.com/reference.png"],
          prompt: "A cat running on the grass",
          resolution: "1080p",
          aspect_ratio: "21:9",
          duration: 15,
        },
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(MediaGenerationRequestSchema.safeParse(result.data).success).toBe(
        true
      );
    });

    it("should enforce reference image count and URL validation", () => {
      const tooMany = HappyHorse11ReferenceToVideoRequestSchema.safeParse({
        model: "happyhorse-1-1/reference-to-video",
        input: {
          reference_image: Array.from(
            { length: 10 },
            (_, i) => `https://example.com/reference-${i + 1}.png`
          ),
          prompt: "A cat running on the grass",
        },
      });
      const badUrl = HappyHorse11ReferenceToVideoRequestSchema.safeParse({
        model: "happyhorse-1-1/reference-to-video",
        input: {
          reference_image: ["not-a-url"],
          prompt: "A cat running on the grass",
        },
      });

      for (const result of [tooMany, badUrl]) {
        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some((i) => i.path.includes("reference_image"))
        ).toBe(true);
      }
    });
  });

  describe("happyhorse 1.1 response", () => {
    it("should parse the documented taskId response", () => {
      const result = HappyHorse11CreateTaskResponseSchema.safeParse({
        code: 200,
        msg: "success",
        data: {
          taskId: "task_253_abc123",
        },
      });

      expect(result.success).toBe(true);
    });

    it("should require taskId data for successful responses", () => {
      const result = HappyHorse11CreateTaskResponseSchema.safeParse({
        code: 200,
        msg: "success",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("volcengine video-to-video lip sync", () => {
    it("should accept the documented lip sync request and apply defaults", () => {
      const request = {
        model: "volcengine/video-to-video-lip-sync",
        callBackUrl: "https://example.com/callback",
        input: {
          mode: "lite",
          video_url: "https://example.com/source-video.mp4",
          audio_url: "https://example.com/target-vocal.wav",
          separate_vocal: true,
          align_audio_reverse: true,
          templ_start_seconds: 1.25,
        },
      };

      const result =
        VolcengineVideoToVideoLipSyncRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.input.open_scenedet).toBe(false);
      expect(result.data.input.align_audio).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    });

    it("should require mode, video_url, and audio_url", () => {
      const result = VolcengineVideoToVideoLipSyncRequestSchema.safeParse({
        model: "volcengine/video-to-video-lip-sync",
        input: {
          mode: "lite",
          video_url: "https://example.com/source-video.mp4",
        },
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("audio_url"))
      ).toBe(true);
    });

    it("should reject unsupported modes", () => {
      const result = VolcengineVideoToVideoLipSyncRequestSchema.safeParse({
        model: "volcengine/video-to-video-lip-sync",
        input: {
          mode: "pro",
          video_url: "https://example.com/source-video.mp4",
          audio_url: "https://example.com/target-vocal.wav",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("mode"))).toBe(
        true
      );
    });
  });

  describe("qwen v1 unversioned models", () => {
    it("should accept the documented text-to-image request", () => {
      const request = {
        model: "qwen/text-to-image",
        callBackUrl: "https://example.com/callback",
        input: {
          prompt: "a photorealistic cat on a windowsill",
          image_size: "square_hd",
          num_inference_steps: 30,
          guidance_scale: 2.5,
          output_format: "png",
          acceleration: "none",
        },
      };

      const result = QwenTextToImageRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("should require prompt for text-to-image and reject overlong prompts", () => {
      const missing = QwenTextToImageRequestSchema.safeParse({
        model: "qwen/text-to-image",
        input: {},
      });
      expect(missing.success).toBe(false);
      expect(missing.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );

      const tooLong = QwenTextToImageRequestSchema.safeParse({
        model: "qwen/text-to-image",
        input: { prompt: "x".repeat(5001) },
      });
      expect(tooLong.success).toBe(false);
    });

    it("should accept documented image-edit and require image_url", () => {
      const request = {
        model: "qwen/image-edit",
        input: {
          prompt: "replace the sky with a sunset",
          image_url:
            "https://file.aiquickdraw.com/custom-page/akr/section-images/1755603225969i6j87xnw.jpg",
          num_images: "2",
        },
      };

      const result = QwenImageEditRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.input.image_size).toBe("landscape_4_3");
      expect(result.data.input.num_inference_steps).toBe(25);
      expect(result.data.input.guidance_scale).toBe(4);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);

      const missingUrl = QwenImageEditRequestSchema.safeParse({
        model: "qwen/image-edit",
        input: { prompt: "edit me" },
      });
      expect(missingUrl.success).toBe(false);
      expect(
        missingUrl.error?.issues.some((i) => i.path.includes("image_url"))
      ).toBe(true);
    });

    it("should reject non-string and out-of-enum num_images for image-edit", () => {
      const numeric = QwenImageEditRequestSchema.safeParse({
        model: "qwen/image-edit",
        input: {
          prompt: "edit",
          image_url: "https://example.com/source.png",
          num_images: 2,
        },
      });
      expect(numeric.success).toBe(false);

      const invalid = QwenImageEditRequestSchema.safeParse({
        model: "qwen/image-edit",
        input: {
          prompt: "edit",
          image_url: "https://example.com/source.png",
          num_images: "5",
        },
      });
      expect(invalid.success).toBe(false);
    });

    it("should accept image-to-image and enforce strength bounds", () => {
      const request = {
        model: "qwen/image-to-image",
        input: {
          prompt: "restyle as watercolor",
          image_url: "https://example.com/source.png",
          strength: 0.8,
        },
      };

      const result = QwenImageToImageRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);

      for (const strength of [-0.1, 1.1] as const) {
        const bad = QwenImageToImageRequestSchema.safeParse({
          model: "qwen/image-to-image",
          input: {
            prompt: "restyle",
            image_url: "https://example.com/source.png",
            strength,
          },
        });
        expect(bad.success).toBe(false);
      }
    });
  });

  describe("seedream 4.5 createTask models", () => {
    it("should accept the documented 4.5 text-to-image request", () => {
      const request = {
        model: "seedream/4.5-text-to-image",
        callBackUrl: "https://example.com/callback",
        input: {
          prompt: "A full-process cafe design tool promotional image in 16:9",
          aspect_ratio: "1:1",
          quality: "basic",
          nsfw_checker: false,
        },
      };

      const result = Seedream45TextToImageRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("should require quality for 4.5 text-to-image and default aspect_ratio", () => {
      const missingQuality = Seedream45TextToImageRequestSchema.safeParse({
        model: "seedream/4.5-text-to-image",
        input: {
          prompt: "A quiet harbour at first light",
        },
      });
      expect(missingQuality.success).toBe(false);
      expect(
        missingQuality.error?.issues.some((i) => i.path.includes("quality"))
      ).toBe(true);

      const withQuality = Seedream45TextToImageRequestSchema.parse({
        model: "seedream/4.5-text-to-image",
        input: {
          prompt: "A quiet harbour at first light",
          quality: "high",
        },
      });
      expect(withQuality.input.aspect_ratio).toBe("1:1");
      expect(withQuality.input.quality).toBe("high");
      expect(withQuality.input.nsfw_checker).toBe(false);
    });

    it("should accept the documented 4.5 edit request", () => {
      const request = {
        model: "seedream/4.5-edit",
        callBackUrl: "https://example.com/callback",
        input: {
          prompt:
            "Keep the model's pose; change clothing material to clear water",
          image_urls: [
            "https://static.aiquickdraw.com/tools/example/1764851484363_ScV1s2aq.webp",
          ],
          aspect_ratio: "1:1",
          quality: "basic",
          nsfw_checker: true,
        },
      };

      const result = Seedream45EditRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("should require image_urls and quality for 4.5 edit", () => {
      const missingImages = Seedream45EditRequestSchema.safeParse({
        model: "seedream/4.5-edit",
        input: {
          prompt: "Change the clothing material",
          quality: "basic",
        },
      });
      expect(missingImages.success).toBe(false);
      expect(
        missingImages.error?.issues.some((i) => i.path.includes("image_urls"))
      ).toBe(true);

      const missingQuality = Seedream45EditRequestSchema.safeParse({
        model: "seedream/4.5-edit",
        input: {
          prompt: "Change the clothing material",
          image_urls: ["https://example.com/source.png"],
        },
      });
      expect(missingQuality.success).toBe(false);
      expect(
        missingQuality.error?.issues.some((i) => i.path.includes("quality"))
      ).toBe(true);
    });

    it("should reject more than 14 image_urls on 4.5 edit", () => {
      const result = Seedream45EditRequestSchema.safeParse({
        model: "seedream/4.5-edit",
        input: {
          prompt: "Change the clothing material",
          image_urls: Array.from(
            { length: 15 },
            (_, i) => `https://example.com/${i}.png`
          ),
          quality: "basic",
        },
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("image_urls"))
      ).toBe(true);
    });
  });

  describe("topaz upscale models", () => {
    it("should accept the documented image-upscale request", () => {
      const request = {
        model: "topaz/image-upscale",
        callBackUrl: "https://example.com/callback",
        input: {
          image_url: "https://static.aiquickdraw.com/tools/example/image.png",
          upscale_factor: "2",
        },
      };

      const result = TopazImageUpscaleRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("should require image_url and upscale_factor for image-upscale", () => {
      const missingFactor = TopazImageUpscaleRequestSchema.safeParse({
        model: "topaz/image-upscale",
        input: {
          image_url: "https://example.com/source.png",
        },
      });
      expect(missingFactor.success).toBe(false);
      expect(
        missingFactor.error?.issues.some((i) =>
          i.path.includes("upscale_factor")
        )
      ).toBe(true);

      const missingUrl = TopazImageUpscaleRequestSchema.safeParse({
        model: "topaz/image-upscale",
        input: {
          upscale_factor: "2",
        },
      });
      expect(missingUrl.success).toBe(false);
      expect(
        missingUrl.error?.issues.some((i) => i.path.includes("image_url"))
      ).toBe(true);
    });

    it("should reject numeric and out-of-enum upscale_factor values", () => {
      const numeric = TopazImageUpscaleRequestSchema.safeParse({
        model: "topaz/image-upscale",
        input: {
          image_url: "https://example.com/source.png",
          upscale_factor: 2,
        },
      });
      expect(numeric.success).toBe(false);

      const invalid = TopazImageUpscaleRequestSchema.safeParse({
        model: "topaz/image-upscale",
        input: {
          image_url: "https://example.com/source.png",
          upscale_factor: "8",
        },
      });
      expect(invalid.success).toBe(false);
      expect(
        invalid.error?.issues.some((i) => i.path.includes("upscale_factor"))
      ).toBe(true);
    });

    it("should accept video-upscale with only video_url", () => {
      const request = {
        model: "topaz/video-upscale",
        input: {
          video_url:
            "https://file.aiquickdraw.com/custom-page/akr/section-images/video.mp4",
        },
      };

      const result = TopazVideoUpscaleRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.input.upscale_factor).toBeUndefined();
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("should accept documented video-upscale factors and reject bad ones", () => {
      for (const factor of ["1", "2", "4"] as const) {
        const result = TopazVideoUpscaleRequestSchema.safeParse({
          model: "topaz/video-upscale",
          input: {
            video_url: "https://example.com/source.mp4",
            upscale_factor: factor,
          },
        });
        expect(result.success).toBe(true);
      }

      const missingUrl = TopazVideoUpscaleRequestSchema.safeParse({
        model: "topaz/video-upscale",
        input: {
          upscale_factor: "2",
        },
      });
      expect(missingUrl.success).toBe(false);
      expect(
        missingUrl.error?.issues.some((i) => i.path.includes("video_url"))
      ).toBe(true);
    });
  });

  describe("infinitalk from-audio model", () => {
    it("should accept the documented from-audio request", () => {
      const request = {
        model: "infinitalk/from-audio",
        callBackUrl: "https://your-domain.com/api/callback",
        input: {
          image_url:
            "https://file.aiquickdraw.com/custom-page/akr/section-images/1757329269873ggqj2hz3.png",
          audio_url:
            "https://file.aiquickdraw.com/custom-page/akr/section-images/1757329255705mmqwrnri.mp3",
          prompt: "A young woman with long dark hair talking on a podcast.",
          resolution: "480p",
        },
      };

      const result = InfinitalkFromAudioRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("should require image_url, audio_url, and prompt", () => {
      const missing = InfinitalkFromAudioRequestSchema.safeParse({
        model: "infinitalk/from-audio",
        input: {
          image_url: "https://example.com/portrait.png",
        },
      });
      expect(missing.success).toBe(false);
      expect(
        missing.error?.issues.some((i) => i.path.includes("audio_url"))
      ).toBe(true);
      expect(missing.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });

    it("should accept optional resolution and seed in range", () => {
      const result = InfinitalkFromAudioRequestSchema.safeParse({
        model: "infinitalk/from-audio",
        input: {
          image_url: "https://example.com/portrait.png",
          audio_url: "https://example.com/voice.mp3",
          prompt: "A host speaking into a microphone",
          resolution: "720p",
          seed: 42000,
        },
      });
      expect(result.success).toBe(true);

      const outOfRange = InfinitalkFromAudioRequestSchema.safeParse({
        model: "infinitalk/from-audio",
        input: {
          image_url: "https://example.com/portrait.png",
          audio_url: "https://example.com/voice.mp3",
          prompt: "A host speaking into a microphone",
          seed: 1,
        },
      });
      expect(outOfRange.success).toBe(false);
      expect(
        outOfRange.error?.issues.some((i) => i.path.includes("seed"))
      ).toBe(true);
    });
  });

  describe("z-image model", () => {
    it("should accept the documented z-image request", () => {
      const request = {
        model: "z-image",
        callBackUrl: "https://your-domain.com/api/callback",
        input: {
          prompt:
            "Generate a photorealistic image of a cafe terrace in the Marais.",
          aspect_ratio: "1:1",
          nsfw_checker: true,
        },
      };

      const result = ZImageRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("should require prompt and aspect_ratio", () => {
      const missingRatio = ZImageRequestSchema.safeParse({
        model: "z-image",
        input: {
          prompt: "A red bicycle leaning against a brick wall",
        },
      });
      expect(missingRatio.success).toBe(false);
      expect(
        missingRatio.error?.issues.some((i) => i.path.includes("aspect_ratio"))
      ).toBe(true);

      const missingPrompt = ZImageRequestSchema.safeParse({
        model: "z-image",
        input: {
          aspect_ratio: "16:9",
        },
      });
      expect(missingPrompt.success).toBe(false);
      expect(
        missingPrompt.error?.issues.some((i) => i.path.includes("prompt"))
      ).toBe(true);
    });

    it("should reject invalid aspect ratios and overlong prompts", () => {
      const badRatio = ZImageRequestSchema.safeParse({
        model: "z-image",
        input: {
          prompt: "A cat on a windowsill",
          aspect_ratio: "21:9",
        },
      });
      expect(badRatio.success).toBe(false);

      const longPrompt = ZImageRequestSchema.safeParse({
        model: "z-image",
        input: {
          prompt: "x".repeat(1001),
          aspect_ratio: "1:1",
        },
      });
      expect(longPrompt.success).toBe(false);
    });
  });

  describe("elevenlabs text-to-audio models", () => {
    const textToSpeechModels = [
      {
        model: "elevenlabs/text-to-speech-multilingual-v2",
        schema: ElevenLabsTextToSpeechMultilingualV2RequestSchema,
      },
      {
        model: "elevenlabs/text-to-speech-turbo-2-5",
        schema: ElevenLabsTextToSpeechTurbo25RequestSchema,
      },
    ] as const;

    for (const { model, schema } of textToSpeechModels) {
      it(`should default omitted numeric settings for ${model}`, () => {
        const request = {
          model,
          input: {
            text: "Defaults stay local to schema parsing.",
            voice: "Rachel",
          },
        };
        const result = schema.safeParse(request);

        expect(result.success).toBe(true);
        if (!result.success) throw result.error;
        expect(result.data.input).toMatchObject({
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          speed: 1,
        });

        for (const composedSchema of [
          MediaGenerationRequestSchema,
          CreateTaskRequestSchema,
        ]) {
          const composedResult = composedSchema.safeParse(request);
          expect(composedResult.success).toBe(true);
          if (!composedResult.success) throw composedResult.error;
          expect(composedResult.data.input).toMatchObject({
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            speed: 1,
          });
        }
      });

      it(`should accept TTS boundaries and preserve values for ${model}`, () => {
        const settings = [
          {
            stability: 0,
            similarity_boost: 0,
            style: 0,
            speed: 0.7,
          },
          {
            stability: 1,
            similarity_boost: 1,
            style: 1,
            speed: 1.2,
          },
          {
            stability: 0.25,
            similarity_boost: 0.6,
            style: 0.4,
            speed: 0.95,
          },
        ];

        for (const numericSettings of settings) {
          const result = schema.safeParse({
            model,
            input: {
              text: "Preserve explicit values.",
              voice: "Rachel",
              ...numericSettings,
            },
          });

          expect(result.success).toBe(true);
          if (!result.success) throw result.error;
          expect(result.data.input).toMatchObject(numericSettings);
        }
      });

      it(`should reject every out-of-range TTS setting for ${model}`, () => {
        const invalidSettings = [
          ["stability", -0.01],
          ["stability", 1.01],
          ["similarity_boost", -0.01],
          ["similarity_boost", 1.01],
          ["style", -0.01],
          ["style", 1.01],
          ["speed", 0.69],
          ["speed", 1.21],
        ] as const;

        for (const [field, value] of invalidSettings) {
          const result = schema.safeParse({
            model,
            input: {
              text: "Reject invalid values.",
              voice: "Rachel",
              [field]: value,
            },
          });

          expect(result.success).toBe(false);
          expect(
            result.error?.issues.some(
              (issue) => issue.path.join(".") === `input.${field}`
            )
          ).toBe(true);
        }
      });

      it(`should require text and voice for ${model}`, () => {
        for (const field of ["text", "voice"] as const) {
          const input: Record<string, unknown> = {
            text: "Required text.",
            voice: "Rachel",
          };
          delete input[field];
          const result = schema.safeParse({ model, input });

          expect(result.success).toBe(false);
          expect(
            result.error?.issues.some(
              (issue) => issue.path.join(".") === `input.${field}`
            )
          ).toBe(true);
        }
      });
    }

    it("should enforce dialogue stability values and its default", () => {
      const request = {
        model: "elevenlabs/text-to-dialogue-v3",
        input: {
          dialogue: [{ text: "Hello.", voice: "Rachel" }],
        },
      } as const;
      const defaulted =
        ElevenLabsTextToDialogueV3RequestSchema.safeParse(request);

      expect(defaulted.success).toBe(true);
      if (!defaulted.success) throw defaulted.error;
      expect(defaulted.data.input.stability).toBe(0.5);

      for (const composedSchema of [
        MediaGenerationRequestSchema,
        CreateTaskRequestSchema,
      ]) {
        const composedResult = composedSchema.safeParse(request);
        expect(composedResult.success).toBe(true);
        if (!composedResult.success) throw composedResult.error;
        expect(composedResult.data).toMatchObject({
          input: { stability: 0.5 },
        });
      }

      for (const stability of [0, 0.5, 1] as const) {
        const result = ElevenLabsTextToDialogueV3RequestSchema.safeParse({
          ...request,
          input: { ...request.input, stability },
        });

        expect(result.success).toBe(true);
        if (!result.success) throw result.error;
        expect(result.data.input.stability).toBe(stability);
      }

      for (const stability of [-0.5, 0.25, 0.75, 1.5]) {
        const result = ElevenLabsTextToDialogueV3RequestSchema.safeParse({
          ...request,
          input: { ...request.input, stability },
        });

        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some(
            (issue) => issue.path.join(".") === "input.stability"
          )
        ).toBe(true);
      }
    });

    it("should accept text-to-speech turbo requests", () => {
      const request = {
        model: "elevenlabs/text-to-speech-turbo-2-5",
        callBackUrl: "https://example.com/callback",
        input: {
          text: "Unlock powerful API with Kie.ai.",
          voice: "Rachel",
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          speed: 1,
          timestamps: false,
          previous_text: "",
          next_text: "",
          language_code: "",
        },
      };

      expect(
        ElevenLabsTextToSpeechTurbo25RequestSchema.safeParse(request).success
      ).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("should accept multilingual text-to-speech requests", () => {
      const request = {
        model: "elevenlabs/text-to-speech-multilingual-v2",
        input: {
          text: "Bonjour depuis Kie.",
          voice: "Rachel",
          language_code: "fr",
        },
      };

      expect(
        ElevenLabsTextToSpeechMultilingualV2RequestSchema.safeParse(request)
          .success
      ).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    });

    it("should accept dialogue text-to-speech requests", () => {
      const request = {
        model: "elevenlabs/text-to-dialogue-v3",
        input: {
          dialogue: [
            {
              text: "I have a pen, I have an apple.",
              voice: "EkK5I93UQWFDigLMpZcX",
            },
            {
              text: "A happy dog.",
              voice: "Z3R5wn05IrDiVCyEkUrK",
            },
          ],
          stability: 0.5,
        },
      };

      expect(
        ElevenLabsTextToDialogueV3RequestSchema.safeParse(request).success
      ).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    });

    it("should reject dialogue requests without turns", () => {
      const result = ElevenLabsTextToDialogueV3RequestSchema.safeParse({
        model: "elevenlabs/text-to-dialogue-v3",
        input: {
          dialogue: [],
        },
      });

      expect(result.success).toBe(false);
    });

    it("should accept sound effect and audio isolation requests", () => {
      const soundEffect = {
        model: "elevenlabs/sound-effect-v2",
        input: {
          text: "",
          loop: false,
          prompt_influence: 0.3,
          output_format: "mp3_44100_128",
        },
      };
      const audioIsolation = {
        model: "elevenlabs/audio-isolation",
        input: {
          audio_url: "https://example.com/source.mp3",
        },
      };

      expect(
        ElevenLabsSoundEffectV2RequestSchema.safeParse(soundEffect).success
      ).toBe(true);
      expect(
        ElevenLabsAudioIsolationRequestSchema.safeParse(audioIsolation).success
      ).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(soundEffect).success).toBe(
        true
      );
      expect(
        MediaGenerationRequestSchema.safeParse(audioIsolation).success
      ).toBe(true);
    });
  });

  describe("gemini omni audio", () => {
    it("should validate audio create requests", () => {
      const result = GeminiOmniAudioCreateRequestSchema.safeParse({
        audio_id: "achernar",
        name: "achernar Narrator",
        voice_description:
          "A calm, clear, and friendly male voice for explainers.",
        example_dialogue: "Hello, I am achernar.",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("gemini omni character", () => {
    it("should validate character create requests", () => {
      const result = GeminiOmniCharacterCreateRequestSchema.safeParse({
        descriptions: "A cinematic host with a navy blazer and warm smile.",
        image_urls: ["https://example.com/characters/host.png"],
        audio_ids: ["audio_01hx8p0demo"],
        character_name: "Host",
      });

      expect(result.success).toBe(true);
    });

    it("should require plural descriptions and one reference image", () => {
      const singularDescription =
        GeminiOmniCharacterCreateRequestSchema.safeParse({
          description: "A cinematic host with a navy blazer.",
          image_urls: ["https://example.com/characters/host.png"],
        });
      const twoImages = GeminiOmniCharacterCreateRequestSchema.safeParse({
        descriptions: "A cinematic host with a navy blazer.",
        image_urls: [
          "https://example.com/characters/host-1.png",
          "https://example.com/characters/host-2.png",
        ],
      });

      expect(singularDescription.success).toBe(false);
      expect(
        singularDescription.error?.issues.some((issue) =>
          issue.path.includes("descriptions")
        )
      ).toBe(true);
      expect(twoImages.success).toBe(false);
      expect(
        twoImages.error?.issues.some((issue) =>
          issue.path.includes("image_urls")
        )
      ).toBe(true);
    });

    it("should validate character create responses with optional code", () => {
      const withoutCode = GeminiOmniCharacterCreateResponseSchema.safeParse({
        msg: "success",
        data: {
          characterId: "character_01hx8p0demo",
          characterName: "Host",
          imageUrl: "https://example.com/characters/host.png",
        },
      });
      const withCode = GeminiOmniCharacterCreateResponseSchema.safeParse({
        code: 200,
        msg: "success",
        data: {
          characterId: "character_01hx8p0demo",
          characterName: "Host",
          imageUrl: "https://example.com/characters/host.png",
        },
      });

      expect(withoutCode.success).toBe(true);
      expect(withCode.success).toBe(true);
    });
  });

  describe("gemini omni video", () => {
    it("should validate multimodal video createTask requests", () => {
      const request = {
        model: "gemini-omni-video",
        callBackUrl: "https://example.com/api/callback",
        input: {
          prompt:
            "Create a futuristic night city short film with a slow push-in shot.",
          image_urls: [
            "https://example.com/assets/scene-1.png",
            "https://example.com/assets/scene-2.png",
          ],
          audio_ids: ["audio_01hx8p0demo"],
          video_list: [
            {
              url: "https://example.com/assets/source-video.mp4",
              start: 0,
              ends: 9.5,
            },
          ],
          character_ids: ["character_01", "character_02"],
          duration: "4",
          aspect_ratio: "16:9",
          seed: 1234,
          resolution: "1080p",
        },
      };

      expect(GeminiOmniVideoRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("should enforce visual quota across images, videos, and characters", () => {
      const result = GeminiOmniVideoRequestSchema.safeParse({
        model: "gemini-omni-video",
        input: {
          prompt: "Animate a group of character references.",
          image_urls: [
            "https://example.com/1.png",
            "https://example.com/2.png",
            "https://example.com/3.png",
          ],
          video_list: [
            {
              url: "https://example.com/source.mp4",
              start: 0,
              ends: 4,
            },
          ],
          character_ids: ["char_1", "char_2", "char_3"],
          duration: "6",
        },
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((issue) =>
          issue.message.includes("quota exceeded")
        )
      ).toBe(true);
    });

    it("should reject invalid clip windows and unsupported durations", () => {
      const invalidClip = GeminiOmniVideoRequestSchema.safeParse({
        model: "gemini-omni-video",
        input: {
          prompt: "Animate the source clip.",
          video_list: [
            {
              url: "https://example.com/source.mp4",
              start: 2,
              ends: 12,
            },
          ],
          duration: "4",
        },
      });
      const invalidDuration = GeminiOmniVideoRequestSchema.safeParse({
        model: "gemini-omni-video",
        input: {
          prompt: "Animate a reference image.",
          image_urls: ["https://example.com/reference.png"],
          duration: "5",
        },
      });

      expect(invalidClip.success).toBe(false);
      expect(invalidDuration.success).toBe(false);
    });
  });

  describe("downloadUrl schema validation", () => {
    it("should validate downloadUrl with required url", () => {
      const result = DownloadUrlRequestSchema.safeParse({
        url: "https://kie.io/cdn/file.zip",
      });
      expect(result.success).toBe(true);
    });

    it("should reject downloadUrl without required url", () => {
      const result = DownloadUrlRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("url"))).toBe(
        true
      );
    });

    it("should reject non-string url", () => {
      const result = DownloadUrlRequestSchema.safeParse({
        url: 123,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("url"))).toBe(
        true
      );
    });
  });

  describe("fileStreamUpload schema validation", () => {
    it("should validate fileStreamUpload with required fields", () => {
      const result = UploadMediaRequestSchema.safeParse({
        file: new Blob(["test"]),
        filename: "test.bin",
        uploadPath: "uploads",
      });
      expect(result.success).toBe(true);
    });

    it("should validate fileStreamUpload with optional fields", () => {
      const result = UploadMediaRequestSchema.safeParse({
        file: new Blob(["test"]),
        filename: "test.txt",
        uploadPath: "uploads",
        fileName: "test.txt",
        mimeType: "text/plain",
      });
      expect(result.success).toBe(true);
    });

    it("should reject fileStreamUpload without required file", () => {
      const result = UploadMediaRequestSchema.safeParse({
        uploadPath: "uploads",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
        true
      );
    });

    it("should reject fileStreamUpload without required uploadPath", () => {
      const result = UploadMediaRequestSchema.safeParse({
        file: new Blob(["test"]),
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("uploadPath"))
      ).toBe(true);
    });
  });

  describe("fileUrlUpload schema validation", () => {
    it("should validate fileUrlUpload with required fields", () => {
      const result = FileUrlUploadRequestSchema.safeParse({
        fileUrl: "https://example.com/file.txt",
        uploadPath: "uploads",
      });
      expect(result.success).toBe(true);
    });

    it("should validate fileUrlUpload with optional fileName", () => {
      const result = FileUrlUploadRequestSchema.safeParse({
        fileUrl: "https://example.com/file.txt",
        uploadPath: "uploads",
        fileName: "test.txt",
      });
      expect(result.success).toBe(true);
    });

    it("should reject fileUrlUpload without required fileUrl", () => {
      const result = FileUrlUploadRequestSchema.safeParse({
        uploadPath: "uploads",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("fileUrl"))).toBe(
        true
      );
    });

    it("should reject fileUrlUpload without required uploadPath", () => {
      const result = FileUrlUploadRequestSchema.safeParse({
        fileUrl: "https://example.com/file.txt",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("uploadPath"))
      ).toBe(true);
    });
  });

  describe("fileBase64Upload schema validation", () => {
    it("should validate fileBase64Upload with required fields", () => {
      const result = FileBase64UploadRequestSchema.safeParse({
        base64Data: "dGVzdCBjb250ZW50",
        uploadPath: "uploads",
      });
      expect(result.success).toBe(true);
    });

    it("should validate fileBase64Upload with optional fields", () => {
      const result = FileBase64UploadRequestSchema.safeParse({
        base64Data: "dGVzdCBjb250ZW50",
        uploadPath: "uploads",
        fileName: "test.txt",
        mimeType: "text/plain",
      });
      expect(result.success).toBe(true);
    });

    it("should reject fileBase64Upload without required base64Data", () => {
      const result = FileBase64UploadRequestSchema.safeParse({
        uploadPath: "uploads",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("base64Data"))
      ).toBe(true);
    });

    it("should reject fileBase64Upload without required uploadPath", () => {
      const result = FileBase64UploadRequestSchema.safeParse({
        base64Data: "dGVzdCBjb250ZW50",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("uploadPath"))
      ).toBe(true);
    });
  });

  describe("veoGenerate schema validation", () => {
    it("should validate veoGenerate with required prompt", () => {
      const result = VeoGenerateRequestSchema.safeParse({
        prompt: "A cat playing piano",
      });
      expect(result.success).toBe(true);
    });

    it("should validate veoGenerate with all fields", () => {
      const result = VeoGenerateRequestSchema.safeParse({
        prompt: "A cat playing piano",
        model: "veo3",
        aspectRatio: "16:9",
        generationType: "TEXT_2_VIDEO",
        imageUrls: ["https://example.com/image.jpg"],
        seeds: 42,
        watermark: "My Watermark",
        enableTranslation: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject veoGenerate without required prompt", () => {
      const result = VeoGenerateRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });

    it("should validate veoGenerate enum values for model", () => {
      const valid = VeoGenerateRequestSchema.safeParse({
        prompt: "test",
        model: "veo3",
      });
      expect(valid.success).toBe(true);

      const invalid = VeoGenerateRequestSchema.safeParse({
        prompt: "test",
        model: "invalid-model",
      });
      expect(invalid.success).toBe(false);
      expect(invalid.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should validate veoGenerate enum values for aspectRatio", () => {
      const valid = VeoGenerateRequestSchema.safeParse({
        prompt: "test",
        aspectRatio: "16:9",
      });
      expect(valid.success).toBe(true);

      const invalid = VeoGenerateRequestSchema.safeParse({
        prompt: "test",
        aspectRatio: "4:3",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("veoExtend schema validation", () => {
    it("should validate veoExtend with required fields", () => {
      const result = VeoExtendRequestSchema.safeParse({
        taskId: "task-123",
        prompt: "Extend the video",
      });
      expect(result.success).toBe(true);
    });

    it("should validate veoExtend with optional fields", () => {
      const result = VeoExtendRequestSchema.safeParse({
        taskId: "task-123",
        prompt: "Extend the video",
        model: "fast",
        seeds: 42,
        watermark: "Mark",
      });
      expect(result.success).toBe(true);
    });

    it("should reject veoExtend without required taskId", () => {
      const result = VeoExtendRequestSchema.safeParse({
        prompt: "Extend the video",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("taskId"))).toBe(
        true
      );
    });

    it("should reject veoExtend without required prompt", () => {
      const result = VeoExtendRequestSchema.safeParse({
        taskId: "task-123",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });
  });

  describe("sunoGenerate schema validation", () => {
    it("should reject sunoGenerate without required prompt", () => {
      const result = SunoGenerateRequestSchema.safeParse({
        model: "V4",
        instrumental: false,
        customMode: true,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });

    it("should reject sunoGenerate without required model", () => {
      const result = SunoGenerateRequestSchema.safeParse({
        prompt: "A happy song",
        instrumental: false,
        customMode: true,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    // `model` is now an open enum (SunoModelAliasSchema in zod.ts): any
    // uppercase `V<version>` id matches the family grammar, so the unlisted
    // `V3` validates by design. The negative keeps its job with a case typo,
    // which the grammar still rejects. Full accept/alias/reject coverage lives
    // in tests/unit/kie-zod.test.ts.
    it("should reject sunoGenerate with invalid model enum value", () => {
      const invalid = SunoGenerateRequestSchema.safeParse({
        prompt: "test",
        model: "v3",
        instrumental: true,
        customMode: false,
        callBackUrl: "https://example.com/callback",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("chatCompletions55 schema validation", () => {
    it("should validate chatCompletions55 with required fields", () => {
      const result = KieChatRequestSchema.safeParse({
        model: "gpt-5.5",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("should validate chatCompletions55 with all optional fields", () => {
      const result = KieChatRequestSchema.safeParse({
        model: "gpt-5.5",
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hello" },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject chatCompletions55 without required model", () => {
      const result = KieChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject chatCompletions55 without required messages", () => {
      const result = KieChatRequestSchema.safeParse({
        model: "gpt-5.5",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("messages"))
      ).toBe(true);
    });

    it("should validate message role enum values", () => {
      const validRoles = ["user", "assistant", "system"];
      for (const role of validRoles) {
        const result = KieChatRequestSchema.safeParse({
          model: "gpt-5.5",
          messages: [{ role, content: "test" }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid message role", () => {
      const result = KieChatRequestSchema.safeParse({
        model: "gpt-5.5",
        messages: [{ role: "invalid", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate response_format type enum", () => {
      const validTypes = ["text", "json_object", "json_schema"];
      for (const type of validTypes) {
        const result = KieChatRequestSchema.safeParse({
          model: "gpt-5.5",
          messages: [{ role: "user", content: "Hello" }],
          response_format: { type },
        });
        expect(result.success).toBe(true);
      }
    });

    it("should validate array items with nested object validation", () => {
      const result = KieChatRequestSchema.safeParse({
        model: "gpt-5.5",
        messages: [
          { role: "user" }, // missing content
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("claudeMessages schema validation", () => {
    it("should validate claudeMessages with required fields", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("should validate claudeMessages with haiku model", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-haiku-4-5",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("should validate claudeMessages with optional fields", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
        thinkingFlag: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid model enum value", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "invalid-model",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should validate claude message roles", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject system role in claude messages", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "system", content: "System prompt" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate tools array with nested validation", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            name: "get_weather",
            description: "Get weather info",
            input_schema: { type: "object" },
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject tool missing required fields", () => {
      const result = KieClaudeRequestSchema.safeParse({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            name: "get_weather",
            // missing description and input_schema
          },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("multiple errors", () => {
    it("should collect multiple validation errors", () => {
      const result = CreateTaskRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
    });

    it("should collect type errors alongside required errors", () => {
      const result = CreateTaskRequestSchema.safeParse({
        model: 123,
        input: "not-an-object",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
    });
  });
});
