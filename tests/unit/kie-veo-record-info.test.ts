import { describe, it, expect, vi } from "vitest";

import { createKie } from "@apicity/kie";
import { createVeoProvider } from "../../packages/provider/kie/src/veo";
import { VeoRecordInfoResponseSchema } from "../../packages/provider/kie/src/zod";

const veoRecordInfoSuccess = {
  code: 200,
  msg: "success",
  data: {
    taskId: "veo_task_abcdef123456",
    paramJson:
      '{"prompt":"A futuristic city with flying cars at sunset.","waterMark":"KieAI"}',
    completeTime: "2025-06-06 10:30:00",
    response: {
      taskId: "veo_task_abcdef123456",
      resultUrls: ["https://example.com/video1.mp4"],
      originUrls: ["https://example.com/original_video1.mp4"],
      fullResultUrls: ["https://example.com/full_result.mp4"],
      resolution: "1080p",
    },
    successFlag: 1,
    errorCode: null,
    errorMessage: "",
    createTime: "2025-06-06 10:25:00",
    fallbackFlag: false,
  },
};

describe("KIE Veo record-info endpoint", () => {
  it("exposes the get.api.v1.veo.recordInfo namespace and schemas", () => {
    const provider = createVeoProvider(
      "https://api.kie.ai",
      "test-api-key",
      vi.fn(),
      30000
    );

    const recordInfo = provider.get.api.v1.veo.recordInfo;

    expect(typeof recordInfo).toBe("function");
    expect(recordInfo.schema.safeParse({ taskId: "task-123" }).success).toBe(
      true
    );
    expect(recordInfo.schema.safeParse({}).success).toBe(false);
    expect(recordInfo.schema.safeParse({ taskId: "" }).success).toBe(false);
    expect(
      recordInfo.responseSchema.safeParse(veoRecordInfoSuccess).success
    ).toBe(true);
  });

  it("routes through the root KIE veo sub-provider", () => {
    const provider = createKie({
      apiKey: "test-api-key",
      fetch: vi.fn(),
    });

    expect(typeof provider.veo.get.api.v1.veo.recordInfo).toBe("function");
  });

  it("sends an authenticated GET with an encoded taskId", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(veoRecordInfoSuccess), { status: 200 })
      );
    const provider = createVeoProvider(
      "https://api.kie.ai",
      "test-api-key",
      mockFetch,
      30000
    );

    const result =
      await provider.get.api.v1.veo.recordInfo("task/id with space");

    expect(VeoRecordInfoResponseSchema.safeParse(result).success).toBe(true);
    expect(result.data?.response?.resolution).toBe("1080p");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.kie.ai/api/v1/veo/record-info?taskId=task%2Fid%20with%20space"
    );
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({
      Authorization: "Bearer test-api-key",
      "Content-Type": "application/json",
    });
  });
});
