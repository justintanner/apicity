import { afterEach, describe, it, expect, vi } from "vitest";

import type {
  TaskResponse,
  Wan22A14bImageToVideoTurboRequest,
  Wan22A14bSpeechToVideoTurboRequest,
  Wan22AnimateMoveRequest,
  Wan22AnimateReplaceRequest,
} from "@apicity/kie";
import { createKie } from "../../packages/provider/kie/src/kie";
import { TEST_PAYGATE_SECRET, mintKieCreateTaskOtp } from "../harness";
import {
  type MediaGenerationRequest,
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
 * Each needs a per-model request member so CreateTaskRequestSchema accepts it.
 *
 * The wan/2-2-* and wan/2-5-* ids (ac-t2cgdc) and the five wan/2-6-* ids
 * (ac-3r4t90) are all KIE_MEDIA_MODELS entries, so they also carry
 * CREATE_TASK_GUARDS entries and modelInputSchemas descriptors. Guard-level
 * rejection is table-driven in tests/unit/kie/create-task-guards.test.ts; the
 * block at the bottom of this file covers the transport half.
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
    } satisfies Wan22A14bImageToVideoTurboRequest;

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

    it.each([
      {
        name: "missing image_url",
        input: { prompt: "missing image" },
      },
      {
        name: "missing prompt",
        input: { image_url: "https://example.com/frame.png" },
      },
      {
        name: "prompt over 5000 characters",
        input: {
          image_url: "https://example.com/frame.png",
          prompt: "x".repeat(5001),
        },
      },
      {
        name: "invalid resolution",
        input: {
          image_url: "https://example.com/frame.png",
          prompt: "A scene",
          resolution: "1080p",
        },
      },
      {
        name: "invalid acceleration",
        input: {
          image_url: "https://example.com/frame.png",
          prompt: "A scene",
          acceleration: "fast",
        },
      },
    ])("rejects $name", ({ input }) => {
      expect(
        Wan22A14bImageToVideoTurboRequestSchema.safeParse({
          model: "wan/2-2-a14b-image-to-video-turbo",
          input,
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
    } satisfies Wan22A14bSpeechToVideoTurboRequest;

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

    it.each([
      {
        name: "missing prompt",
        input: {
          image_url: "https://example.com/face.png",
          audio_url: "https://example.com/speech.mp3",
        },
      },
      {
        name: "missing image_url",
        input: {
          prompt: "talking",
          audio_url: "https://example.com/speech.mp3",
        },
      },
      {
        name: "prompt over 5000 characters",
        input: {
          prompt: "x".repeat(5001),
          image_url: "https://example.com/face.png",
          audio_url: "https://example.com/speech.mp3",
        },
      },
      {
        name: "num_frames below the lower bound",
        input: { ...request.input, num_frames: 39 },
      },
      {
        name: "num_frames above the upper bound",
        input: { ...request.input, num_frames: 121 },
      },
      {
        name: "num_frames off the required step",
        input: { ...request.input, num_frames: 41 },
      },
      {
        name: "frames_per_second below the lower bound",
        input: { ...request.input, frames_per_second: 3 },
      },
      {
        name: "frames_per_second above the upper bound",
        input: { ...request.input, frames_per_second: 61 },
      },
      {
        name: "negative_prompt over 500 characters",
        input: { ...request.input, negative_prompt: "x".repeat(501) },
      },
      {
        name: "num_inference_steps below the lower bound",
        input: { ...request.input, num_inference_steps: 1 },
      },
      {
        name: "num_inference_steps above the upper bound",
        input: { ...request.input, num_inference_steps: 41 },
      },
      {
        name: "guidance_scale below the lower bound",
        input: { ...request.input, guidance_scale: 0.9 },
      },
      {
        name: "guidance_scale above the upper bound",
        input: { ...request.input, guidance_scale: 10.1 },
      },
      {
        name: "guidance_scale off the required step",
        input: { ...request.input, guidance_scale: 1.05 },
      },
      {
        name: "shift below the lower bound",
        input: { ...request.input, shift: 0.9 },
      },
      {
        name: "shift above the upper bound",
        input: { ...request.input, shift: 10.1 },
      },
      {
        name: "shift off the required step",
        input: { ...request.input, shift: 1.05 },
      },
      {
        name: "invalid resolution",
        input: { ...request.input, resolution: "1080p" },
      },
    ])("rejects $name", ({ input }) => {
      expect(
        Wan22A14bSpeechToVideoTurboRequestSchema.safeParse({
          model: "wan/2-2-a14b-speech-to-video-turbo",
          input,
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

  describe("wan/2-2-animate-move", () => {
    const request = {
      model: "wan/2-2-animate-move",
      input: {
        video_url: "https://example.com/motion.mp4",
        image_url: "https://example.com/subject.png",
      },
    } satisfies Wan22AnimateMoveRequest;

    it("accepts video_url + image_url", () => {
      const parsed = Wan22AnimateMoveRequestSchema.parse(request);
      expect(parsed.input.resolution).toBe("480p");
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it.each([
      {
        name: "missing video_url",
        input: { image_url: "https://example.com/subject.png" },
      },
      {
        name: "missing image_url",
        input: { video_url: "https://example.com/motion.mp4" },
      },
      {
        name: "invalid resolution",
        input: {
          video_url: "https://example.com/motion.mp4",
          image_url: "https://example.com/subject.png",
          resolution: "1080p",
        },
      },
    ])("rejects $name", ({ input }) => {
      expect(
        Wan22AnimateMoveRequestSchema.safeParse({
          model: "wan/2-2-animate-move",
          input,
        }).success
      ).toBe(false);
    });
  });

  describe("wan/2-2-animate-replace", () => {
    const request = {
      model: "wan/2-2-animate-replace",
      input: {
        video_url: "https://example.com/motion.mp4",
        image_url: "https://example.com/subject.png",
      },
    } satisfies Wan22AnimateReplaceRequest;

    it("accepts video_url + image_url", () => {
      const parsed = Wan22AnimateReplaceRequestSchema.parse(request);
      expect(parsed.input.resolution).toBe("480p");
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    });

    it.each([
      {
        name: "missing video_url",
        input: { image_url: "https://example.com/subject.png" },
      },
      {
        name: "missing image_url",
        input: { video_url: "https://example.com/motion.mp4" },
      },
      {
        name: "invalid resolution",
        input: {
          video_url: "https://example.com/motion.mp4",
          image_url: "https://example.com/subject.png",
          resolution: "1080p",
        },
      },
    ])("rejects $name", ({ input }) => {
      expect(
        Wan22AnimateReplaceRequestSchema.safeParse({
          model: "wan/2-2-animate-replace",
          input,
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

// Schema-level parsing above proves the contract; this proves the provider
// enforces it. Catalogue membership is what buys the wan 2.6 five a
// CREATE_TASK_GUARDS entry, so an out-of-contract payload now fails locally
// instead of being transmitted — the alias-only wan 2.2 / 2.5 models have no
// guard and reach the API unvalidated. The rejection half of that contract is
// table-driven in tests/unit/kie/create-task-guards.test.ts alongside every
// other guarded model; what belongs here is the half that proves the guard
// narrows nothing upstream accepts.
describe("wan 2.6 createTask transport", () => {
  afterEach(() => vi.restoreAllMocks());

  it("transmits a valid wan 2.6 payload", async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          msg: "success",
          data: { taskId: "wan-2-6-task-1" },
        } satisfies TaskResponse),
        { status: 200 }
      )
    );
    const provider = createKie({
      apiKey: "test-key",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    const request = {
      model: "wan/2-6-text-to-video",
      input: { prompt: "A slow pan across a frozen lake", duration: "10" },
    } satisfies MediaGenerationRequest;

    const result = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(result.data?.taskId).toBe("wan-2-6-task-1");
    const response: TaskResponse = {
      code: 200,
      msg: "success",
      data: { taskId: result.data!.taskId },
    };
    expect(response.data?.taskId).toBe("wan-2-6-task-1");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
