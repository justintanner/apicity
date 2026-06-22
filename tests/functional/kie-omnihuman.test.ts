import { describe, it, expect } from "vitest";
import { createKie } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie omnihuman 1.5", () => {
  it("serializes createTask requests to the KIE jobs endpoint", async () => {
    const captured: { input?: RequestInfo | URL; init?: RequestInit } = {};
    const fetchImpl: typeof fetch = async (input, init) => {
      captured.input = input;
      captured.init = init;

      return new Response(
        JSON.stringify({
          code: 200,
          msg: "success",
          data: { taskId: "omnihuman-test-task" },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    };
    const provider = createKie({
      apiKey: "test-key",
      fetch: fetchImpl,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request = {
      model: "omnihuman-1-5",
      input: {
        image_url: "https://example.com/portrait.png",
        mask_url: ["https://example.com/mask.png"],
        audio_url: "https://example.com/speech.mp3",
        prompt: "A person speaking naturally with gentle expressions.",
        output_resolution: "1080",
        pe_fast_mode: false,
        seed: -1,
      },
      callBackUrl: "https://example.com/callback",
    };

    const response = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(response.data?.taskId).toBe("omnihuman-test-task");
    expect(String(captured.input)).toBe(
      "https://api.kie.ai/api/v1/jobs/createTask"
    );
    expect(captured.init?.method).toBe("POST");
    expect(new Headers(captured.init?.headers).get("authorization")).toBe(
      "Bearer test-key"
    );
    expect(new Headers(captured.init?.headers).get("content-type")).toBe(
      "application/json"
    );
    expect(JSON.parse(captured.init?.body as string)).toEqual(request);
  });
});
