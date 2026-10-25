import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { createHarCapture, type Har } from "@apicity/har";
import { describeEndpoint } from "../../packages/cli/src/discovery";
import { runHarCommand } from "../../packages/cli/src/har";
import type { HarReport } from "../../packages/cli/src/har-report-types";

// Callers name fal queue captures by the SDK dot path, for submit and for the
// polls alike (ac-8zeblu). Before the catalog carried the status and result
// rows, `apicity har report` listed every poll as not-in-catalog, so a failed
// poll never reached the outcome counts.

const REQUEST_ID = "01a15e15-e01b-7052-af20-d94990a75498";

// Answers queue.fal.run offline; no provider call is made.
const queueStub: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const { pathname } = new URL(request.url);
  if (request.method === "POST" && pathname === "/fal-ai/flux/dev") {
    return Response.json({
      request_id: REQUEST_ID,
      status_url: `https://queue.fal.run/fal-ai/flux/requests/${REQUEST_ID}/status`,
      response_url: `https://queue.fal.run/fal-ai/flux/requests/${REQUEST_ID}`,
    });
  }
  if (pathname === `/fal-ai/flux/requests/${REQUEST_ID}/status`) {
    return Response.json({ status: "COMPLETED" });
  }
  if (pathname === `/fal-ai/flux/requests/${REQUEST_ID}`) {
    return Response.json({ images: [] });
  }
  return Response.json(
    {
      detail: [
        {
          loc: ["path", "request_id"],
          msg: "Request not found",
          type: "value_error",
        },
      ],
    },
    { status: 422 }
  );
};

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "fal-queue-catalog-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

async function report(path: string): Promise<HarReport> {
  let output = "";
  await runHarCommand(
    ["report", path, "--no-baseline", "--json"],
    {
      out: (s) => {
        output += s + "\n";
      },
      err: (s) => {
        throw new Error(s);
      },
    },
    { stdoutIsTTY: false }
  );
  return (JSON.parse(output) as { data: HarReport }).data;
}

it("har report resolves fal queue polls under their SDK dot paths", async () => {
  const host = { fetch: queueStub };
  const capture = createHarCapture({ dir, mode: "all", providers: ["fal"] });
  capture.install(host);
  const fal = createFal({ apiKey: "fal-test-key", fetch: host.fetch });

  const submit = { endpoint_id: "fal-ai/flux/dev", input: { prompt: "a cat" } };
  await capture.call(
    { provider: "fal", endpoint: "v1.queue.submit", input: submit },
    () => fal.v1.queue.submit(submit)
  );
  // Polls use the two-segment app namespace, as fal's status URLs do.
  const poll = { endpoint_id: "fal-ai/flux", request_id: REQUEST_ID };
  await capture.call(
    { provider: "fal", endpoint: "v1.queue.status", input: poll },
    () => fal.v1.queue.status(poll)
  );
  await capture.call(
    { provider: "fal", endpoint: "v1.queue.result", input: poll },
    () => fal.v1.queue.result(poll)
  );
  const missing = { endpoint_id: "fal-ai/flux", request_id: "missing" };
  await expect(
    capture.call(
      { provider: "fal", endpoint: "v1.queue.status", input: missing },
      () => fal.get.v1.queue.status(missing)
    )
  ).rejects.toMatchObject({ status: 422 });
  await capture.close();

  const r = await report(dir);
  expect(r.unresolvedCalls).toEqual([]);
  expect(r.unmatched).toEqual([]);
  expect(r.summary).toMatchObject({
    calls: 4,
    outcomes: { ok: 3, provider_error: 1, local_error: 0, network_error: 0 },
    unmatchedExchanges: 0,
    unresolvedCalls: 0,
  });
  const endpoints = r.endpoints.map((e) => `${e.method} ${e.dotPath}`);
  expect([...new Set(endpoints)].sort()).toEqual([
    "GET v1.queue.result",
    "GET v1.queue.status",
    "POST v1.queue.submit",
  ]);
  const status = r.endpoints.filter((e) => e.dotPath === "v1.queue.status");
  expect(status.flatMap((e) => e.providerErrors.groups)).toEqual([
    expect.objectContaining({ status: 422, fields: ["request_id"] }),
  ]);
  // Each exchange matches its row's full URL with the endpoint id spanning
  // segments; the submit no longer falls back to the sole entry (ac-bynay5).
  expect(
    Object.fromEntries(r.endpoints.map((e) => [e.dotPath, e.volume.matchedBy]))
  ).toEqual({
    "v1.queue.result": { strict: 1, lenient: 0, soleEntry: 0 },
    "v1.queue.status": { strict: 2, lenient: 0, soleEntry: 0 },
    "v1.queue.submit": { strict: 1, lenient: 0, soleEntry: 0 },
  });
  const submitRecord = r.endpoints.find((e) => e.dotPath === "v1.queue.submit");
  expect(submitRecord?.schemaTooStrict).toMatchObject({
    checked: 1,
    rejected: 0,
    issues: [],
  });
});

it("har report attributes every exchange of a retried queue submit to its row", async () => {
  // Two submit exchanges in one call rule out the sole-entry fallback, so the
  // catalog row's URL must match `fal-ai/flux/dev` itself.
  const r = await report(
    "tests/fixtures/har-report/fal-queue/submit-retry.har"
  );
  expect(r.unresolvedCalls).toEqual([]);
  expect(r.unmatched).toEqual([]);
  expect(r.endpoints).toHaveLength(1);
  expect(r.endpoints[0]).toMatchObject({
    method: "POST",
    dotPath: "v1.queue.submit",
    volume: {
      calls: 1,
      outcomes: { ok: 1 },
      exchanges: { primary: 2, auxiliary: 0, local: 0 },
      matchedBy: { strict: 2, lenient: 0, soleEntry: 0 },
      statusHistogram: [
        { status: 200, count: 1 },
        { status: 503, count: 1 },
      ],
    },
    // The wire body is the request's `input`, so the schema checks the
    // annotated input and the factory added nothing to it (ac-dvsxwf).
    schemaTooStrict: {
      checked: 1,
      rejected: 0,
      issues: [],
      unknownKeys: { available: true, keys: [] },
    },
    defaults: { factoryDefaults: { calls: 1, fields: [] } },
  });
});

const SUBMIT_FIXTURE = "tests/fixtures/har-report/fal-queue/submit-retry.har";
function submitFixture(): Har {
  return JSON.parse(readFileSync(SUBMIT_FIXTURE, "utf8")) as Har;
}
function save(har: Har): string {
  const file = join(dir, "submit.har");
  writeFileSync(file, JSON.stringify(har));
  return file;
}

it("har report validates a queue submit's annotated input against the schema", async () => {
  const har = submitFixture();
  har.log._apicity!.input = {
    endpoint_id: "fal-ai/flux/dev",
    input: { prompt: "a cat" },
    priority: "high",
    extra: true,
  };
  const [submit] = (await report(save(har))).endpoints;
  expect(submit.schemaTooStrict).toMatchObject({
    checked: 1,
    rejected: 1,
    issues: [
      expect.objectContaining({ code: "invalid_value", path: "priority" }),
    ],
    unknownKeys: { keys: [{ path: "extra", count: 1, acceptedBySchema: 0 }] },
    valuesOutsideEnum: [expect.objectContaining({ path: "priority" })],
  });
});

it("har report leaves a legacy queue submit, which has no input, unvalidated", async () => {
  const har = submitFixture();
  delete har.log._apicity;
  const [submit] = (await report(save(har))).endpoints;
  expect(submit).toMatchObject({
    dotPath: "v1.queue.submit",
    volume: { callsBySource: { annotated: 0, legacy: 2 } },
    schemaTooStrict: { available: false, reason: "no annotated input" },
    schemaTooLoose: { available: false, reason: "no annotated input" },
  });
});

it("describes the queue polls with their queue.fal.run URLs and request fields", async () => {
  for (const [dotPath, path] of [
    ["v1.queue.status", "/{endpoint_id}/requests/{request_id}/status"],
    ["v1.queue.result", "/{endpoint_id}/requests/{request_id}"],
  ]) {
    const d = await describeEndpoint("fal", dotPath);
    expect(d).toMatchObject({
      method: "GET",
      fullUrl: `https://queue.fal.run${path}`,
    });
    expect(d.callShape?.fields).toEqual([
      { placeholder: "endpoint_id", property: "endpoint_id" },
      { placeholder: "request_id", property: "request_id" },
    ]);
  }
});
