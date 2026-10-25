import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { createHarCapture } from "@apicity/har";
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
