import {
  OP_ENV_CLASSIFICATIONS,
  OP_ENV_POLICY,
  OP_ENV_SOURCES,
} from "./op-env-policy.mjs";

const assignmentPattern = /^([A-Z_][A-Z0-9_]*)=(.*)$/;
export const onePasswordReferencePattern = /^op:\/\/Apicity\/[^/]+\/password$/;

const validClassifications = new Set(Object.values(OP_ENV_CLASSIFICATIONS));
const validSources = new Set(Object.values(OP_ENV_SOURCES));

export function parseEnvAssignments(envFile) {
  return envFile
    .split(/\r?\n/)
    .map((line) => line.match(assignmentPattern))
    .filter(Boolean)
    .map((match) => ({
      name: match[1],
      rawValue: match[2],
    }));
}

export function findLiteralAssignments(assignments) {
  return assignments.filter(
    ({ rawValue }) => !onePasswordReferencePattern.test(rawValue)
  );
}

export function findUnresolvedAssignments(assignments, env = process.env) {
  return assignments
    .map(({ name }) => name)
    .filter((name) => {
      const value = env[name];

      return !value || value.startsWith("op://");
    });
}

function findDuplicateAssignmentNames(assignments) {
  const seen = new Set();
  const duplicates = new Set();

  for (const { name } of assignments) {
    if (seen.has(name)) {
      duplicates.add(name);
    }

    seen.add(name);
  }

  return [...duplicates];
}

function isValidPolicyEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  if (
    !validClassifications.has(entry.classification) ||
    !validSources.has(entry.source)
  ) {
    return false;
  }

  if (entry.source === OP_ENV_SOURCES.ONE_PASSWORD) {
    return !("allowedValues" in entry);
  }

  return (
    entry.classification === OP_ENV_CLASSIFICATIONS.PUBLIC_METADATA &&
    Array.isArray(entry.allowedValues) &&
    entry.allowedValues.length > 0 &&
    entry.allowedValues.every(
      (value) => typeof value === "string" && value.length > 0
    ) &&
    new Set(entry.allowedValues).size === entry.allowedValues.length
  );
}

function invalidAssignmentNames(assignments, policy) {
  return assignments
    .filter(({ name, rawValue }) => {
      const entry = policy[name];

      if (entry.source === OP_ENV_SOURCES.ONE_PASSWORD) {
        return !onePasswordReferencePattern.test(rawValue);
      }

      return !entry.allowedValues.includes(rawValue);
    })
    .map(({ name }) => name);
}

function failure(label, names) {
  return {
    ok: false,
    message: `${label}: ${names.join(", ")}`,
  };
}

export function validateOpEnv(
  envFile,
  env = process.env,
  policy = OP_ENV_POLICY
) {
  const assignments = parseEnvAssignments(envFile);
  const duplicateNames = findDuplicateAssignmentNames(assignments);

  if (duplicateNames.length > 0) {
    return failure("Duplicate .env assignments", duplicateNames);
  }

  const assignmentNames = new Set(assignments.map(({ name }) => name));
  const policyNames = Object.keys(policy);
  const missingPolicy = assignments
    .map(({ name }) => name)
    .filter((name) => !(name in policy));

  if (missingPolicy.length > 0) {
    return failure("Environment policy missing", missingPolicy);
  }

  const stalePolicy = policyNames.filter((name) => !assignmentNames.has(name));

  if (stalePolicy.length > 0) {
    return failure("Environment policy stale", stalePolicy);
  }

  const invalidPolicy = policyNames.filter(
    (name) => !isValidPolicyEntry(policy[name])
  );

  if (invalidPolicy.length > 0) {
    return failure("Environment policy invalid", invalidPolicy);
  }

  const invalidAssignments = invalidAssignmentNames(assignments, policy);

  if (invalidAssignments.length > 0) {
    return failure("Invalid .env assignments", invalidAssignments);
  }

  const onePasswordAssignments = assignments.filter(
    ({ name }) => policy[name].source === OP_ENV_SOURCES.ONE_PASSWORD
  );
  const unresolved = findUnresolvedAssignments(onePasswordAssignments, env);

  if (unresolved.length > 0) {
    return failure("1Password did not resolve", unresolved);
  }

  return {
    ok: true,
    message: "Environment policy OK - all 1Password references resolved",
  };
}
