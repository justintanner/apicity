import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface HarPostData {
  mimeType?: string;
  params?: unknown[];
  text?: string;
}

interface HarEntry {
  request?: {
    postData?: HarPostData;
  };
}

interface HarRecording {
  log?: {
    entries?: HarEntry[];
  };
}

interface HarFixture {
  path: string;
  entryIndex: number;
  expected: Record<string, unknown>;
}

interface SummarylessFixture {
  path: string;
  entryIndex: number;
  reason: string;
}

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

function blobSummary(
  contentType: string,
  size: number
): Record<string, unknown> {
  return fileSummary("blob", contentType, size);
}

function multipart(fields: Record<string, unknown>): Record<string, unknown> {
  return { _multipart: true, ...fields };
}

const summarizedMultipartFixtures: HarFixture[] = [
  {
    path: "../recordings/alibaba_1329897167/uploads-policy_611870938/recording.har",
    entryIndex: 1,
    expected: multipart({
      OSSAccessKeyId: "***",
      Signature: "***",
      policy: "***",
      key: "dashscope-instant/3d723ccd294679c81934310f2b5e8d0a/2026-04-19/d3ebcc22-8f47-9eb9-903c-836d14c79dca/cat1.jpg",
      "x-oss-object-acl": "private",
      "x-oss-forbid-overwrite": "true",
      success_action_status: "200",
      "x-oss-content-type": "image/jpeg",
      file: fileSummary("cat1.jpg", "image/jpeg", 83558),
    }),
  },
  {
    path: "../recordings/kie_2079838932/wan-27-videoedit_297357185/recording.har",
    entryIndex: 0,
    expected: multipart({
      file: fileSummary("jump.mp4", "video/mp4", 1318021),
      uploadPath: "videos/test-uploads",
    }),
  },
  {
    path: "../recordings/kie_2079838932/bytedance-seedance-2-multimodal_1291051021/recording.har",
    entryIndex: 0,
    expected: multipart({
      file: fileSummary("cat1.jpg", "image/jpeg", 83558),
      uploadPath: "images/test-uploads",
    }),
  },
  {
    path: "../recordings/kie_2079838932/bytedance-seedance-2-multimodal_1291051021/recording.har",
    entryIndex: 1,
    expected: multipart({
      file: fileSummary("seedance-ref.mp4", "video/mp4", 74734),
      uploadPath: "videos/test-uploads",
    }),
  },
  {
    path: "../recordings/kie_2079838932/bytedance-seedance-2-multimodal_1291051021/recording.har",
    entryIndex: 2,
    expected: multipart({
      file: fileSummary("dialog.mp3", "audio/mpeg", 48317),
      uploadPath: "audio/test-uploads",
    }),
  },
  {
    path: "../recordings/kie_2079838932/bytedance-seedance-2-first-last-frame_2269386182/recording.har",
    entryIndex: 0,
    expected: multipart({
      file: fileSummary("cat1.jpg", "image/jpeg", 83558),
      uploadPath: "images/test-uploads",
    }),
  },
  {
    path: "../recordings/kie_2079838932/bytedance-seedance-2-first-last-frame_2269386182/recording.har",
    entryIndex: 1,
    expected: multipart({
      file: fileSummary("cat2.jpg", "image/jpeg", 227912),
      uploadPath: "images/test-uploads",
    }),
  },
  {
    path: "../recordings/kie_2079838932/bytedance-seedance-2-first-frame_1729742647/recording.har",
    entryIndex: 0,
    expected: multipart({
      file: fileSummary("cat1.jpg", "image/jpeg", 83558),
      uploadPath: "images/test-uploads",
    }),
  },
  {
    path: "../recordings/openai_3991279299/files-content_2411795472/recording.har",
    entryIndex: 0,
    expected: multipart({
      file: blobSummary("application/json", 18),
      purpose: "batch",
    }),
  },
  {
    path: "../recordings/openai_3991279299/transcribe-dialog_409608981/recording.har",
    entryIndex: 0,
    expected: multipart({
      file: blobSummary("audio/mp3", 48317),
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
      language: "en",
    }),
  },
  {
    path: "../recordings/openai_3991279299/transcribe-tone_3316906573/recording.har",
    entryIndex: 0,
    expected: multipart({
      file: blobSummary("audio/mp3", 2528),
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
    }),
  },
  {
    path: "../recordings/openai_3991279299/translate-tone_2581553320/recording.har",
    entryIndex: 0,
    expected: multipart({
      file: blobSummary("audio/mp3", 2528),
      model: "whisper-1",
      response_format: "json",
    }),
  },
  {
    path: "../recordings/xai_3613880225/files-content_2411795472/recording.har",
    entryIndex: 0,
    expected: multipart({
      file: fileSummary("content-test.json", "application/json", 27),
      purpose: "batch",
    }),
  },
  {
    path: "../recordings/xai_3613880225/collections-documents-add_396223839/recording.har",
    entryIndex: 1,
    expected: multipart({
      file: fileSummary("test-doc.txt", "text/plain", 21),
      purpose: "batch",
    }),
  },
  {
    path: "../recordings/xai_3613880225/collections-documents-delete_426912719/recording.har",
    entryIndex: 1,
    expected: multipart({
      file: fileSummary("test-del.txt", "text/plain", 25),
      purpose: "batch",
    }),
  },
  {
    path: "../recordings/xai_3613880225/collections-documents-batchget_2925998328/recording.har",
    entryIndex: 1,
    expected: multipart({
      file: fileSummary("doc1.txt", "text/plain", 9),
      purpose: "batch",
    }),
  },
  {
    path: "../recordings/xai_3613880225/collections-documents-batchget_2925998328/recording.har",
    entryIndex: 2,
    expected: multipart({
      file: fileSummary("doc2.txt", "text/plain", 9),
      purpose: "batch",
    }),
  },
];

const intentionalSummarylessFixtures: SummarylessFixture[] = [
  {
    path: "../recordings/b2_2402036085/object-core_2379895886/recording.har",
    entryIndex: 1,
    reason: "raw B2 object PUT body",
  },
  {
    path: "../recordings/b2_2402036085/real-asset-e2e_2913189355/recording.har",
    entryIndex: 0,
    reason: "raw B2 image PUT body",
  },
  {
    path: "../recordings/fal_2801268556/storage-upload-initiate_29504192/recording.har",
    entryIndex: 1,
    reason: "raw FAL signed-url image PUT body",
  },
  {
    path: "../recordings/s3_106018211/bucket-config_3411174552/recording.har",
    entryIndex: 2,
    reason: "raw S3 bucket CORS XML body",
  },
  {
    path: "../recordings/s3_106018211/bucket-config_3411174552/recording.har",
    entryIndex: 4,
    reason: "raw S3 bucket tagging XML body",
  },
  {
    path: "../recordings/s3_106018211/bucket-create-metadata-table-configuration_4088030758/recording.har",
    entryIndex: 0,
    reason: "raw S3 metadata table XML body",
  },
  {
    path: "../recordings/s3_106018211/bucket-put-abac_2545682793/recording.har",
    entryIndex: 0,
    reason: "raw S3 ABAC XML body",
  },
  {
    path: "../recordings/s3_106018211/bucket-put-accelerate-configuration_4191516392/recording.har",
    entryIndex: 0,
    reason: "raw S3 accelerate XML body",
  },
  {
    path: "../recordings/s3_106018211/bucket-put-intelligent-tiering_1061248874/recording.har",
    entryIndex: 0,
    reason: "raw S3 intelligent-tiering XML body",
  },
  {
    path: "../recordings/s3_106018211/bucket-put-lifecycle-legacy_652631378/recording.har",
    entryIndex: 0,
    reason: "raw S3 lifecycle XML body",
  },
  {
    path: "../recordings/s3_106018211/bucket-put-notification-legacy_1290942939/recording.har",
    entryIndex: 0,
    reason: "raw S3 notification XML body",
  },
  {
    path: "../recordings/s3_106018211/bulk-versioning_2486007404/recording.har",
    entryIndex: 0,
    reason: "raw S3 delete-objects XML body",
  },
  {
    path: "../recordings/s3_106018211/bulk-versioning_2486007404/recording.har",
    entryIndex: 3,
    reason: "raw S3 object PUT body",
  },
  {
    path: "../recordings/s3_106018211/bulk-versioning_2486007404/recording.har",
    entryIndex: 4,
    reason: "raw S3 object PUT body",
  },
  {
    path: "../recordings/s3_106018211/bulk-versioning_2486007404/recording.har",
    entryIndex: 5,
    reason: "raw S3 delete-objects XML body",
  },
  {
    path: "../recordings/s3_106018211/multipart-upload_2601292111/recording.har",
    entryIndex: 1,
    reason: "raw S3 multipart part body",
  },
  {
    path: "../recordings/s3_106018211/multipart-upload_2601292111/recording.har",
    entryIndex: 3,
    reason: "raw S3 multipart completion XML body",
  },
  {
    path: "../recordings/s3_106018211/multipart-upload_2601292111/recording.har",
    entryIndex: 7,
    reason: "raw S3 multipart completion XML body",
  },
  {
    path: "../recordings/s3_106018211/object-core_2379895886/recording.har",
    entryIndex: 1,
    reason: "raw S3 object PUT body",
  },
  {
    path: "../recordings/s3_106018211/object-governance_740119753/recording.har",
    entryIndex: 0,
    reason: "raw S3 object PUT body",
  },
  {
    path: "../recordings/s3_106018211/object-management_1494981478/recording.har",
    entryIndex: 0,
    reason: "raw S3 object PUT body",
  },
  {
    path: "../recordings/s3_106018211/object-management_1494981478/recording.har",
    entryIndex: 3,
    reason: "raw S3 object tagging XML body",
  },
  {
    path: "../recordings/youtube_3083192990/videos-insert_2365121445/recording.har",
    entryIndex: 0,
    reason: "multipart/related body mixes JSON metadata with media bytes",
  },
];

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
    fs.readFileSync(path.resolve(import.meta.dirname, relativePath), "utf8")
  ) as HarRecording;
}

function readFixtureEntry(fixture: {
  path: string;
  entryIndex: number;
}): HarEntry {
  const entry = readHar(fixture.path).log?.entries?.[fixture.entryIndex];
  expect(entry, `${fixture.path}#${fixture.entryIndex}`).toBeDefined();
  return entry as HarEntry;
}

function hasPostDataSummary(postData: HarPostData | undefined): boolean {
  if (typeof postData?.text === "string" && postData.text.length > 0) {
    return true;
  }
  return Array.isArray(postData?.params) && postData.params.length > 0;
}

function fixtureId(fixture: { path: string; entryIndex: number }): string {
  return `${fixture.path}#${fixture.entryIndex}`;
}

function pathId(filePath: string, entryIndex: number): string {
  const relative = path.relative(import.meta.dirname, filePath);
  return `${relative}#${entryIndex}`;
}

function collectEmptyNonFreeMediaPostDataIds(): string[] {
  const recordingsDir = path.resolve(import.meta.dirname, "../recordings");
  const ids: string[] = [];

  for (const filePath of collectHarFiles(recordingsDir)) {
    if (filePath.includes(`${path.sep}free-media-upload_`)) continue;

    const har = JSON.parse(fs.readFileSync(filePath, "utf8")) as HarRecording;
    for (const [index, entry] of (har.log?.entries ?? []).entries()) {
      const postData = entry.request?.postData;
      if (postData && !hasPostDataSummary(postData)) {
        ids.push(pathId(filePath, index));
      }
    }
  }

  return ids.sort();
}

describe("non-free-media upload HAR request bodies", () => {
  it("keeps sanitized multipart summaries for FormData upload fixtures", () => {
    for (const fixture of summarizedMultipartFixtures) {
      const entry = readFixtureEntry(fixture);
      const postData = entry.request?.postData;

      expect(postData?.mimeType, fixtureId(fixture)).toBe(
        "multipart/form-data"
      );
      expect(postData?.text, fixtureId(fixture)).toEqual(expect.any(String));
      expect(JSON.parse(postData?.text ?? ""), fixtureId(fixture)).toEqual(
        fixture.expected
      );
    }
  });

  it("keeps documented raw upload payloads summary-less", () => {
    for (const fixture of intentionalSummarylessFixtures) {
      const entry = readFixtureEntry(fixture);

      expect(fixture.reason.length, fixtureId(fixture)).toBeGreaterThan(0);
      expect(
        hasPostDataSummary(entry.request?.postData),
        fixtureId(fixture)
      ).toBe(false);
    }
  });

  it("has no untriaged empty postData entries outside free-media-upload", () => {
    expect(collectEmptyNonFreeMediaPostDataIds()).toEqual(
      intentionalSummarylessFixtures.map(fixtureId).sort()
    );
  });
});
