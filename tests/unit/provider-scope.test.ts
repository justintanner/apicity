import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  integrationDir,
  hasEndpointDocsRows,
  mcpServerDir,
  providerRoot,
  repoRoot,
  resolveProviderScope,
} from "../../scripts/lib/provider-scope.mjs";

const functionalDir = path.join("tests", "functional");
const unitDir = path.join("tests", "unit");

const originalCwd = process.cwd();
const originalProviderPath = process.env.APICITY_PROVIDER_PATH;
const originalInitCwd = process.env.INIT_CWD;

function restoreEnv(
  name: "APICITY_PROVIDER_PATH" | "INIT_CWD",
  value?: string
) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function expectOpenAiTests(tests: string[]) {
  expect(tests).toContain(`${integrationDir}/openai-chat.test.ts`);
  expect(tests).toContain(`${integrationDir}/openai-responses.test.ts`);
  expect(tests).toContain(`${unitDir}/openai-zod.test.ts`);
  // Matching is by filename, not by directory: every scanned directory is fair
  // game, so assert on the basename rather than an `integrationDir` prefix.
  expect(tests.every((test) => path.basename(test).startsWith("openai"))).toBe(
    true
  );
}

describe("resolveProviderScope", () => {
  beforeEach(() => {
    delete process.env.APICITY_PROVIDER_PATH;
    delete process.env.INIT_CWD;
    process.chdir(repoRoot);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    restoreEnv("APICITY_PROVIDER_PATH", originalProviderPath);
    restoreEnv("INIT_CWD", originalInitCwd);
  });

  it("resolves provider names with optional @apicity scope", () => {
    expect(resolveProviderScope("openai")).toMatchObject({
      provider: "openai",
      packageDir: "packages/provider/openai",
      source: "argument",
      input: "openai",
    });

    const scoped = resolveProviderScope("@apicity/openai");

    expect(scoped).toMatchObject({
      provider: "openai",
      packageDir: "packages/provider/openai",
      source: "argument",
      input: "@apicity/openai",
    });
    expectOpenAiTests(scoped.tests);
  });

  it("resolves the endpoint-less MCP workspace package", () => {
    const byName = resolveProviderScope("mcp-server");
    const byPath = resolveProviderScope("packages/mcp-server/src/server.ts");

    for (const scope of [byName, byPath]) {
      expect(scope).toMatchObject({
        provider: "mcp-server",
        packageDir: mcpServerDir,
      });
      expect(scope.tests).toContain(`${unitDir}/mcp-schema.test.ts`);
      expect(scope.tests).toContain(`${unitDir}/mcp-provider-registry.test.ts`);
    }
  });

  it("distinguishes endpoint-less packages without admitting typos", () => {
    expect(hasEndpointDocsRows("openai")).toBe(true);
    expect(hasEndpointDocsRows("b2")).toBe(true);
    expect(hasEndpointDocsRows("cost")).toBe(false);
    expect(hasEndpointDocsRows("mcp-server")).toBe(false);
  });

  it("resolves relative and absolute provider package paths", () => {
    const relative = "packages/provider/free-media-upload/src/index.ts";
    const absolute = path.join(providerRoot, "s3", "src", "s3.ts");

    expect(resolveProviderScope(relative)).toMatchObject({
      provider: "free-media-upload",
      packageDir: "packages/provider/free-media-upload",
      source: "argument",
      input: relative,
      tests: [
        `${integrationDir}/free-media-upload-catbox.test.ts`,
        `${integrationDir}/free-media-upload-filebin.test.ts`,
        `${integrationDir}/free-media-upload-gofile.test.ts`,
        `${integrationDir}/free-media-upload-litterbox.test.ts`,
        `${integrationDir}/free-media-upload-recordings.test.ts`,
        `${integrationDir}/free-media-upload-tempsh.test.ts`,
        `${integrationDir}/free-media-upload-tflink.test.ts`,
        `${integrationDir}/free-media-upload-tmpfiles.test.ts`,
        `${integrationDir}/free-media-upload-uguu.test.ts`,
        `${unitDir}/free-media-upload-helpers.test.ts`,
      ],
    });

    expect(resolveProviderScope(absolute)).toMatchObject({
      provider: "s3",
      packageDir: "packages/provider/s3",
      source: "argument",
      input: absolute,
      tests: [
        `${integrationDir}/s3-bucket-config.test.ts`,
        `${integrationDir}/s3-bucket-read.test.ts`,
        `${integrationDir}/s3-bulk-versioning.test.ts`,
        `${integrationDir}/s3-compatibility-missing.test.ts`,
        `${integrationDir}/s3-multipart-upload.test.ts`,
        `${integrationDir}/s3-object-core.test.ts`,
        `${integrationDir}/s3-object-governance.test.ts`,
        `${integrationDir}/s3-object-management.test.ts`,
        `${unitDir}/s3-endpoints.test.ts`,
      ],
    });
  });

  it("selects nested tests/unit/<provider>/ suites by directory name", () => {
    // `kie/validate.test.ts` does not carry the `kie` filename prefix, so only
    // directory-name attribution reaches it. Baseline was 95 flat paths; the
    // nested file lifts the count past that.
    const kie = resolveProviderScope("kie");
    expect(kie.tests).toContain(`${unitDir}/kie/validate.test.ts`);
    expect(kie.tests.length).toBeGreaterThan(95);

    // `anthropic/schemas.test.ts` likewise lacks the provider prefix.
    expect(resolveProviderScope("anthropic").tests).toContain(
      `${unitDir}/anthropic/schemas.test.ts`
    );

    // The prefix-carrying `fireworks/fireworks-*` files come in via the same
    // nested scan, not the flat one (they live one directory deep).
    const fireworks = resolveProviderScope("fireworks");
    expect(fireworks.tests).toContain(
      `${unitDir}/fireworks/fireworks-kontext.test.ts`
    );
    expect(fireworks.tests).toContain(
      `${unitDir}/fireworks/fireworks-model-prep.test.ts`
    );
  });

  it("attributes nested suites only to a matching provider directory", () => {
    // `tests/unit/shared/` is not a provider directory: no scope may claim it.
    for (const provider of ["kie", "anthropic", "fireworks", "fal", "openai"]) {
      const { tests } = resolveProviderScope(provider);
      expect(tests.some((test) => test.startsWith(`${unitDir}/shared/`))).toBe(
        false
      );
    }

    // Top-level provider files stay selected — the nested scan is additive.
    expect(resolveProviderScope("fal").tests).toContain(
      `${unitDir}/fal-zod.test.ts`
    );
  });

  it("resolves integration test paths by longest provider prefix", () => {
    expect(
      resolveProviderScope("tests/integration/xai-chat.test.ts")
    ).toMatchObject({
      provider: "xai",
      packageDir: "packages/provider/xai",
      source: "argument",
      input: "tests/integration/xai-chat.test.ts",
    });

    expect(
      resolveProviderScope("tests/integration/x-media-upload-status.test.ts")
    ).toMatchObject({
      provider: "x",
      packageDir: "packages/provider/x",
      source: "argument",
      input: "tests/integration/x-media-upload-status.test.ts",
      tests: [
        `${integrationDir}/x-media-upload-append.test.ts`,
        `${integrationDir}/x-media-upload-finalize.test.ts`,
        `${integrationDir}/x-media-upload-initialize.test.ts`,
        `${integrationDir}/x-media-upload-status.test.ts`,
        `${integrationDir}/x-post-video.test.ts`,
        `${integrationDir}/x-tweets.test.ts`,
        `${integrationDir}/x-users-me.test.ts`,
        `${unitDir}/x-oauth.test.ts`,
        `${unitDir}/x-zod.test.ts`,
      ],
    });
  });

  it("falls back to APICITY_PROVIDER_PATH before INIT_CWD", () => {
    process.env.APICITY_PROVIDER_PATH =
      "packages/provider/telegram/src/telegram.ts";
    process.env.INIT_CWD = path.join(providerRoot, "youtube");

    expect(resolveProviderScope()).toMatchObject({
      provider: "telegram",
      packageDir: "packages/provider/telegram",
      source: "APICITY_PROVIDER_PATH",
      input: "packages/provider/telegram/src/telegram.ts",
      tests: [
        `${integrationDir}/telegram-chat-admin-shapes.test.ts`,
        `${integrationDir}/telegram-send-all-types.test.ts`,
        `${functionalDir}/telegram-send-methods.test.ts`,
        `${unitDir}/telegram-endpoints.test.ts`,
        `${unitDir}/telegram-zod.test.ts`,
      ],
    });
  });

  it("falls back to INIT_CWD before current working directory", () => {
    process.env.INIT_CWD = path.join(providerRoot, "youtube");
    process.chdir(path.join(providerRoot, "xai"));

    expect(resolveProviderScope()).toMatchObject({
      provider: "youtube",
      packageDir: "packages/provider/youtube",
      source: "initial working directory",
      input: process.env.INIT_CWD,
    });
  });

  it("falls back to the current working directory", () => {
    const cwd = path.join(providerRoot, "xai");

    process.chdir(cwd);

    expect(resolveProviderScope()).toMatchObject({
      provider: "xai",
      packageDir: "packages/provider/xai",
      source: "current working directory",
      input: cwd,
    });
  });

  it("throws a useful error for unknown provider scopes", () => {
    let message = "";

    try {
      resolveProviderScope("packages/provider/not-a-provider/src/index.ts");
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain("Could not resolve a provider scope.");
    expect(message).toContain(
      "Pass a provider name or a path under packages/provider/<provider>."
    );
    expect(message).toContain(
      "Integration test paths like tests/integration/openai-chat.test.ts work too."
    );
    expect(message).toContain("pnpm run test:provider -- openai");
    expect(message).toContain("Known providers:");
    expect(message).toContain("openai");
  });
});
