import { describe, expect, it } from "vitest";

import {
  AUTH_CODES,
  NETWORK_CODES,
  NPM_AUTH_VERDICT,
  classifyHostNpmrc,
  classifyNpmAuth,
  fingerprintToken,
  npmErrorCode,
  npmErrorKind,
  parseAuthTokenLine,
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
const DEFERRED_DIVERGENT = {
  kind: "deferred",
  variable: "NPM_TOKEN",
  resolved: divergent,
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

describe("npmErrorCode", () => {
  it("prefers npm's own string code", () => {
    expect(npmErrorCode({ code: "E401" })).toBe("E401");
  });

  it("reports a killed child as a timeout", () => {
    expect(npmErrorCode({ killed: true, code: 143 })).toBe("ETIMEDOUT");
  });

  it("lifts the code out of stderr when error.code is numeric", () => {
    expect(
      npmErrorCode({ code: 1, stderr: "npm error code E401\nnpm error 401" })
    ).toBe("E401");
  });

  it("returns null when nothing names a code", () => {
    expect(
      npmErrorCode({ code: 1, stderr: "npm error 500 Internal Server Error" })
    ).toBeNull();
    expect(npmErrorCode({})).toBeNull();
  });
});

// BR-3's other half. The verdict ladder can only reach `credential-rejected`
// through `kind: "auth"`, so which npm failures become "auth" is the decision
// that decides whether an outage can be reported as a dead token. Anything
// unrecognised must land on "other", which the ladder reports as unproven.
describe("npmErrorKind", () => {
  const CASES: Array<[string, Record<string, unknown>, string]> = [
    ["E401", { code: "E401" }, "auth"],
    ["E403", { code: "E403" }, "auth"],
    ["ENEEDAUTH", { code: "ENEEDAUTH" }, "auth"],
    [
      "E401 named only in stderr",
      { code: 1, stderr: "npm error code E401" },
      "auth",
    ],
    ["ENOTFOUND", { code: "ENOTFOUND" }, "network"],
    ["ETIMEDOUT", { code: "ETIMEDOUT" }, "network"],
    ["ECONNREFUSED", { code: "ECONNREFUSED" }, "network"],
    ["EAI_AGAIN", { code: "EAI_AGAIN" }, "network"],
    ["a killed child", { killed: true }, "network"],
    ["E500", { code: "E500" }, "other"],
    ["an uncoded failure", { code: 1, stderr: "npm error 500" }, "other"],
    ["an empty error", {}, "other"],
  ];

  for (const [label, error, kind] of CASES) {
    it(`classifies ${label} as ${kind}`, () => {
      expect(npmErrorKind(error)).toBe(kind);
    });
  }

  it("covers every code in both exported sets, and they do not overlap", () => {
    for (const code of AUTH_CODES) {
      expect(npmErrorKind({ code })).toBe("auth");
    }

    for (const code of NETWORK_CODES) {
      expect(npmErrorKind({ code })).toBe("network");
    }

    expect([...AUTH_CODES].some((code) => NETWORK_CODES.has(code))).toBe(false);
  });
});

describe("parseAuthTokenLine", () => {
  it("returns null when no line assigns a token", () => {
    expect(
      parseAuthTokenLine("registry=https://registry.npmjs.org/\n")
    ).toBeNull();
    expect(parseAuthTokenLine("")).toBeNull();
  });

  it("reads a registry-scoped assignment and strips the quotes npm tolerates", () => {
    expect(
      parseAuthTokenLine(
        `//registry.npmjs.org/:_authToken="${AUTHORITATIVE_TOKEN}"\n`
      )
    ).toBe(AUTHORITATIVE_TOKEN);
  });

  it("skips commented-out assignments", () => {
    expect(
      parseAuthTokenLine(
        `; //registry.npmjs.org/:_authToken=${DIVERGENT_TOKEN}\n` +
          `# _authToken=${LEGACY_TOKEN}\n`
      )
    ).toBeNull();
  });

  it("is last-wins across registries", () => {
    // RR-1, pinned as the behaviour that ships today rather than endorsed: a
    // later unrelated registry's token becomes the reported host state.
    expect(
      parseAuthTokenLine(
        `//registry.npmjs.org/:_authToken=${AUTHORITATIVE_TOKEN}\n` +
          `//npm.pkg.github.com/:_authToken=${DIVERGENT_TOKEN}\n`
      )
    ).toBe(DIVERGENT_TOKEN);
  });
});

describe("classifyHostNpmrc", () => {
  const lookupEnv = (name: string): string | undefined =>
    name === "NPM_TOKEN" ? AUTHORITATIVE_TOKEN : undefined;

  it("tags a missing or empty value as absent", () => {
    expect(classifyHostNpmrc(null, lookupEnv, syntheticHash)).toEqual(ABSENT);
    expect(classifyHostNpmrc("", lookupEnv, syntheticHash)).toEqual(ABSENT);
  });

  it("tags a variable reference as deferred and fingerprints what it resolves to", () => {
    expect(classifyHostNpmrc("${NPM_TOKEN}", lookupEnv, syntheticHash)).toEqual(
      DEFERRED_MATCHING
    );
  });

  it("leaves a deferred reference unresolved when the variable is unset", () => {
    expect(
      classifyHostNpmrc("${UNSET_TOKEN}", lookupEnv, syntheticHash)
    ).toEqual({ kind: "deferred", variable: "UNSET_TOKEN", resolved: null });
  });

  it("tags a raw value as literal and keeps only its fingerprint", () => {
    const result = classifyHostNpmrc(DIVERGENT_TOKEN, lookupEnv, syntheticHash);

    expect(result).toEqual(LITERAL_DIFFERING);
    // The host npmrc is the one path a second raw token travels. It must not
    // survive into the tagged state the renderer reads.
    expectNoTokenLeak(JSON.stringify(result));
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

  it("tells the operator how to fix a deferred reference that diverges", () => {
    const result = classify({ cached: DEFERRED_DIVERGENT });
    const message = renderNpmAuthMessage(result);

    expect(result.exitCode).toBe(1);
    expect(message).toContain("WARNING");
    expect(message).toContain("different credential");
    expect(message).toContain('export NPM_TOKEN="$(op read');
    expect(message).toContain("redeploy");
    expectNoTokenLeak(message);
  });

  it("keeps a divergent deferred reference a warning, not a failure", () => {
    const result = classify({
      cached: DEFERRED_DIVERGENT,
      whoami: { ok: true, account: "apicity-publisher" },
      ping: null,
    });
    const message = renderNpmAuthMessage(result);

    expect(result.exitCode).toBe(0);
    expect(result.ok).toBe(true);
    expect(message).toContain("export NPM_TOKEN=");
    // Asserted here, not in the block above: that one runs the default
    // `credential-rejected` verdict, whose own line already emits
    // ROTATION_ANCHOR, so the same assertion there would pass with the remedy
    // deleted. On this passing verdict the anchor can only come from the remedy.
    expect(message).toContain("RELEASE.md#rotating-the-npm-publish-token");
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
