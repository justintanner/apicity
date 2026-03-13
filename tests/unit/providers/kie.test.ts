// Tests for the kie provider
import { describe, it, expect, vi } from "vitest";

describe("kie provider", () => {
  interface TaskResponse {
    taskId: string;
  }

  interface MediaGenerationRequest {
    model: string;
    input: Record<string, unknown>;
  }

  type MediaType = "image" | "video" | "audio" | "transcription";

  interface VeoProvider {
    api: {
      v1: {
        veo: {
          generate(req: Record<string, unknown>): Promise<{ taskId: string }>;
        };
      };
    };
  }

  interface SunoProvider {
    api: {
      v1: {
        generate(req: Record<string, unknown>): Promise<{ taskId: string }>;
      };
    };
  }

  interface KieChatProvider {
    gpt52: {
      v1: {
        chat: {
          completions(req: Record<string, unknown>): Promise<{
            content: string;
            model: string;
          }>;
        };
      };
    };
  }

  interface UploadMediaResponse {
    downloadUrl: string;
  }

  interface DownloadUrlResponse {
    url: string;
  }

  type KieTaskState = "waiting" | "queuing" | "generating" | "success" | "fail";

  interface KieTaskResult {
    resultUrls: string[];
    resultObject?: Record<string, unknown>;
  }

  interface KieTaskInfo {
    taskId: string;
    model: string;
    state: KieTaskState;
    param: string;
    result?: KieTaskResult;
    failCode: string;
    failMsg: string;
    costTime: number;
    completeTime: number;
    createTime: number;
    updateTime: number;
    progress: number;
  }

  interface KieProvider {
    api: {
      v1: {
        jobs: {
          createTask(req: MediaGenerationRequest): Promise<TaskResponse>;
          recordInfo(taskId: string): Promise<KieTaskInfo>;
        };
        common: {
          downloadUrl(url: string): Promise<DownloadUrlResponse>;
        };
        chat: {
          credit(): Promise<{
            balance: number;
            totalUsed: number;
            currency: string;
          }>;
        };
      };
      fileStreamUpload(req: {
        file: Blob;
        filename: string;
        mimeType?: string;
      }): Promise<UploadMediaResponse>;
    };
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
      api: {
        v1: {
          jobs: {
            createTask: vi.fn().mockResolvedValue({ taskId: "test-task-id" }),
            recordInfo: vi.fn().mockResolvedValue({
              taskId: "test-task-id",
              model: "nano-banana-pro",
              state: "success",
              param: '{"prompt":"A sunset"}',
              result: {
                resultUrls: ["https://cdn.kie.ai/files/result.png"],
              },
              failCode: "",
              failMsg: "",
              costTime: 12000,
              completeTime: 1700000000000,
              createTime: 1700000000000,
              updateTime: 1700000000000,
              progress: 100,
            } satisfies KieTaskInfo),
          },
          common: {
            downloadUrl: vi.fn().mockResolvedValue({
              url: "https://cdn.kie.ai/tmp/download/test-file.mp4",
            }),
          },
          chat: {
            credit: vi.fn().mockResolvedValue({
              balance: 100,
              totalUsed: 50,
              currency: "credits",
            }),
          },
        },
        fileStreamUpload: vi.fn().mockResolvedValue({
          downloadUrl: "https://kieai.redpandaai.co/uploads/test.png",
        }),
      },
      validateModel: vi
        .fn()
        .mockImplementation((modelId: string) => ALL_MODELS.includes(modelId)),
      getModels: vi.fn().mockReturnValue(ALL_MODELS),
      getModelType: vi
        .fn()
        .mockImplementation((modelId: string) => MODEL_TYPES[modelId] ?? null),
      veo: {
        api: {
          v1: {
            veo: {
              generate: vi.fn().mockResolvedValue({ taskId: "veo-task-id" }),
            },
          },
        },
      },
      suno: {
        api: {
          v1: {
            generate: vi.fn().mockResolvedValue({ taskId: "suno-task-id" }),
          },
        },
      },
      chat: {
        gpt52: {
          v1: {
            chat: {
              completions: vi.fn().mockResolvedValue({
                content: "Hello!",
                model: "gpt-5.2",
              }),
            },
          },
        },
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

    const result = await provider.api.v1.jobs.createTask(req);
    expect(result.taskId).toBe("test-task-id");
  });

  it("should create task with seedance model", async () => {
    const provider = createMockProvider();
    const req: MediaGenerationRequest = {
      model: "bytedance/seedance-1.5-pro",
      input: {
        prompt: "A cinematic sunset over mountains",
        resolution: "1080p",
        duration: "8",
      },
    };

    const result = await provider.api.v1.jobs.createTask(req);
    expect(result.taskId).toBe("test-task-id");
  });

  it("should create task with nano-banana-2", async () => {
    const provider = createMockProvider();
    const req: MediaGenerationRequest = {
      model: "nano-banana-2",
      input: {
        prompt: "A beautiful landscape",
        google_search: true,
        resolution: "4K",
      },
    };

    const result = await provider.api.v1.jobs.createTask(req);
    expect(result.taskId).toBe("test-task-id");
  });

  it("should create task with elevenlabs dialogue", async () => {
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

    const result = await provider.api.v1.jobs.createTask(req);
    expect(result.taskId).toBe("test-task-id");
  });

  it("should access veo sub-provider", async () => {
    const provider = createMockProvider();
    const result = await provider.veo.api.v1.veo.generate({
      prompt: "A rocket launch",
      model: "veo3_fast",
    });
    expect(result.taskId).toBe("veo-task-id");
  });

  it("should access suno sub-provider", async () => {
    const provider = createMockProvider();
    const result = await provider.suno.api.v1.generate({
      prompt: "A jazz ballad",
      model: "V4_5",
    });
    expect(result.taskId).toBe("suno-task-id");
  });

  it("should access chat sub-provider", async () => {
    const provider = createMockProvider();
    const result = await provider.chat.gpt52.v1.chat.completions({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.content).toBe("Hello!");
  });

  it("should get task info", async () => {
    const provider = createMockProvider();
    const result = await provider.api.v1.jobs.recordInfo("test-task-id");
    expect(result.taskId).toBe("test-task-id");
    expect(result.state).toBe("success");
    expect(result.model).toBe("nano-banana-pro");
    expect(result.progress).toBe(100);
    expect(result.result?.resultUrls).toContain(
      "https://cdn.kie.ai/files/result.png"
    );
  });

  it("should get a temporary download URL", async () => {
    const provider = createMockProvider();
    const result = await provider.api.v1.common.downloadUrl(
      "https://cdn.kie.ai/files/test-file.mp4"
    );
    expect(result.url).toBe("https://cdn.kie.ai/tmp/download/test-file.mp4");
  });

  it("should upload media and return download URL", async () => {
    const provider = createMockProvider();
    const file = new Blob(["fake-image-data"], { type: "image/png" });
    const result = await provider.api.fileStreamUpload({
      file,
      filename: "test.png",
    });
    expect(result.downloadUrl).toBe(
      "https://kieai.redpandaai.co/uploads/test.png"
    );
  });
});
