import { describe, expect, it } from "vitest";
import {
  classifyChangedFiles,
  detectProviderForChangedFile,
} from "../../scripts/lib/affected-provider-tests.mjs";

const providers = ["free-media-upload", "google", "openai", "x", "xai"];

describe("detectProviderForChangedFile", () => {
  it("maps provider package paths", () => {
    expect(
      detectProviderForChangedFile(
        "packages/provider/openai/src/openai.ts",
        providers
      )
    ).toBe("openai");
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
    ).toBe("google");
  });

  it("does not map shared files", () => {
    expect(
      detectProviderForChangedFile("tests/vitest.integration.ts", providers)
    ).toBe("");
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
});
