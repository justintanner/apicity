import { describe, expect, it } from "vitest";
import {
  REDACTED_HAR_VALUE,
  scrubSensitiveResponse,
  type HarRecordingLike,
} from "../har-scrub";

describe("HAR response scrubber", () => {
  it("redacts response cookies and provider identifiers", () => {
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

    expect(recording.response?.cookies?.[0]?.value).toBe(REDACTED_HAR_VALUE);
    expect(recording.response?.cookies?.[1]?.value).toBe(REDACTED_HAR_VALUE);
    expect(recording.response?.cookies?.[2]?.value).toBeUndefined();
    expect(recording.response?.headers).toEqual([
      { name: "anthropic-organization-id", value: REDACTED_HAR_VALUE },
      { name: "openai-organization", value: REDACTED_HAR_VALUE },
      { name: "request-id", value: REDACTED_HAR_VALUE },
      { name: "x-request-id", value: REDACTED_HAR_VALUE },
      { name: "traceresponse", value: REDACTED_HAR_VALUE },
      { name: "x-dashscope-inner-user-meta", value: REDACTED_HAR_VALUE },
      { name: "set-cookie", value: REDACTED_HAR_VALUE },
      { name: "Set-Cookie", value: REDACTED_HAR_VALUE },
      { name: "content-type", value: "application/json" },
    ]);
  });
});
