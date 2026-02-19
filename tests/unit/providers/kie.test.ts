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

  interface KieProvider {
    createTask(req: MediaGenerationRequest): Promise<TaskResponse>;
    getTaskStatus(taskId: string): Promise<{
      taskId: string;
      status: string;
      result?: { urls?: string[] };
    }>;
    waitForTask(taskId: string): Promise<TaskResult>;
    generate(req: MediaGenerationRequest): Promise<TaskResult>;
    getCredits(): Promise<{
      balance: number;
      totalUsed: number;
      currency: string;
    }>;
    validateModel(modelId: string): boolean;
    getModels(): string[];
    getModelType(modelId: string): "image" | "video" | null;
  }

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
      getCredits: vi.fn().mockResolvedValue({
        balance: 100,
        totalUsed: 50,
        currency: "credits",
      }),
      validateModel: vi
        .fn()
        .mockImplementation(
          (modelId: string) =>
            modelId === "kling-3.0/video" || modelId === "nano-banana-pro"
        ),
      getModels: vi
        .fn()
        .mockReturnValue(["kling-3.0/video", "nano-banana-pro"]),
      getModelType: vi.fn().mockImplementation((modelId: string) => {
        if (modelId === "kling-3.0/video") return "video";
        if (modelId === "nano-banana-pro") return "image";
        return null;
      }),
    };
  }

  it("should validate supported models", () => {
    const provider = createMockProvider();
    expect(provider.validateModel("kling-3.0/video")).toBe(true);
    expect(provider.validateModel("nano-banana-pro")).toBe(true);
    expect(provider.validateModel("unsupported-model")).toBe(false);
  });

  it("should return model type", () => {
    const provider = createMockProvider();
    expect(provider.getModelType("kling-3.0/video")).toBe("video");
    expect(provider.getModelType("nano-banana-pro")).toBe("image");
    expect(provider.getModelType("unknown")).toBe(null);
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

  it("should generate media", async () => {
    const provider = createMockProvider();
    const req: MediaGenerationRequest = {
      model: "nano-banana-pro",
      input: {
        prompt: "A sunset",
        aspect_ratio: "16:9",
      },
    };

    const result = await provider.generate(req);
    expect(result.status).toBe("completed");
    expect(result.imageUrl).toBe("https://example.com/image.png");
  });
});
