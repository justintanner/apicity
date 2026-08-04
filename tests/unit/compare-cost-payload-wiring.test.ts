import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createPreflightSteps,
  runPreflightSteps,
} from "../../scripts/preflight-changed.mjs";

const PACKAGE_JSON = fileURLToPath(
  new URL("../../package.json", import.meta.url)
);

interface PackageManifest {
  scripts: Record<string, string>;
}

async function readPackageManifest(): Promise<PackageManifest> {
  return JSON.parse(await readFile(PACKAGE_JSON, "utf8")) as PackageManifest;
}

describe("compare-cost payload gate wiring", () => {
  it("registers the exact clean-checkout command in the repository lint chain", async () => {
    const { scripts } = await readPackageManifest();

    expect(scripts["lint:compare-payloads"]).toBe(
      "pnpm run build:kie --silent && " +
        "node scripts/check-compare-cost-payloads.mjs"
    );
    expect(scripts["lint:repo"]).toBe(
      "pnpm run lint:endpoints && " +
        "pnpm run lint:signatures && " +
        "pnpm run lint:factory && " +
        "pnpm run lint:recordings && " +
        "pnpm run lint:timers && " +
        "pnpm run lint:ignores && " +
        "pnpm run gen:shared:check && " +
        "pnpm run lint:compare-payloads"
    );
  });

  it("orders the explicit compare-payload step before test:run", () => {
    const steps = createPreflightSteps([
      "scripts/preflight-changed.mjs",
      "package.json",
    ]);
    const compareIndex = steps.findIndex(
      (step) => step.title === "compare-cost payload schemas"
    );
    const testIndex = steps.findIndex((step) => step.title === "test:run");

    expect(steps[compareIndex]).toMatchObject({
      command: "pnpm",
      args: ["run", "lint:compare-payloads"],
    });
    expect(compareIndex).toBeGreaterThanOrEqual(0);
    expect(compareIndex).toBeLessThan(testIndex);
  });

  it("returns a seeded compare failure unchanged and stops before test:run", () => {
    const steps = createPreflightSteps(["scripts/preflight-changed.mjs"]);
    const invoked: string[] = [];

    const status = runPreflightSteps(steps, {
      execute(step) {
        invoked.push(step.title);
        return step.title === "compare-cost payload schemas" ? 37 : 0;
      },
      log() {},
    });

    expect(status).toBe(37);
    expect(invoked).toContain("compare-cost payload schemas");
    expect(invoked).not.toContain("test:run");
  });
});
