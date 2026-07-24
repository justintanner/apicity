import { describe, expect, it } from "vitest";
import {
  classifyChangedFiles,
  detectProviderForChangedFile,
  normalizeProjectPath,
} from "../../scripts/lib/affected-provider-tests.mjs";

const providers = [
  "anthropic",
  "free-media-upload",
  "google",
  "googleflow",
  "kie",
  "openai",
  "x",
  "xai",
];

describe("normalizeProjectPath", () => {
  it("normalizes dot-prefixed and Windows-style paths", () => {
    expect(
      normalizeProjectPath(".\\packages\\provider\\openai\\src\\openai.ts")
    ).toBe("packages/provider/openai/src/openai.ts");
    expect(
      normalizeProjectPath(" ./tests\\integration\\xai-image.test.ts ")
    ).toBe("tests/integration/xai-image.test.ts");
  });

  it("trims blank changed paths to empty strings", () => {
    expect(normalizeProjectPath("")).toBe("");
    expect(normalizeProjectPath("   \t  ")).toBe("");
  });
});

describe("detectProviderForChangedFile", () => {
  it("maps provider package paths", () => {
    expect(
      detectProviderForChangedFile(
        "packages/provider/openai/src/openai.ts",
        providers
      )
    ).toBe("openai");
    expect(
      detectProviderForChangedFile(
        "packages/provider/xai/src/xai.ts",
        providers
      )
    ).toBe("xai");
    expect(
      detectProviderForChangedFile("packages/provider/x-tools/src/index.ts", [
        "x",
        "xai",
      ])
    ).toBe("");
  });

  it("maps integration tests by longest provider prefix", () => {
    expect(
      detectProviderForChangedFile(
        "tests/integration/xai-image.test.ts",
        providers
      )
    ).toBe("xai");
    expect(
      detectProviderForChangedFile(
        "tests/integration/x-media-upload.test.ts",
        providers
      )
    ).toBe("x");
    expect(
      detectProviderForChangedFile(
        "tests/integration/free-media-upload-catbox.test.ts",
        providers
      )
    ).toBe("free-media-upload");
  });

  it("maps nested tests/unit/<provider>/ suites by directory name", () => {
    expect(
      detectProviderForChangedFile("tests/unit/kie/validate.test.ts", providers)
    ).toBe("kie");
    expect(
      detectProviderForChangedFile(
        "tests/functional/anthropic/schemas.test.ts",
        providers
      )
    ).toBe("anthropic");
    // A non-provider subdirectory (`shared`) has no slug match and stays full.
    expect(
      detectProviderForChangedFile(
        "tests/unit/shared/provider-infrastructure.test.ts",
        providers
      )
    ).toBe("");
  });

  it("maps provider recording directories", () => {
    expect(
      detectProviderForChangedFile(
        "tests/recordings/openai_3991279299/chat-hello/recording.har",
        providers
      )
    ).toBe("openai");
    expect(
      detectProviderForChangedFile(
        "tests/recordings/google-flow_3038927025/contracts/recording.har",
        providers
      )
    ).toBe("googleflow");
    expect(
      detectProviderForChangedFile(
        "tests/recordings/xai_3038927025/image/recording.har",
        providers
      )
    ).toBe("xai");
    expect(
      detectProviderForChangedFile(
        "tests/recordings/free-media-upload_3991279299/upload/recording.har",
        providers
      )
    ).toBe("free-media-upload");
  });

  it("does not map shared files", () => {
    expect(
      detectProviderForChangedFile("tests/vitest.integration.ts", providers)
    ).toBe("");
    expect(
      detectProviderForChangedFile(
        "tests/integration/xylophone.test.ts",
        providers
      )
    ).toBe("");
  });

  it("normalizes changed paths before direct detection", () => {
    expect(
      detectProviderForChangedFile(
        ".\\packages\\provider\\openai\\src\\openai.ts",
        providers
      )
    ).toBe("openai");
    expect(
      detectProviderForChangedFile(
        "./tests\\recordings\\free-media-upload_3991279299\\upload\\recording.har",
        providers
      )
    ).toBe("free-media-upload");
  });
});

describe("classifyChangedFiles", () => {
  it("selects provider mode for one provider", () => {
    expect(
      classifyChangedFiles(
        [
          "packages/provider/openai/src/openai.ts",
          "tests/integration/openai-chat.test.ts",
        ],
        providers
      )
    ).toEqual({
      mode: "providers",
      providers: ["openai"],
      fullReasons: [],
    });
  });

  it("scopes a nested unit test edit to its provider", () => {
    expect(
      classifyChangedFiles(["tests/unit/kie/validate.test.ts"], providers)
    ).toEqual({
      mode: "providers",
      providers: ["kie"],
      fullReasons: [],
    });
  });

  it("selects all touched providers for multi-provider diffs", () => {
    expect(
      classifyChangedFiles(
        [
          "packages/provider/openai/src/openai.ts",
          "packages/provider/xai/src/xai.ts",
        ],
        providers
      )
    ).toMatchObject({
      mode: "providers",
      providers: ["openai", "xai"],
    });
  });

  it("falls back to full mode for mixed shared changes", () => {
    expect(
      classifyChangedFiles(
        ["packages/provider/openai/src/openai.ts", "scripts/test-provider.mjs"],
        providers
      )
    ).toEqual({
      mode: "full",
      providers: ["openai"],
      fullReasons: ["scripts/test-provider.mjs"],
    });
  });

  it("normalizes changed files before provider classification", () => {
    expect(
      classifyChangedFiles(
        [
          "./packages/provider/xai/src/xai.ts",
          ".\\tests\\recordings\\x_3038927025\\post\\recording.har",
        ],
        providers
      )
    ).toEqual({
      mode: "providers",
      providers: ["x", "xai"],
      fullReasons: [],
    });
  });

  it("preserves scoped providers when ambiguous files require full mode", () => {
    expect(
      classifyChangedFiles(
        [
          "packages/provider/openai/src/openai.ts",
          "packages/provider/x-tools/src/index.ts",
          "tests/integration/xylophone.test.ts",
        ],
        providers
      )
    ).toEqual({
      mode: "full",
      providers: ["openai"],
      fullReasons: [
        "packages/provider/x-tools/src/index.ts",
        "tests/integration/xylophone.test.ts",
      ],
    });
  });

  it("ignores blank changed paths", () => {
    expect(
      classifyChangedFiles(
        ["", "   ", "\t", "./packages/provider/openai/src/openai.ts"],
        providers
      )
    ).toEqual({
      mode: "providers",
      providers: ["openai"],
      fullReasons: [],
    });
  });

  it("keeps detected providers when unknown test slugs require full mode", () => {
    expect(
      classifyChangedFiles(
        [
          "./packages/provider/openai/src/openai.ts",
          ".\\tests\\integration\\unknown-media.test.ts",
          "tests/recordings/not-a-provider_3991279299/upload/recording.har",
        ],
        providers
      )
    ).toEqual({
      mode: "full",
      providers: ["openai"],
      fullReasons: [
        "tests/integration/unknown-media.test.ts",
        "tests/recordings/not-a-provider_3991279299/upload/recording.har",
      ],
    });
  });
});
