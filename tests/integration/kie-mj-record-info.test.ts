import { describe, it, expect } from "vitest";
import { createKie } from "@apicity/kie";

describe("kie mj record-info", () => {
  it("requests the Midjourney task details endpoint", async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const provider = createKie({
      apiKey: "kie-test-key",
      fetch: async (input, init) => {
        calls.push({ input, init });

        return new Response(
          JSON.stringify({
            code: 200,
            msg: "success",
            data: {
              taskId: "mj_task_abcdef123456",
              taskType: "mj_txt2img",
              paramJson: JSON.stringify({
                prompt: "A mountain landscape",
                taskType: "mj_txt2img",
              }),
              completeTime: "2024-03-20T10:30:00Z",
              resultInfoJson: {
                resultUrls: [{ resultUrl: "https://example.com/image1.jpeg" }],
              },
              successFlag: 1,
              createTime: "2024-03-20T10:25:00Z",
              errorCode: null,
              errorMessage: null,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    });

    const recordInfo = provider.get.api.v1.mj.recordInfo;
    const result = await recordInfo("task id/with spaces");

    expect(result.code).toBe(200);
    expect(result.data?.taskId).toBe("mj_task_abcdef123456");
    expect(result.data?.successFlag).toBe(1);
    expect(calls).toHaveLength(1);
    expect(String(calls[0].input)).toBe(
      "https://api.kie.ai/api/v1/mj/record-info?taskId=task%20id%2Fwith%20spaces"
    );
    expect(calls[0].init?.method).toBe("GET");
    expect(calls[0].init?.headers).toMatchObject({
      Authorization: "Bearer kie-test-key",
      "Content-Type": "application/json",
    });
    expect(recordInfo.responseSchema.safeParse(result).success).toBe(true);
  });

  it("validates the request taskId via schema", () => {
    const recordInfo = createKie({
      apiKey: "kie-test-key",
    }).get.api.v1.mj.recordInfo;

    expect(recordInfo.schema.safeParse({ taskId: "abc123" }).success).toBe(
      true
    );
    expect(recordInfo.schema.safeParse({}).success).toBe(false);
    expect(recordInfo.schema.safeParse({ taskId: "" }).success).toBe(false);
  });
});
