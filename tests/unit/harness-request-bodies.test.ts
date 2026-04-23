import { describe, expect, it } from "vitest";
import {
  getRequestBodyText,
  parseRequestBody,
  type HarEntry,
} from "../har-data";
import { summarizeMultipartFormData } from "../harness";

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
});
