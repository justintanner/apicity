import { describe, expect, it } from "vitest";

import {
  findLiteralAssignments,
  findUnresolvedAssignments,
  parseEnvAssignments,
  validateOpEnv,
} from "../../scripts/lib/check-op.mjs";

describe("check-op env validation", () => {
  it("parses uppercase .env assignments", () => {
    expect(
      parseEnvAssignments(
        [
          "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
          "XAI_API_KEY=op://Apicity/XAI_API_KEY/password",
          "lowercase_key=ignored",
          "NOT AN ASSIGNMENT",
        ].join("\n")
      )
    ).toEqual([
      {
        name: "OPENAI_API_KEY",
        rawValue: "op://Apicity/OPENAI_API_KEY/password",
      },
      {
        name: "XAI_API_KEY",
        rawValue: "op://Apicity/XAI_API_KEY/password",
      },
    ]);
  });

  it("accepts only Apicity password references", () => {
    const assignments = parseEnvAssignments(
      [
        "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
        "XAI_API_KEY=op://Private/XAI_API_KEY/password",
        "ANTHROPIC_API_KEY=op://Apicity/ANTHROPIC_API_KEY/token",
        "GOOGLE_API_KEY=op://Apicity/nested/item/password",
      ].join("\n")
    );

    expect(
      findLiteralAssignments(assignments).map(
        ({ name }: { name: string }) => name
      )
    ).toEqual(["XAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY"]);
  });

  it("rejects literal and non-1Password assignments by variable name", () => {
    expect(
      validateOpEnv(
        [
          "OPENAI_API_KEY=sk-literal",
          "XAI_API_KEY=op://OtherVault/XAI_API_KEY/password",
        ].join("\n"),
        {
          OPENAI_API_KEY: "sk-literal",
          XAI_API_KEY: "xai-secret",
        }
      )
    ).toEqual({
      ok: false,
      message: "Non-1Password .env assignments: OPENAI_API_KEY, XAI_API_KEY",
    });
  });

  it("detects unresolved environment values", () => {
    const assignments = parseEnvAssignments(
      [
        "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
        "XAI_API_KEY=op://Apicity/XAI_API_KEY/password",
        "ANTHROPIC_API_KEY=op://Apicity/ANTHROPIC_API_KEY/password",
      ].join("\n")
    );

    expect(
      findUnresolvedAssignments(assignments, {
        OPENAI_API_KEY: "op://Apicity/OPENAI_API_KEY/password",
        XAI_API_KEY: "",
        ANTHROPIC_API_KEY: "anthropic-secret",
      })
    ).toEqual(["OPENAI_API_KEY", "XAI_API_KEY"]);
  });

  it("accepts resolved secret values", () => {
    expect(
      validateOpEnv(
        [
          "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
          "XAI_API_KEY=op://Apicity/XAI_API_KEY/password",
        ].join("\n"),
        {
          OPENAI_API_KEY: "sk-resolved",
          XAI_API_KEY: "xai-resolved",
        }
      )
    ).toEqual({
      ok: true,
      message: "1Password OK - all .env secret references resolved",
    });
  });
});
