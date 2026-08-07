import { describe, it, expect } from "vitest";

import {
  CreateTaskRequestSchema,
  MediaGenerationRequestSchema,
  Wan22A14bImageToVideoTurboRequestSchema,
  Wan22A14bSpeechToVideoTurboRequestSchema,
  Wan22A14bTextToVideoTurboRequestSchema,
  Wan22AnimateMoveRequestSchema,
  Wan22AnimateReplaceRequestSchema,
  Wan25ImageToVideoRequestSchema,
  Wan25TextToVideoRequestSchema,
  Wan26FlashImageToVideoRequestSchema,
  Wan26FlashVideoToVideoRequestSchema,
  Wan26ImageToVideoRequestSchema,
  Wan26TextToVideoRequestSchema,
  Wan26VideoToVideoRequestSchema,
} from "../../packages/provider/kie/src/zod";

/**
 * WAN createTask models with per-model request members (ac-n4ib21).
 * The wan/2-2-* and wan/2-5-* ids below are KIE_MEDIA_MODELS entries whose
 * requests CREATE_TASK_GUARDS validates before transport (ac-t2cgdc); the
 * wan/2-6-* ids are alias-accepted only — they match KieMediaWanModelAliasSchema
 * and need per-model request members so CreateTaskRequestSchema accepts them.
 */
describe("kie WAN createTask models", () => {
  describe("wan/2-2-a14b-image-to-video-turbo", () => {
    const request = {
      model: "wan/2-2-a14b-image-to-video-turbo",
      callBackUrl: "https://example.com/callback",
      input: {
        image_url: "https://example.com/frame.png",
        prompt: "A low-angle close-up of a man walking toward the camera",
        resolution: "720p",
        enable_prompt_expansion: false,
        acceleration: "none",
      },
    };

    it("accepts the documented request via CreateTask", () => {
      expect(
        Wan22A14bImageToVideoTurboRequestSchema.safeParse(request).success
      ).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("defaults resolution, acceleration, and nsfw_checker", () => {
      const parsed = Wan22A14bImageToVideoTurboRequestSchema.parse({
        model: "wan/2-2-a14b-image-to-video-turbo",
        input: {
          image_url: "https://example.com/frame.png",
          prompt: "A quiet harbour at first light",
        },
      });
      expect(parsed.input.resolution).toBe("720p");
      expect(parsed.input.acceleration).toBe("none");
      expect(parsed.input.nsfw_checker).toBe(false);
    });

    it("requires image_url and prompt", () => {
      expect(
        Wan22A14bImageToVideoTurboRequestSchema.safeParse({
          model: "wan/2-2-a14b-image-to-video-turbo",
          input: { prompt: "missing image" },
        }).success
      ).toBe(false);
      expect(
        Wan22A14bImageToVideoTurboRequestSchema.safeParse({
          model: "wan/2-2-a14b-image-to-video-turbo",
          input: { image_url: "https://example.com/frame.png" },
        }).success
      ).toBe(false);
    });
  });

  describe("wan/2-2-a14b-speech-to-video-turbo", () => {
    const request = {
      model: "wan/2-2-a14b-speech-to-video-turbo",
      input: {
        prompt: "The lady is talking",
        image_url: "https://example.com/face.png",
        audio_url: "https://example.com/speech.mp3",
      },
    };

    it("accepts a minimal required payload and applies defaults", () => {
      const parsed = Wan22A14bSpeechToVideoTurboRequestSchema.parse(request);
      expect(parsed.input.num_frames).toBe(80);
      expect(parsed.input.frames_per_second).toBe(16);
      expect(parsed.input.resolution).toBe("480p");
      expect(parsed.input.num_inference_steps).toBe(27);
      expect(parsed.input.guidance_scale).toBe(3.5);
      expect(parsed.input.shift).toBe(5);
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("requires prompt, image_url, and audio_url", () => {
      expect(
        Wan22A14bSpeechToVideoTurboRequestSchema.safeParse({
          model: "wan/2-2-a14b-speech-to-video-turbo",
          input: {
            prompt: "talking",
            image_url: "https://example.com/face.png",
          },
        }).success
      ).toBe(false);
    });

    it("rejects num_frames outside 40–120", () => {
      expect(
        Wan22A14bSpeechToVideoTurboRequestSchema.safeParse({
          ...request,
          input: { ...request.input, num_frames: 39 },
        }).success
      ).toBe(false);
    });
  });

  describe("wan/2-2-a14b-text-to-video-turbo", () => {
    it("accepts text-to-video with aspect_ratio and defaults", () => {
      const request = {
        model: "wan/2-2-a14b-text-to-video-turbo",
        input: {
          prompt: "A polar landscape bathed in golden sunrise light",
        },
      };
      const parsed = Wan22A14bTextToVideoTurboRequestSchema.parse(request);
      expect(parsed.input.resolution).toBe("720p");
      expect(parsed.input.aspect_ratio).toBe("16:9");
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it.each(["16:9", "9:16"] as const)(
      "accepts aspect_ratio %s",
      (aspect_ratio) => {
        expect(
          Wan22A14bTextToVideoTurboRequestSchema.safeParse({
            model: "wan/2-2-a14b-text-to-video-turbo",
            input: {
              prompt: "A cinematic landscape",
              aspect_ratio,
            },
          }).success
        ).toBe(true);
      }
    );
  });

  describe("wan/2-2-animate-move and animate-replace", () => {
    it.each([
      {
        model: "wan/2-2-animate-move" as const,
        schema: Wan22AnimateMoveRequestSchema,
      },
      {
        model: "wan/2-2-animate-replace" as const,
        schema: Wan22AnimateReplaceRequestSchema,
      },
    ])("accepts $model with video_url + image_url", ({ model, schema }) => {
      const request = {
        model,
        input: {
          video_url: "https://example.com/motion.mp4",
          image_url: "https://example.com/subject.png",
        },
      };
      const parsed = schema.parse(request);
      expect(parsed.input.resolution).toBe("480p");
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it("rejects missing video_url on animate-move", () => {
      expect(
        Wan22AnimateMoveRequestSchema.safeParse({
          model: "wan/2-2-animate-move",
          input: { image_url: "https://example.com/subject.png" },
        }).success
      ).toBe(false);
    });
  });

  describe("wan/2-5-image-to-video", () => {
    it("requires duration without injecting a default", () => {
      const missing = Wan25ImageToVideoRequestSchema.safeParse({
        model: "wan/2-5-image-to-video",
        input: {
          prompt: "Camera slowly pushes in",
          image_url: "https://example.com/start.png",
        },
      });
      expect(missing.success).toBe(false);
      expect(
        missing.error?.issues.some((i) => i.path.includes("duration"))
      ).toBe(true);
    });

    it("accepts duration 5 or 10 as strings", () => {
      for (const duration of ["5", "10"] as const) {
        const request = {
          model: "wan/2-5-image-to-video",
          input: {
            prompt: "Camera slowly pushes in",
            image_url: "https://example.com/start.png",
            duration,
          },
        };
        expect(Wan25ImageToVideoRequestSchema.safeParse(request).success).toBe(
          true
        );
        expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
      }
    });
  });

  describe("wan/2-5-text-to-video", () => {
    it("requires duration and accepts optional aspect_ratio", () => {
      const request = {
        model: "wan/2-5-text-to-video",
        input: {
          prompt: "A flock of birds over a mountain lake",
          duration: "10",
          aspect_ratio: "1:1",
          resolution: "1080p",
        },
      };
      expect(Wan25TextToVideoRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);

      expect(
        Wan25TextToVideoRequestSchema.safeParse({
          model: "wan/2-5-text-to-video",
          input: { prompt: "missing duration only" },
        }).success
      ).toBe(false);
    });
  });

  /**
   * `seed` bounds are not uniform across the 2.2/2.5 fragments: only the two
   * turbo text-to-video/image-to-video pages document Min 0 / Max 2147483647.
   * Speech-to-video and both 2.5 pages type `seed` as a bare integer, and no
   * page's prose promises a server-applied default (a random seed is chosen
   * when `seed` is omitted), so none of them injects one.
   */
  describe("seed bounds follow each model's fragment", () => {
    const bounded = [
      {
        model: "wan/2-2-a14b-image-to-video-turbo" as const,
        schema: Wan22A14bImageToVideoTurboRequestSchema,
        input: {
          image_url: "https://example.com/frame.png",
          prompt: "A quiet harbour at first light",
        },
      },
      {
        model: "wan/2-2-a14b-text-to-video-turbo" as const,
        schema: Wan22A14bTextToVideoTurboRequestSchema,
        input: { prompt: "A quiet harbour at first light" },
      },
    ];

    it.each(bounded)(
      "bounds seed to 0–2147483647 on $model",
      ({ model, schema, input }) => {
        expect(
          schema.safeParse({ model, input: { ...input, seed: 2147483647 } })
            .success
        ).toBe(true);
        expect(
          schema.safeParse({ model, input: { ...input, seed: 2147483648 } })
            .success
        ).toBe(false);
        expect(
          schema.safeParse({ model, input: { ...input, seed: -1 } }).success
        ).toBe(false);
      }
    );

    const unbounded = [
      {
        model: "wan/2-2-a14b-speech-to-video-turbo" as const,
        schema: Wan22A14bSpeechToVideoTurboRequestSchema,
        input: {
          prompt: "The lady is talking",
          image_url: "https://example.com/face.png",
          audio_url: "https://example.com/speech.mp3",
        },
      },
      {
        model: "wan/2-5-image-to-video" as const,
        schema: Wan25ImageToVideoRequestSchema,
        input: {
          prompt: "Camera slowly pushes in",
          image_url: "https://example.com/start.png",
          duration: "5",
        },
      },
      {
        model: "wan/2-5-text-to-video" as const,
        schema: Wan25TextToVideoRequestSchema,
        input: {
          prompt: "A flock of birds over a mountain lake",
          duration: "5",
        },
      },
    ];

    it.each(unbounded)(
      "leaves seed unbounded on $model",
      ({ model, schema, input }) => {
        for (const seed of [-1, 0, 4294967295]) {
          expect(
            schema.safeParse({ model, input: { ...input, seed } }).success
          ).toBe(true);
        }
        expect(
          schema.safeParse({ model, input: { ...input, seed: 1.5 } }).success
        ).toBe(false);
      }
    );

    it("never injects a seed default", () => {
      for (const { model, schema, input } of [...bounded, ...unbounded]) {
        const parsed = schema.parse({ model, input });
        expect(parsed.input.seed).toBeUndefined();
      }
    });
  });

  describe("wan/2-6-flash-image-to-video", () => {
    it("requires audio and a single image_url entry", () => {
      const request = {
        model: "wan/2-6-flash-image-to-video",
        input: {
          prompt: "An anthropomorphic fox singing in the rain",
          image_urls: ["https://example.com/fox.webp"],
          audio: true,
        },
      };
      const parsed = Wan26FlashImageToVideoRequestSchema.parse(request);
      expect(parsed.input.duration).toBe("5");
      expect(parsed.input.resolution).toBe("1080p");
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);

      expect(
        Wan26FlashImageToVideoRequestSchema.safeParse({
          model: "wan/2-6-flash-image-to-video",
          input: {
            prompt: "no audio field",
            image_urls: ["https://example.com/fox.webp"],
          },
        }).success
      ).toBe(false);

      expect(
        Wan26FlashImageToVideoRequestSchema.safeParse({
          model: "wan/2-6-flash-image-to-video",
          input: {
            prompt: "too many images",
            image_urls: [
              "https://example.com/a.png",
              "https://example.com/b.png",
            ],
            audio: false,
          },
        }).success
      ).toBe(false);
    });

    it("rejects prompt shorter than 2 characters", () => {
      expect(
        Wan26FlashImageToVideoRequestSchema.safeParse({
          model: "wan/2-6-flash-image-to-video",
          input: {
            prompt: "x",
            image_urls: ["https://example.com/fox.webp"],
            audio: false,
          },
        }).success
      ).toBe(false);
    });
  });

  describe("wan/2-6-flash-video-to-video", () => {
    it("accepts up to 3 video_urls and defaults duration/resolution", () => {
      const request = {
        model: "wan/2-6-flash-video-to-video",
        input: {
          prompt: "Restyle the clip as a neon noir chase",
          video_urls: ["https://example.com/clip.mp4"],
        },
      };
      const parsed = Wan26FlashVideoToVideoRequestSchema.parse(request);
      expect(parsed.input.duration).toBe("5");
      expect(parsed.input.resolution).toBe("1080p");
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);

      expect(
        Wan26FlashVideoToVideoRequestSchema.safeParse({
          model: "wan/2-6-flash-video-to-video",
          input: {
            prompt: "too many videos",
            video_urls: [
              "https://example.com/1.mp4",
              "https://example.com/2.mp4",
              "https://example.com/3.mp4",
              "https://example.com/4.mp4",
            ],
          },
        }).success
      ).toBe(false);
    });
  });

  describe("wan/2-6-image-to-video", () => {
    it("accepts the documented payload with multi_shots default false", () => {
      const request = {
        model: "wan/2-6-image-to-video",
        input: {
          prompt: "An anthropomorphic fox singing a Christmas song",
          image_urls: ["https://example.com/fox.webp"],
        },
      };
      const parsed = Wan26ImageToVideoRequestSchema.parse(request);
      expect(parsed.input.duration).toBe("5");
      expect(parsed.input.resolution).toBe("1080p");
      expect(parsed.input.multi_shots).toBe(false);
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it.each(["5", "10", "15"] as const)("accepts duration %s", (duration) => {
      expect(
        Wan26ImageToVideoRequestSchema.safeParse({
          model: "wan/2-6-image-to-video",
          input: {
            prompt: "Camera orbit around the subject",
            image_urls: ["https://example.com/subject.png"],
            duration,
          },
        }).success
      ).toBe(true);
    });
  });

  describe("wan/2-6-text-to-video", () => {
    it("accepts text-only generation with defaults", () => {
      const request = {
        model: "wan/2-6-text-to-video",
        input: {
          prompt:
            "In a hyperrealistic ASMR video, a hand uses a knitted knife to " +
            "slowly slice a burger made entirely of knitted wool.",
        },
      };
      const parsed = Wan26TextToVideoRequestSchema.parse(request);
      expect(parsed.input.duration).toBe("5");
      expect(parsed.input.resolution).toBe("1080p");
      expect(parsed.input.multi_shots).toBe(false);
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });
  });

  describe("wan/2-6-video-to-video", () => {
    it("accepts video rewrite payloads (duration max 10)", () => {
      const request = {
        model: "wan/2-6-video-to-video",
        input: {
          prompt: "The subject drinks milk tea while dancing",
          video_urls: ["https://example.com/source.mp4"],
          duration: "10",
          resolution: "720p",
        },
      };
      expect(Wan26VideoToVideoRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);

      expect(
        Wan26VideoToVideoRequestSchema.safeParse({
          model: "wan/2-6-video-to-video",
          input: {
            prompt: "duration 15 is flash/i2v only",
            video_urls: ["https://example.com/source.mp4"],
            duration: "15",
          },
        }).success
      ).toBe(false);
    });
  });

  it("rejects all twelve models when the body is empty", () => {
    const models = [
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
    ] as const;

    for (const model of models) {
      expect(
        CreateTaskRequestSchema.safeParse({ model, input: {} }).success
      ).toBe(false);
    }
  });
});
