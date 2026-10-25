import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { describeEndpoint } from "../../packages/cli/src/discovery";

// The endpoint walker behind lint:endpoints, gen:call-shapes and doc-gen reads
// endpoints written as property functions (`list: async function list() {}`)
// but skips method shorthand (`async list() {}`). A shorthand endpoint's URL
// comment goes unchecked, the README leaves it out, and a catalog row with a
// placeholder cannot get a call shape (ac-3ba9xb).
it("writes every fal endpoint as a property function the walker can see", () => {
  const source = readFileSync("packages/provider/fal/src/fal.ts", "utf8");
  const shorthand = source
    .split("\n")
    .map((line, i) => ({ line: i + 1, text: line.trim() }))
    .filter(({ text }) => /^async [A-Za-z0-9_]+\s*\(/.test(text));
  expect(shorthand).toEqual([]);
});

it("describes the fal endpoints the walker used to skip", async () => {
  const rows: Array<[string, string, string[]]> = [
    ["v1.models.usage", "https://api.fal.ai/v1/models/usage", []],
    ["v1.models.analytics", "https://api.fal.ai/v1/models/analytics", []],
    [
      "v1.serverless.files.list",
      "https://api.fal.ai/v1/serverless/files/list",
      [],
    ],
    [
      "v1.serverless.apps.queue",
      "https://api.fal.ai/v1/serverless/apps/{owner}/{name}/queue",
      ["owner", "name"],
    ],
    ["v1.serverless.metrics", "https://api.fal.ai/v1/serverless/metrics", []],
    [
      "v1.workflows.get",
      "https://api.fal.ai/v1/workflows/{username}/{workflow_name}",
      ["username", "workflow_name"],
    ],
  ];
  for (const [dotPath, fullUrl, fields] of rows) {
    const d = await describeEndpoint("fal", dotPath);
    expect(d).toMatchObject({ method: "GET", fullUrl });
    expect(d.callShape?.fields ?? []).toEqual(
      fields.map((field) => ({ placeholder: field, property: field }))
    );
  }
});
