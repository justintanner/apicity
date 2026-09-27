import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const formula = readFileSync(
  ".beads/formulas/mol-apicity-release.formula.toml",
  "utf8"
);
const guard = formula
  .split("# Sub-step 0:")[1]
  .split("```bash\n")[1]
  .split("```")[0];
const root = (id: string, createdAt: string, version = "0.13.0") => ({
  id,
  created_at: createdAt,
  metadata: {
    "gc.kind": "workflow",
    "gc.root_store_ref": "rig:apicity",
    "gc.var.version": version,
  },
});

function run(
  roots: ReturnType<typeof root>[],
  owner = "session-id",
  self = "ac-a",
  fail = false
) {
  const step = [
    {
      metadata: {
        "gc.step_ref": "mol-apicity-release.release",
        "gc.root_bead_id": self,
      },
    },
  ];
  return spawnSync(
    "bash",
    [
      "-c",
      `
bd() {
  if [[ "$1" == update ]]; then return 0; fi
  if [[ "$*" == *--assignee* ]]; then
    if [[ "$*" == *"--assignee $TEST_OWNER "* ]]; then printf '%s' "$TEST_STEP"; else printf '[]'; fi
  else
    if [[ "$TEST_FAIL" == yes ]]; then return 1; fi
    printf '%s' "$TEST_ROOTS"
  fi
}
gc() { return 0; }
${guard}`,
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        GC_SESSION_ID: "session-id",
        GC_SESSION_NAME: "session-name",
        TEST_OWNER: owner,
        TEST_STEP: JSON.stringify(step),
        TEST_ROOTS: JSON.stringify(roots),
        TEST_FAIL: fail ? "yes" : "no",
      },
    }
  );
}

describe("release singleton guard", () => {
  it.each(["session-id", "session-name"])(
    "resolves claim owner %s",
    (owner) => {
      const result = run([root("ac-a", "2026-09-27")], owner);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain("root=ac-a");
    }
  );
  it("allows only the older workflow across versions", () => {
    const roots = [
      root("ac-a", "2026-09-26", "0.12.2"),
      root("ac-b", "2026-09-27"),
    ];
    expect(run(roots).status).toBe(0);
    expect(run(roots, "session-id", "ac-b").status).toBe(1);
  });
  it("breaks equal timestamp ties deterministically", () => {
    const roots = [root("ac-a", "2026-09-27"), root("ac-b", "2026-09-27")];
    expect(run(roots).status).toBe(0);
    expect(run(roots, "session-id", "ac-b").status).toBe(1);
  });
  it("fails closed on unknown identity, missing root, or failed list", () => {
    expect(run([root("ac-a", "2026-09-27", "0.12.2")], "unknown").status).toBe(
      1
    );
    expect(run([], "session-id").status).toBe(1);
    expect(run([], "unknown", "ac-a", true).status).toBe(1);
    expect(run([], "unknown").status).toBe(0);
  });
});
