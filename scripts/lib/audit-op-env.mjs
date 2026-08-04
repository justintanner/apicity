import { execFile } from "node:child_process";

import { parseEnvAssignments, validateOpEnv } from "./check-op.mjs";
import {
  OP_ENV_CLASSIFICATIONS,
  OP_ENV_POLICY,
  OP_ENV_SOURCES,
} from "./op-env-policy.mjs";

export const OP_ENV_AUDIT_SENTINEL = "apicity-op-sentinel:0123456789";

export const OP_ENV_AUDIT_DISPOSITIONS = Object.freeze({
  NO_ACTION_REQUIRED: "no_action_required",
  REMOVE_FROM_SECRET_INJECTION: "remove_from_secret_injection",
  UNRESOLVED_CONCEALMENT_RISK: "unresolved_concealment_risk",
  RESOLUTION_FAILED: "resolution_failed",
});

const concealmentMarker = Buffer.from("<concealed by 1Password>", "utf8");
const expectedSentinel = Buffer.from(OP_ENV_AUDIT_SENTINEL, "utf8");

/**
 * @typedef {object} AuditEntry
 * @property {string} name
 * @property {string} classification
 * @property {number | null} length
 * @property {string} disposition
 */

/**
 * @typedef {object} AuditError
 * @property {"policy_validation_failed" | "resolution_failed" |
 *   "sentinel_failed"} code
 * @property {string} [name]
 * @property {string} [message]
 */

/**
 * @typedef {object} AuditResult
 * @property {boolean} ok
 * @property {AuditEntry[]} entries
 * @property {"pass" | "fail" | "not_run"} sentinel
 * @property {AuditError[]} errors
 */

/**
 * Resolve one reference without a shell. Child output is captured by
 * `execFile`; only stdout is returned to the caller, and child errors are
 * replaced with a value-free error.
 *
 * @param {string} reference
 * @param {typeof execFile} [execFileImpl]
 * @returns {Promise<string>}
 */
export function resolveOnePasswordReference(
  reference,
  execFileImpl = execFile
) {
  return new Promise((resolve, reject) => {
    execFileImpl(
      "op",
      ["read", "--no-newline", reference],
      { encoding: "utf8", maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(new Error("1Password reference resolution failed"));
          return;
        }

        resolve(stdout);
      }
    );
  });
}

/**
 * Run the decimal sentinel under normal 1Password masking. Neither mismatched
 * output nor child errors are included in the returned error.
 *
 * @param {object} [options]
 * @param {typeof execFile} [options.execFileImpl]
 * @param {string} [options.envFilePath]
 * @param {string} [options.nodePath]
 * @returns {Promise<Buffer>}
 */
export function runOnePasswordSentinel({
  execFileImpl = execFile,
  envFilePath = ".env",
  nodePath = process.execPath,
} = {}) {
  const script = `process.stdout.write(${JSON.stringify(
    OP_ENV_AUDIT_SENTINEL
  )})`;

  return new Promise((resolve, reject) => {
    execFileImpl(
      "op",
      ["run", `--env-file=${envFilePath}`, "--", nodePath, "-e", script],
      { encoding: "buffer", maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(new Error("1Password sentinel failed"));
          return;
        }

        resolve(stdout);
      }
    );
  });
}

/**
 * @param {Buffer | string} output
 * @returns {boolean}
 */
export function isExactSentinelOutput(output) {
  const outputBuffer = Buffer.isBuffer(output)
    ? output
    : Buffer.from(output, "utf8");

  return (
    !outputBuffer.includes(concealmentMarker) &&
    outputBuffer.equals(expectedSentinel)
  );
}

/**
 * @param {string} classification
 * @param {number} length
 * @returns {string}
 */
function dispositionFor(classification, length) {
  if (length > 2) {
    return OP_ENV_AUDIT_DISPOSITIONS.NO_ACTION_REQUIRED;
  }

  if (classification === OP_ENV_CLASSIFICATIONS.PUBLIC_METADATA) {
    return OP_ENV_AUDIT_DISPOSITIONS.REMOVE_FROM_SECRET_INJECTION;
  }

  return OP_ENV_AUDIT_DISPOSITIONS.UNRESOLVED_CONCEALMENT_RISK;
}

/**
 * Build synthetic resolved values solely to reuse the tracked environment's
 * structural and policy validation without resolving a secret twice.
 *
 * @param {ReturnType<typeof parseEnvAssignments>} assignments
 * @param {typeof OP_ENV_POLICY} policy
 * @returns {Record<string, string>}
 */
function policyValidationEnv(assignments, policy) {
  return Object.fromEntries(
    assignments
      .filter(
        ({ name }) => policy[name]?.source === OP_ENV_SOURCES.ONE_PASSWORD
      )
      .map(({ name }) => [name, "audit-policy-validation-placeholder"])
  );
}

/**
 * Audit active 1Password assignments. Resolved values live only in the local
 * loop variable long enough to count Unicode code points; the returned result
 * contains safe metadata only.
 *
 * @param {string} envFile
 * @param {object} [options]
 * @param {typeof OP_ENV_POLICY} [options.policy]
 * @param {(reference: string) => Promise<string>} [options.resolveReference]
 * @param {() => Promise<Buffer | string>} [options.runSentinel]
 * @returns {Promise<AuditResult>}
 */
export async function auditOpEnv(
  envFile,
  {
    policy = OP_ENV_POLICY,
    resolveReference = resolveOnePasswordReference,
    runSentinel = runOnePasswordSentinel,
  } = {}
) {
  const assignments = parseEnvAssignments(envFile);
  const policyResult = validateOpEnv(
    envFile,
    policyValidationEnv(assignments, policy),
    policy
  );

  if (!policyResult.ok) {
    return {
      ok: false,
      entries: [],
      sentinel: "not_run",
      errors: [
        {
          code: "policy_validation_failed",
          message: policyResult.message,
        },
      ],
    };
  }

  const entries = [];
  const errors = [];
  const onePasswordAssignments = assignments.filter(
    ({ name }) => policy[name].source === OP_ENV_SOURCES.ONE_PASSWORD
  );

  for (const { name, rawValue } of onePasswordAssignments) {
    let resolvedValue;

    try {
      resolvedValue = await resolveReference(rawValue);

      if (typeof resolvedValue !== "string") {
        throw new TypeError("Resolved value was not text");
      }

      const length = [...resolvedValue].length;
      resolvedValue = undefined;
      entries.push({
        name,
        classification: policy[name].classification,
        length,
        disposition: dispositionFor(policy[name].classification, length),
      });
    } catch {
      resolvedValue = undefined;
      entries.push({
        name,
        classification: policy[name].classification,
        length: null,
        disposition: OP_ENV_AUDIT_DISPOSITIONS.RESOLUTION_FAILED,
      });
      errors.push({ code: "resolution_failed", name });
    }
  }

  let sentinel = "fail";

  try {
    const output = await runSentinel();
    sentinel = isExactSentinelOutput(output) ? "pass" : "fail";
  } catch {
    sentinel = "fail";
  }

  if (sentinel === "fail") {
    errors.push({ code: "sentinel_failed" });
  }

  const hasShortValueRisk = entries.some(
    ({ disposition }) =>
      disposition === OP_ENV_AUDIT_DISPOSITIONS.REMOVE_FROM_SECRET_INJECTION ||
      disposition === OP_ENV_AUDIT_DISPOSITIONS.UNRESOLVED_CONCEALMENT_RISK
  );

  return {
    ok: errors.length === 0 && !hasShortValueRisk,
    entries,
    sentinel,
    errors,
  };
}

/**
 * @param {AuditResult} result
 * @returns {string}
 */
export function renderAuditResult(result) {
  const rows = result.entries.map(
    ({ name, classification, length, disposition }) =>
      `| ${name} | ${classification} | ${
        length ?? "unavailable"
      } | ${disposition} |`
  );

  return [
    "| Name | Classification | Length | Disposition |",
    "| --- | --- | ---: | --- |",
    ...rows,
    "",
    `Sentinel: ${result.sentinel}`,
  ].join("\n");
}

/**
 * @param {AuditResult} result
 * @returns {string[]}
 */
export function renderAuditErrors(result) {
  return result.errors.map((error) => {
    if (error.code === "policy_validation_failed") {
      return error.message;
    }

    if (error.code === "resolution_failed") {
      return `1Password resolution failed: ${error.name}`;
    }

    return "1Password sentinel check failed";
  });
}
