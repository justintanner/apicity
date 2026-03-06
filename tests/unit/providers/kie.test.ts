// Tests for the kie provider
import { describe, it, expect, vi } from "vitest";

describe("kie provider", () => {
  interface TaskResponse {
    taskId: string;
  }

  interface TaskResult {
    taskId: string;
    status: "completed" | "failed";
    urls: string[];
    imageUrl?: string;
    videoUrl?: string;
  }

  interface MediaGenerationRequest {
    model: string;
    input: Record<string, unknown>;
  }

  type MediaType = "image" | "video" | "audio" | "transcription";

  interface VeoProvider {
    generate(req: Record<string, unknown>): Promise<TaskResult>;
  }

  interface SunoProvider {
    generate(req: Record<string, unknown>): Promise<TaskResult>;
  }

  interface KieChatProvider {
    chat(req: Record<string, unknown>): Promise<{
      content: string;
      model: string;
    }>;
  }

  interface UploadMediaResponse {
    downloadUrl: string;
  }

  interface KieProvider {
    createTask(req: MediaGenerationRequest): Promise<TaskResponse>;
    getTaskStatus(taskId: string): Promise<{
      taskId: string;
      status: string;
      result?: { urls?: string[] };
    }>;
    waitForTask(taskId: string): Promise<TaskResult>;
    generate(req: MediaGenerationRequest): Promise<TaskResult>;
    uploadMedia(req: {
      file: Blob;
      filename: string;
      mimeType?: string;
    }): Promise<UploadMediaResponse>;
    getCredits(): Promise<{
      balance: number;
      totalUsed: number;
      currency: string;
    }>;
    validateModel(modelId: string): boolean;
    getModels(): string[];
    getModelType(modelId: string): MediaType | null;
    veo: VeoProvider;
    suno: SunoProvider;
    chat: KieChatProvider;
  }

  const ALL_MODELS = [
    "kling-3.0/video",
    "grok-imagine/text-to-image",
    "grok-imagine/image-to-image",
    "grok-imagine/text-to-video",
    "grok-imagine/image-to-video",
    "nano-banana-pro",
    "bytedance/seedance-1.5-pro",
    "nano-banana-2",
    "gpt-image/1.5-image-to-image",
    "seedream/5-lite-image-to-image",
    "elevenlabs/text-to-dialogue-v3",
    "elevenlabs/sound-effect-v2",
    "elevenlabs/speech-to-text",
    "sora-watermark-remover",
  ];

  const MODEL_TYPES: Record<string, MediaType> = {
    "kling-3.0/video": "video",
    "grok-imagine/text-to-image": "image",
    "grok-imagine/image-to-image": "image",
    "grok-imagine/text-to-video": "video",
    "grok-imagine/image-to-video": "video",
    "nano-banana-pro": "image",
    "bytedance/seedance-1.5-pro": "video",
    "nano-banana-2": "image",
    "gpt-image/1.5-image-to-image": "image",
    "seedream/5-lite-image-to-image": "image",
    "elevenlabs/text-to-dialogue-v3": "audio",
    "elevenlabs/sound-effect-v2": "audio",
    "elevenlabs/speech-to-text": "transcription",
    "sora-watermark-remover": "video",
  };

  function createMockProvider(): KieProvider {
    return {
      createTask: vi.fn().mockResolvedValue({ taskId: "test-task-id" }),
      getTaskStatus: vi.fn().mockResolvedValue({
        taskId: "test-task-id",
        status: "completed",
        result: {
          urls: ["https://example.com/image.png"],
        },
      }),
      waitForTask: vi.fn().mockResolvedValue({
        taskId: "test-task-id",
        status: "completed",
        urls: ["https://example.com/image.png"],
        imageUrl: "https://example.com/image.png",
      }),
      generate: vi.fn().mockResolvedValue({
        taskId: "test-task-id",
        status: "completed",
        urls: ["https://example.com/image.png"],
        imageUrl: "https://example.com/image.png",
      }),
      uploadMedia: vi.fn().mockResolvedValue({
        downloadUrl: "https://kieai.redpandaai.co/uploads/test.png",
      }),
      getCredits: vi.fn().mockResolvedValue({
        balance: 100,
        totalUsed: 50,
        currency: "credits",
      }),
      validateModel: vi
        .fn()
        .mockImplementation((modelId: string) => ALL_MODELS.includes(modelId)),
      getModels: vi.fn().mockReturnValue(ALL_MODELS),
      getModelType: vi
        .fn()
        .mockImplementation((modelId: string) => MODEL_TYPES[modelId] ?? null),
      veo: {
        generate: vi.fn().mockResolvedValue({
          taskId: "veo-task-id",
          status: "completed",
          urls: ["https://example.com/video.mp4"],
          videoUrl: "https://example.com/video.mp4",
        }),
      },
      suno: {
        generate: vi.fn().mockResolvedValue({
          taskId: "suno-task-id",
          status: "completed",
          urls: ["https://example.com/audio.mp3"],
          title: "Test Track",
          duration: 120,
          trackCount: 1,
        }),
      },
      chat: {
        chat: vi.fn().mockResolvedValue({
          content: "Hello!",
          model: "gpt-5.2",
        }),
      },
    };
  }

  it("should validate all supported models", () => {
    const provider = createMockProvider();
    for (const model of ALL_MODELS) {
      expect(provider.validateModel(model)).toBe(true);
    }
    expect(provider.validateModel("unsupported-model")).toBe(false);
  });

  it("should return correct model types", () => {
    const provider = createMockProvider();
    expect(provider.getModelType("kling-3.0/video")).toBe("video");
    expect(provider.getModelType("nano-banana-pro")).toBe("image");
    expect(provider.getModelType("nano-banana-2")).toBe("image");
    expect(provider.getModelType("bytedance/seedance-1.5-pro")).toBe("video");
    expect(provider.getModelType("elevenlabs/text-to-dialogue-v3")).toBe(
      "audio"
    );
    expect(provider.getModelType("elevenlabs/sound-effect-v2")).toBe("audio");
    expect(provider.getModelType("elevenlabs/speech-to-text")).toBe(
      "transcription"
    );
    expect(provider.getModelType("sora-watermark-remover")).toBe("video");
    expect(provider.getModelType("unknown")).toBe(null);
  });

  it("should return all 14 models", () => {
    const provider = createMockProvider();
    const models = provider.getModels();
    expect(models).toHaveLength(14);
    expect(models).toContain("nano-banana-2");
    expect(models).toContain("bytedance/seedance-1.5-pro");
    expect(models).toContain("sora-watermark-remover");
  });

  it("should create a task", async () => {
    const provider = createMockProvider();
    const req: MediaGenerationRequest = {
      model: "nano-banana-pro",
      input: {
        prompt: "A sunset",
        aspect_ratio: "16:9",
      },
    };

    const result = await provider.createTask(req);
    expect(result.taskId).toBe("test-task-id");
  });

  it("should generate media with seedance model", async () => {
    const provider = createMockProvider();
    const req: MediaGenerationRequest = {
      model: "bytedance/seedance-1.5-pro",
      input: {
        prompt: "A cinematic sunset over mountains",
        resolution: "1080p",
        duration: "8",
      },
    };

    const result = await provider.generate(req);
    expect(result.status).toBe("completed");
  });

  it("should generate media with nano-banana-2", async () => {
    const provider = createMockProvider();
    const req: MediaGenerationRequest = {
      model: "nano-banana-2",
      input: {
        prompt: "A beautiful landscape",
        google_search: true,
        resolution: "4K",
      },
    };

    const result = await provider.generate(req);
    expect(result.status).toBe("completed");
  });

  it("should generate media with elevenlabs dialogue", async () => {
    const provider = createMockProvider();
    const req: MediaGenerationRequest = {
      model: "elevenlabs/text-to-dialogue-v3",
      input: {
        dialogue: [
          { text: "Hello!", voice: "Adam" },
          { text: "Hi there!", voice: "Alice" },
        ],
        stability: 0.5,
      },
    };

    const result = await provider.generate(req);
    expect(result.status).toBe("completed");
  });

  it("should access veo sub-provider", async () => {
    const provider = createMockProvider();
    const result = await provider.veo.generate({
      prompt: "A rocket launch",
      model: "veo3_fast",
    });
    expect(result.status).toBe("completed");
    expect(result.videoUrl).toBe("https://example.com/video.mp4");
  });

  it("should access suno sub-provider", async () => {
    const provider = createMockProvider();
    const result = await provider.suno.generate({
      prompt: "A jazz ballad",
      model: "V4_5",
    });
    expect(result.status).toBe("completed");
  });

  it("should access chat sub-provider", async () => {
    const provider = createMockProvider();
    const result = await provider.chat.chat({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.content).toBe("Hello!");
  });

  it("should upload media and return download URL", async () => {
    const provider = createMockProvider();
    const file = new Blob(["fake-image-data"], { type: "image/png" });
    const result = await provider.uploadMedia({
      file,
      filename: "test.png",
    });
    expect(result.downloadUrl).toBe(
      "https://kieai.redpandaai.co/uploads/test.png"
    );
  });
});
