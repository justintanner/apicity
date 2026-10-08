import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GUARD_ONLY_REQUEST_HEADER_PLACEHOLDERS,
  PERSISTED_REQUEST_HEADER_PLACEHOLDERS as SHARED_PLACEHOLDERS,
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

  it("takes its names and placeholders from the table the harness applies", () => {
    // Re-exported, not copied: one object behind both imports.
    expect(PERSISTED_REQUEST_HEADER_PLACEHOLDERS).toBe(SHARED_PLACEHOLDERS);
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

  it("checks guard-only names the harness leaves as recorded", () => {
    const recording: PersistedHarRecording = {
      request: { headers: [{ name: "api-key", value: "raw api-key value" }] },
    };

    redactPersistedHarSecrets(recording);

    expect(recording.request?.headers).toEqual([
      { name: "api-key", value: "raw api-key value" },
    ]);
    expect(
      findUnredactedRequestSecrets({ log: { entries: [recording] } })
    ).toEqual([
      { entryIndex: 0, headerIndex: 0, name: "api-key", placeholder: "***" },
    ]);
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
