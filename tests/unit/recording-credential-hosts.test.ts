import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  dirToRecordingName,
  normalizeName,
} from "../../scripts/lib/recording-names.mjs";
import {
  CREDENTIAL_ENV,
  FAL_HOST_CREDENTIALS,
  auditFalCredentialWiring,
  classifyHosts,
  credentialForExpression,
  readRecordingHosts,
  resolveFalRecordingsDir,
  scanFalCallSites,
} from "../../scripts/lib/fal-credential-hosts.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const RECORDINGS_ROOT = path.join(REPO_ROOT, "tests", "recordings");
const TESTS_DIR = path.join(REPO_ROOT, "tests");
const temporaryRoots: string[] = [];

interface SyntheticTree {
  root: string;
  recordingsRoot: string;
  testsDir: string;
}

interface PairOptions {
  slug: string;
  host: string;
  keyExpression: string;
  file?: string;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function walkRecordingFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkRecordingFiles(fullPath));
    else if (entry.name === "recording.har") files.push(fullPath);
  }
  return files.sort();
}

function createSyntheticTree(): SyntheticTree {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fal-credential-hosts-"));
  const recordingsRoot = path.join(root, "tests", "recordings");
  const testsDir = path.join(root, "tests");
  fs.mkdirSync(recordingsRoot, { recursive: true });
  temporaryRoots.push(root);
  return { root, recordingsRoot, testsDir };
}

function writeRecording(
  tree: SyntheticTree,
  slug: string,
  hosts: string[],
  recordingName: string | null = slug
): string {
  const relativeSegments = slug
    .replace(/^fal\//, "")
    .split("/")
    .map((segment) => `${segment}_123`);
  const recordingDir = path.join(
    tree.recordingsRoot,
    "fal_123",
    ...relativeSegments
  );
  const harPath = path.join(recordingDir, "recording.har");
  fs.mkdirSync(recordingDir, { recursive: true });
  fs.writeFileSync(
    harPath,
    JSON.stringify({
      log: {
        ...(recordingName === null ? {} : { _recordingName: recordingName }),
        entries: hosts.map((host, index) => ({
          _id: String(index),
          request: { url: `https://${host}/synthetic` },
        })),
      },
    })
  );
  return harPath;
}

function writeTestFile(
  tree: SyntheticTree,
  relativePath: string,
  source: string
): string {
  const file = path.join(tree.testsDir, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source);
  return file;
}

// Built from parts on purpose. Spelling the helper name out in full, followed
// by an open parenthesis, makes this file itself look like a recording call
// site to every scanner that uses SETUP_RE -- this guard included, which would
// then fail on the unresolvable argument, and `check-orphan-recordings.mjs`,
// which would report the synthetic names below as phantom references.
function setupName(suffix = ""): string {
  return ["setup", `Polly${suffix}`].join("");
}

function sourceForPair(slug: string, keyExpression: string): string {
  const setup = setupName();
  return [
    `import { ${setup} } from "../harness";`,
    "let ctx;",
    `ctx = ${setup}("${slug}");`,
    "const provider = createFal({",
    `  apiKey: ${keyExpression},`,
    "});",
    "void ctx;",
    "void provider;",
  ].join("\n");
}

function auditPair({
  slug,
  host,
  keyExpression,
  file = "integration/pair.test.ts",
}: PairOptions) {
  const tree = createSyntheticTree();
  writeRecording(tree, slug, [host]);
  writeTestFile(tree, file, sourceForPair(slug, keyExpression));
  return auditFalCredentialWiring(tree);
}

describe("fal credential host audit against the committed corpus", () => {
  it("covers every recording with exactly one credential class", () => {
    const falDir = resolveFalRecordingsDir(RECORDINGS_ROOT);
    const expectedTotal = walkRecordingFiles(falDir).length;
    const result = auditFalCredentialWiring();
    const { sites } = scanFalCallSites(TESTS_DIR);
    const unmapped = walkRecordingFiles(falDir).filter((harPath) => {
      const relativeDir = path.relative(falDir, path.dirname(harPath));
      return !sites.has(`fal/${dirToRecordingName(relativeDir)}`);
    });

    console.log(
      "fal credential host audit",
      JSON.stringify({
        ...result.summary,
        unmapped: unmapped.length,
        failures: result.failures.length,
      })
    );
    expect(result.failures).toEqual([]);
    expect(result.summary.total).toBe(expectedTotal);
    expect(result.summary.total).toBeGreaterThan(0);
    expect({
      partitioned: result.summary.admin + result.summary.generation,
      adminPositive: result.summary.admin > 0,
      generationPositive: result.summary.generation > 0,
    }).toEqual({
      partitioned: result.summary.total,
      adminPositive: true,
      generationPositive: true,
    });
  });

  it("maps every recording directory slug to a call site", () => {
    const falDir = resolveFalRecordingsDir(RECORDINGS_ROOT);
    const { sites, unresolved } = scanFalCallSites(TESTS_DIR);
    const missing = walkRecordingFiles(falDir)
      .map(
        (harPath) =>
          `fal/${dirToRecordingName(
            path.relative(falDir, path.dirname(harPath))
          )}`
      )
      .filter((slug) => !sites.has(slug));

    expect(unresolved).toEqual([]);
    expect(missing).toEqual([]);
  });
});

describe("fal recording host classification", () => {
  it("pins all supported hosts and their credential classes", () => {
    expect(FAL_HOST_CREDENTIALS).toEqual({
      "api.fal.ai": "admin",
      "fal.run": "generation",
      "queue.fal.run": "generation",
      "rest.fal.ai": "generation",
      "v3b.fal.media": "generation",
    });
    expect(CREDENTIAL_ENV).toEqual({
      admin: "FAL_ADMIN_API_KEY",
      generation: "FAL_API_KEY",
    });

    for (const [host, credential] of Object.entries(FAL_HOST_CREDENTIALS)) {
      expect(classifyHosts([host])).toEqual({ ok: true, credential, host });
    }
  });

  it("fails unknown and mixed-class host sets without guessing", () => {
    expect(classifyHosts(["cdn.fal.ai"])).toEqual({
      ok: false,
      reason: "unknown-host",
      host: "cdn.fal.ai",
    });
    expect(classifyHosts(["api.fal.ai", "fal.run"])).toEqual({
      ok: false,
      reason: "mixed-classes",
      hosts: ["api.fal.ai", "fal.run"],
    });
  });

  it("accepts multi-host generation recordings", () => {
    expect(classifyHosts(["rest.fal.ai", "v3b.fal.media"])).toEqual({
      ok: true,
      credential: "generation",
      host: "rest.fal.ai",
    });
  });

  it("reads sorted, deduplicated request hosts and Polly identity", () => {
    const tree = createSyntheticTree();
    const harPath = writeRecording(tree, "fal/storage-upload-initiate", [
      "v3b.fal.media",
      "rest.fal.ai",
      "v3b.fal.media",
    ]);

    expect(readRecordingHosts(harPath)).toEqual({
      hosts: ["rest.fal.ai", "v3b.fal.media"],
      recordingName: "fal/storage-upload-initiate",
    });
  });
});

describe("fal credential expression classification", () => {
  it("recognizes admin before generation and rejects literals", () => {
    expect(
      credentialForExpression(
        'process.env.FAL_ADMIN_API_KEY ?? "fal-admin-test-key"'
      )
    ).toBe("admin");
    expect(
      credentialForExpression('process.env.FAL_API_KEY ?? "fal-test-key"')
    ).toBe("generation");
    expect(credentialForExpression("process.env.FAL_ADMIN_API_KEY")).toBe(
      "admin"
    );
    expect(credentialForExpression('"fal-test-key"')).toBeNull();
  });
});

describe("fal call-site scanning", () => {
  it("recognizes variants, wrapped names, and file-scoped sibling keys", () => {
    const tree = createSyntheticTree();
    const regular = setupName();
    const ignoringBody = setupName("IgnoringBody");
    writeTestFile(
      tree,
      "integration/regular.test.ts",
      sourceForPair("fal/regular", 'process.env.FAL_API_KEY ?? "fal-test-key"')
    );
    writeTestFile(
      tree,
      "integration/ignoring-body.test.ts",
      [
        `ctx = ${ignoringBody}("fal/ignoring-body");`,
        "const provider = createFal({",
        '  apiKey: process.env.FAL_API_KEY ?? "fal-test-key",',
        "});",
      ].join("\n")
    );
    writeTestFile(
      tree,
      "integration/wrapped.test.ts",
      [
        `ctx = ${regular}(`,
        '  "fal/wrapped"',
        ");",
        "const provider = createFal({",
        '  apiKey: process.env.FAL_API_KEY ?? "fal-test-key",',
        "});",
      ].join("\n")
    );
    writeTestFile(
      tree,
      "integration/sibling.test.ts",
      [
        "beforeEach(() => {",
        `  ctx = ${regular}("fal/sibling");`,
        "});",
        'it("uses a sibling key", () => {',
        "  const provider = createFal({",
        '    apiKey: process.env.FAL_API_KEY ?? "fal-test-key",',
        "  });",
        "  void provider;",
        "});",
      ].join("\n")
    );

    const result = scanFalCallSites(tree.testsDir);
    expect(result.unresolved).toEqual([]);
    expect([...result.sites.keys()].sort()).toEqual([
      "fal/ignoring-body",
      "fal/regular",
      "fal/sibling",
      "fal/wrapped",
    ]);
    expect(result.sites.get("fal/regular")).toHaveLength(1);
    expect(result.sites.get("fal/ignoring-body")).toHaveLength(1);
    expect(result.sites.get("fal/wrapped")?.[0].line).toBe(1);
    expect(result.sites.get("fal/sibling")?.[0]).toMatchObject({
      file: "tests/integration/sibling.test.ts",
      distinctExpressionCount: 1,
    });
    expect(result.sites.get("fal/sibling")?.[0].keyLine).toBeGreaterThan(
      result.sites.get("fal/sibling")?.[0].line ?? 0
    );
  });

  it("fails a file with two distinct FAL key expressions", () => {
    const tree = createSyntheticTree();
    const setup = setupName();
    writeRecording(tree, "fal/ambiguous", ["api.fal.ai"]);
    writeTestFile(
      tree,
      "integration/ambiguous.test.ts",
      [
        `ctx = ${setup}("fal/ambiguous");`,
        "const admin = createFal({",
        '  apiKey: process.env.FAL_ADMIN_API_KEY ?? "fal-admin-test-key",',
        "});",
        "const generation = createFal({",
        '  apiKey: process.env.FAL_API_KEY ?? "fal-test-key",',
        "});",
        "void admin;",
        "void generation;",
      ].join("\n")
    );

    const result = auditFalCredentialWiring(tree);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toContain("fal/ambiguous");
    expect(result.failures[0]).toContain("FAL_ADMIN_API_KEY");
    expect(result.failures[0]).toContain("FAL_API_KEY");
    expect(result.failures[0]).toContain(
      "split the file so each holds one credential class, or extend the guard to block-scoped association"
    );
  });

  it("reports an unresolvable setup argument with file, line, and source", () => {
    const tree = createSyntheticTree();
    const setup = setupName();
    writeRecording(tree, "fal/resolved", ["fal.run"]);
    writeTestFile(
      tree,
      "integration/unresolved.test.ts",
      [
        `ctx = ${setup}("fal/resolved");`,
        `other = ${setup}(DYNAMIC_RECORDING);`,
        "const provider = createFal({",
        '  apiKey: process.env.FAL_API_KEY ?? "fal-test-key",',
        "});",
        "void provider;",
      ].join("\n")
    );

    const result = auditFalCredentialWiring(tree);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toMatch(
      /tests\/integration\/unresolved\.test\.ts:\d+: DYNAMIC_RECORDING/
    );
  });
});

describe("recording slug normalization", () => {
  it("matches the harness dotted-name and hash-suffix rules", () => {
    expect(normalizeName("fal/gpt-image-1.5")).toBe("fal/gpt-image-1-5");
    expect(normalizeName("fal/gpt-image-1.5-edit")).toBe(
      "fal/gpt-image-1-5-edit"
    );
    expect(dirToRecordingName("x_4206709809")).toBe("x");
  });
});

describe("fal credential wiring end to end", () => {
  it.each([
    {
      slug: "fal/admin-pass",
      host: "api.fal.ai",
      keyExpression: 'process.env.FAL_ADMIN_API_KEY ?? "fal-admin-test-key"',
    },
    {
      slug: "fal/generation-pass",
      host: "fal.run",
      keyExpression: 'process.env.FAL_API_KEY ?? "fal-test-key"',
    },
  ])("accepts $slug with its matching credential", (pair) => {
    expect(auditPair(pair).failures).toEqual([]);
  });

  it.each([
    {
      slug: "fal/admin-fail",
      host: "api.fal.ai",
      expected: "FAL_ADMIN_API_KEY",
      keyExpression: 'process.env.FAL_API_KEY ?? "fal-test-key"',
    },
    {
      slug: "fal/generation-fail",
      host: "fal.run",
      expected: "FAL_API_KEY",
      keyExpression: 'process.env.FAL_ADMIN_API_KEY ?? "fal-admin-test-key"',
    },
  ])("rejects $slug with the wrong credential", (pair) => {
    const result = auditPair(pair);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toContain(pair.slug);
    expect(result.failures[0]).toContain(pair.host);
    expect(result.failures[0]).toContain(`process.env.${pair.expected}`);
    expect(result.failures[0]).toContain(pair.keyExpression);
    expect(result.failures[0]).toMatch(
      /tests\/integration\/pair\.test\.ts:\d+/
    );
  });
});
