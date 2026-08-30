/**
 * Pure classification for the npm publish credential check.
 *
 * This module does no I/O of any kind: it reads no files, spawns no processes
 * and computes no digests itself. `scripts/check-npm-auth.mjs` gathers the
 * facts and injects them, so the only token-shaped value this module ever sees
 * is `fingerprintToken`'s first argument — and that function is the one place
 * a token can enter. Nothing here ever puts a token into a message.
 */

export const NPM_AUTH_VERDICT = Object.freeze({
  OK: "ok",
  CREDENTIAL_REJECTED: "credential-rejected",
  REGISTRY_UNREACHABLE: "registry-unreachable",
  SECRET_MISSING: "secret-missing",
  SECRET_MALFORMED: "secret-malformed",
});

const SECRET_REFERENCE = "op://apicity/NPM_TOKEN/password";
const ROTATION_ANCHOR = "RELEASE.md#rotating-the-npm-publish-token";
const SHA256_PREFIX_LENGTH = 8;

/**
 * Reduce a token to a shape it cannot be reconstructed from: its length,
 * whether it carries npm's granular-token prefix, and the leading hex
 * characters of its digest. `hashFn` is injected so this module stays free of
 * any digest implementation and tests can pass a synthetic hash.
 */
export function fingerprintToken(value, hashFn) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  return {
    length: value.length,
    hasNpmPrefix: value.startsWith("npm_"),
    sha256Prefix: hashFn(value).slice(0, SHA256_PREFIX_LENGTH),
  };
}

function describeFingerprint(fingerprint) {
  return `${fingerprint.length} chars, sha256 ${fingerprint.sha256Prefix}`;
}

function sameCredential(left, right) {
  return (
    Boolean(left) && Boolean(right) && left.sha256Prefix === right.sha256Prefix
  );
}

/**
 * The host npm user config is reported on every verdict and never changes the
 * exit code — it is context for the operator, not a pass/fail signal.
 *
 * `cached` is tagged rather than a bare fingerprint on purpose. A file holding
 * `_authToken=` plus a variable reference is a template, not a cached
 * credential: npm interpolates it at read time. Comparing the file's raw bytes
 * against the resolved secret would report a divergence on every run of a
 * correctly configured host, forever.
 */
function cachedLines(cached, tokenFingerprint) {
  if (!cached || cached.kind === "absent") {
    return [];
  }

  if (cached.kind === "deferred") {
    const variable = `$${cached.variable}`;

    if (!cached.resolved) {
      return [
        `WARNING: the host npm user config defers to ${variable}, which is not set here.`,
        `  npm would send the unexpanded placeholder and collect a 401 that looks exactly`,
        `  like a dead token. Set ${variable} before reading anything into a manual npm call.`,
      ];
    }

    if (!tokenFingerprint) {
      return [
        `The host npm user config defers to ${variable} (${describeFingerprint(cached.resolved)}).`,
      ];
    }

    if (sameCredential(cached.resolved, tokenFingerprint)) {
      return [
        `The host npm user config defers to ${variable}, which resolves to the same`,
        `  credential as ${SECRET_REFERENCE} (sha256 ${cached.resolved.sha256Prefix}). No divergence.`,
      ];
    }

    return [
      `WARNING: the host npm user config defers to ${variable}, which resolves to a`,
      `  different credential (${describeFingerprint(cached.resolved)}) than`,
      `  ${SECRET_REFERENCE} (${describeFingerprint(tokenFingerprint)}).`,
      `  A manual npm call on this host would use that one; ${SECRET_REFERENCE} is authoritative.`,
    ];
  }

  if (cached.kind === "literal") {
    const hygiene = `  A token written into that file is a credential at rest in plaintext; prefer a variable reference.`;

    if (sameCredential(cached.fingerprint, tokenFingerprint)) {
      return [
        `The host npm user config holds a literal token matching ${SECRET_REFERENCE}`,
        `  (sha256 ${cached.fingerprint.sha256Prefix}).`,
        hygiene,
      ];
    }

    return [
      `WARNING: the host npm user config holds a literal token`,
      `  (${describeFingerprint(cached.fingerprint)}) that differs from ${SECRET_REFERENCE}.`,
      `  A manual npm call on this host would use that one; ${SECRET_REFERENCE} is authoritative.`,
      hygiene,
    ];
  }

  return [];
}

/**
 * Map the collected facts onto one verdict.
 *
 * The ping branch is deliberately checked before the auth branch: when the
 * registry is unreachable, a failed `npm whoami` says nothing about the
 * credential, and reporting "credential is dead" from a network outage is the
 * single most expensive way this check could be wrong.
 */
export function classifyNpmAuth({ tokenFingerprint, cached, whoami, ping }) {
  const result = decide({ tokenFingerprint, whoami, ping });

  return {
    ...result,
    ok: result.verdict === NPM_AUTH_VERDICT.OK,
    lines: [...result.lines, ...cachedLines(cached, tokenFingerprint)],
  };
}

function decide({ tokenFingerprint, whoami, ping }) {
  if (tokenFingerprint === null) {
    return {
      verdict: NPM_AUTH_VERDICT.SECRET_MISSING,
      exitCode: 3,
      lines: [
        `secret-missing: could not read ${SECRET_REFERENCE}.`,
        `  Check that the op CLI is installed and signed in, and that the item exists.`,
      ],
    };
  }

  if (tokenFingerprint.hasNpmPrefix === false) {
    return {
      verdict: NPM_AUTH_VERDICT.SECRET_MALFORMED,
      exitCode: 4,
      lines: [
        `secret-malformed: ${SECRET_REFERENCE} does not look like an npm token`,
        `  (${describeFingerprint(tokenFingerprint)}); expected an npm_-prefixed granular access token.`,
      ],
    };
  }

  if (whoami && whoami.ok) {
    return {
      verdict: NPM_AUTH_VERDICT.OK,
      exitCode: 0,
      lines: [
        `ok: ${SECRET_REFERENCE} authenticates to the npm registry as ${whoami.account}.`,
      ],
    };
  }

  if (ping && ping.ok === false) {
    return {
      verdict: NPM_AUTH_VERDICT.REGISTRY_UNREACHABLE,
      exitCode: 2,
      lines: [
        `registry-unreachable: the npm registry did not answer, so the credential could`,
        `  not be tested. This is not evidence that the token is bad. Retry when the`,
        `  network is healthy.`,
      ],
    };
  }

  if (whoami && whoami.kind === "auth") {
    return {
      verdict: NPM_AUTH_VERDICT.CREDENTIAL_REJECTED,
      exitCode: 1,
      lines: [
        `credential-rejected: the npm registry is reachable and healthy, and it refused`,
        `  ${SECRET_REFERENCE} (${describeFingerprint(tokenFingerprint)}).`,
        `  The token is expired or revoked. Rotate it: ${ROTATION_ANCHOR}`,
      ],
    };
  }

  return {
    verdict: NPM_AUTH_VERDICT.REGISTRY_UNREACHABLE,
    exitCode: 2,
    lines: [
      `registry-unreachable: npm whoami failed in a way this check cannot classify`,
      `  as either an auth failure or a network failure. Treating it as unproven`,
      `  rather than as a dead credential.`,
    ],
  };
}

export function renderNpmAuthMessage(result) {
  return result.lines.join("\n");
}
