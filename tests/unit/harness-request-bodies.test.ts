import { describe, expect, it } from "vitest";
import {
  getRequestBodyText,
  parseRequestBody,
  type HarEntry,
} from "../har-data";
import {
  redactPersistedHarSecrets,
  summarizeMultipartFormData,
  type PersistedHarRecording,
} from "../harness";

function emptyResponse(): HarEntry["response"] {
  return {
    status: 200,
    statusText: "OK",
    headers: [],
    content: {},
  };
}

describe("harness request body helpers", () => {
  it("summarizes multipart form data without embedding file bytes", () => {
    const image = new Blob(["cat-bytes"], { type: "image/jpeg" });
    const mask = new Blob(["mask-bytes"], { type: "image/png" });
    const form = new FormData();
    form.append("prompt", "Add a red bow tie");
    form.append("model", "gpt-image-2-2026-04-21");
    form.append("image", image, "cat.jpg");
    form.append("image", mask, "mask.png");

    expect(summarizeMultipartFormData(form)).toEqual({
      _multipart: true,
      prompt: "Add a red bow tie",
      model: "gpt-image-2-2026-04-21",
      image: [
        {
          _file: true,
          filename: "cat.jpg",
          contentType: "image/jpeg",
          size: image.size,
        },
        {
          _file: true,
          filename: "mask.png",
          contentType: "image/png",
          size: mask.size,
        },
      ],
    });
  });

  it("reconstructs a readable body from multipart HAR params", () => {
    const entry: HarEntry = {
      request: {
        method: "POST",
        url: "https://api.openai.com/v1/images/edits",
        headers: [
          {
            name: "content-type",
            value: "multipart/form-data; boundary=test",
          },
        ],
        postData: {
          mimeType: "multipart/form-data",
          params: [
            { name: "prompt", value: "Add a red bow tie" },
            { name: "model", value: "gpt-image-2-2026-04-21" },
            {
              name: "image",
              fileName: "cat.jpg",
              contentType: "image/jpeg",
            },
          ],
        },
      },
      response: emptyResponse(),
    };

    const expected = {
      _multipart: true,
      prompt: "Add a red bow tie",
      model: "gpt-image-2-2026-04-21",
      image: {
        _file: true,
        filename: "cat.jpg",
        contentType: "image/jpeg",
      },
    };

    expect(parseRequestBody(entry)).toEqual(expected);
    expect(JSON.parse(getRequestBodyText(entry) ?? "")).toEqual(expected);
  });

  it("redacts Gofile guest tokens from persisted response bodies", () => {
    const recording: PersistedHarRecording = {
      response: {
        content: {
          mimeType: "application/json",
          text: '{"data":{"guestToken":"live-token","nested":[{"guestToken":"other-token"}]},"status":"ok"}\n',
        },
      },
    };

    redactPersistedHarSecrets(recording);

    expect(JSON.parse(recording.response?.content?.text ?? "")).toEqual({
      data: {
        guestToken: "***",
        nested: [{ guestToken: "***" }],
      },
      status: "ok",
    });
    expect(recording.response?.content?.text).not.toContain("live-token");
    expect(recording.response?.content?.text).not.toContain("other-token");
    expect(recording.response?.content?.size).toBe(
      new TextEncoder().encode(recording.response?.content?.text ?? "").length
    );
    expect(recording.response?.bodySize).toBe(
      recording.response?.content?.size
    );
  });
});

describe("harness persist scrubbers", () => {
  it("redacts DashScope identifiers and signed OSS response URLs", () => {
    const recording: PersistedHarRecording = {
      request: {
        url: "https://api.telegram.org/bot123456:secret/sendMessage",
        headers: [
          { name: "authorization", value: "Bearer real-token" },
          { name: "x-api-key", value: "real-key" },
        ],
      },
      response: {
        headers: [
          { name: "x-dashscope-apikeyid", value: "apikey-123" },
          { name: "x-dashscope-bwid", value: "ws-123" },
          { name: "x-dashscope-uid", value: "5077675727314676" },
          { name: "x-dashscope-workspace", value: "ws-456" },
          {
            name: "x-dashscope-inner-flow-control-meta",
            value: JSON.stringify({
              model: "qwen-image-edit",
              user_id: "5077675727314676",
              user_spec: {
                default_spec: false,
                count_limit: 2,
              },
            }),
          },
        ],
        content: {
          text: JSON.stringify({
            image:
              "https://dashscope-result-sh.oss-cn-shanghai.aliyuncs.com/" +
              "result.png?Expires=1777010569&OSSAccessKeyId=LTAI-secret" +
              "&Signature=secret-signature",
            upload_host:
              "https://dashscope-file-mgr.oss-cn-beijing.aliyuncs.com",
            oss_access_key_id: "LTAI-upload-secret",
            signature: "upload-policy-signature",
          }),
        },
      },
    };

    redactPersistedHarSecrets(recording);

    expect(recording.request?.url).toBe(
      "https://api.telegram.org/bot***/sendMessage"
    );
    expect(recording.request?.headers).toEqual([
      { name: "authorization", value: "Bearer ***" },
      { name: "x-api-key", value: "***" },
    ]);
    expect(recording.response?.headers).toEqual([
      { name: "x-dashscope-apikeyid", value: "***" },
      { name: "x-dashscope-bwid", value: "ws-***" },
      { name: "x-dashscope-uid", value: "***" },
      { name: "x-dashscope-workspace", value: "ws-***" },
      {
        name: "x-dashscope-inner-flow-control-meta",
        value: JSON.stringify({
          model: "qwen-image-edit",
          user_id: "***",
          user_spec: "***",
        }),
      },
    ]);
    expect(recording.response?.content?.text).toContain("OSSAccessKeyId=***");
    expect(recording.response?.content?.text).toContain("Signature=***");
    expect(recording.response?.content?.text).not.toContain("LTAI-secret");
    expect(recording.response?.content?.text).not.toContain(
      "LTAI-upload-secret"
    );
    expect(recording.response?.content?.text).not.toContain("secret-signature");
    expect(recording.response?.content?.text).not.toContain(
      "upload-policy-signature"
    );
  });
});
