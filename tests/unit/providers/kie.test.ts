// Tests for the kie provider
import { describe, it, expect, vi } from "vitest";
import { kie } from "../../../packages/provider/kie/src";

describe("kie provider", () => {
  interface KieApiEnvelope<T = Record<string, unknown>> {
    code: number;
    msg: string;
    data?: T;
  }

  type TaskResponse = KieApiEnvelope<{ taskId: string }>;

  interface MediaGenerationRequest {
    model: string;
    input: Record<string, unknown>;
  }

  interface VeoSubmitResponse {
    code: number;
    data?: { taskId?: string };
  }

  interface SunoSubmitResponse {
    code: number;
    msg?: string;
    data?: { taskId?: string };
  }

  interface VeoProvider {
    api: {
      v1: {
        veo: {
          generate(req: Record<string, unknown>): Promise<VeoSubmitResponse>;
        };
      };
    };
  }

  interface SunoProvider {
    api: {
      v1: {
        generate(req: Record<string, unknown>): Promise<SunoSubmitResponse>;
      };
    };
  }

  interface KieChatProvider {
    gpt52: {
      v1: {
        chat: {
          completions(req: Record<string, unknown>): Promise<{
            choices?: Array<{ message?: { content?: string } }>;
            model?: string;
          }>;
        };
      };
    };
  }

  interface UploadMediaResponse {
    success: boolean;
    code: number;
    data?: { downloadUrl: string };
  }

  type DownloadUrlResponse = KieApiEnvelope<string>;

  interface KieTaskInfoData {
    taskId?: string;
    model?: string;
    state?: string;
    param?: string;
    resultJson?: string;
    failCode?: string;
    failMsg?: string;
    costTime?: number;
    completeTime?: number;
    createTime?: number;
    updateTime?: number;
    progress?: number;
  }

  type KieTaskInfo = KieApiEnvelope<KieTaskInfoData>;

  type KieCreditsResponse = KieApiEnvelope<number>;

  interface KieProvider {
    api: {
      v1: {
        jobs: {
          createTask(req: MediaGenerationRequest): Promise<TaskResponse>;
          recordInfo(taskId: string): Promise<KieTaskInfo>;
        };
        common: {
          downloadUrl(req: { url: string }): Promise<DownloadUrlResponse>;
        };
        chat: {
          credit(): Promise<KieCreditsResponse>;
        };
      };
      fileStreamUpload(req: {
        file: Blob;
        filename: string;
        mimeType?: string;
      }): Promise<UploadMediaResponse>;
    };
    veo: VeoProvider;
    suno: SunoProvider;
    chat: KieChatProvider;
  }

  function createMockProvider(): KieProvider {
    return {
      api: {
        v1: {
          jobs: {
            createTask: vi.fn().mockResolvedValue({
              code: 200,
              msg: "success",
              data: { taskId: "test-task-id" },
            } satisfies TaskResponse),
            recordInfo: vi.fn().mockResolvedValue({
              code: 200,
              msg: "success",
              data: {
                taskId: "test-task-id",
                model: "nano-banana-pro",
                state: "success",
                param: '{"prompt":"A sunset"}',
                resultJson:
                  '{"resultUrls":["https://cdn.kie.ai/files/result.png"]}',
                failCode: "",
                failMsg: "",
                costTime: 12000,
                completeTime: 1700000000000,
                createTime: 1700000000000,
                updateTime: 1700000000000,
                progress: 100,
              },
            } satisfies KieTaskInfo),
          },
          common: {
            downloadUrl: vi.fn().mockResolvedValue({
              code: 200,
              msg: "success",
              data: "https://cdn.kie.ai/tmp/download/test-file.mp4",
            } satisfies DownloadUrlResponse),
          },
          chat: {
            credit: vi.fn().mockResolvedValue({
              code: 200,
              msg: "success",
              data: 100,
            } satisfies KieCreditsResponse),
          },
        },
        fileStreamUpload: vi.fn().mockResolvedValue({
          success: true,
          code: 200,
          data: {
            downloadUrl: "https://kieai.redpandaai.co/uploads/test.png",
          },
        } satisfies UploadMediaResponse),
      },
      veo: {
        api: {
          v1: {
            veo: {
              generate: vi.fn().mockResolvedValue({
                code: 200,
                data: { taskId: "veo-task-id" },
              }),
            },
          },
        },
      },
      suno: {
        api: {
          v1: {
            generate: vi.fn().mockResolvedValue({
              code: 200,
              data: { taskId: "suno-task-id" },
            }),
          },
        },
      },
      chat: {
        gpt52: {
          v1: {
            chat: {
              completions: vi.fn().mockResolvedValue({
                choices: [
                  { message: { role: "assistant", content: "Hello!" } },
                ],
                model: "gpt-5.2",
              }),
            },
          },
        },
      },
    };
  }

  it("should create a task", async () => {
    const provider = createMockProvider();
    const req: MediaGenerationRequest = {
      model: "nano-banana-pro",
      input: { prompt: "A sunset", aspect_ratio: "16:9" },
    };
    const result = await provider.api.v1.jobs.createTask(req);
    expect(result.data?.taskId).toBe("test-task-id");
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
    expect(result.data?.taskId).toBe("test-task-id");
  });

  it("should access veo sub-provider", async () => {
    const provider = createMockProvider();
    const result = await provider.veo.api.v1.veo.generate({
      prompt: "A rocket launch",
      model: "veo3_fast",
    });
    expect(result.data?.taskId).toBe("veo-task-id");
  });

  it("should access suno sub-provider", async () => {
    const provider = createMockProvider();
    const result = await provider.suno.api.v1.generate({
      prompt: "A jazz ballad",
      model: "V4_5",
      instrumental: true,
      customMode: true,
    });
    expect(result.data?.taskId).toBe("suno-task-id");
  });

  it("should access chat sub-provider", async () => {
    const provider = createMockProvider();
    const result = await provider.chat.gpt52.v1.chat.completions({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.choices?.[0].message?.content).toBe("Hello!");
  });

  it("should get task info", async () => {
    const provider = createMockProvider();
    const result = await provider.api.v1.jobs.recordInfo("test-task-id");
    expect(result.data?.taskId).toBe("test-task-id");
    expect(result.data?.state).toBe("success");
    expect(result.data?.model).toBe("nano-banana-pro");
    expect(result.data?.progress).toBe(100);
  });

  it("should get a temporary download URL", async () => {
    const provider = createMockProvider();
    const result = await provider.api.v1.common.downloadUrl({
      url: "https://cdn.kie.ai/files/test-file.mp4",
    });
    expect(result.data).toBe("https://cdn.kie.ai/tmp/download/test-file.mp4");
  });

  it("should upload media and return download URL", async () => {
    const provider = createMockProvider();
    const file = new Blob(["fake-image-data"], { type: "image/png" });
    const result = await provider.api.fileStreamUpload({
      file,
      filename: "test.png",
    });
    expect(result.data?.downloadUrl).toBe(
      "https://kieai.redpandaai.co/uploads/test.png"
    );
  });

  describe("payloadSchema", () => {
    const provider = kie({
      apiKey: "test-key",
      fetch: vi
        .fn()
        .mockResolvedValue(
          new Response('{"code":200,"msg":"ok","data":{}}', { status: 200 })
        ),
    });

    it("api.v1.jobs.createTask.payloadSchema has method POST and path /api/v1/jobs/createTask", () => {
      const schema = provider.api.v1.jobs.createTask.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/api/v1/jobs/createTask");
    });

    it("api.v1.common.downloadUrl.payloadSchema has method POST and path contains download-url", () => {
      const schema = provider.api.v1.common.downloadUrl.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toContain("download-url");
    });

    it("api.fileStreamUpload.payloadSchema has method POST and contentType multipart/form-data", () => {
      const schema = provider.api.fileStreamUpload.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.contentType).toBe("multipart/form-data");
    });

    it("api.v1.jobs.createTask.validatePayload accepts valid task request", () => {
      const result = provider.api.v1.jobs.createTask.validatePayload({
        model: "nano-banana-pro",
        input: { prompt: "test" },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("api.v1.jobs.createTask.validatePayload rejects empty object", () => {
      const result = provider.api.v1.jobs.createTask.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.join(" ")).toContain("model");
      expect(result.errors.join(" ")).toContain("input");
    });

    it("api.v1.common.downloadUrl.validatePayload rejects empty object", () => {
      const result = provider.api.v1.common.downloadUrl.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.join(" ")).toContain("url");
    });
  });

  describe("modelInputSchemas", () => {
    const provider = kie({
      apiKey: "test-key",
      fetch: vi
        .fn()
        .mockResolvedValue(
          new Response('{"code":200,"msg":"ok","data":{}}', { status: 200 })
        ),
    });

    it("should have all 18 models", () => {
      const models = Object.keys(provider.modelInputSchemas);
      expect(models).toHaveLength(18);
    });

    it("every entry should have a type and non-empty fields", () => {
      for (const [model, schema] of Object.entries(
        provider.modelInputSchemas
      )) {
        expect(schema.type, `${model} missing type`).toBeTruthy();
        expect(
          Object.keys(schema.fields).length,
          `${model} has no fields`
        ).toBeGreaterThan(0);
      }
    });

    it("nano-banana-pro should be image with prompt required", () => {
      const schema = provider.modelInputSchemas["nano-banana-pro"];
      expect(schema.type).toBe("image");
      expect(schema.fields.prompt.required).toBe(true);
      expect(schema.fields.resolution?.enum).toContain("4K");
    });

    it("kling-3.0/video should be video with duration, mode required", () => {
      const schema = provider.modelInputSchemas["kling-3.0/video"];
      expect(schema.type).toBe("video");
      expect(schema.fields.sound.type).toBe("boolean");
      expect(schema.fields.duration.required).toBe(true);
      expect(schema.fields.mode.required).toBe(true);
      expect(schema.fields.mode.enum).toContain("pro");
    });

    it("elevenlabs/speech-to-text should be transcription", () => {
      const schema = provider.modelInputSchemas["elevenlabs/speech-to-text"];
      expect(schema.type).toBe("transcription");
      expect(schema.fields.audio_url.required).toBe(true);
    });

    it("elevenlabs/text-to-dialogue-v3 should be audio with dialogue required", () => {
      const schema =
        provider.modelInputSchemas["elevenlabs/text-to-dialogue-v3"];
      expect(schema.type).toBe("audio");
      expect(schema.fields.dialogue.required).toBe(true);
    });

    it("sora-watermark-remover should be video with video_url required", () => {
      const schema = provider.modelInputSchemas["sora-watermark-remover"];
      expect(schema.type).toBe("video");
      expect(schema.fields.video_url.required).toBe(true);
    });
  });
});
