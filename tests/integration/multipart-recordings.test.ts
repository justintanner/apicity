import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface HarHeader {
  name?: string;
  value?: string;
}

interface HarEntry {
  request?: {
    method?: string;
    url?: string;
    headers?: HarHeader[];
    postData?: {
      mimeType?: string;
      params?: unknown[];
      text?: string;
    };
  };
}

interface HarRecording {
  log?: {
    entries?: HarEntry[];
  };
}

interface FormDataFixture {
  path: string;
  entryIndex: number;
  expected: Record<string, unknown>;
}

interface SummaryLessExceptionRule {
  reason: string;
  matches(relativePath: string, entry: HarEntry): boolean;
}

const recordingsDir = path.resolve(import.meta.dirname, "../recordings");

const historicalFormDataFixtures: FormDataFixture[] = [
  {
    path: "alibaba_1329897167/uploads-policy_611870938/recording.har",
    entryIndex: 1,
    expected: {
      _multipart: true,
      OSSAccessKeyId: "***",
      Signature: "***",
      policy: "***",
      key: "dashscope-instant/3d723ccd294679c81934310f2b5e8d0a/2026-04-19/d3ebcc22-8f47-9eb9-903c-836d14c79dca/cat1.jpg",
      "x-oss-object-acl": "private",
      "x-oss-forbid-overwrite": "true",
      success_action_status: "200",
      "x-oss-content-type": "image/jpeg",
      file: {
        _file: true,
        filename: "cat1.jpg",
        contentType: "image/jpeg",
        size: 83558,
      },
    },
  },
  {
    path: "kie_2079838932/bytedance-seedance-2-first-frame_1729742647/recording.har",
    entryIndex: 0,
    expected: kieFile("cat1.jpg", "image/jpeg", 83558, "images/test-uploads"),
  },
  {
    path: "kie_2079838932/bytedance-seedance-2-first-last-frame_2269386182/recording.har",
    entryIndex: 0,
    expected: kieFile("cat1.jpg", "image/jpeg", 83558, "images/test-uploads"),
  },
  {
    path: "kie_2079838932/bytedance-seedance-2-first-last-frame_2269386182/recording.har",
    entryIndex: 1,
    expected: kieFile("cat2.jpg", "image/jpeg", 227912, "images/test-uploads"),
  },
  {
    path: "kie_2079838932/bytedance-seedance-2-multimodal_1291051021/recording.har",
    entryIndex: 0,
    expected: kieFile("cat1.jpg", "image/jpeg", 83558, "images/test-uploads"),
  },
  {
    path: "kie_2079838932/bytedance-seedance-2-multimodal_1291051021/recording.har",
    entryIndex: 1,
    expected: kieFile(
      "seedance-ref.mp4",
      "video/mp4",
      74734,
      "videos/test-uploads"
    ),
  },
  {
    path: "kie_2079838932/bytedance-seedance-2-multimodal_1291051021/recording.har",
    entryIndex: 2,
    expected: kieFile("dialog.mp3", "audio/mpeg", 48317, "audio/test-uploads"),
  },
  {
    path: "kie_2079838932/wan-27-videoedit_297357185/recording.har",
    entryIndex: 0,
    expected: kieFile("jump.mp4", "video/mp4", 1318021, "videos/test-uploads"),
  },
  {
    path: "openai_3991279299/files-content_2411795472/recording.har",
    entryIndex: 0,
    expected: openAiFile("application/json", 18, "batch"),
  },
  {
    path: "openai_3991279299/transcribe-dialog_409608981/recording.har",
    entryIndex: 0,
    expected: {
      _multipart: true,
      file: fileSummary("blob", "audio/mp3", 48317),
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
      language: "en",
    },
  },
  {
    path: "openai_3991279299/transcribe-tone_3316906573/recording.har",
    entryIndex: 0,
    expected: openAiAudio("gpt-4o-mini-transcribe", 2528),
  },
  {
    path: "openai_3991279299/translate-tone_2581553320/recording.har",
    entryIndex: 0,
    expected: openAiAudio("whisper-1", 2528),
  },
  {
    path: "xai_3613880225/collections-documents-add_396223839/recording.har",
    entryIndex: 1,
    expected: xaiFile("test-doc.txt", "text/plain", 21),
  },
  {
    path: "xai_3613880225/collections-documents-batchget_2925998328/recording.har",
    entryIndex: 1,
    expected: xaiFile("doc1.txt", "text/plain", 9),
  },
  {
    path: "xai_3613880225/collections-documents-batchget_2925998328/recording.har",
    entryIndex: 2,
    expected: xaiFile("doc2.txt", "text/plain", 9),
  },
  {
    path: "xai_3613880225/collections-documents-delete_426912719/recording.har",
    entryIndex: 1,
    expected: xaiFile("test-del.txt", "text/plain", 25),
  },
  {
    path: "xai_3613880225/files-content_2411795472/recording.har",
    entryIndex: 0,
    expected: xaiFile("content-test.json", "application/json", 27),
  },
];

const summaryLessUploadExceptionRules: SummaryLessExceptionRule[] = [
  {
    reason:
      "B2/S3-compatible object APIs use raw object or XML request bodies.",
    matches: (relativePath) =>
      relativePath.startsWith("b2_") || relativePath.startsWith("s3_"),
  },
  {
    reason: "FAL storage signed uploads send the file bytes as a raw PUT body.",
    matches: (relativePath) => relativePath.startsWith("fal_"),
  },
  {
    reason: "filebin.net uploads send the file bytes as a raw POST body.",
    matches: (relativePath) =>
      relativePath.startsWith("free-media-upload_") &&
      relativePath.includes("/filebin-upload"),
  },
  {
    reason: "YouTube uses multipart/related, not browser FormData.",
    matches: (relativePath, entry) =>
      relativePath.startsWith("youtube_") &&
      headerValue(entry, "content-type")
        .toLowerCase()
        .startsWith("multipart/related"),
  },
];

function fileSummary(
  filename: string,
  contentType: string,
  size: number
): Record<string, unknown> {
  return {
    _file: true,
    filename,
    contentType,
    size,
  };
}

function kieFile(
  filename: string,
  contentType: string,
  size: number,
  uploadPath: string
): Record<string, unknown> {
  return {
    _multipart: true,
    file: fileSummary(filename, contentType, size),
    uploadPath,
  };
}

function openAiFile(
  contentType: string,
  size: number,
  purpose: string
): Record<string, unknown> {
  return {
    _multipart: true,
    file: fileSummary("blob", contentType, size),
    purpose,
  };
}

function openAiAudio(model: string, size: number): Record<string, unknown> {
  return {
    _multipart: true,
    file: fileSummary("blob", "audio/mp3", size),
    model,
    response_format: "json",
  };
}

function xaiFile(
  filename: string,
  contentType: string,
  size: number
): Record<string, unknown> {
  return {
    _multipart: true,
    file: fileSummary(filename, contentType, size),
    purpose: "batch",
  };
}

function collectHarFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHarFiles(fullPath));
      continue;
    }
    if (entry.name === "recording.har") {
      results.push(fullPath);
    }
  }
  return results;
}

function readHar(relativePath: string): HarRecording {
  return JSON.parse(
    fs.readFileSync(path.join(recordingsDir, relativePath), "utf8")
  ) as HarRecording;
}

function headerValue(entry: HarEntry, name: string): string {
  const lower = name.toLowerCase();
  return (
    entry.request?.headers?.find(
      (header) => header.name?.toLowerCase() === lower
    )?.value ?? ""
  );
}

function isMultipartFormData(entry: HarEntry): boolean {
  const mimeType = entry.request?.postData?.mimeType ?? "";
  const contentType = headerValue(entry, "content-type");
  return /multipart\/form-data/i.test(`${mimeType}\n${contentType}`);
}

function isSparsePostData(entry: HarEntry): boolean {
  const postData = entry.request?.postData;
  if (!postData) return false;

  const hasText = typeof postData.text === "string" && postData.text.length > 0;
  const hasParams =
    Array.isArray(postData.params) && postData.params.length > 0;
  return !hasText && !hasParams;
}

function isUploadLike(relativePath: string, entry: HarEntry): boolean {
  const signal = [
    relativePath,
    entry.request?.url ?? "",
    entry.request?.postData?.mimeType ?? "",
    headerValue(entry, "content-type"),
  ].join("\n");
  return /upload|files?|audio|image|video|media|documents|contents|multipart|object|bucket|s3/i.test(
    signal
  );
}

function parseMultipartSummary(entry: HarEntry): Record<string, unknown> {
  const text = entry.request?.postData?.text;
  expect(text).toEqual(expect.any(String));
  return JSON.parse(text as string) as Record<string, unknown>;
}

function exceptionReason(
  relativePath: string,
  entry: HarEntry
): string | undefined {
  return summaryLessUploadExceptionRules.find((rule) =>
    rule.matches(relativePath, entry)
  )?.reason;
}

describe("non-Fireworks multipart HAR request summaries", () => {
  it("keeps _multipart summaries for multipart/form-data entries", () => {
    for (const filePath of collectHarFiles(recordingsDir)) {
      const relativePath = path.relative(recordingsDir, filePath);
      if (relativePath.startsWith("fireworks_")) continue;

      const har = readHar(relativePath);
      for (const entry of har.log?.entries ?? []) {
        if (!isMultipartFormData(entry)) continue;

        expect(parseMultipartSummary(entry)._multipart, relativePath).toBe(
          true
        );
      }
    }
  });

  it("keeps exact summaries for historically sparse FormData fixtures", () => {
    for (const fixture of historicalFormDataFixtures) {
      const har = readHar(fixture.path);
      const entry = har.log?.entries?.[fixture.entryIndex];
      expect(entry, fixture.path).toBeDefined();
      expect(entry?.request?.postData?.mimeType, fixture.path).toBe(
        "multipart/form-data"
      );
      expect(parseMultipartSummary(entry as HarEntry), fixture.path).toEqual(
        fixture.expected
      );
    }
  });

  it("documents sparse raw upload recordings that are not FormData", () => {
    const unexpected: string[] = [];

    for (const filePath of collectHarFiles(recordingsDir)) {
      const relativePath = path.relative(recordingsDir, filePath);
      if (relativePath.startsWith("fireworks_")) continue;

      const har = readHar(relativePath);
      for (const [index, entry] of (har.log?.entries ?? []).entries()) {
        if (!isSparsePostData(entry) || !isUploadLike(relativePath, entry)) {
          continue;
        }

        const reason = exceptionReason(relativePath, entry);
        if (!reason) {
          unexpected.push(`${relativePath}#${index}`);
        }
      }
    }

    expect(unexpected).toEqual([]);
  });
});
