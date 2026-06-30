import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  integrationDir,
  providerRoot,
  repoRoot,
  resolveProviderScope,
} from "../../scripts/lib/provider-scope.mjs";

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
  expect(
    tests.every((test) => test.startsWith(`${integrationDir}/openai`))
  ).toBe(true);
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
      ],
    });
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
});
