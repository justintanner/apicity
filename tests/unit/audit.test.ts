import { describe, expect, it } from "vitest";
import {
  collectPackages,
  installedPackages,
  selectAdvisories,
} from "../../scripts/audit.mjs";

describe("bulk audit helpers", () => {
  it("collects every resolved dependency version from workspace trees", () => {
    expect(
      collectPackages([
        {
          dependencies: {
            alpha: {
              version: "1.2.3",
              dependencies: {
                beta: { version: "2.0.0" },
              },
            },
            workspace: { version: "link:../workspace" },
          },
        },
        {
          devDependencies: {
            alpha: { version: "1.2.3" },
            release: { version: "3.0.0-beta.1" },
          },
        },
      ])
    ).toEqual({
      alpha: ["1.2.3"],
      beta: ["2.0.0"],
      release: ["3.0.0-beta.1"],
    });
  });

  it("filters bulk advisory results at the configured severity", () => {
    const report = {
      alpha: [
        { id: 1, severity: "low", title: "Low issue" },
        { id: 2, severity: "high", title: "High issue" },
      ],
      beta: [{ id: 3, severity: "critical", title: "Critical issue" }],
    };

    expect(selectAdvisories(report, "moderate")).toEqual([
      {
        id: 2,
        packageName: "alpha",
        severity: "high",
        title: "High issue",
        url: undefined,
      },
      {
        id: 3,
        packageName: "beta",
        severity: "critical",
        title: "Critical issue",
        url: undefined,
      },
    ]);
  });

  it("allows a large recursive pnpm inventory", () => {
    const calls: unknown[][] = [];
    const packages = installedPackages((...args: unknown[]) => {
      calls.push(args);
      return {
        status: 0,
        stdout: JSON.stringify([
          { dependencies: { alpha: { version: "1.2.3" } } },
        ]),
        stderr: "",
      };
    });

    expect(packages).toEqual({ alpha: ["1.2.3"] });
    expect(calls).toEqual([
      [
        "pnpm",
        [
          "list",
          "--recursive",
          "--depth",
          "Infinity",
          "--json",
          "--lockfile-only",
        ],
        { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
      ],
    ]);
  });
});
