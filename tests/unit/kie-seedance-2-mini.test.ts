import { describe, expect, it, vi } from "vitest";
import { createKie, KieError, type Seedance2MiniRequest } from "@apicity/kie";
import {
  Seedance2MiniRecordInfoResponseSchema,
  Seedance2MiniRequestSchema,
  Seedance2MiniTaskResultJsonSchema,
} from "@apicity/kie/zod";

import { TEST_PAYGATE_SECRET, mintKieCreateTaskOtp } from "../harness";

describe("KIE Seedance 2 Mini", () => {
  it("serializes createTask requests to the shared KIE jobs endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          msg: "success",
          data: { taskId: "seedance-mini-task-1" },
        }),
        { status: 200 }
      )
    );
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request = {
      model: "bytedance/seedance-2-mini",
      input: {
        prompt: "A compact product launch video with synced ambience.",
        reference_image_urls: ["https://example.com/reference.png"],
        reference_video_urls: ["https://example.com/source.mp4"],
        reference_audio_urls: ["https://example.com/voice.wav"],
        generate_audio: false,
        resolution: "720p",
        aspect_ratio: "16:9",
        duration: 15,
        web_search: false,
        nsfw_checker: true,
      },
      callBackUrl: "https://example.com/kie-callback",
    } satisfies Seedance2MiniRequest;

    const result = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(result.data?.taskId).toBe("seedance-mini-task-1");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it("parses recordInfo responses and Seedance Mini resultJson", async () => {
    const createRequest = {
      model: "bytedance/seedance-2-mini",
      input: {
        prompt: "A calm camera move over a city model.",
      },
    } satisfies Seedance2MiniRequest;
    const resultJson = JSON.stringify({
      resultUrls: ["https://cdn.kie.ai/video/seedance-mini.mp4"],
    });
    const responseBody = {
      code: 200,
      msg: "success",
      data: {
        taskId: "task/id with space",
        model: "bytedance/seedance-2-mini",
        state: "success",
        param: JSON.stringify(createRequest),
        resultJson,
        failCode: null,
        failMsg: null,
        costTime: 1234,
        completeTime: 1782000000,
        createTime: 1781999900,
      },
    };
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(responseBody), { status: 200 })
      );
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
    });

    expect(
      provider.get.api.v1.jobs.recordInfo.schema.safeParse({
        taskId: "task/id with space",
      }).success
    ).toBe(true);
    const info =
      await provider.get.api.v1.jobs.recordInfo("task/id with space");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=task%2Fid%20with%20space"
    );
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(info.data?.taskId).toBe("task/id with space");
    expect(
      provider.get.api.v1.jobs.recordInfo.seedance2MiniResponseSchema.safeParse(
        info
      ).success
    ).toBe(true);
    expect(Seedance2MiniRecordInfoResponseSchema.safeParse(info).success).toBe(
      true
    );
    expect(
      Seedance2MiniTaskResultJsonSchema.parse(JSON.parse(resultJson))
    ).toEqual({
      resultUrls: ["https://cdn.kie.ai/video/seedance-mini.mp4"],
    });
  });

  it("maps createTask and recordInfo HTTP failures to KieError", async () => {
    const createRequest = {
      model: "bytedance/seedance-2-mini",
      input: {
        prompt: "A short validation sample.",
      },
    } satisfies Seedance2MiniRequest;
    const createFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ msg: "Invalid model" }), { status: 422 })
      );
    const createProvider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: createFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    await expect(
      createProvider.post.api.v1.jobs.createTask(
        createRequest,
        mintKieCreateTaskOtp(createRequest)
      )
    ).rejects.toMatchObject({
      name: "KieError",
      status: 422,
      message: "Kie API error 422: Invalid model",
      body: { msg: "Invalid model" },
    });

    const recordFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ msg: "Task not found" }), { status: 404 })
      );
    const recordProvider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: recordFetch,
    });

    await expect(
      recordProvider.get.api.v1.jobs.recordInfo("missing-task")
    ).rejects.toMatchObject({
      name: "KieError",
      status: 404,
      message: "Kie API error 404: Task not found",
      body: { msg: "Task not found" },
    });
  });

  it("validates defaults, enums, ranges, prompt length, and media arrays", () => {
    const parsed = Seedance2MiniRequestSchema.safeParse({
      model: "bytedance/seedance-2-mini",
      input: {},
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.input.reference_image_urls).toEqual([]);
      expect(parsed.data.input.reference_video_urls).toEqual([]);
      expect(parsed.data.input.reference_audio_urls).toEqual([]);
      expect(parsed.data.input.generate_audio).toBe(true);
      expect(parsed.data.input.resolution).toBe("720p");
      expect(parsed.data.input.aspect_ratio).toBe("16:9");
      expect(parsed.data.input.duration).toBe(15);
      expect(parsed.data.input.web_search).toBe(false);
      expect(parsed.data.input.nsfw_checker).toBe(true);
    }

    expect(
      Seedance2MiniRequestSchema.safeParse({
        model: "bytedance/seedance-2-mini",
        input: { duration: 3 },
      }).success
    ).toBe(false);
    expect(
      Seedance2MiniRequestSchema.safeParse({
        model: "bytedance/seedance-2-mini",
        input: { duration: 15.5 },
      }).success
    ).toBe(false);
    expect(
      Seedance2MiniRequestSchema.safeParse({
        model: "bytedance/seedance-2-mini",
        input: { resolution: "1080p" },
      }).success
    ).toBe(false);
    expect(
      Seedance2MiniRequestSchema.safeParse({
        model: "bytedance/seedance-2-mini",
        input: { aspect_ratio: "2:3" },
      }).success
    ).toBe(false);
    expect(
      Seedance2MiniRequestSchema.safeParse({
        model: "bytedance/seedance-2-mini",
        input: { prompt: "x".repeat(20001) },
      }).success
    ).toBe(false);
    expect(
      Seedance2MiniRequestSchema.safeParse({
        model: "bytedance/seedance-2-mini",
        input: { reference_audio_urls: ["not-a-url"] },
      }).success
    ).toBe(false);
  });

  it("rejects invalid Seedance Mini requests before fetch", async () => {
    const mockFetch = vi.fn();
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request = {
      model: "bytedance/seedance-2-mini",
      input: {
        duration: 16,
      },
    } satisfies Seedance2MiniRequest;

    await expect(
      provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      )
    ).rejects.toBeInstanceOf(KieError);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
