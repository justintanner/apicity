import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  advisoryGhsaId,
  applyAuditExceptions,
  auditReport,
  parseAuditExceptions,
} from "../../scripts/audit.mjs";

const PICOMATCH = {
  id: 1247710,
  packageName: "picomatch",
  severity: "high",
  title:
    "picomatch vulnerable to ReDoS through single-branch repeated extglobs",
  url: "https://github.com/advisories/GHSA-fc5q-39xc-vjpf",
};
const OTHER = {
  id: 7,
  packageName: "picomatch",
  severity: "moderate",
  title: "Another picomatch issue",
  url: "https://github.com/advisories/GHSA-2222-3333-4444",
};
const EXCEPTION = {
  advisory: "GHSA-fc5q-39xc-vjpf",
  package: "picomatch",
  reason: "No patched release exists. Operator decision ac-p48wtr.",
  expires: "2026-12-02",
};

function file(entries: unknown): string {
  return JSON.stringify({ exceptions: entries });
}

function texts(report: { lines: { text: string }[] }): string {
  return report.lines.map((line) => line.text).join("\n");
}

describe("audit exception file", () => {
  it("parses a valid entry", () => {
    expect(parseAuditExceptions(file([EXCEPTION]))).toEqual([EXCEPTION]);
    expect(parseAuditExceptions(file([]))).toEqual([]);
  });

  it.each([
    ["invalid JSON", "{", "not valid JSON"],
    ["a bare array", "[]", 'only key is "exceptions"'],
    ["an extra top-level key", '{"exceptions":[],"x":1}', "only key"],
    ["a non-array list", '{"exceptions":{}}', "only key"],
    ["a non-object entry", file(["x"]), "exceptions[0] must be an object"],
    [
      "a missing advisory",
      file([{ ...EXCEPTION, advisory: undefined }]),
      "exceptions[0].advisory",
    ],
    [
      "a missing package",
      file([{ ...EXCEPTION, package: undefined }]),
      "exceptions[0].package",
    ],
    ["an empty reason", file([{ ...EXCEPTION, reason: " " }]), ".reason"],
    [
      "a missing expiry",
      file([{ ...EXCEPTION, expires: undefined }]),
      "exceptions[0].expires",
    ],
    [
      "a misspelled expiry field",
      file([{ ...EXCEPTION, expires: undefined, expiry: "2026-12-02" }]),
      "exceptions[0].expires",
    ],
    [
      "an unknown field",
      file([{ ...EXCEPTION, severity: "high" }]),
      "unknown field(s): severity",
    ],
    [
      "a non-GHSA advisory id",
      file([{ ...EXCEPTION, advisory: "CVE-2026-112366" }]),
      "must be a GHSA id",
    ],
    [
      "a numeric feed id",
      file([{ ...EXCEPTION, advisory: 1247710 }]),
      "exceptions[0].advisory",
    ],
    [
      "an impossible date",
      file([{ ...EXCEPTION, expires: "2026-02-30" }]),
      "real UTC date",
    ],
    [
      "a date-time",
      file([{ ...EXCEPTION, expires: "2026-12-02T00:00:00Z" }]),
      "real UTC date",
    ],
    [
      "a repeated entry",
      file([EXCEPTION, { ...EXCEPTION, reason: "again" }]),
      "exceptions[1] repeats GHSA-fc5q-39xc-vjpf on picomatch",
    ],
  ])("rejects %s", (_name, text, message) => {
    expect(() => parseAuditExceptions(text)).toThrow(message);
  });

  it("reads the GHSA id from a bulk feed advisory URL", () => {
    expect(advisoryGhsaId(PICOMATCH.url)).toBe("ghsa-fc5q-39xc-vjpf");
    expect(
      advisoryGhsaId("https://github.com/advisories/ghsa-FC5Q-39xc-vjpf/")
    ).toBe("ghsa-fc5q-39xc-vjpf");
    expect(advisoryGhsaId("https://example.test/GHSA-fc5q-39xc-vjpf")).toBe(
      null
    );
    expect(advisoryGhsaId(undefined)).toBe(null);
    expect(advisoryGhsaId(1247710)).toBe(null);
  });
});

describe("audit exceptions applied to findings", () => {
  it("lets the excepted advisory through and prints it", () => {
    const report = auditReport(
      [PICOMATCH],
      [EXCEPTION],
      "2026-11-18",
      "moderate"
    );
    expect(report.failed).toBe(false);
    const printed = texts(report);
    expect(printed).toContain(
      "- high picomatch: picomatch vulnerable to ReDoS through single-branch repeated extglobs (https://github.com/advisories/GHSA-fc5q-39xc-vjpf)"
    );
    expect(printed).toContain("excepted until 2026-12-02 (14 days left)");
    expect(printed).toContain(EXCEPTION.reason);
    expect(printed).not.toContain("No known vulnerabilities found");
    expect(report.lines.at(-1)).toEqual({
      stream: "log",
      text: "No other known vulnerabilities found",
    });
  });

  it("honors the exception through the day before it expires", () => {
    const last = auditReport(
      [PICOMATCH],
      [EXCEPTION],
      "2026-12-01",
      "moderate"
    );
    expect(last.failed).toBe(false);
    expect(texts(last)).toContain("(1 day left)");
  });

  it.each(["2026-12-02", "2026-12-03", "2027-01-01"])(
    "fails from the expiry date on (%s)",
    (today) => {
      const result = applyAuditExceptions([PICOMATCH], [EXCEPTION], today);
      expect(result.blocking).toEqual([PICOMATCH]);
      expect(result.excepted).toEqual([]);
      expect(result.problems).toHaveLength(1);
      expect(result.problems[0]).toContain(
        "GHSA-fc5q-39xc-vjpf on picomatch expired on 2026-12-02"
      );

      const report = auditReport([PICOMATCH], [EXCEPTION], today, "moderate");
      expect(report.failed).toBe(true);
      expect(texts(report)).toContain("1 moderate-or-higher vulnerability");
    }
  );

  it("fails on an expired exception even when nothing matches it", () => {
    const report = auditReport([], [EXCEPTION], "2026-12-02", "moderate");
    expect(report.failed).toBe(true);
    expect(texts(report)).toContain("expired on 2026-12-02");
  });

  it("fails on an exception that matches nothing", () => {
    const report = auditReport([], [EXCEPTION], "2026-11-18", "moderate");
    expect(report.failed).toBe(true);
    expect(texts(report)).toContain(
      "GHSA-fc5q-39xc-vjpf on picomatch matches no current advisory"
    );
    expect(texts(report)).not.toContain("vulnerabilities found");
  });

  it("still fails on any other advisory, and still prints the exception", () => {
    const report = auditReport(
      [PICOMATCH, OTHER],
      [EXCEPTION],
      "2026-11-18",
      "moderate"
    );
    expect(report.failed).toBe(true);
    const printed = texts(report);
    expect(printed).toContain("excepted until 2026-12-02");
    expect(printed).toContain("1 moderate-or-higher vulnerability found:");
    expect(printed).toContain(
      "- moderate picomatch: Another picomatch issue (https://github.com/advisories/GHSA-2222-3333-4444)"
    );
  });

  it("does not cover the same advisory id on another package", () => {
    const elsewhere = { ...PICOMATCH, packageName: "micromatch" };
    const result = applyAuditExceptions([elsewhere], [EXCEPTION], "2026-11-18");
    expect(result.blocking).toEqual([elsewhere]);
    expect(result.problems[0]).toContain("matches no current advisory");
  });

  it("does not cover an advisory whose URL carries no GHSA id", () => {
    const bare = { ...PICOMATCH, url: undefined };
    const result = applyAuditExceptions([bare], [EXCEPTION], "2026-11-18");
    expect(result.blocking).toEqual([bare]);
    expect(result.excepted).toEqual([]);
  });

  it("keeps the gate's output unchanged when there are no exceptions", () => {
    expect(auditReport([], [], "2026-11-18", "moderate")).toEqual({
      failed: false,
      lines: [{ stream: "log", text: "No known vulnerabilities found" }],
    });
    expect(
      auditReport([PICOMATCH, OTHER], [], "2026-11-18", "moderate")
    ).toEqual({
      failed: true,
      lines: [
        {
          stream: "error",
          text: "2 moderate-or-higher vulnerabilities found:",
        },
        {
          stream: "error",
          text: "- high picomatch: picomatch vulnerable to ReDoS through single-branch repeated extglobs (https://github.com/advisories/GHSA-fc5q-39xc-vjpf)",
        },
        {
          stream: "error",
          text: "- moderate picomatch: Another picomatch issue (https://github.com/advisories/GHSA-2222-3333-4444)",
        },
      ],
    });
  });

  it("rejects a malformed audit date", () => {
    expect(() => applyAuditExceptions([], [], "18-11-2026")).toThrow(
      "Invalid audit date"
    );
  });
});

describe("checked-in audit exceptions", () => {
  // Static pin, never compared with the clock: widening or renewing the
  // exception has to change this test as well as the file.
  it("holds exactly the one operator-approved entry", () => {
    const entries = parseAuditExceptions(
      readFileSync(
        new URL("../../scripts/audit-exceptions.json", import.meta.url),
        "utf8"
      )
    );
    expect(entries).toEqual([
      {
        advisory: "GHSA-fc5q-39xc-vjpf",
        package: "picomatch",
        reason: expect.stringContaining("ac-p48wtr"),
        expires: "2026-12-02",
      },
    ]);
  });
});
