import { afterAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  auditFalCredentialWiring,
  classifyHosts,
  credentialForExpression,
  CREDENTIAL_ENV,
  FAL_HOST_CREDENTIALS,
  listHarFiles,
  resolveFalRecordingsDir,
  scanFalCallSites,
} from "../../scripts/lib/fal-credential-hosts.mjs";
import { normalizeName } from "../../scripts/lib/recording-names.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

// fal splits its surface across two credentials: `api.fal.ai` needs
// FAL_ADMIN_API_KEY, the inference and storage hosts need FAL_API_KEY. Replay
// never contacts fal, so a miswired apiKey passes every gate here and only
// fails the next dev:record — against a paid account, after the mistake has
// been committed. This guard is what makes that a gate failure instead
// (ac-wt8fzl).
//
// The filename is deliberately provider-NEUTRAL. A tests/unit/fal-*.test.ts
// name would be auto-selected by `test:provider fal` and de-duplicated out of
// the cross-cutting run for the fal scope; a neutral name means the
// CROSS_CUTTING_TESTS entry is what runs it at all.

// Synthetic fixture sources must never spell the setup-call token followed by
// an open paren anywhere in this file, comments included: it lives inside
// `tests/**`, so both static scanners that walk that tree — this guard and
// `scripts/check-orphan-recordings.mjs` — would read the fixtures as real call
// sites and report recordings that do not exist. Building each fixture through
// `call()` keeps the token from ever appearing contiguously in the committed
// source, which is why the name is assembled from two halves below.
const SETUP = "setupPoll" + "y";
const call = (variant: string, arg: string) => `${SETUP}${variant}(${arg})`;
const KEY = (name: string) => `apiKey: process.env.${name} ?? "k",`;

const recordingsRoot = path.join(repoRoot, "tests", "recordings");
const testsDir = path.join(repoRoot, "tests");

const temporaryDirs: string[] = [];

function synthetic(files: Record<string, string>): string {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "apicity-fal-cred-"))
  );
  temporaryDirs.push(root);
  for (const [name, source] of Object.entries(files)) {
    const full = path.join(root, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, source);
  }
  return root;
}

afterAll(() => {
  for (const dir of temporaryDirs)
    fs.rmSync(dir, { recursive: true, force: true });
});

describe("fal credential wiring — committed corpus", () => {
  it("passes with every recording mapped and correctly wired", () => {
    const result = auditFalCredentialWiring({ recordingsRoot, testsDir });

    // Print rather than pin: hardcoding today's counts would turn every new
    // fal recording into a spurious failure.
    console.log(
      `fal credential wiring: ${result.summary.total} recordings ` +
        `(${result.summary.admin} admin, ${result.summary.generation} generation)`
    );

    expect(result.failures, result.failures.join("\n")).toEqual([]);

    const falDir = resolveFalRecordingsDir(recordingsRoot);
    expect(result.summary.total).toBe(listHarFiles(falDir).length);
    expect(result.summary.total).toBeGreaterThan(0);
    expect(result.summary.admin).toBeGreaterThan(0);
    expect(result.summary.generation).toBeGreaterThan(0);
    expect(result.summary.admin + result.summary.generation).toBe(
      result.summary.total
    );
  });

  it("maps every recording to at least one call site", () => {
    const falDir = resolveFalRecordingsDir(recordingsRoot);
    const { sites } = scanFalCallSites(testsDir);
    const unmapped = listHarFiles(falDir)
      .map(
        (har) =>
          "fal/" +
          path
            .relative(falDir, path.dirname(har))
            .split(path.sep)
            .map((segment) => segment.replace(/_\d+$/, ""))
            .join("/")
      )
      .filter((slug) => !sites.has(slug));
    expect(unmapped).toEqual([]);
  });

  it("resolves the fal directory by prefix, not by a pinned hash", () => {
    const dir = resolveFalRecordingsDir(recordingsRoot);
    expect(path.basename(dir)).toMatch(/^fal_\d+$/);
  });

  it("throws rather than silently checking nothing", () => {
    expect(() => resolveFalRecordingsDir(synthetic({}))).toThrow(/found 0/);
    const twoDirs = synthetic({
      "fal_1/a/recording.har": "{}",
      "fal_2/a/recording.har": "{}",
    });
    expect(() => resolveFalRecordingsDir(twoDirs)).toThrow(/found 2/);
    const empty = synthetic({ "fal_1/placeholder.txt": "" });
    expect(() => resolveFalRecordingsDir(empty)).toThrow(/no recording.har/);
  });
});

describe("host classification", () => {
  it("classifies each table host", () => {
    for (const [host, credential] of Object.entries(FAL_HOST_CREDENTIALS)) {
      const result = classifyHosts([host]);
      expect(result.ok, host).toBe(true);
      if (!result.ok) throw new Error("unreachable");
      expect(result.credential).toBe(credential);
    }
    expect(CREDENTIAL_ENV.admin).toBe("FAL_ADMIN_API_KEY");
    expect(CREDENTIAL_ENV.generation).toBe("FAL_API_KEY");
  });

  it("fails an unknown host and names it", () => {
    const result = classifyHosts(["cdn.fal.ai"]);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.reason).toBe("unknown-host");
    expect(result.host).toBe("cdn.fal.ai");
  });

  it("fails a genuine mix of credential classes", () => {
    const result = classifyHosts(["api.fal.ai", "fal.run"]);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.reason).toBe("mixed-classes");
  });

  it("accepts a two-host generation recording", () => {
    // storage-upload-initiate legitimately touches both.
    const result = classifyHosts(["rest.fal.ai", "v3b.fal.media"]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.credential).toBe("generation");
  });
});

describe("credential expressions", () => {
  it("reads the admin name before the generation name", () => {
    expect(
      credentialForExpression('process.env.FAL_ADMIN_API_KEY ?? "x"')
    ).toBe("admin");
    expect(credentialForExpression('process.env.FAL_API_KEY ?? "x"')).toBe(
      "generation"
    );
    expect(credentialForExpression('"fal-test-key"')).toBeNull();
  });
});

describe("slug normalization matches recordingExists()", () => {
  it("collapses dots per segment and strips hash suffixes", () => {
    expect(normalizeName("fal/gpt-image-1.5")).toBe("fal/gpt-image-1-5");
    expect(normalizeName("fal/gpt-image-1.5-edit")).toBe(
      "fal/gpt-image-1-5-edit"
    );
  });
});

describe("call-site scanning on synthetic files", () => {
  const har = (host: string, name: string) =>
    JSON.stringify({
      log: {
        _recordingName: name,
        entries: [{ request: { url: `https://${host}/x` } }],
      },
    });

  it("recognizes both setupPolly variants", () => {
    const root = synthetic({
      "integration/a.test.ts": `${call("", '"fal/alpha"')};\n${KEY("FAL_API_KEY")}\n`,
      "integration/b.test.ts": `${call("IgnoringBody", '"fal/beta"')};\n${KEY("FAL_API_KEY")}\n`,
    });
    const { sites } = scanFalCallSites(root);
    expect([...sites.keys()].sort()).toEqual(["fal/alpha", "fal/beta"]);
  });

  it("resolves a wrapped call site whose name is on the next line", () => {
    const root = synthetic({
      "integration/a.test.ts": `ctx = ${call("", '\n  "fal/wrapped"\n')};\n${KEY("FAL_API_KEY")}\n`,
    });
    const { sites } = scanFalCallSites(root);
    expect(sites.has("fal/wrapped")).toBe(true);
  });

  it("resolves a beforeEach site against an apiKey in a sibling it block", () => {
    const root = synthetic({
      "integration/a.test.ts": [
        `beforeEach(() => { ctx = ${call("", '"fal/split"')}; });`,
        `it("x", () => { createFal({ ${KEY("FAL_API_KEY")} }); });`,
      ].join("\n"),
    });
    const { sites } = scanFalCallSites(root);
    const site = sites.get("fal/split")?.[0];
    expect(site?.distinctExpressionCount).toBe(1);
    expect(credentialForExpression(site?.keyExpression ?? "")).toBe(
      "generation"
    );
  });

  it("resolves a name hoisted into a const", () => {
    const root = synthetic({
      "integration/a.test.ts": `const NAME = "fal/hoisted";\n${call("", "NAME")};\n${KEY("FAL_API_KEY")}\n`,
    });
    const { sites } = scanFalCallSites(root);
    expect(sites.has("fal/hoisted")).toBe(true);
  });

  it("normalizes a dotted slug at the call site", () => {
    const root = synthetic({
      "integration/a.test.ts": `${call("", '"fal/gpt-image-1.5"')};\n${KEY("FAL_API_KEY")}\n`,
    });
    const { sites } = scanFalCallSites(root);
    expect(sites.has("fal/gpt-image-1-5")).toBe(true);
  });

  it("reports an unresolvable argument rather than skipping it", () => {
    const root = synthetic({
      "integration/a.test.ts": `${call("", "`fal/${name}`")};\n`,
    });
    const { unresolved } = scanFalCallSites(root);
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0]).toContain("a.test.ts:1");
  });

  it("counts two distinct FAL_ expressions in one file", () => {
    const root = synthetic({
      "integration/a.test.ts": [
        `${call("", '"fal/mixed"')};`,
        KEY("FAL_API_KEY"),
        KEY("FAL_ADMIN_API_KEY"),
      ].join("\n"),
    });
    const { sites } = scanFalCallSites(root);
    expect(sites.get("fal/mixed")?.[0].distinctExpressionCount).toBe(2);
  });

  it("ignores literal apiKey values that name no environment variable", () => {
    const root = synthetic({
      "integration/a.test.ts": `${call("", '"fal/lit"')};\napiKey: "fal-test-key",\n${KEY("FAL_API_KEY")}\n`,
    });
    const { sites } = scanFalCallSites(root);
    expect(sites.get("fal/lit")?.[0].distinctExpressionCount).toBe(1);
  });

  describe("end to end on synthetic pairs", () => {
    const audit = (host: string, slug: string, keyExpr: string) => {
      const recordings = synthetic({
        [`fal_1/${slug}_1234/recording.har`]: har(host, `fal/${slug}`),
      });
      const tests = synthetic({
        "integration/a.test.ts": `${call("", `"fal/${slug}"`)};\napiKey: ${keyExpr},\n`,
      });
      return auditFalCredentialWiring({
        recordingsRoot: recordings,
        testsDir: tests,
      });
    };

    it("passes a correctly wired admin recording", () => {
      expect(
        audit("api.fal.ai", "adm", 'process.env.FAL_ADMIN_API_KEY ?? "k"')
          .failures
      ).toEqual([]);
    });

    it("passes a correctly wired generation recording", () => {
      expect(
        audit("fal.run", "gen", 'process.env.FAL_API_KEY ?? "k"').failures
      ).toEqual([]);
    });

    it("fails an api.fal.ai recording wired to the generation key", () => {
      const { failures } = audit(
        "api.fal.ai",
        "adm",
        'process.env.FAL_API_KEY ?? "k"'
      );
      expect(failures).toHaveLength(1);
      expect(failures[0]).toContain("fal/adm");
      expect(failures[0]).toContain("api.fal.ai");
      expect(failures[0]).toContain("process.env.FAL_ADMIN_API_KEY");
      expect(failures[0]).toMatch(/a\.test\.ts:\d+/);
    });

    it("fails a fal.run recording wired to the admin key", () => {
      const { failures } = audit(
        "fal.run",
        "gen",
        'process.env.FAL_ADMIN_API_KEY ?? "k"'
      );
      expect(failures).toHaveLength(1);
      expect(failures[0]).toContain("fal/gen");
      expect(failures[0]).toContain("fal.run");
      expect(failures[0]).toContain("process.env.FAL_API_KEY");
    });

    it("names the remedy when a file mixes credential classes", () => {
      const recordings = synthetic({
        "fal_1/amb_1/recording.har": har("fal.run", "fal/amb"),
      });
      const tests = synthetic({
        "integration/a.test.ts": [
          `${call("", '"fal/amb"')};`,
          KEY("FAL_API_KEY"),
          KEY("FAL_ADMIN_API_KEY"),
        ].join("\n"),
      });
      const { failures } = auditFalCredentialWiring({
        recordingsRoot: recordings,
        testsDir: tests,
      });
      expect(failures).toHaveLength(1);
      expect(failures[0]).toContain("2 distinct FAL_* apiKey");
      expect(failures[0]).toContain("split the file");
    });

    it("fails a recording with no call site at all", () => {
      const recordings = synthetic({
        "fal_1/orphan_1/recording.har": har("fal.run", "fal/orphan"),
      });
      const tests = synthetic({ "integration/a.test.ts": "// nothing\n" });
      const { failures } = auditFalCredentialWiring({
        recordingsRoot: recordings,
        testsDir: tests,
      });
      expect(failures).toHaveLength(1);
      expect(failures[0]).toContain("no setupPolly* call site");
    });

    it("fails an unknown host with its name", () => {
      const recordings = synthetic({
        "fal_1/cdn_1/recording.har": har("cdn.fal.ai", "fal/cdn"),
      });
      const tests = synthetic({
        "integration/a.test.ts": `${call("", '"fal/cdn"')};\n${KEY("FAL_API_KEY")}\n`,
      });
      const { failures } = auditFalCredentialWiring({
        recordingsRoot: recordings,
        testsDir: tests,
      });
      expect(failures[0]).toContain("cdn.fal.ai");
      expect(failures[0]).toContain("FAL_HOST_CREDENTIALS");
    });

    it("fails when the HAR name disagrees with its directory slug", () => {
      const recordings = synthetic({
        "fal_1/actual_1/recording.har": har("fal.run", "fal/something-else"),
      });
      const tests = synthetic({
        "integration/a.test.ts": `${call("", '"fal/actual"')};\n${KEY("FAL_API_KEY")}\n`,
      });
      const { failures } = auditFalCredentialWiring({
        recordingsRoot: recordings,
        testsDir: tests,
      });
      expect(failures[0]).toContain("does not normalize to");
    });
  });
});
