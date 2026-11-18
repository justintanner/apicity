import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GUARD_ONLY_REQUEST_HEADER_PLACEHOLDERS,
  PERSISTED_REQUEST_HEADER_PLACEHOLDERS as SHARED_PLACEHOLDERS,
  SIGNED_URL_QUERY_PARAMS,
  findLiveSignedUrlParams,
  findUnredactedRequestSecrets,
} from "../../scripts/lib/har-secrets.mjs";
import {
  PERSISTED_REQUEST_HEADER_PLACEHOLDERS,
  redactPersistedHarSecrets,
  type PersistedHarRecording,
} from "../harness";

// The harness redacts these request headers at record time, so a committed
// HAR can hold a live key only through a hand edit or a harness regression.
// When ac-0hyt0n's review planted both faults below in a recording, a literal
// `ci:local` failed on neither (ac-1zmydw). The names and placeholders come
// from tests/harness.ts, which re-exports the table it applies; `api-key` is
// checked as well without the harness redacting it.

interface HarHeader {
  name?: string;
  value?: string;
}

interface HarEntry {
  request?: {
    headers?: HarHeader[];
  };
}

interface HarRecording {
  log?: {
    entries?: HarEntry[];
  };
}

interface Leak {
  entryIndex: number;
  name: string;
  placeholder: string;
}

const GUARDED_PLACEHOLDERS: ReadonlyArray<[string, string]> = [
  ...Object.entries(PERSISTED_REQUEST_HEADER_PLACEHOLDERS),
  ...Object.entries(GUARD_ONLY_REQUEST_HEADER_PLACEHOLDERS),
];
const GUARDED_NAMES = new Set(GUARDED_PLACEHOLDERS.map(([name]) => name));

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function listRecordingFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listRecordingFiles(fullPath);
    return entry.name.endsWith(".har") ? [fullPath] : [];
  });
}

function harWithEntries(...entries: HarHeader[][]): HarRecording {
  return {
    log: { entries: entries.map((headers) => ({ request: { headers } })) },
  };
}

function describeLeak(file: string, leak: Leak): string {
  return (
    `${file}: entry ${leak.entryIndex} request header ${leak.name} ` +
    `is not ${JSON.stringify(leak.placeholder)}`
  );
}

describe("HAR request secrets", () => {
  it("keeps every committed recording's request secrets redacted", () => {
    const recordingsRoot = path.join(process.cwd(), "tests", "recordings");
    const files = listRecordingFiles(recordingsRoot);
    const leaks: string[] = [];
    let guardedHeaders = 0;

    for (const file of files) {
      const har = JSON.parse(readFileSync(file, "utf8")) as HarRecording;
      const relativePath = path.relative(process.cwd(), file);

      for (const leak of findUnredactedRequestSecrets(har)) {
        leaks.push(describeLeak(relativePath, leak));
      }
      for (const entry of har.log?.entries ?? []) {
        for (const header of entry.request?.headers ?? []) {
          if (GUARDED_NAMES.has(header.name?.toLowerCase() ?? "")) {
            guardedHeaders += 1;
          }
        }
      }
    }

    // A walk that reached no recording, or no guarded header, would pass
    // without having checked anything.
    expect(files.length).toBeGreaterThan(0);
    expect(guardedHeaders).toBeGreaterThan(0);
    expect(leaks).toEqual([]);
  });

  // The harness removes signed-URL parameters at record time, so a committed
  // HAR or fixture holds a live one only through a hand edit, a file written
  // outside the harness, or a scrubber regression. Before ac-rm9wz4 widened
  // the list, an ElevenLabs history response kept two GCS signed URLs.
  it("keeps signed-URL credentials out of every committed HAR and text fixture", () => {
    const textFile = /\.(har|json|jsonl|md|ts|tsv|golden|sdp|txt|html)$/;
    const files = ["recordings", "failures", "fixtures"].flatMap((dir) =>
      listFiles(path.join(process.cwd(), "tests", dir)).filter((file) =>
        textFile.test(file)
      )
    );
    const leaks: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      let document: unknown = text;
      try {
        document = JSON.parse(text);
      } catch {
        // Not JSON: scan the text itself.
      }
      for (const leak of findLiveSignedUrlParams(document)) {
        leaks.push(
          `${path.relative(process.cwd(), file)}: ${leak.path} holds a value for ${leak.name}`
        );
      }
    }
    expect(
      files.filter((file) => file.endsWith(".har")).length
    ).toBeGreaterThan(1000);
    expect(leaks).toEqual([]);
  });

  it("takes its names and placeholders from the table the harness applies", () => {
    // Scripts use the checked gen:shared copy of the shipped table.
    expect(PERSISTED_REQUEST_HEADER_PLACEHOLDERS).toEqual(SHARED_PLACEHOLDERS);
    expect(Object.isFrozen(PERSISTED_REQUEST_HEADER_PLACEHOLDERS)).toBe(true);

    // What the harness persists for every table header is exactly what the
    // guard accepts.
    const names = Object.keys(PERSISTED_REQUEST_HEADER_PLACEHOLDERS);
    const recording: PersistedHarRecording = {
      request: {
        headers: names.map((name) => ({
          name: name.toUpperCase(),
          value: `raw ${name} value`,
        })),
      },
    };

    redactPersistedHarSecrets(recording);

    expect(recording.request?.headers).toEqual(
      Object.entries(PERSISTED_REQUEST_HEADER_PLACEHOLDERS).map(
        ([name, placeholder]) => ({
          name: name.toUpperCase(),
          value: placeholder,
        })
      )
    );
    expect(
      findUnredactedRequestSecrets({ log: { entries: [recording] } })
    ).toEqual([]);
  });

  it("guards at least every header ac-1zmydw names", () => {
    // The table is the harness's, so this file never restates it. These are
    // the names the bead requires: a floor, so dropping one from the table
    // cannot quietly narrow the guard.
    for (const name of [
      "authorization",
      "x-api-key",
      "xi-api-key",
      "x-goog-api-key",
      "api-key",
    ]) {
      expect(GUARDED_NAMES.has(name), name).toBe(true);
    }
  });

  it("scrubs the formerly guard-only api-key header", () => {
    const recording: PersistedHarRecording = {
      request: { headers: [{ name: "api-key", value: "raw api-key value" }] },
    };

    redactPersistedHarSecrets(recording);

    expect(recording.request?.headers).toEqual([
      { name: "api-key", value: "***" },
    ]);
    expect(
      findUnredactedRequestSecrets({ log: { entries: [recording] } })
    ).toEqual([]);
  });

  it("fails a live authorization value, naming the entry and header", () => {
    const findings = findUnredactedRequestSecrets(
      harWithEntries(
        [{ name: "authorization", value: "Bearer ***" }],
        [
          { name: "content-type", value: "application/json" },
          { name: "authorization", value: "Bearer kie0123456789abcdefLIVE" },
        ]
      )
    );

    expect(findings).toEqual([
      {
        entryIndex: 1,
        headerIndex: 1,
        name: "authorization",
        placeholder: "Bearer ***",
      },
    ]);
    // The report names the header; it never repeats the key.
    expect(JSON.stringify(findings)).not.toContain("LIVE");
  });

  it("fails an extra provider-key header beside a redacted one", () => {
    const findings = findUnredactedRequestSecrets(
      harWithEntries([
        { name: "authorization", value: "Bearer ***" },
        { name: "x-goog-api-key", value: "real-looking-value" },
      ])
    );

    expect(findings).toEqual([
      {
        entryIndex: 0,
        headerIndex: 1,
        name: "x-goog-api-key",
        placeholder: "***",
      },
    ]);
  });

  it.each(GUARDED_PLACEHOLDERS)(
    "holds %s to exactly %s in any letter case",
    (name, placeholder) => {
      const upper = name.toUpperCase();

      expect(
        findUnredactedRequestSecrets(
          harWithEntries([{ name: upper, value: placeholder }])
        )
      ).toEqual([]);
      for (const value of [`${placeholder} `, "***x", "", undefined]) {
        expect(
          findUnredactedRequestSecrets(
            harWithEntries([{ name: upper, value }])
          ),
          JSON.stringify(value)
        ).toEqual([
          { entryIndex: 0, headerIndex: 0, name: upper, placeholder },
        ]);
      }
    }
  );

  it("ignores other headers and recordings without request headers", () => {
    expect(
      findUnredactedRequestSecrets(
        harWithEntries([
          { name: "content-type", value: "application/json" },
          { name: "x-amz-date", value: "20261007T000000Z" },
          { name: "constructor", value: "Object" },
          { value: "unnamed" },
        ])
      )
    ).toEqual([]);
    expect(findUnredactedRequestSecrets({})).toEqual([]);
    expect(findUnredactedRequestSecrets(null)).toEqual([]);
    expect(
      findUnredactedRequestSecrets({ log: { entries: [{}, { request: {} }] } })
    ).toEqual([]);
  });
});

describe("new shipped scrubber URL and authorization rules", () => {
  it("redacts thesportsdb path credentials without touching unrelated paths", () => {
    const recording = {
      request: {
        url: "https://www.thesportsdb.com/api/v1/json/private/searchteams.php?t=Arsenal",
      },
    };
    redactPersistedHarSecrets(recording);
    expect(recording.request.url).toBe(
      "https://www.thesportsdb.com/api/v1/json/***/searchteams.php?t=Arsenal"
    );
  });
  it.each([
    "X-Amz-Signature",
    "X-Amz-Credential",
    "X-Amz-Security-Token",
    "x-amz-security-token",
    "X-AMZ-SECURITY-TOKEN",
    "X%2DAmz%2DSecurity%2DToken",
    "OSSAccessKeyId",
    "Signature",
  ])("removes signed query %s", (key) => {
    const recording = {
      request: { url: `https://bucket.example/object?${key}=private&keep=one` },
    };
    redactPersistedHarSecrets(recording);
    expect(recording.request.url).toBe(
      "https://bucket.example/object?keep=one"
    );
  });
  // Synthetic presigned URLs: every signed value is a placeholder.
  const presigned =
    "https://bucket.example/out/video.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256" +
    "&X-Amz-Credential=placeholder-credential" +
    "&X-Amz-Security-Token=placeholder-token" +
    "&X-Amz-Signature=placeholder-signature&X-Amz-Expires=3600";
  const scrubbed =
    "https://bucket.example/out/video.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600";
  it("removes presigned credentials from URLs nested in a JSON response", () => {
    const recording = {
      response: {
        content: {
          text: JSON.stringify({
            task: { status: "succeeded", content: { url: presigned } },
            outputs: [{ video: { url: presigned } }],
          }),
        },
      },
    };
    redactPersistedHarSecrets(recording);
    const text = recording.response.content.text;
    expect(text).not.toMatch(/placeholder-|Security-Token|Signature=/i);
    expect(JSON.parse(text)).toEqual({
      task: { status: "succeeded", content: { url: scrubbed } },
      outputs: [{ video: { url: scrubbed } }],
    });
  });
  it("removes presigned credentials when JSON escapes & as \\u0026", () => {
    const escaped = presigned.replaceAll("&", "\\u0026");
    const recording = {
      response: { content: { text: `{"url":"${escaped}","n":1}` } },
    };
    redactPersistedHarSecrets(recording);
    expect(recording.response.content.text).toBe(
      `{"url":"${scrubbed.replaceAll("&", "\\u0026")}","n":1}`
    );
    expect(JSON.parse(recording.response.content.text).url).toBe(scrubbed);
  });
  it("removes presigned credentials from a percent-encoded nested URL", () => {
    const recording = {
      response: {
        content: {
          text: JSON.stringify({
            player: `https://cdn.example/watch?src=${encodeURIComponent(presigned)}&page=2`,
          }),
        },
      },
    };
    redactPersistedHarSecrets(recording);
    expect(JSON.parse(recording.response.content.text).player).toBe(
      `https://cdn.example/watch?src=${encodeURIComponent(scrubbed)}&page=2`
    );
  });
  it("drops signed parameters from the recorded queryString as well", () => {
    const recording = {
      request: {
        url: presigned,
        queryString: [...new URL(presigned).searchParams].map(
          ([name, value]) => ({ name, value })
        ),
      },
    };
    redactPersistedHarSecrets(recording);
    expect(recording.request.url).toBe(scrubbed);
    expect(recording.request.queryString).toEqual([
      { name: "X-Amz-Algorithm", value: "AWS4-HMAC-SHA256" },
      { name: "X-Amz-Expires", value: "3600" },
    ]);
  });
  it("keeps the exact text of URLs that carry no signed parameter", () => {
    const text =
      '{"a":"https://bucket.example/a?keep=1\\u0026also=2",' +
      JSON.stringify({
        b: `https://cdn.example/watch?src=${encodeURIComponent("https://x.example/b?keep=1")}`,
        c: "HTTPS://Example.COM/c?Keep=1",
      }).slice(1);
    expect(JSON.parse(text).a).toBe("https://bucket.example/a?keep=1&also=2");
    const query = [{ name: "keep", value: "https://x.example/?keep=1" }];
    const recording = {
      request: { url: "https://example.com/?keep=1", queryString: query },
      response: { content: { text } },
    };
    redactPersistedHarSecrets(recording);
    expect(recording.response.content.text).toBe(text);
    expect(recording.request.queryString).toBe(query);
  });
  // One synthetic presigned URL per storage family, in the family's documented
  // spelling. Every credential value is a placeholder; the unsigned parameters
  // must survive.
  const families: [string, string, string][] = [
    [
      "AWS SigV4",
      "https://bucket.s3.us-east-1.amazonaws.com/out.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=placeholder-credential&X-Amz-Date=20261118T000000Z&X-Amz-Expires=3600&X-Amz-Security-Token=placeholder-token&X-Amz-SignedHeaders=host&X-Amz-Signature=placeholder-signature",
      "https://bucket.s3.us-east-1.amazonaws.com/out.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20261118T000000Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host",
    ],
    [
      "Alibaba Cloud OSS V1",
      "https://bucket.oss-cn-hangzhou.aliyuncs.com/out.mp4?OSSAccessKeyId=placeholder-key-id&Expires=1794999999&Signature=placeholder-signature&security-token=placeholder-token",
      "https://bucket.oss-cn-hangzhou.aliyuncs.com/out.mp4?Expires=1794999999",
    ],
    [
      "Alibaba Cloud OSS V4",
      "https://bucket.oss-cn-hangzhou.aliyuncs.com/out.mp4?x-oss-signature-version=OSS4-HMAC-SHA256&x-oss-credential=placeholder-credential&x-oss-date=20261118T000000Z&x-oss-expires=3600&x-oss-security-token=placeholder-token&x-oss-signature=placeholder-signature",
      "https://bucket.oss-cn-hangzhou.aliyuncs.com/out.mp4?x-oss-signature-version=OSS4-HMAC-SHA256&x-oss-date=20261118T000000Z&x-oss-expires=3600",
    ],
    [
      "Volcengine TOS",
      "https://bucket.tos-cn-beijing.volces.com/out.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=placeholder-credential&X-Tos-Date=20261118T000000Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Signature=placeholder-signature&X-Tos-Security-Token=placeholder-token",
      "https://bucket.tos-cn-beijing.volces.com/out.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Date=20261118T000000Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host",
    ],
    [
      "Google Cloud Storage V4",
      "https://storage.googleapis.com/bucket/out.mp4?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=placeholder-credential&X-Goog-Date=20261118T000000Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host&X-Goog-Signature=placeholder-signature",
      "https://storage.googleapis.com/bucket/out.mp4?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Date=20261118T000000Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host",
    ],
  ];
  it("lists exactly the documented credential parameters of each family", () => {
    expect(SIGNED_URL_QUERY_PARAMS).toEqual({
      aws: ["x-amz-credential", "x-amz-signature", "x-amz-security-token"],
      ossV1: ["ossaccesskeyid", "signature", "security-token"],
      ossV4: ["x-oss-credential", "x-oss-signature", "x-oss-security-token"],
      tos: ["x-tos-credential", "x-tos-signature", "x-tos-security-token"],
      gcs: ["x-goog-credential", "x-goog-signature"],
    });
  });
  it.each(families)(
    "removes %s presigned credentials from a nested response URL",
    (_family, presignedUrl, unsignedUrl) => {
      const body = { data: { outputs: [{ url: presignedUrl }] } };
      const recording = {
        request: {
          url: presignedUrl,
          queryString: [...new URL(presignedUrl).searchParams].map(
            ([name, value]) => ({ name, value })
          ),
        },
        response: { content: { text: JSON.stringify(body) } },
      };
      const names = new URL(presignedUrl).searchParams;
      const signed = [...names.keys()].filter((name) =>
        /placeholder/.test(names.get(name)!)
      );
      expect(
        findLiveSignedUrlParams(recording).map((leak) => leak.name)
      ).toEqual(expect.arrayContaining(signed));

      redactPersistedHarSecrets(recording);
      expect(recording.request.url).toBe(unsignedUrl);
      expect(JSON.parse(recording.response.content.text)).toEqual({
        data: { outputs: [{ url: unsignedUrl }] },
      });
      expect(JSON.stringify(recording)).not.toMatch(/placeholder/);
      expect(findLiveSignedUrlParams(recording)).toEqual([]);
    }
  );
  it("does not report placeholder or empty signed-URL values", () => {
    expect(
      findLiveSignedUrlParams({
        url: "https://bucket.example/a?X-Amz-Signature=***&X-Goog-Signature=",
        queryString: [{ name: "x-oss-security-token", value: "***" }],
      })
    ).toEqual([]);
  });
  it("preserves fal Key scheme and accepts both historical placeholders", () => {
    const recording = {
      request: { headers: [{ name: "Authorization", value: "Key private" }] },
    };
    redactPersistedHarSecrets(recording);
    expect(recording.request.headers[0].value).toBe("Key ***");
    expect(
      findUnredactedRequestSecrets({ log: { entries: [recording] } })
    ).toEqual([]);
    recording.request.headers[0].value = "Bearer ***";
    expect(
      findUnredactedRequestSecrets({ log: { entries: [recording] } })
    ).toEqual([]);
  });
});
