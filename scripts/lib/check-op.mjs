const assignmentPattern = /^([A-Z_][A-Z0-9_]*)=(.*)$/;
const onePasswordReferencePattern = /^op:\/\/Apicity\/[^/]+\/password$/;

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

export function validateOpEnv(envFile, env = process.env) {
  const assignments = parseEnvAssignments(envFile);
  const literalAssignments = findLiteralAssignments(assignments);

  if (literalAssignments.length > 0) {
    return {
      ok: false,
      message:
        "Non-1Password .env assignments: " +
        literalAssignments.map(({ name }) => name).join(", "),
    };
  }

  const unresolved = findUnresolvedAssignments(assignments, env);

  if (unresolved.length > 0) {
    return {
      ok: false,
      message: `1Password did not resolve: ${unresolved.join(", ")}`,
    };
  }

  return {
    ok: true,
    message: "1Password OK - all .env secret references resolved",
  };
}
