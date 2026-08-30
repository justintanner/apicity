import { describe, expect, it } from "vitest";

import {
  NPM_AUTH_VERDICT,
  classifyNpmAuth,
  fingerprintToken,
  renderNpmAuthMessage,
} from "../../scripts/lib/check-npm-auth.mjs";

// Synthetic, deterministic stand-in for the sha256 the CLI injects. It hashes
// the reversed string so tokens that share npm's `npm_` prefix still produce
// different eight-character prefixes — a forward byte-wise hash would collide
// on the prefix and quietly make every divergence assertion vacuous.
const syntheticHash = (value: string): string => {
  let hex = "";

  for (const char of [...value].reverse()) {
    hex += char.charCodeAt(0).toString(16).padStart(2, "0");
  }

  return hex.padEnd(8, "0");
};

const AUTHORITATIVE_TOKEN = "npm_authoritative-secret-alpha";
const DIVERGENT_TOKEN = "npm_some-other-secret-bravo";
const LEGACY_TOKEN = "0f1e2d3c-legacy-classic-token";

interface TokenFingerprint {
  length: number;
  hasNpmPrefix: boolean;
  sha256Prefix: string;
}

// `fingerprintToken` returns `TokenFingerprint | null`, so narrow once here
// rather than asserting non-null at every property access below.
const fingerprintOf = (token: string): TokenFingerprint => {
  const fingerprint = fingerprintToken(token, syntheticHash);

  if (fingerprint === null) {
    throw new Error("fingerprintToken returned null for a non-empty token");
  }

  return fingerprint;
};

const authoritative = fingerprintOf(AUTHORITATIVE_TOKEN);
const divergent = fingerprintOf(DIVERGENT_TOKEN);

const HEALTHY_PING = { ok: true };
const REJECTED = { ok: false, kind: "auth" };

const ABSENT = { kind: "absent" };
const DEFERRED_MATCHING = {
  kind: "deferred",
  variable: "NPM_TOKEN",
  resolved: authoritative,
};
const DEFERRED_UNSET = {
  kind: "deferred",
  variable: "NPM_TOKEN",
  resolved: null,
};
const LITERAL_MATCHING = { kind: "literal", fingerprint: authoritative };
const LITERAL_DIFFERING = { kind: "literal", fingerprint: divergent };

const classify = (overrides: Record<string, unknown>) =>
  classifyNpmAuth({
    tokenFingerprint: authoritative,
    cached: ABSENT,
    whoami: REJECTED,
    ping: HEALTHY_PING,
    ...overrides,
  });

const messageOf = (overrides: Record<string, unknown>): string =>
  renderNpmAuthMessage(classify(overrides));

// Every token-shaped string this file invents. No rendered message may contain
// any of them, whatever the verdict or host-npmrc state.
const SYNTHETIC_TOKENS = [AUTHORITATIVE_TOKEN, DIVERGENT_TOKEN, LEGACY_TOKEN];

const expectNoTokenLeak = (message: string): void => {
  for (const token of SYNTHETIC_TOKENS) {
    expect(message).not.toContain(token);
  }
};

describe("fingerprintToken", () => {
  it("returns null for a missing or empty secret", () => {
    expect(fingerprintToken(undefined, syntheticHash)).toBeNull();
    expect(fingerprintToken(null, syntheticHash)).toBeNull();
    expect(fingerprintToken("", syntheticHash)).toBeNull();
  });

  it("exposes only fields the token cannot be reconstructed from", () => {
    expect(Object.keys(authoritative).sort()).toEqual([
      "hasNpmPrefix",
      "length",
      "sha256Prefix",
    ]);
    expect(authoritative.length).toBe(AUTHORITATIVE_TOKEN.length);
    expect(authoritative.hasNpmPrefix).toBe(true);
    expect(authoritative.sha256Prefix).toHaveLength(8);
    expectNoTokenLeak(JSON.stringify(authoritative));
  });

  it("flags a token without npm's granular-token prefix", () => {
    expect(fingerprintOf(LEGACY_TOKEN).hasNpmPrefix).toBe(false);
  });

  it("gives different credentials different digest prefixes", () => {
    expect(authoritative.sha256Prefix).not.toBe(divergent.sha256Prefix);
  });
});

describe("classifyNpmAuth verdicts", () => {
  it("reports secret-missing when 1Password yielded nothing", () => {
    const result = classify({ tokenFingerprint: null });
    const message = renderNpmAuthMessage(result);

    expect(result.verdict).toBe(NPM_AUTH_VERDICT.SECRET_MISSING);
    expect(result.exitCode).toBe(3);
    expect(result.ok).toBe(false);
    expect(message).toContain("op://apicity/NPM_TOKEN/password");
    expect(message).toContain("op CLI");
    expectNoTokenLeak(message);
  });

  it("reports secret-malformed when the stored value is not an npm token", () => {
    const result = classify({
      tokenFingerprint: fingerprintOf(LEGACY_TOKEN),
    });
    const message = renderNpmAuthMessage(result);

    expect(result.verdict).toBe(NPM_AUTH_VERDICT.SECRET_MALFORMED);
    expect(result.exitCode).toBe(4);
    expectNoTokenLeak(message);
  });

  it("reports ok and names the account when npm whoami succeeds", () => {
    const result = classify({
      whoami: { ok: true, account: "apicity-publisher" },
      ping: null,
    });
    const message = renderNpmAuthMessage(result);

    expect(result.verdict).toBe(NPM_AUTH_VERDICT.OK);
    expect(result.exitCode).toBe(0);
    expect(result.ok).toBe(true);
    expect(message).toContain("apicity-publisher");
    expectNoTokenLeak(message);
  });

  it("reports credential-rejected only when the registry is proven healthy", () => {
    const result = classify({ whoami: REJECTED, ping: HEALTHY_PING });
    const message = renderNpmAuthMessage(result);

    expect(result.verdict).toBe(NPM_AUTH_VERDICT.CREDENTIAL_REJECTED);
    expect(result.exitCode).toBe(1);
    expect(message).toContain("healthy");
    expect(message).toContain("RELEASE.md#rotating-the-npm-publish-token");
    expectNoTokenLeak(message);
  });

  it("prefers registry-unreachable over credential-rejected when the ping fails", () => {
    const result = classify({ whoami: REJECTED, ping: { ok: false } });
    const message = renderNpmAuthMessage(result);

    // BR-3: a network outage must never be reported as a dead credential.
    expect(result.verdict).toBe(NPM_AUTH_VERDICT.REGISTRY_UNREACHABLE);
    expect(result.exitCode).toBe(2);
    expect(message).not.toContain("credential-rejected");
    expectNoTokenLeak(message);
  });

  it("reports an unclassifiable npm failure as registry-unreachable", () => {
    const result = classify({
      whoami: { ok: false, kind: "other" },
      ping: HEALTHY_PING,
    });
    const message = renderNpmAuthMessage(result);

    expect(result.verdict).toBe(NPM_AUTH_VERDICT.REGISTRY_UNREACHABLE);
    expect(result.exitCode).toBe(2);
    expectNoTokenLeak(message);
  });
});

describe("classifyNpmAuth host npm user config reporting", () => {
  it("says nothing when the host has no npm user config token", () => {
    const withAbsent = classify({ cached: ABSENT });
    const message = renderNpmAuthMessage(withAbsent);

    expect(withAbsent.exitCode).toBe(1);
    expect(message).not.toContain("npm user config");
    expectNoTokenLeak(message);
  });

  it("reports a deferred reference that resolves to the same credential", () => {
    const result = classify({ cached: DEFERRED_MATCHING });
    const message = renderNpmAuthMessage(result);

    expect(result.exitCode).toBe(1);
    expect(message).toContain("defers to $NPM_TOKEN");
    expect(message).toContain("No divergence");
    expect(message).not.toContain("WARNING");
    expectNoTokenLeak(message);
  });

  it("calls out a deferred reference whose variable is unset", () => {
    const result = classify({ cached: DEFERRED_UNSET });
    const message = renderNpmAuthMessage(result);

    expect(result.exitCode).toBe(1);
    expect(message).toContain("WARNING");
    expect(message).toContain("$NPM_TOKEN");
    expect(message).toContain("401");
    expectNoTokenLeak(message);
  });

  it("reports a matching literal token as a hygiene finding", () => {
    const result = classify({ cached: LITERAL_MATCHING });
    const message = renderNpmAuthMessage(result);

    expect(result.exitCode).toBe(1);
    expect(message).toContain("literal token matching");
    expect(message).toContain("plaintext");
    expect(message).not.toContain("WARNING");
    expectNoTokenLeak(message);
  });

  it("warns when a literal token differs from the authoritative secret", () => {
    const result = classify({ cached: LITERAL_DIFFERING });
    const message = renderNpmAuthMessage(result);

    expect(result.exitCode).toBe(1);
    expect(message).toContain("WARNING");
    expect(message).toContain("differs from op://apicity/NPM_TOKEN/password");
    expect(message).toContain("authoritative");
    expectNoTokenLeak(message);
  });

  it("appends the host line to a passing verdict without changing the exit code", () => {
    const passing = {
      whoami: { ok: true, account: "apicity-publisher" },
      ping: null,
    };
    const clean = classify({ ...passing, cached: ABSENT });
    const noisy = classify({ ...passing, cached: LITERAL_DIFFERING });

    expect(clean.exitCode).toBe(0);
    expect(noisy.exitCode).toBe(0);
    expect(noisy.ok).toBe(true);
    expect(noisy.lines.length).toBeGreaterThan(clean.lines.length);
    expect(renderNpmAuthMessage(noisy)).toContain("WARNING");
    expectNoTokenLeak(renderNpmAuthMessage(noisy));
  });

  it("reports the host config on every verdict", () => {
    const verdicts = [
      { tokenFingerprint: null },
      { tokenFingerprint: fingerprintOf(LEGACY_TOKEN) },
      { whoami: { ok: true, account: "apicity-publisher" }, ping: null },
      { whoami: REJECTED, ping: { ok: false } },
      { whoami: REJECTED, ping: HEALTHY_PING },
    ];

    for (const verdict of verdicts) {
      const message = messageOf({ ...verdict, cached: DEFERRED_MATCHING });

      expect(message).toContain("defers to $NPM_TOKEN");
      expectNoTokenLeak(message);
    }
  });
});

describe("renderNpmAuthMessage", () => {
  it("joins the classifier's lines", () => {
    const result = classify({});

    expect(renderNpmAuthMessage(result)).toBe(result.lines.join("\n"));
  });
});
