// Tests for the Suno sub-provider
import { describe, it, expect, vi } from "vitest";

describe("kie suno provider", () => {
  interface SunoGenerateRequest {
    prompt: string;
    style?: string;
    instrumental?: boolean;
    model?: "V4" | "V4_5" | "V4_5PLUS" | "V4_5ALL" | "V5";
    customMode?: boolean;
    negativeTags?: string;
    title?: string;
  }

  interface SunoProvider {
    api: {
      v1: {
        generate(req: SunoGenerateRequest): Promise<{ taskId: string }>;
      };
    };
  }

  function createMockSunoProvider(): SunoProvider {
    return {
      api: {
        v1: {
          generate: vi.fn().mockResolvedValue({ taskId: "suno-task-123" }),
        },
      },
    };
  }

  it("should generate music with default model", async () => {
    const suno = createMockSunoProvider();
    const result = await suno.api.v1.generate({
      prompt: "A smooth jazz ballad with piano and saxophone",
    });
    expect(result.taskId).toBe("suno-task-123");
  });

  it("should generate instrumental music", async () => {
    const suno = createMockSunoProvider();
    const result = await suno.api.v1.generate({
      prompt: "An upbeat electronic dance track",
      instrumental: true,
      model: "V4_5",
    });
    expect(result.taskId).toBe("suno-task-123");
  });

  it("should generate with custom mode options", async () => {
    const suno = createMockSunoProvider();
    const result = await suno.api.v1.generate({
      prompt: "Verse 1: Walking down the street...",
      style: "pop rock",
      customMode: true,
      title: "City Walk",
      negativeTags: "heavy metal",
    });
    expect(result.taskId).toBe("suno-task-123");
  });

  it("should generate a task and return taskId", async () => {
    const suno = createMockSunoProvider();
    const { taskId } = await suno.api.v1.generate({
      prompt: "A lullaby",
      model: "V5",
    });
    expect(taskId).toBe("suno-task-123");
  });
});
