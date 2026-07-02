import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

function runEndpointComments(args: string[]) {
  return spawnSync(
    process.execPath,
    ["scripts/check-endpoint-comments.mjs", ...args],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );
}

describe("check-endpoint-comments CLI", () => {
  it("accepts TSV-only providers", () => {
    const result = runEndpointComments(["--provider", "b2"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Checked 0 endpoints for b2");
    expect(result.stdout).toContain("all have valid URL comments.");
  });

  it("still rejects unknown providers", () => {
    const result = runEndpointComments(["--provider", "not-a-provider"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown provider(s): not-a-provider.");
    expect(result.stderr).toContain("Known providers:");
  });
});
