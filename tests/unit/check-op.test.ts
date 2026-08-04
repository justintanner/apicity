import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  findLiteralAssignments,
  findUnresolvedAssignments,
  parseEnvAssignments,
  validateOpEnv,
} from "../../scripts/lib/check-op.mjs";
import {
  OP_ENV_CLASSIFICATIONS,
  OP_ENV_POLICY,
  OP_ENV_SOURCES,
} from "../../scripts/lib/op-env-policy.mjs";

const credential = {
  classification: OP_ENV_CLASSIFICATIONS.CREDENTIAL,
  source: OP_ENV_SOURCES.ONE_PASSWORD,
};
const publicSignatureType = {
  classification: OP_ENV_CLASSIFICATIONS.PUBLIC_METADATA,
  source: OP_ENV_SOURCES.PUBLIC_LITERAL,
  allowedValues: ["0", "1", "2", "3"],
};

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

  it("recognizes only canonical Apicity password references", () => {
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

  it("accepts the tracked policy and approved signature-type literal", () => {
    const envFile = readFileSync(
      new URL("../../.env", import.meta.url),
      "utf8"
    );
    const resolvedEnv = Object.fromEntries(
      parseEnvAssignments(envFile)
        .filter(
          ({ name }: { name: string }) =>
            OP_ENV_POLICY[name].source === OP_ENV_SOURCES.ONE_PASSWORD
        )
        .map(({ name }: { name: string }) => [name, `resolved-${name}`])
    );

    expect(validateOpEnv(envFile, resolvedEnv)).toEqual({
      ok: true,
      message: "Environment policy OK - all 1Password references resolved",
    });
  });

  it("rejects an unsupported public enum by variable name", () => {
    const privateValue = "not-for-error-output";

    const result = validateOpEnv(
      [
        "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
        "POLYMARKET_SIGNATURE_TYPE=4",
      ].join("\n"),
      { OPENAI_API_KEY: privateValue },
      {
        OPENAI_API_KEY: credential,
        POLYMARKET_SIGNATURE_TYPE: publicSignatureType,
      }
    );

    expect(result).toEqual({
      ok: false,
      message: "Invalid .env assignments: POLYMARKET_SIGNATURE_TYPE",
    });
    expect(result.message).not.toContain(privateValue);
  });

  it("rejects an arbitrary literal credential by variable name", () => {
    const literalCredential = "credential-that-must-not-appear";

    const result = validateOpEnv(
      `OPENAI_API_KEY=${literalCredential}`,
      { OPENAI_API_KEY: literalCredential },
      { OPENAI_API_KEY: credential }
    );

    expect(result).toEqual({
      ok: false,
      message: "Invalid .env assignments: OPENAI_API_KEY",
    });
    expect(result.message).not.toContain(literalCredential);
  });

  it("rejects a noncanonical one-password reference by variable name", () => {
    expect(
      validateOpEnv(
        "OPENAI_API_KEY=op://OtherVault/OPENAI_API_KEY/password",
        { OPENAI_API_KEY: "resolved-openai" },
        { OPENAI_API_KEY: credential }
      )
    ).toEqual({
      ok: false,
      message: "Invalid .env assignments: OPENAI_API_KEY",
    });
  });

  it("rejects missing policy coverage by variable name", () => {
    expect(
      validateOpEnv(
        [
          "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
          "XAI_API_KEY=op://Apicity/XAI_API_KEY/password",
        ].join("\n"),
        {
          OPENAI_API_KEY: "resolved-openai",
          XAI_API_KEY: "resolved-xai",
        },
        { OPENAI_API_KEY: credential }
      )
    ).toEqual({
      ok: false,
      message: "Environment policy missing: XAI_API_KEY",
    });
  });

  it("rejects stale policy coverage by variable name", () => {
    expect(
      validateOpEnv(
        "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
        { OPENAI_API_KEY: "resolved-openai" },
        {
          OPENAI_API_KEY: credential,
          XAI_API_KEY: credential,
        }
      )
    ).toEqual({
      ok: false,
      message: "Environment policy stale: XAI_API_KEY",
    });
  });

  it("detects unresolved one-password values only", () => {
    const assignments = parseEnvAssignments(
      [
        "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
        "XAI_API_KEY=op://Apicity/XAI_API_KEY/password",
      ].join("\n")
    );

    expect(
      findUnresolvedAssignments(assignments, {
        OPENAI_API_KEY: "op://Apicity/OPENAI_API_KEY/password",
        XAI_API_KEY: "",
      })
    ).toEqual(["OPENAI_API_KEY", "XAI_API_KEY"]);

    expect(
      validateOpEnv(
        [
          "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
          "POLYMARKET_SIGNATURE_TYPE=3",
        ].join("\n"),
        {},
        {
          OPENAI_API_KEY: credential,
          POLYMARKET_SIGNATURE_TYPE: publicSignatureType,
        }
      )
    ).toEqual({
      ok: false,
      message: "1Password did not resolve: OPENAI_API_KEY",
    });
  });
});
