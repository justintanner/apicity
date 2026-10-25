import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  symlinkSync,
  chmodSync,
  copyFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { z } from "zod";
import { runHarCommand } from "../../packages/cli/src/har";
import {
  flattenIssues,
  validate,
  unknownKeys,
} from "../../packages/cli/src/har-report-schema";
import { normalizeMessage } from "../../packages/cli/src/har-report-values";
import { zodToJsonSchema } from "../../packages/cli/src/schema";
import type { HarReport } from "../../packages/cli/src/har-report-types";
import type { Har } from "@apicity/har";
const root = "tests/fixtures/har-report";
let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "har-report-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});
async function run(args: string[], json = true) {
  let output = "";
  const exit = await runHarCommand(
    ["report", ...args, ...(json ? ["--json"] : [])],
    {
      out: (s) => {
        output += s + "\n";
      },
      err: (s) => {
        throw new Error(s);
      },
    },
    { stdoutIsTTY: false }
  );
  return {
    output,
    exit,
    data: json ? (JSON.parse(output) as { data: HarReport }).data : null,
  };
}
function fixture(name = "c1") {
  return JSON.parse(readFileSync(`${root}/corpus/${name}.har`, "utf8")) as Har;
}
function save(har: Har, name = "input.har") {
  const file = join(dir, name);
  writeFileSync(file, JSON.stringify(har));
  return file;
}
it("attributes annotated uploads only to their call and keeps legacy entries separate", async () => {
  const r = (await run([`${root}/corpus`, "--no-baseline"])).data!;
  expect(r.endpoints[1].volume.exchanges).toEqual({
    primary: 1,
    auxiliary: 2,
    local: 0,
  });
  expect(r.endpoints[1].volume.auxiliaryTargets).toEqual([
    { target: "PUT v3b.fal.media/files/upload/<id>", count: 1 },
    { target: "fal POST storage.upload.initiate", count: 1 },
  ]);
  expect(r.endpoints[2].volume.callsBySource).toEqual({
    annotated: 2,
    legacy: 2,
  });
  expect(r.endpoints[2].localFailures.groups).toHaveLength(1);
  expect(r.unmatched).toEqual([
    {
      method: "GET",
      host: "cdn.example.invalid",
      path: "/assets/<id>/video.mp4",
      providerHint: null,
      count: 1,
    },
  ]);
});
it("uses sole-entry fallback and reports method ambiguity", async () => {
  const h = fixture();
  h.log.entries[0].request.url = "https://unknown.invalid/custom";
  let r = (await run([save(h), "--no-baseline"])).data!;
  expect(r.endpoints[0].volume.matchedBy.soleEntry).toBe(1);
  h.log._apicity!.provider = "openai";
  h.log._apicity!.endpoint = "v1.files";
  h.log.entries = [];
  r = (await run([save(h), "--no-baseline"])).data!;
  expect(r.unresolvedCalls[0]).toMatchObject({
    provider: "openai",
    endpoint: "v1.files",
    reason: "method-ambiguous",
  });
});
it("counts malformed/local entries and unreadable files, deduplicates real paths, ignores hidden files and directory symlinks", async () => {
  const h = fixture();
  h.log.entries.push(null as unknown as Har["log"]["entries"][number]);
  save(h);
  writeFileSync(join(dir, "bad.har"), "{");
  writeFileSync(join(dir, "not.har"), "{}");
  writeFileSync(join(dir, ".hidden.har"), "{");
  mkdirSync(join(dir, "node_modules"));
  writeFileSync(join(dir, "node_modules/a.har"), "{");
  symlinkSync(dir, join(dir, "link"));
  const r = (await run([dir, join(dir, "input.har"), "--no-baseline"])).data!;
  expect(r.inputs).toMatchObject({
    files: 1,
    duplicateFiles: 1,
    skipped: { malformedEntries: 1 },
    unreadable: [
      { file: join(dir, "bad.har"), reason: "invalid-json" },
      { file: join(dir, "not.har"), reason: "not-a-har" },
    ],
  });
  const legacy = fixture("c5");
  delete legacy.log._apicity;
  expect(
    (await run([save(legacy), "--no-baseline"])).data!.inputs.skipped
      .localEntries
  ).toBe(1);
});
it.skipIf(process.getuid?.() === 0)(
  "reports read errors without aborting a readable corpus",
  async () => {
    save(fixture());
    const file = save(fixture(), "unreadable.har");
    chmodSync(file, 0);
    try {
      expect(
        (await run([dir, "--no-baseline"])).data!.inputs.unreadable
      ).toEqual([{ file, reason: "read-error" }]);
    } finally {
      chmodSync(file, 0o600);
    }
  }
);
it("applies inclusive timestamps and provider/endpoint filters", async () => {
  const args = [`${root}/corpus`, "--no-baseline"];
  expect(
    (await run([...args, "--since", "2026-10-24T00:00:00Z"])).data!.summary
      .calls
  ).toBe(16);
  expect(
    (await run([...args, "--since", "2026-10-25"])).data!.inputs.skipped
      .beforeSince
  ).toBe(17);
  const h = fixture();
  h.log._apicity!.startedAt = "invalid";
  expect(
    (await run([save(h), "--since", "2026-10-01", "--no-baseline"])).data!
      .inputs.skipped.noTimestamp
  ).toBe(1);
  const r = (
    await run([
      ...args,
      "--provider",
      "kie",
      "--endpoint",
      "api.v1.jobs.createTask",
    ])
  ).data!;
  expect(r.endpoints).toHaveLength(3);
  expect(r.summary.calls).toBe(8);
  expect(r.unmatched).toEqual([]);
  expect(r.unresolvedCalls).toEqual([]);
});
it("excludes input files from an explicit baseline and supports baseline-free installed use", async () => {
  const h = save(fixture());
  const r = (await run([dir, "--baseline", dir])).data!;
  expect(r.baseline).toMatchObject({ source: "flag", files: 0, responses: 0 });
  // Resolve the default baseline in a one-file checkout layout: scanning the
  // committed corpus here outran the 30 s timeout under ci:local load. The
  // smoke test pins the repository-root default under its own timeout.
  const repo = join(dir, "repo");
  mkdirSync(join(repo, "tests/recordings"), { recursive: true });
  mkdirSync(join(repo, "scripts"));
  copyFileSync(
    `${root}/baseline/b1.har`,
    join(repo, "tests/recordings/b1.har")
  );
  copyFileSync(
    "scripts/endpoint-docs.tsv",
    join(repo, "scripts/endpoint-docs.tsv")
  );
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    expect((await run([h])).data!.baseline.source).toBe("none");
    process.chdir(repo);
    expect((await run([h])).data!.baseline).toMatchObject({
      source: "default",
      path: "tests/recordings",
      files: 1,
    });
  } finally {
    process.chdir(cwd);
  }
});
it("prints markdown even to a non-terminal and validates usage/missing inputs", async () => {
  expect(
    (await run([`${root}/corpus/c1.har`, "--no-baseline"], false)).output
  ).toMatch(/^# apicity har report\n/);
  for (const args of [
    ["--quiet"],
    ["--since", "bad"],
    ["--provider", "unknown"],
    ["--baseline"],
    ["--baseline", dir, "--no-baseline"],
  ])
    await expect(run([`${root}/corpus/c1.har`, ...args])).rejects.toMatchObject(
      { code: "usage" }
    );
  await expect(run([join(dir, "missing")])).rejects.toMatchObject({
    code: "not_found",
  });
  await expect(run([dir])).rejects.toMatchObject({ code: "not_found" });
});
it("prefixes nested union paths and ignores captured media placeholders", () => {
  const schema = z.object({
    a: z.object({
      b: z.union([
        z.object({ n: z.number() }),
        z.object({ s: z.string(), extra: z.string() }),
      ]),
    }),
  });
  const body = { a: { b: { n: "wrong" } } };
  const parsed = schema.safeParse(body);
  expect(parsed.success).toBe(false);
  if (!parsed.success)
    expect(
      flattenIssues(parsed.error.issues, {
        option: -1,
        optionCount: 0,
        unknownVariant: false,
      })[0].path
    ).toEqual(["a", "b", "n"]);
  const media = z.object({ url: z.url() });
  const result = validate(
    {
      safe: media,
      json: zodToJsonSchema(media),
      status: "ok",
      variantKey: null,
    },
    { url: "<inline image/png data URL — replace with a real URL or upload>" },
    null
  );
  expect(result).toMatchObject({ accepted: true, placeholders: 1, issues: [] });
  expect(
    unknownKeys(
      { items: [{ known: 1, extra: true }], free: { anything: true } },
      {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: { known: { type: "number" } },
            },
          },
          free: { type: "object", additionalProperties: {} },
        },
      }
    )
  ).toEqual(["items[].extra"]);
});
it("normalizes message identifiers in the specified order", () => {
  expect(
    normalizeMessage(
      "  task 8f14e45fceea167a at https://a.invalid/123 key abc123def456ghi7 value 12\nfailed "
    )
  ).toBe("task <id> at <url> key <id> value <n> failed");
  expect(normalizeMessage("id 123e4567-e89b-12d3-a456-426614174000")).toBe(
    "id <id>"
  );
  expect(normalizeMessage("z".repeat(400))).toHaveLength(300);
});

it("separates provider payload failures from server/auth/network and later call failures", async () => {
  const h = fixture();
  h.log.entries[0].response.status = 500;
  h.log.entries[0].response.content.text = JSON.stringify({
    message: "Server failed",
    code: 500,
  });
  let r = (await run([save(h), "--no-baseline"])).data!.endpoints[0];
  expect(r.providerErrors.groups[0].payloadRelevant).toBe(false);
  expect(r.schemaTooLoose.checked).toBe(0);
  h.log.entries[0].response.status = 200;
  h.log.entries[0].response.content.text = JSON.stringify({ code: 200 });
  h.log._apicity!.error = {
    name: "Error",
    message: "Failed later",
    status: 422,
    code: "later",
  };
  r = (await run([save(h), "--no-baseline"])).data!.endpoints[0];
  expect(r.providerErrors.groups[0]).toMatchObject({
    source: "call-error",
    code: "later",
    message: "Failed later",
  });
  expect(r.schemaTooLoose.checked).toBe(0);
  h.log.entries[0].response.status = 0;
  h.log._apicity!.outcome = "network_error";
  r = (await run([save(h), "--no-baseline"])).data!.endpoints[0];
  expect(r.providerErrors.groups).toEqual([]);
});
it("scrubs request secrets and bounds samples before report output", async () => {
  const h = fixture();
  const data = JSON.parse(h.log.entries[0].request.postData!.text!) as Record<
    string,
    unknown
  >;
  data.api_key = "fixture-secret-do-not-emit";
  data.description = "z".repeat(500);
  h.log.entries[0].request.postData!.text = JSON.stringify(data);
  const r = await run([save(h), "--no-baseline"]);
  expect(r.output).not.toContain("fixture-secret-do-not-emit");
  expect(r.output).toContain("truncated 500 chars");
});
it("ignores optional baseline keys and excludes business failures from drift", async () => {
  const h = fixture("c3");
  h.log.entries = h.log.entries.slice(0, 1);
  h.log.entries[0].response.content.text = JSON.stringify({ stable: 1 });
  const baseline = fixture("c3");
  baseline.log.entries = baseline.log.entries.slice(0, 2);
  baseline.log.entries[0].response.content.text = JSON.stringify({
    stable: 1,
    optional: true,
  });
  baseline.log.entries[1].response.content.text = JSON.stringify({ stable: 2 });
  const input = save(h);
  const base = save(baseline, "base.har");
  const r = (await run([input, "--baseline", base])).data!.endpoints[0];
  expect(r.responseDrift).toMatchObject({
    available: true,
    newKeys: [],
    missingKeys: [],
    typeChanges: [],
  });
});

it("preserves the first directory argument spelling in report file paths", async () => {
  const r = (await run(["./tests/fixtures/har-report/corpus", "--no-baseline"]))
    .data!;
  expect(r.inputs.unreadable[0].file).toBe(
    "./tests/fixtures/har-report/corpus/c9.har"
  );
  expect(r.endpoints[2].providerErrors.groups[0].sample.file).toBe(
    "./tests/fixtures/har-report/corpus/c1.har"
  );
});

it("does not borrow a directory provider hint for unresolved annotated calls", async () => {
  const h = fixture("c8");
  h.log.entries[0].request.url =
    "https://unknown.invalid/kling/v4/text-to-video";
  h.log.entries[0].request.method = "POST";
  mkdirSync(join(dir, "fal_123"));
  const r = (await run([save(h, "fal_123/input.har"), "--no-baseline"])).data!;
  expect(r.endpoints).toEqual([]);
  expect(r.unmatched[0].providerHint).toBeNull();
  expect(r.unresolvedCalls[0].reason).toBe("not-in-catalog");
});
