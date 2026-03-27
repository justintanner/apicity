// Tests for the kie provider
import { describe, it, expect, vi } from "vitest";
import { kie, KieError } from "../../../packages/provider/kie/src";

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

  describe("claudeHaiku sub-provider", () => {
    function mockFetchOk(body: Record<string, unknown>): typeof fetch {
      return vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(body), { status: 200 })
        ) as unknown as typeof fetch;
    }

    it("should call claudeHaiku.v1.messages and return response", async () => {
      const responseBody = {
        id: "msg_abc123",
        type: "message",
        role: "assistant",
        model: "claude-haiku-4-5",
        content: [{ type: "text", text: "Hello!" }],
        stop_reason: "end_turn",
        usage: { input_tokens: 10, output_tokens: 5 },
        credits_consumed: 1,
      };
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetchOk(responseBody),
      });

      const result = await provider.claudeHaiku.v1.messages({
        model: "claude-haiku-4-5",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(result.id).toBe("msg_abc123");
      expect(result.model).toBe("claude-haiku-4-5");
      expect(result.content?.[0]).toEqual({ type: "text", text: "Hello!" });
      expect(result.stop_reason).toBe("end_turn");
      expect(result.usage?.input_tokens).toBe(10);
      expect(result.credits_consumed).toBe(1);
    });

    it("should send correct URL, headers, and body", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response('{"id":"msg_1"}', { status: 200 }));
      const provider = kie({
        apiKey: "sk-test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch as unknown as typeof fetch,
      });

      await provider.claudeHaiku.v1.messages({
        model: "claude-haiku-4-5",
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.kie.ai/claude/v1/messages");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer sk-test-key",
          "Content-Type": "application/json",
        })
      );
      const body = JSON.parse(init.body as string);
      expect(body.model).toBe("claude-haiku-4-5");
      expect(body.messages).toEqual([{ role: "user", content: "Hi" }]);
    });

    it("should support tool use in request and response", async () => {
      const responseBody = {
        id: "msg_tool",
        type: "message",
        role: "assistant",
        model: "claude-haiku-4-5",
        content: [
          {
            type: "tool_use",
            id: "toolu_1",
            name: "get_weather",
            input: { location: "London" },
          },
        ],
        stop_reason: "tool_use",
        usage: { input_tokens: 20, output_tokens: 15 },
      };
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetchOk(responseBody),
      });

      const result = await provider.claudeHaiku.v1.messages({
        model: "claude-haiku-4-5",
        messages: [{ role: "user", content: "What's the weather?" }],
        tools: [
          {
            name: "get_weather",
            description: "Get current weather",
            input_schema: {
              type: "object",
              properties: { location: { type: "string" } },
              required: ["location"],
            },
          },
        ],
      });

      expect(result.stop_reason).toBe("tool_use");
      const block = result.content?.[0];
      expect(block?.type).toBe("tool_use");
      if (block?.type === "tool_use") {
        expect(block.name).toBe("get_weather");
        expect(block.input).toEqual({ location: "London" });
      }
    });

    describe("error handling", () => {
      it("should throw KieError on HTTP error with error body", async () => {
        const provider = kie({
          apiKey: "test-key",
          fetch: vi.fn().mockImplementation(() =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  error: {
                    message: "Rate limit exceeded",
                    type: "rate_limit_error",
                  },
                }),
                { status: 429 }
              )
            )
          ) as unknown as typeof fetch,
        });

        try {
          await provider.claudeHaiku.v1.messages({
            model: "claude-haiku-4-5",
            messages: [{ role: "user", content: "Hi" }],
          });
          expect.unreachable("should have thrown");
        } catch (e) {
          expect(e).toBeInstanceOf(KieError);
          const err = e as InstanceType<typeof KieError>;
          expect(err.status).toBe(429);
          expect(err.message).toContain("Rate limit exceeded");
        }
      });

      it("should throw KieError on HTTP error without parseable body", async () => {
        const provider = kie({
          apiKey: "test-key",
          fetch: vi
            .fn()
            .mockResolvedValue(
              new Response("Internal Server Error", { status: 500 })
            ) as unknown as typeof fetch,
        });

        await expect(
          provider.claudeHaiku.v1.messages({
            model: "claude-haiku-4-5",
            messages: [{ role: "user", content: "Hi" }],
          })
        ).rejects.toThrow(KieError);
      });

      it("should throw KieError on malformed JSON response", async () => {
        const provider = kie({
          apiKey: "test-key",
          fetch: vi
            .fn()
            .mockResolvedValue(
              new Response("not json at all", { status: 200 })
            ) as unknown as typeof fetch,
        });

        await expect(
          provider.claudeHaiku.v1.messages({
            model: "claude-haiku-4-5",
            messages: [{ role: "user", content: "Hi" }],
          })
        ).rejects.toThrow(KieError);
      });

      it("should throw KieError on fetch failure", async () => {
        const provider = kie({
          apiKey: "test-key",
          fetch: vi
            .fn()
            .mockRejectedValue(
              new TypeError("fetch failed")
            ) as unknown as typeof fetch,
        });

        await expect(
          provider.claudeHaiku.v1.messages({
            model: "claude-haiku-4-5",
            messages: [{ role: "user", content: "Hi" }],
          })
        ).rejects.toThrow(KieError);
      });
    });

    describe("payloadSchema", () => {
      const provider = kie({
        apiKey: "test-key",
        fetch: vi
          .fn()
          .mockResolvedValue(
            new Response('{"id":"msg_1"}', { status: 200 })
          ) as unknown as typeof fetch,
      });

      it("should have method POST and correct path", () => {
        const schema = provider.claudeHaiku.v1.messages.payloadSchema;
        expect(schema.method).toBe("POST");
        expect(schema.path).toBe("/claude/v1/messages");
      });

      it("should have required model and messages fields", () => {
        const fields = provider.claudeHaiku.v1.messages.payloadSchema.fields;
        expect(fields.model.required).toBe(true);
        expect(fields.model.enum).toEqual(["claude-haiku-4-5"]);
        expect(fields.messages.required).toBe(true);
        expect(fields.messages.type).toBe("array");
      });

      it("should have optional tools and stream fields", () => {
        const fields = provider.claudeHaiku.v1.messages.payloadSchema.fields;
        expect(fields.tools.required).toBeUndefined();
        expect(fields.tools.type).toBe("array");
        expect(fields.stream.type).toBe("boolean");
      });
    });

    describe("validatePayload", () => {
      const provider = kie({
        apiKey: "test-key",
        fetch: vi
          .fn()
          .mockResolvedValue(
            new Response('{"id":"msg_1"}', { status: 200 })
          ) as unknown as typeof fetch,
      });

      it("should accept valid claude-haiku request", () => {
        const result = provider.claudeHaiku.v1.messages.validatePayload({
          model: "claude-haiku-4-5",
          messages: [{ role: "user", content: "Hello" }],
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should reject empty object", () => {
        const result = provider.claudeHaiku.v1.messages.validatePayload({});
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.join(" ")).toContain("model");
        expect(result.errors.join(" ")).toContain("messages");
      });

      it("should reject request missing messages", () => {
        const result = provider.claudeHaiku.v1.messages.validatePayload({
          model: "claude-haiku-4-5",
        });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toContain("messages");
      });

      it("should reject request missing model", () => {
        const result = provider.claudeHaiku.v1.messages.validatePayload({
          messages: [{ role: "user", content: "Hi" }],
        });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toContain("model");
      });

      it("should accept request with tools", () => {
        const result = provider.claudeHaiku.v1.messages.validatePayload({
          model: "claude-haiku-4-5",
          messages: [{ role: "user", content: "Use a tool" }],
          tools: [
            {
              name: "calc",
              description: "Calculator",
              input_schema: { type: "object" },
            },
          ],
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe("core endpoints (real factory)", () => {
    function mockFetchOk(body: Record<string, unknown>): typeof fetch {
      return vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(body), { status: 200 })
        ) as unknown as typeof fetch;
    }

    it("should send createTask to correct URL with JSON body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            msg: "success",
            data: { taskId: "t1" },
          }),
          { status: 200 }
        )
      );
      const provider = kie({
        apiKey: "sk-test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const result = await provider.api.v1.jobs.createTask({
        model: "nano-banana-pro",
        input: { prompt: "A sunset" },
      });

      expect(result.data?.taskId).toBe("t1");
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
      expect(init.method).toBe("POST");
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer sk-test"
      );
      const body = JSON.parse(init.body as string);
      expect(body.model).toBe("nano-banana-pro");
      expect(body.input.prompt).toBe("A sunset");
    });

    it("should send recordInfo GET with taskId query param", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            msg: "success",
            data: {
              taskId: "t1",
              model: "nano-banana-pro",
              state: "success",
              progress: 100,
            },
          }),
          { status: 200 }
        )
      );
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const result = await provider.api.v1.jobs.recordInfo("t1");

      expect(result.data?.taskId).toBe("t1");
      expect(result.data?.state).toBe("success");
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/v1/jobs/recordInfo?taskId=t1");
      expect(init.method).toBe("GET");
    });

    it("should send downloadUrl POST with correct body", async () => {
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetchOk({
          code: 200,
          msg: "success",
          data: "https://cdn.kie.ai/tmp/file.mp4",
        }),
      });

      const result = await provider.api.v1.common.downloadUrl({
        url: "uploads/file.mp4",
      });

      expect(result.data).toBe("https://cdn.kie.ai/tmp/file.mp4");
    });

    it("should send credit GET to correct URL", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ code: 200, msg: "success", data: 42 }),
            { status: 200 }
          )
        );
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const result = await provider.api.v1.chat.credit();

      expect(result.data).toBe(42);
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.kie.ai/api/v1/chat/credit");
      expect(init.method).toBe("GET");
    });

    it("should send fileStreamUpload FormData to upload URL", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            code: 200,
            data: { downloadUrl: "https://cdn.kie.ai/uploads/test.png" },
          }),
          { status: 200 }
        )
      );
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const blob = new Blob(["fake-image"], { type: "image/png" });
      const result = await provider.api.fileStreamUpload({
        file: blob,
        filename: "test.png",
      });

      expect(result.data?.downloadUrl).toBe(
        "https://cdn.kie.ai/uploads/test.png"
      );
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://kieai.redpandaai.co/api/file-stream-upload");
      expect(init.method).toBe("POST");
      expect(init.body).toBeInstanceOf(FormData);
    });

    it("should throw KieError when MIME type cannot be inferred", async () => {
      const mockFetch = vi.fn();
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const blob = new Blob(["data"]);
      try {
        await provider.api.fileStreamUpload({
          file: blob,
          filename: "noext",
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).status).toBe(400);
        expect((err as KieError).message).toContain(
          "Cannot determine MIME type"
        );
      }
    });

    it("should use explicit mimeType over inferred", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            code: 200,
            data: { downloadUrl: "https://cdn.kie.ai/up/f.bin" },
          }),
          { status: 200 }
        )
      );
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const blob = new Blob(["data"]);
      await provider.api.fileStreamUpload({
        file: blob,
        filename: "data.bin",
        mimeType: "application/octet-stream",
      });

      // Should not throw — explicit mimeType provided
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });

  describe("core error handling (real factory)", () => {
    it("should throw KieError on createTask HTTP error", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ msg: "Unauthorized" }), { status: 401 })
        );
      const provider = kie({
        apiKey: "bad-key",
        fetch: mockFetch as unknown as typeof fetch,
      });

      try {
        await provider.api.v1.jobs.createTask({
          model: "nano-banana-pro",
          input: { prompt: "test" },
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).status).toBe(401);
      }
    });

    it("should throw KieError on recordInfo HTTP error", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ msg: "Not found" }), { status: 404 })
        );
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetch as unknown as typeof fetch,
      });

      try {
        await provider.api.v1.jobs.recordInfo("nonexistent");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).status).toBe(404);
      }
    });

    it("should throw KieError on credit HTTP error", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 500 }));
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetch as unknown as typeof fetch,
      });

      try {
        await provider.api.v1.chat.credit();
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).status).toBe(500);
      }
    });

    it("should throw KieError on network failure for createTask", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed"));
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetch as unknown as typeof fetch,
      });

      try {
        await provider.api.v1.jobs.createTask({
          model: "nano-banana-pro",
          input: { prompt: "test" },
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).message).toContain("Failed to create task");
      }
    });

    it("should throw KieError on upload HTTP error", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ msg: "File too large" }), {
          status: 413,
        })
      );
      const provider = kie({
        apiKey: "test-key",
        fetch: mockFetch as unknown as typeof fetch,
      });

      try {
        await provider.api.fileStreamUpload({
          file: new Blob(["data"]),
          filename: "file.png",
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).status).toBe(413);
      }
    });
  });
});
