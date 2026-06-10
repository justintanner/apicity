import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import {
  loadEnvFile,
  parseEnvFile,
} from "../../packages/mcp-server/src/env-file";

const dir = mkdtempSync(join(tmpdir(), "apicity-env-file-"));

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeEnvFile(name: string, content: string): string {
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
}

describe("parseEnvFile", () => {
  it("parses KEY=VALUE lines and skips comments and blanks", () => {
    expect(
      parseEnvFile(
        [
          "# providers",
          "",
          "OPENAI_API_KEY=sk-openai",
          "  XAI_API_KEY = xai-key  ",
          "not-an-assignment",
          "=no-key",
        ].join("\n")
      )
    ).toEqual([
      ["OPENAI_API_KEY", "sk-openai"],
      ["XAI_API_KEY", "xai-key"],
    ]);
  });

  it("strips one pair of matching quotes", () => {
    expect(
      parseEnvFile(
        [
          'OPENAI_API_KEY="sk-openai"',
          "XAI_API_KEY='xai-key'",
          "ANTHROPIC_API_KEY=\"mismatched'",
        ].join("\n")
      )
    ).toEqual([
      ["OPENAI_API_KEY", "sk-openai"],
      ["XAI_API_KEY", "xai-key"],
      ["ANTHROPIC_API_KEY", "\"mismatched'"],
    ]);
  });
});

describe("loadEnvFile", () => {
  it("fills env vars from the file", () => {
    const path = writeEnvFile(
      "fill.env",
      "OPENAI_API_KEY=sk-openai\nXAI_API_KEY=xai-key\n"
    );
    const env: NodeJS.ProcessEnv = {};
    loadEnvFile(path, env);
    expect(env.OPENAI_API_KEY).toBe("sk-openai");
    expect(env.XAI_API_KEY).toBe("xai-key");
  });

  it("does not overwrite env vars that are already set", () => {
    const path = writeEnvFile("no-clobber.env", "OPENAI_API_KEY=from-file\n");
    const env: NodeJS.ProcessEnv = { OPENAI_API_KEY: "existing" };
    loadEnvFile(path, env);
    expect(env.OPENAI_API_KEY).toBe("existing");
  });

  it("skips op:// reference values", () => {
    const path = writeEnvFile(
      "op-refs.env",
      [
        "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
        "XAI_API_KEY=xai-key",
      ].join("\n")
    );
    const env: NodeJS.ProcessEnv = {};
    loadEnvFile(path, env);
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(env.XAI_API_KEY).toBe("xai-key");
  });

  it("overwrites env vars holding unresolved op:// references", () => {
    const path = writeEnvFile("resolve-refs.env", "OPENAI_API_KEY=sk-real\n");
    const env: NodeJS.ProcessEnv = {
      OPENAI_API_KEY: "op://Apicity/OPENAI_API_KEY/password",
    };
    loadEnvFile(path, env);
    expect(env.OPENAI_API_KEY).toBe("sk-real");
  });

  it("errors clearly on a missing file", () => {
    const missing = join(dir, "missing.env");
    expect(() => loadEnvFile(missing, {})).toThrow(
      `--env-file ${missing} could not be read:`
    );
  });
});
