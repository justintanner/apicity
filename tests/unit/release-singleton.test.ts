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

interface Bead {
  id: string;
  title: string;
  status: string;
  assignee: string | null;
  created_at?: string;
  metadata: Record<string, string>;
}

const SESSION = {
  GC_SESSION_ID: "su-wisp-self",
  GC_SESSION_NAME: "gc__run-operator-su-wisp-self",
};

const root = (id: string, createdAt: string, version = "0.13.0"): Bead => ({
  id,
  title: "mol-apicity-release",
  status: "in_progress",
  assignee: null,
  created_at: createdAt,
  metadata: {
    "gc.kind": "workflow",
    "gc.root_store_ref": "rig:apicity",
    "gc.var.version": version,
  },
});

// A claimed release step. Native claims assign it to the lane template and
// record the claiming session only in metadata.
const step = (
  id: string,
  rootId: string,
  {
    assignee = "apicity/gc.run-operator",
    sessionId,
    sessionName,
    status = "in_progress",
    stepRef = "mol-apicity-release.release",
  }: {
    assignee?: string;
    sessionId?: string;
    sessionName?: string;
    status?: string;
    stepRef?: string;
  } = {}
): Bead => ({
  id,
  title: "Release Apicity: gates, publish, tag, sync, close",
  status,
  assignee,
  metadata: {
    "gc.step_ref": stepRef,
    "gc.root_bead_id": rootId,
    ...(sessionId === undefined ? {} : { "gc.session_id": sessionId }),
    ...(sessionName === undefined ? {} : { "gc.session_name": sessionName }),
  },
});

// `bd` answers show/list from TEST_BEADS with the filters the guard passes;
// `gc` only reports, so the abort path's drain-ack is observable on stderr.
const mock = `
bd() {
  local cmd=$1
  shift
  case "$cmd" in
    update) return 0 ;;
    show)
      local found
      found=$(jq -c --arg id "$1" '[.[] | select(.id == $id)]' <<<"$TEST_BEADS")
      if [[ "$found" == "[]" ]]; then
        printf '{"error":"no issues found matching the provided IDs"}'
        return 1
      fi
      if [[ "$TEST_SHOW_SHAPE" == object ]]; then jq -c '.[0]' <<<"$found"; else printf '%s' "$found"; fi
      ;;
    list)
      local status="" assignee="" title="" field=""
      while [ $# -gt 0 ]; do
        case "$1" in
          --status) status=$2; shift ;;
          --assignee) assignee=$2; shift ;;
          --title-contains) title=$2; shift ;;
          --metadata-field) field=$2; shift ;;
          --limit) shift ;;
        esac
        shift
      done
      if [[ -n "$title" && "$TEST_FAIL" == yes ]]; then return 1; fi
      jq -c --arg s "$status" --arg a "$assignee" --arg t "$title" --arg f "$field" '[.[]
        | select($s == "" or .status == $s)
        | select($a == "" or .assignee == $a)
        | select($t == "" or (.title | ascii_downcase | contains($t | ascii_downcase)))
        | select($f == "" or .metadata[$f | split("=")[0]] == ($f | split("=")[1:] | join("=")))]' <<<"$TEST_BEADS"
      ;;
  esac
}
gc() { echo "gc $*" >&2; }
`;

function run({
  beads,
  env = {},
  showShape = "array",
  failRunsList = false,
}: {
  beads: Bead[];
  env?: Record<string, string>;
  showShape?: "array" | "object";
  failRunsList?: boolean;
}) {
  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    TEST_BEADS: JSON.stringify(beads),
    TEST_SHOW_SHAPE: showShape,
    TEST_FAIL: failRunsList ? "yes" : "no",
  };
  // A Gas City session runs this suite with its own identity in the
  // environment; the guard must only ever see the scenario's.
  delete childEnv.GC_TRIGGER_BEAD_ID;
  delete childEnv.GC_SESSION_ID;
  delete childEnv.GC_SESSION_NAME;
  return spawnSync("bash", ["-c", `${mock}\n${guard}`], {
    encoding: "utf8",
    env: { ...childEnv, ...env },
  });
}

// Run the guard as the session whose launch step belongs to workflow `self`.
function runAs(self: string, roots: Bead[]) {
  return run({
    beads: [...roots, step("ac-step", self)],
    env: { ...SESSION, GC_TRIGGER_BEAD_ID: "ac-step" },
  });
}

describe("release singleton guard", () => {
  it.each(["array", "object"] as const)(
    "resolves a lane-assigned step from GC_TRIGGER_BEAD_ID (bd show %s)",
    (showShape) => {
      // ac-ib7s5m: on 2026-10-14 this step shape (assignee = lane template, no
      // session metadata needed) made the guard count its own run as a
      // competitor and abort every release.
      const result = run({
        beads: [root("ac-a", "2026-10-14"), step("ac-s", "ac-a")],
        env: { ...SESSION, GC_TRIGGER_BEAD_ID: "ac-s" },
        showShape,
      });
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain(
        "Singleton guard: this is the only in-progress mol-apicity-release run (root=ac-a)"
      );
    }
  );

  it.each([
    { key: "gc.session_id", meta: { sessionId: SESSION.GC_SESSION_ID } },
    { key: "gc.session_name", meta: { sessionName: SESSION.GC_SESSION_NAME } },
  ])("resolves from $key metadata without GC_TRIGGER_BEAD_ID", ({ meta }) => {
    const result = run({
      beads: [root("ac-a", "2026-10-14"), step("ac-s", "ac-a", meta)],
      env: SESSION,
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("root=ac-a");
  });

  it("falls back to metadata when the trigger bead is not a release step", () => {
    const result = run({
      beads: [
        root("ac-a", "2026-10-14"),
        step("ac-s", "ac-a", { sessionId: SESSION.GC_SESSION_ID }),
        step("ac-w", "ac-z", { stepRef: "mol-do-work.implement" }),
      ],
      env: { ...SESSION, GC_TRIGGER_BEAD_ID: "ac-w" },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("root=ac-a");
  });

  it("prefers the gc.session_id match over a gc.session_name match", () => {
    // Pool-era claims stamped a shared pool slot as gc.session_name; only the
    // ID is unique to this session, so it wins even when listed second.
    const result = run({
      beads: [
        root("ac-a", "2026-10-13"),
        root("ac-b", "2026-10-14"),
        step("ac-sb", "ac-b", {
          sessionId: "su-wisp-other",
          sessionName: SESSION.GC_SESSION_NAME,
        }),
        step("ac-sa", "ac-a", { sessionId: SESSION.GC_SESSION_ID }),
      ],
      env: SESSION,
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("root=ac-a");
  });

  it.each(["GC_SESSION_ID", "GC_SESSION_NAME"] as const)(
    "keeps the legacy assignee match for a claim assigned to %s",
    (owner) => {
      const result = run({
        beads: [
          root("ac-a", "2026-09-27"),
          step("ac-s", "ac-a", { assignee: SESSION[owner] }),
        ],
        env: SESSION,
      });
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain("root=ac-a");
    }
  );

  it("does not adopt a release step claimed by another session", () => {
    const result = run({
      beads: [
        root("ac-a", "2026-10-14"),
        step("ac-s", "ac-a", {
          sessionId: "su-wisp-other",
          sessionName: "gc__run-operator-su-wisp-other",
        }),
      ],
      env: SESSION,
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(
      "1 active release runs (self-id unavailable)"
    );
    expect(result.stderr).toContain("gc runtime drain-ack");
  });

  it("aborts a cancelled run whose own step and root are closed", () => {
    // Skipping the trigger step would let the run continue as a manual
    // release; resolving its closed root keeps the guard fail-closed.
    const result = run({
      beads: [
        { ...root("ac-a", "2026-10-14"), status: "closed" },
        step("ac-s", "ac-a", {
          status: "closed",
          sessionId: SESSION.GC_SESSION_ID,
        }),
      ],
      env: { ...SESSION, GC_TRIGGER_BEAD_ID: "ac-s" },
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(
      "own workflow root missing from active runs"
    );
  });

  it("allows only the older workflow across versions", () => {
    const roots = [
      root("ac-a", "2026-09-26", "0.12.2"),
      root("ac-b", "2026-09-27"),
    ];
    expect(runAs("ac-a", roots).status).toBe(0);
    const newer = runAs("ac-b", roots);
    expect(newer.status).toBe(1);
    expect(newer.stdout).toContain("ac-a (version 0.12.2)");
    expect(newer.stderr).toContain("gc runtime drain-ack");
  });

  it("breaks equal timestamp ties deterministically", () => {
    const roots = [root("ac-a", "2026-09-27"), root("ac-b", "2026-09-27")];
    expect(runAs("ac-a", roots).status).toBe(0);
    expect(runAs("ac-b", roots).status).toBe(1);
  });

  it("fails closed on unknown identity, missing root, or failed list", () => {
    expect(
      run({ beads: [root("ac-a", "2026-09-27", "0.12.2")], env: SESSION })
        .status
    ).toBe(1);
    expect(runAs("ac-a", []).status).toBe(1);
    const failed = run({
      beads: [root("ac-a", "2026-09-27"), step("ac-s", "ac-a")],
      env: { ...SESSION, GC_TRIGGER_BEAD_ID: "ac-s" },
      failRunsList: true,
    });
    expect(failed.status).toBe(1);
    expect(failed.stderr).toContain(
      "STOP: could not verify concurrent release workflows."
    );
    expect(run({ beads: [], env: SESSION }).status).toBe(0);
  });
});
