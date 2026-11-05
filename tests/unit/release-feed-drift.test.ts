import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The release formula runs check:kie-feed-drift because CI cannot: it reads
// KIE's live feed. This runs the formula's own block with `pnpm` and `bd`
// mocked, because a wrong exit code here either stops a release over a feed
// outage or publishes past a real price change.
const formula = readFileSync(
  ".beads/formulas/mol-apicity-release.formula.toml",
  "utf8"
);
const HEADING = "**4. Compare the KIE price table with KIE's live feed:**";
const block = formula
  .split(HEADING)[1]!
  .split("```bash\n")[1]!
  .split("```")[0]!
  .replaceAll("{{version}}", "9.9.9");

const COMPARED = "Compared 603 cells: 603 agree, 0 differ.";
const DIFFER =
  "DIFFER Kling 2.1, video-generation, Standard-5.0s | kling/v2-1-standard 5 | table 0.125 | feed 0.2525";

function run({
  rc,
  output = COMPARED,
  releaseBead = "ac-release",
  bdFails = false,
}: {
  rc: number;
  output?: string;
  releaseBead?: string;
  bdFails?: boolean;
}) {
  const mock = `
    pnpm() {
      [[ "$*" == "run --silent check:kie-feed-drift" ]] || { echo "unexpected pnpm $*"; return 99; }
      printf '%s\\n' "$TEST_OUTPUT"
      return "$TEST_RC"
    }
    bd() {
      if [[ "$1" == list ]]; then echo '[{"id":"ac-found-by-title"}]'; return 0; fi
      echo "BD $*"
      [[ "$TEST_BD_FAILS" == no ]]
    }
  `;
  return spawnSync(
    "bash",
    ["-c", `${mock}\n${block.replaceAll("{{release_bead}}", releaseBead)}`],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        TEST_RC: String(rc),
        TEST_OUTPUT: output,
        TEST_BD_FAILS: bdFails ? "yes" : "no",
      },
    }
  );
}

describe("release KIE feed drift gate", () => {
  it("runs on main before stable moves and before the version bump", () => {
    const at = formula.indexOf("check:kie-feed-drift 2>&1");
    expect(at).toBeGreaterThan(formula.indexOf("# Sub-step 2:"));
    expect(at).toBeLessThan(formula.indexOf("# Sub-step 3:"));
    expect(at).toBeLessThan(formula.indexOf("# Sub-step 4:"));
  });

  it("names a script that exists", () => {
    const scripts = (
      JSON.parse(readFileSync("package.json", "utf8")) as {
        scripts: Record<string, string>;
      }
    ).scripts;
    expect(scripts["check:kie-feed-drift"]).toBeDefined();
  });

  it("continues on exit 0 and reports the comparison", () => {
    const result = run({ rc: 0 });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(COMPARED);
    expect(result.stdout).not.toContain("ABORT");
    expect(result.stdout).not.toContain("BD ");
  });

  it("stops on exit 1 and names the cell", () => {
    const result = run({ rc: 1, output: `Compared 603 cells\n${DIFFER}` });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("ABORT");
    expect(result.stdout).toContain(DIFFER);
  });

  it("stops and shows the output when exit 1 names no cell", () => {
    const result = run({ rc: 1, output: "ERR_PNPM_NO_SCRIPT Missing script" });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("ABORT");
    expect(result.stdout).toContain("ERR_PNPM_NO_SCRIPT");
  });

  it("warns on exit 2, records it on the release bead, and continues", () => {
    const result = run({ rc: 2, output: "fetch failed" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("WARNING");
    expect(result.stdout).not.toContain("ABORT");
    expect(result.stdout).toContain("BD update ac-release --append-notes");
    expect(result.stdout).toContain("exit 2");
    expect(result.stdout).toContain("fetch failed");
  });

  it("finds the release bead by title when the variable is blank", () => {
    const result = run({ rc: 2, output: "fetch failed", releaseBead: "" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("BD update ac-found-by-title");
  });

  it("never stops on exit 2, even when the note cannot be recorded", () => {
    const result = run({ rc: 2, output: "fetch failed", bdFails: true });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("could not record");
    expect(result.stdout).not.toContain("ABORT");
  });

  it("stops on any other failure, such as a killed process", () => {
    const result = run({ rc: 137, output: "" });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("exited 137");
  });
});
