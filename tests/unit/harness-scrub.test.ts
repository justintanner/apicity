import { describe, expect, it } from "vitest";
import { scrubSensitiveResponse, type HarRecordingLike } from "../har-scrub";

describe("HAR response scrubber", () => {
  it("drops response cookies and sensitive response headers", () => {
    const recording: HarRecordingLike = {
      response: {
        cookies: [
          { name: "_cfuvid", value: "real-cookie-value" },
          { name: "JSESSIONID", value: "real-session-id" },
          { name: "empty" },
        ],
        headers: [
          { name: "anthropic-organization-id", value: "org-real" },
          { name: "openai-organization", value: "org-openai" },
          { name: "request-id", value: "req-real" },
          { name: "x-request-id", value: "req-x-real" },
          { name: "traceresponse", value: "trace-real" },
          { name: "x-dashscope-inner-user-meta", value: "user-real" },
          { name: "set-cookie", value: "_cfuvid=real-cookie-value" },
          { name: "Set-Cookie", value: "JSESSIONID=real-session-id; Path=/" },
          { name: "content-type", value: "application/json" },
        ],
      },
    };

    scrubSensitiveResponse(recording);

    expect(recording.response?.cookies).toEqual([]);
    expect(recording.response?.headers).toEqual([
      { name: "content-type", value: "application/json" },
    ]);
  });

  it("drops Kie JSESSIONID response cookies", () => {
    const recording: HarRecordingLike = {
      response: {
        cookies: [{ name: "JSESSIONID", value: "kie-session-id" }],
        headers: [
          {
            name: "set-cookie",
            value: "JSESSIONID=kie-session-id; Path=/; HttpOnly",
          },
        ],
      },
    };

    scrubSensitiveResponse(recording);

    expect(recording.response?.cookies).toEqual([]);
    expect(recording.response?.headers).toEqual([]);
  });
});
