import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const paths = [
  "formulas/mol-apicity-release.formula.toml",
  ".beads/formulas/mol-apicity-release.formula.toml",
];

describe.each(paths)("release tracking bead in %s", (path) => {
  const formula = readFileSync(path, "utf8");
  const createLine = formula
    .split("\n")
    .find((line) => line.includes('bd create "Release Apicity'));
  const parser = createLine?.match(/jq -([a-z]+) '([^']+)'/);

  function parse(input: string) {
    expect(
      parser,
      "the actual create command must contain its jq parser"
    ).toBeTruthy();
    return spawnSync("jq", [`-${parser![1]}`, parser![2]], {
      input,
      encoding: "utf8",
    });
  }

  it.each(['{"id":"ac-release"}', '[{"id":"ac-release"}]'])(
    "captures the ID from %s",
    (input) => {
      const result = parse(input);
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("ac-release\n");
    }
  );

  it.each(["{}", "[]", "null", '{"id":""}', '{"id":42}', "invalid"])(
    "rejects missing or invalid IDs in %s",
    (input) => {
      const result = parse(input);
      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
    }
  );

  it("stops before showing the bead when creation or parsing fails", () => {
    expect(createLine).toMatch(/^\s*if ! release_bead=/);
    expect(createLine).toContain("$(set -o pipefail;");
    const failureBlock = formula.slice(formula.indexOf(createLine!));
    expect(failureBlock).toMatch(/then\n\s+echo .*\n\s+exit 1\n\s+fi/);
  });
});

it("keeps the two release formula copies identical", () => {
  expect(readFileSync(paths[0], "utf8")).toBe(readFileSync(paths[1], "utf8"));
});
