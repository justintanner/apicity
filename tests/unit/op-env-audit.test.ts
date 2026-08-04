import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  auditOpEnv,
  isExactSentinelOutput,
  OP_ENV_AUDIT_DISPOSITIONS,
  OP_ENV_AUDIT_SENTINEL,
  renderAuditErrors,
  renderAuditResult,
} from "../../scripts/lib/audit-op-env.mjs";
import { parseEnvAssignments } from "../../scripts/lib/check-op.mjs";
import {
  OP_ENV_CLASSIFICATIONS,
  OP_ENV_POLICY,
  OP_ENV_SOURCES,
} from "../../scripts/lib/op-env-policy.mjs";

const credential = {
  classification: OP_ENV_CLASSIFICATIONS.CREDENTIAL,
  source: OP_ENV_SOURCES.ONE_PASSWORD,
} as const;
const sensitiveMetadata = {
  classification: OP_ENV_CLASSIFICATIONS.SENSITIVE_METADATA,
  source: OP_ENV_SOURCES.ONE_PASSWORD,
} as const;
const publicMetadata = {
  classification: OP_ENV_CLASSIFICATIONS.PUBLIC_METADATA,
  source: OP_ENV_SOURCES.ONE_PASSWORD,
} as const;
const publicLiteral = {
  classification: OP_ENV_CLASSIFICATIONS.PUBLIC_METADATA,
  source: OP_ENV_SOURCES.PUBLIC_LITERAL,
  allowedValues: ["0", "1", "2", "3"],
} as const;

describe("1Password environment audit", () => {
  it("enumerates each active reference once and classifies Unicode short hits", async () => {
    const envFile = [
      "PUBLIC_SHORT=op://Apicity/PUBLIC_SHORT/password",
      "CREDENTIAL_SHORT=op://Apicity/CREDENTIAL_SHORT/password",
      "SENSITIVE_LONG=op://Apicity/SENSITIVE_LONG/password",
      "PUBLIC_LITERAL=3",
    ].join("\n");
    const policy = {
      PUBLIC_SHORT: publicMetadata,
      CREDENTIAL_SHORT: credential,
      SENSITIVE_LONG: sensitiveMetadata,
      PUBLIC_LITERAL: publicLiteral,
    };
    const values = new Map([
      ["op://Apicity/PUBLIC_SHORT/password", "🗝"],
      ["op://Apicity/CREDENTIAL_SHORT/password", "🧪🧿"],
      ["op://Apicity/SENSITIVE_LONG/password", "private-long-value"],
    ]);
    const resolveReference = vi.fn(async (reference: string) => {
      const value = values.get(reference);

      if (value === undefined) {
        throw new Error("unexpected reference");
      }

      return value;
    });

    const result = await auditOpEnv(envFile, {
      policy,
      resolveReference,
      runSentinel: async () => Buffer.from(OP_ENV_AUDIT_SENTINEL),
    });

    expect(resolveReference.mock.calls.map(([reference]) => reference)).toEqual(
      [...values.keys()]
    );
    expect(result).toEqual({
      ok: false,
      entries: [
        {
          name: "PUBLIC_SHORT",
          classification: OP_ENV_CLASSIFICATIONS.PUBLIC_METADATA,
          length: 1,
          disposition: OP_ENV_AUDIT_DISPOSITIONS.REMOVE_FROM_SECRET_INJECTION,
        },
        {
          name: "CREDENTIAL_SHORT",
          classification: OP_ENV_CLASSIFICATIONS.CREDENTIAL,
          length: 2,
          disposition: OP_ENV_AUDIT_DISPOSITIONS.UNRESOLVED_CONCEALMENT_RISK,
        },
        {
          name: "SENSITIVE_LONG",
          classification: OP_ENV_CLASSIFICATIONS.SENSITIVE_METADATA,
          length: 18,
          disposition: OP_ENV_AUDIT_DISPOSITIONS.NO_ACTION_REQUIRED,
        },
      ],
      sentinel: "pass",
      errors: [],
    });

    const rendered = [
      renderAuditResult(result),
      ...renderAuditErrors(result),
      JSON.stringify(result),
    ].join("\n");

    for (const value of values.values()) {
      expect(rendered).not.toContain(value);
    }
  });

  it("covers the complete tracked one-password population", async () => {
    const envFile = readFileSync(
      new URL("../../.env", import.meta.url),
      "utf8"
    );
    const expectedReferences = parseEnvAssignments(envFile).filter(
      ({ name }: { name: string }) =>
        OP_ENV_POLICY[name].source === OP_ENV_SOURCES.ONE_PASSWORD
    );
    const resolveReference = vi.fn(async (reference: string) => {
      return `fake-resolved-value-for-${reference.length}`;
    });

    const result = await auditOpEnv(envFile, {
      resolveReference,
      runSentinel: async () => OP_ENV_AUDIT_SENTINEL,
    });

    expect(result.ok).toBe(true);
    expect(result.entries.map(({ name }: { name: string }) => name)).toEqual(
      expectedReferences.map(({ name }: { name: string }) => name)
    );
    expect(resolveReference).toHaveBeenCalledTimes(expectedReferences.length);
    expect(
      new Set(resolveReference.mock.calls.map(([reference]) => reference))
    ).toHaveLength(expectedReferences.length);
  });

  it("fails closed on missing policy before resolving any value", async () => {
    const resolveReference = vi.fn(async () => "must-not-be-resolved");
    const runSentinel = vi.fn(async () => OP_ENV_AUDIT_SENTINEL);
    const result = await auditOpEnv(
      [
        "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
        "XAI_API_KEY=op://Apicity/XAI_API_KEY/password",
      ].join("\n"),
      {
        policy: { OPENAI_API_KEY: credential },
        resolveReference,
        runSentinel,
      }
    );

    expect(result.ok).toBe(false);
    expect(result.entries).toEqual([]);
    expect(result.sentinel).toBe("not_run");
    expect(renderAuditErrors(result)).toEqual([
      "Environment policy missing: XAI_API_KEY",
    ]);
    expect(resolveReference).not.toHaveBeenCalled();
    expect(runSentinel).not.toHaveBeenCalled();
  });

  it("sanitizes resolution failures without stopping later entries", async () => {
    const leakedValue = "resolved-value-from-child";
    const envFile = [
      "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
      "XAI_API_KEY=op://Apicity/XAI_API_KEY/password",
    ].join("\n");
    const resolveReference = vi.fn(async (reference: string) => {
      if (reference.includes("OPENAI")) {
        const error = new Error(`child failed with ${leakedValue}`);
        Object.assign(error, {
          stdout: leakedValue,
          stderr: `stderr-${leakedValue}`,
        });
        throw error;
      }

      return "another-private-value";
    });

    const result = await auditOpEnv(envFile, {
      policy: {
        OPENAI_API_KEY: credential,
        XAI_API_KEY: credential,
      },
      resolveReference,
      runSentinel: async () => OP_ENV_AUDIT_SENTINEL,
    });
    const rendered = [
      renderAuditResult(result),
      ...renderAuditErrors(result),
      JSON.stringify(result),
    ].join("\n");

    expect(result.ok).toBe(false);
    expect(resolveReference).toHaveBeenCalledTimes(2);
    expect(result.entries[0]).toEqual({
      name: "OPENAI_API_KEY",
      classification: OP_ENV_CLASSIFICATIONS.CREDENTIAL,
      length: null,
      disposition: OP_ENV_AUDIT_DISPOSITIONS.RESOLUTION_FAILED,
    });
    expect(renderAuditErrors(result)).toContain(
      "1Password resolution failed: OPENAI_API_KEY"
    );
    expect(rendered).not.toContain(leakedValue);
    expect(rendered).not.toContain("another-private-value");
    expect(rendered).not.toContain("child failed");
  });

  it("accepts only the exact sentinel bytes and retains no mismatch", async () => {
    expect(isExactSentinelOutput(Buffer.from(OP_ENV_AUDIT_SENTINEL))).toBe(
      true
    );
    expect(isExactSentinelOutput(`${OP_ENV_AUDIT_SENTINEL}\n`)).toBe(false);
    expect(
      isExactSentinelOutput(
        OP_ENV_AUDIT_SENTINEL.replace("3", "<concealed by 1Password>")
      )
    ).toBe(false);

    const mismatch = "sentinel-output-that-must-not-render";
    const result = await auditOpEnv(
      "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
      {
        policy: { OPENAI_API_KEY: credential },
        resolveReference: async () => "private-value-longer-than-two",
        runSentinel: async () => mismatch,
      }
    );
    const rendered = [
      renderAuditResult(result),
      ...renderAuditErrors(result),
      JSON.stringify(result),
    ].join("\n");

    expect(result.ok).toBe(false);
    expect(result.sentinel).toBe("fail");
    expect(renderAuditErrors(result)).toContain(
      "1Password sentinel check failed"
    );
    expect(rendered).not.toContain(mismatch);
    expect(rendered).not.toContain("private-value-longer-than-two");
  });
});
