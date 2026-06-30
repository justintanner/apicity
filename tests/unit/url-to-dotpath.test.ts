import { describe, expect, it } from "vitest";
import {
  urlToDotPath,
  urlToDotString,
} from "../../scripts/lib/url-to-dotpath.mjs";

describe("urlToDotPath", () => {
  it("converts relative URL path segments to dotted namespace parts", () => {
    expect(urlToDotPath("/v1/language-models")).toEqual([
      "v1",
      "languageModels",
    ]);
    expect(urlToDotPath("/v1/chat_completions")).toEqual([
      "v1",
      "chatCompletions",
    ]);
  });

  it("removes placeholder segments and query/hash suffixes", () => {
    expect(
      urlToDotPath("/v1/batches/{batch_id}/cancel?limit=10#details")
    ).toEqual(["v1", "batches", "cancel"]);
    expect(
      urlToDotPath("https://queue.fal.run/v1/files?limit=10#details")
    ).toEqual(["queue", "v1", "files"]);
    expect(urlToDotPath("/v1/files/{file_id}/content/{query}")).toEqual([
      "v1",
      "files",
      "content",
    ]);
    expect(urlToDotPath("/v1/models/{model}:predict")).toEqual([
      "v1",
      "models",
      "predict",
    ]);
  });

  it("drops conventional api and www host labels", () => {
    expect(urlToDotPath("https://api.openai.com/v1/models")).toEqual([
      "v1",
      "models",
    ]);
    expect(urlToDotPath("https://www.api.example.com/v2/items")).toEqual([
      "v2",
      "items",
    ]);
  });

  it("keeps non-conventional subdomain labels by default", () => {
    expect(urlToDotPath("https://queue.fal.run/requests/status")).toEqual([
      "queue",
      "requests",
      "status",
    ]);
  });

  it("can retain full hostnames for multi-host providers", () => {
    expect(
      urlToDotPath("https://catbox.moe/user/api.php", {
        keepFullHostname: true,
      })
    ).toEqual(["catbox", "moe", "user"]);
    expect(
      urlToDotPath("https://tmpfiles.org/upload", {
        keepFullHostname: true,
      })
    ).toEqual(["tmpfiles", "org", "upload"]);
  });

  it("ignores configured provider-owned host labels", () => {
    expect(
      urlToDotPath("https://queue.fal.run/requests", {
        ignoredHostLabels: ["queue"],
      })
    ).toEqual(["requests"]);
    expect(
      urlToDotPath("https://kieai.erweima.ai/v1/jobs", {
        ignoredHostLabels: ["kieai"],
      })
    ).toEqual(["v1", "jobs"]);
  });

  it("filters conventional server-script filenames from paths", () => {
    expect(
      urlToDotPath("https://tmpfiles.org/upload/index.html", {
        keepFullHostname: true,
      })
    ).toEqual(["tmpfiles", "org", "upload"]);
    expect(
      urlToDotPath("https://catbox.moe/user/API.PHP", {
        keepFullHostname: true,
      })
    ).toEqual(["catbox", "moe", "user"]);
    expect(urlToDotPath("/v1/hooks/callback.cgi")).toEqual(["v1", "hooks"]);
  });

  it("returns null for invalid or empty URLs", () => {
    expect(urlToDotPath("")).toBeNull();
    expect(urlToDotPath("not a url")).toBeNull();
    expect(urlToDotPath("ftp://example.com/v1/files")).toBeNull();
    expect(urlToDotPath(null)).toBeNull();
  });
});

describe("urlToDotString", () => {
  it("joins URL dot path segments with periods", () => {
    expect(urlToDotString("https://queue.fal.run/v1/image-to-video")).toBe(
      "queue.v1.imageToVideo"
    );
  });

  it("returns null when the URL has no dot path segments", () => {
    expect(urlToDotString("https://api.openai.com")).toBeNull();
  });
});
