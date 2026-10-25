import { expect, it } from "vitest";
import { runHarCommand } from "../../packages/cli/src/har";
import type { HarReport } from "../../packages/cli/src/har-report-types";
it("reports at least fifty fal/kie endpoints from the committed corpus", async () => {
  let output = "";
  expect(
    await runHarCommand(
      ["report", "tests/recordings", "--provider", "fal,kie", "--json"],
      {
        out: (s) => {
          output += s;
        },
        err: (s) => {
          throw new Error(s);
        },
      }
    )
  ).toBe(0);
  const r = (JSON.parse(output) as { data: HarReport }).data;
  expect(r.summary.endpoints).toBeGreaterThanOrEqual(50);
  expect(r.endpoints.every((e) => ["fal", "kie"].includes(e.provider))).toBe(
    true
  );
  expect(r.baseline).toMatchObject({
    source: "default",
    path: "tests/recordings",
    files: 0,
  });
}, 120000);
