import { describe, it, expect } from "vitest";
import {
  Kling26TextToVideoRequestSchema,
  Kling26ImageToVideoRequestSchema,
  Kling26MotionControlRequestSchema,
  KlingAiAvatarProRequestSchema,
  KlingAiAvatarStandardRequestSchema,
  KlingV21MasterImageToVideoRequestSchema,
  KlingV21MasterTextToVideoRequestSchema,
  KlingV21ProRequestSchema,
  KlingV21StandardRequestSchema,
  KlingV25TurboImageToVideoProRequestSchema,
  KlingV25TurboTextToVideoProRequestSchema,
  KieMediaModelSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

describe("Kling createTask models (ac-uej9fm)", () => {
  const models = [
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
  ] as const;

  it.each(models)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("validates kling-2.6/text-to-video via schema and guard", () => {
    const req = {
      model: "kling-2.6/text-to-video" as const,
      callBackUrl: "https://example.com/api/callback",
      input: {
        prompt:
          "Scene: A fashion live-streaming sales setting with clothes on racks",
        sound: false,
        aspect_ratio: "1:1" as const,
        duration: "5" as const,
      },
    };
    expect(Kling26TextToVideoRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates kling-2.6/image-to-video via schema and guard", () => {
    const req = {
      model: "kling-2.6/image-to-video" as const,
      input: {
        prompt:
          "In a bright rehearsal room, sunlight streams through the windows",
        image_urls: [
          "https://static.aiquickdraw.com/tools/example/1764851002741_i0lEiI8I.png",
        ],
        sound: false,
        duration: "5" as const,
      },
    };
    expect(Kling26ImageToVideoRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates kling-2.6/motion-control via schema and guard", () => {
    const req = {
      model: "kling-2.6/motion-control" as const,
      input: {
        prompt: "The cartoon character is dancing.",
        input_urls: [
          "https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png",
        ],
        video_urls: [
          "https://static.aiquickdraw.com/tools/example/1767525918769_QyvTNib2.mp4",
        ],
        mode: "720p" as const,
        character_orientation: "image" as const,
      },
    };
    expect(Kling26MotionControlRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates kling/ai-avatar-pro via schema and guard", () => {
    const req = {
      model: "kling/ai-avatar-pro" as const,
      input: {
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/175792685809077e8h8k3.png",
        audio_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/1757925802302srqfkcqh.mp3",
        prompt: "",
      },
    };
    expect(KlingAiAvatarProRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates kling/ai-avatar-standard via schema and guard", () => {
    const req = {
      model: "kling/ai-avatar-standard" as const,
      input: {
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/17579268936223zs9l3dt.png",
        audio_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/17579258340109gghun47.mp3",
        prompt: "",
      },
    };
    expect(KlingAiAvatarStandardRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates kling/v2-1-master-image-to-video via schema and guard", () => {
    const req = {
      model: "kling/v2-1-master-image-to-video" as const,
      input: {
        prompt:
          "A team of paratroopers descends into enemy territory through clouds",
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/1755256297923kmjpynul.png",
        duration: "5" as const,
        negative_prompt: "blur, distort, and low quality",
        cfg_scale: 0.5,
      },
    };
    expect(KlingV21MasterImageToVideoRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates kling/v2-1-master-text-to-video via schema and guard", () => {
    const req = {
      model: "kling/v2-1-master-text-to-video" as const,
      input: {
        prompt:
          "First-person view from a soldier jumping from a transport plane",
        duration: "5" as const,
        aspect_ratio: "16:9" as const,
        negative_prompt: "blur, distort, and low quality",
        cfg_scale: 0.5,
      },
    };
    expect(KlingV21MasterTextToVideoRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates kling/v2-1-pro via schema and guard", () => {
    const req = {
      model: "kling/v2-1-pro" as const,
      input: {
        prompt:
          "POV shot of a gravity surfer diving between ancient ruins suspended midair",
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/1754892534386c8wt0qfs.png",
        duration: "5" as const,
        negative_prompt: "blur, distort, and low quality",
        cfg_scale: 0.5,
      },
    };
    expect(KlingV21ProRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates kling/v2-1-standard via schema and guard", () => {
    const req = {
      model: "kling/v2-1-standard" as const,
      input: {
        prompt:
          "Begin with the uploaded image as the first frame. Gradually animate the scene.",
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/1755256596169mkkwr2ag.png",
        duration: "5" as const,
        negative_prompt: "blur, distort, and low quality",
        cfg_scale: 0.5,
      },
    };
    expect(KlingV21StandardRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates kling/v2-5-turbo-image-to-video-pro via schema and guard", () => {
    const req = {
      model: "kling/v2-5-turbo-image-to-video-pro" as const,
      input: {
        prompt:
          "A team of paratroopers descends into enemy territory, as they pass through clouds",
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/1755256297923kmjpynul.png",
        duration: "5" as const,
        negative_prompt: "blur, distort, and low quality",
        cfg_scale: 0.5,
      },
    };
    expect(
      KlingV25TurboImageToVideoProRequestSchema.safeParse(req).success
    ).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates kling/v2-5-turbo-text-to-video-pro via schema and guard", () => {
    const req = {
      model: "kling/v2-5-turbo-text-to-video-pro" as const,
      input: {
        prompt:
          "Wide shot of a ruined city: collapsed towers, fires blazing, storm clouds",
        duration: "5" as const,
        aspect_ratio: "16:9" as const,
        negative_prompt: "blur, distort, and low quality",
        cfg_scale: 0.5,
      },
    };
    expect(
      KlingV25TurboTextToVideoProRequestSchema.safeParse(req).success
    ).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects kling-2.6/text-to-video without sound", () => {
    expect(
      Kling26TextToVideoRequestSchema.safeParse({
        model: "kling-2.6/text-to-video",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          aspect_ratio: "16:9",
          duration: "5",
        },
      }).success
    ).toBe(false);
  });

  it("rejects kling-2.6/image-to-video without image_urls", () => {
    expect(
      Kling26ImageToVideoRequestSchema.safeParse({
        model: "kling-2.6/image-to-video",
        input: {
          prompt: "Animate this still frame into a gentle camera push-in",
          sound: true,
          duration: "5",
        },
      }).success
    ).toBe(false);
  });

  it("rejects numeric duration (numeric-string-only)", () => {
    expect(
      Kling26TextToVideoRequestSchema.safeParse({
        model: "kling-2.6/text-to-video",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          sound: false,
          aspect_ratio: "1:1",
          duration: 5,
        },
      }).success
    ).toBe(false);
  });

  it("rejects cfg_scale outside 0-1 on v2.1 pro", () => {
    expect(
      KlingV21ProRequestSchema.safeParse({
        model: "kling/v2-1-pro",
        input: {
          prompt: "A gentle camera push-in across a sunlit courtyard",
          image_url: "https://example.com/frame.png",
          cfg_scale: 1.5,
        },
      }).success
    ).toBe(false);
  });

  it("rejects prompt longer than 1000 on kling-2.6 text-to-video", () => {
    expect(
      Kling26TextToVideoRequestSchema.safeParse({
        model: "kling-2.6/text-to-video",
        input: {
          prompt: "x".repeat(1001),
          sound: false,
          aspect_ratio: "1:1",
          duration: "5",
        },
      }).success
    ).toBe(false);
  });

  it("accepts empty prompt on AI avatar models", () => {
    expect(
      KlingAiAvatarProRequestSchema.safeParse({
        model: "kling/ai-avatar-pro",
        input: {
          image_url: "https://example.com/face.png",
          audio_url: "https://example.com/speech.mp3",
          prompt: "",
        },
      }).success
    ).toBe(true);
  });

  it("exposes modelInputSchemas for all eleven Kling models", () => {
    for (const model of models) {
      expect(modelInputSchemas[model].type).toBe("video");
    }

    expect(
      modelInputSchemas["kling-2.6/text-to-video"].fields.sound?.required
    ).toBe(true);
    expect(
      modelInputSchemas["kling-2.6/image-to-video"].fields.image_urls?.required
    ).toBe(true);
    expect(
      modelInputSchemas["kling-2.6/motion-control"].fields.mode?.enum
    ).toEqual(["720p", "1080p"]);
    expect(
      modelInputSchemas["kling/ai-avatar-pro"].fields.audio_url?.required
    ).toBe(true);
    expect(
      modelInputSchemas["kling/v2-1-pro"].fields.tail_image_url
    ).toBeDefined();
    expect(
      modelInputSchemas["kling/v2-1-standard"].fields.tail_image_url
    ).toBeUndefined();
    expect(
      modelInputSchemas["kling/v2-5-turbo-text-to-video-pro"].fields.duration
        ?.enum
    ).toEqual(["5", "10"]);
  });
});
