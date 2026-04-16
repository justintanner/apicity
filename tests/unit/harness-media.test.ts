import { describe, expect, it } from "vitest";
import { entryHasMedia, recordingHasMedia, type HarEntry } from "../har-data";

function jsonEntry(requestBody: unknown, responseBody: unknown): HarEntry {
  return {
    request: {
      method: "POST",
      url: "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis",
      headers: [{ name: "content-type", value: "application/json" }],
      postData: { text: JSON.stringify(requestBody) },
    },
    response: {
      status: 200,
      statusText: "OK",
      headers: [{ name: "content-type", value: "application/json" }],
      content: {
        mimeType: "application/json",
        text: JSON.stringify(responseBody),
      },
    },
  };
}

describe("harness media detection", () => {
  it("detects Alibaba videoedit request media URLs", () => {
    const entry = jsonEntry(
      {
        model: "wan2.7-videoedit",
        input: {
          prompt: "Convert the entire scene to a claymation style",
          media: [
            {
              type: "video",
              url: "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20260402/ldnfdf/wan2.7-videoedit-style-change.mp4",
            },
          ],
        },
        parameters: {
          resolution: "720P",
          prompt_extend: true,
          watermark: true,
        },
      },
      {
        output: {
          task_id: "task-123",
          task_status: "PENDING",
        },
        request_id: "request-123",
      }
    );

    expect(entryHasMedia(entry)).toBe(true);
    expect(recordingHasMedia({ entries: [entry] })).toBe(true);
  });

  it("does not treat bare filenames as media URLs", () => {
    const entry = jsonEntry(
      { filename: "sample.mp4" },
      { object: "file", filename: "sample.mp4" }
    );

    expect(entryHasMedia(entry)).toBe(false);
  });
});
