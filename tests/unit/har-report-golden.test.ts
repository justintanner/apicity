/** Regenerate reviewed goldens: UPDATE_HAR_REPORT=1 pnpm run test:run tests/unit/har-report-golden.test.ts */
import { readFileSync, writeFileSync } from "node:fs";
import { expect, it } from "vitest";
import { runHarCommand } from "../../packages/cli/src/har";
import type { HarReport } from "../../packages/cli/src/har-report-types";
const root = "tests/fixtures/har-report";
async function run(json: boolean) {
  let output = "";
  expect(
    await runHarCommand(
      [
        "report",
        `${root}/corpus`,
        "--baseline",
        `${root}/baseline`,
        ...(json ? ["--json"] : []),
      ],
      {
        out: (s) => {
          output += s + "\n";
        },
        err: (s) => {
          throw new Error(s);
        },
      },
      { stdoutIsTTY: false }
    )
  ).toBe(0);
  return output;
}
it("pins the real provider schemas and all seven learning sections byte-for-byte", async () => {
  for (const json of [false, true]) {
    const actual = await run(json);
    expect(await run(json)).toBe(actual);
    const file = `${root}/report.${json ? "json" : "md"}.golden`;
    if (process.env.UPDATE_HAR_REPORT === "1") writeFileSync(file, actual);
    expect(actual).toBe(readFileSync(file, "utf8"));
    if (!json) {
      expect(actual.match(/### [1-7]\. /g)).toHaveLength(42);
      continue;
    }
    const report = (JSON.parse(actual) as { data: HarReport }).data;
    expect(report.summary).toEqual({
      endpoints: 4,
      records: 6,
      calls: 16,
      outcomes: { ok: 13, provider_error: 1, local_error: 1, network_error: 1 },
      primaryExchanges: 16,
      auxiliaryExchanges: 2,
      unmatchedExchanges: 1,
      unresolvedCalls: 1,
    });
    expect(report.inputs).toMatchObject({
      files: 9,
      annotatedFiles: 6,
      legacyFiles: 3,
      entries: 20,
    });
    expect(report.baseline).toMatchObject({ files: 2, responses: 3 });
    const fal = report.endpoints[0];
    expect(fal.schemaTooStrict).toMatchObject({
      checked: 4,
      rejected: 1,
      valuesOutsideRange: [
        { path: "duration", maximum: 30, values: [{ value: 45, count: 1 }] },
      ],
    });
    expect(fal.defaults.schemaDefaults.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "aspect_ratio",
          absent: 2,
          equal: 1,
          overridden: 1,
          overrideRate: 0.25,
        }),
        expect.objectContaining({
          path: "duration",
          absent: 1,
          equal: 1,
          overridden: 2,
          overrideRate: 0.5,
        }),
      ])
    );
    expect(fal.responseDrift).toMatchObject({
      newKeys: [{ path: "seed", types: ["number"], count: 4 }],
      missingKeys: [{ path: "video.file_name", baselineCount: 2 }],
      typeChanges: [{ path: "video.file_size", newTypes: ["null"] }],
    });
    const kie = report.endpoints[2];
    expect(kie.schemaTooLoose.groups).toHaveLength(1);
    expect(kie.providerErrors.groups[0]).toMatchObject({
      status: 200,
      code: "422",
      message: "The duration <n> is not supported for task <id>",
      fields: ["input.duration"],
      payloadRelevant: true,
    });
    expect(kie.schemaTooStrict).toMatchObject({
      checked: 2,
      rejected: 1,
      unknownKeys: {
        keys: [{ path: "input.extra_flag", count: 1, acceptedBySchema: 1 }],
      },
    });
    expect(report.endpoints[3].schema).toMatchObject({ option: "none" });
    expect(report.endpoints[5].volume).toMatchObject({
      polls: { repeats: 3 },
      statusHistogram: [
        { status: 0, count: 1 },
        { status: 200, count: 3 },
      ],
    });
  }
});
