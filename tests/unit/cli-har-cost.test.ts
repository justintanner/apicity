/** Regenerate reviewed goldens: UPDATE_HAR_COST=1 pnpm run test:run tests/unit/cli-har-cost.test.ts */
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PRICING } from "@apicity/cost";
import { runHarCommand } from "../../packages/cli/src/har";
import type { HarCostReport } from "../../packages/cli/src/har-cost";
import {
  proposalsFrom,
  tokenVote,
  unitVote,
  type RateVote,
} from "../../packages/cli/src/har-cost-corrections";
import type {
  CostHelperActual,
  CostHelperHints,
} from "../../packages/cli/src/cost";

const root = "tests/fixtures/har-cost";
const corpus = `${root}/corpus`;
const source = { url: "https://example.test/rates", asOf: "2026-02-01" };

// Every priced model the fixtures name, so a later rate change cannot move a
// golden. The xAI rows carry no cached rate, which is what AC-02 solves for.
const stub = (input: number, output: number, cacheRead?: number) => ({
  kind: "tokens" as const,
  rate: { input, output, ...(cacheRead === undefined ? {} : { cacheRead }) },
  source,
});
const video = (rate: number) => ({
  kind: "perUnit" as const,
  unit: "seconds" as const,
  units: (payload: Record<string, unknown>) =>
    Number((payload.input as { duration?: string } | undefined)?.duration),
  select: [
    {
      name: "resolution",
      pick: (payload: Record<string, unknown>) =>
        (payload.input as { resolution?: string } | undefined)?.resolution,
    },
  ],
  rates: { "720p": rate },
  source,
});
const stubs: Record<string, Record<string, unknown>> = {
  xai: {
    "grok-4-fast": stub(0.2, 0.5),
    "grok-4.6": stub(2, 6),
    "grok-4": stub(3, 15),
  },
  kie: {
    "fixture/agrees": video(0.09),
    "fixture/disagrees": video(0.09),
    "fixture/before-rate": video(0.09),
    "fixture/matches": video(0.09),
  },
  openai: { "fixture-token": stub(2, 8, 0.5) },
};
const tables = PRICING as unknown as Record<string, Record<string, unknown>>;
const saved: Array<[string, string, unknown]> = [];

beforeAll(() => {
  for (const [provider, entries] of Object.entries(stubs)) {
    for (const [key, entry] of Object.entries(entries)) {
      saved.push([provider, key, tables[provider]![key]]);
      tables[provider]![key] = entry;
    }
  }
});
afterAll(() => {
  for (const [provider, key, entry] of saved) {
    if (entry === undefined) delete tables[provider]![key];
    else tables[provider]![key] = entry;
  }
});

async function run(args: string[]): Promise<string> {
  let output = "";
  const exit = await runHarCommand(
    ["cost", ...args],
    {
      out: (s) => {
        output += `${s}\n`;
      },
      err: (s) => {
        throw new Error(s);
      },
    },
    { stdoutIsTTY: false }
  );
  expect(exit).toBe(0);
  return output;
}
const report = async (args: string[]) =>
  (JSON.parse(await run([...args, "--json"])) as { data: HarCostReport }).data;
const groupFor = (data: HarCostReport, model: string | null) =>
  data.groups.filter((group) => group.model === model);

function exchange(
  method: string,
  url: string,
  request: unknown,
  response: unknown,
  started = "2026-06-25T00:00:00.000Z"
) {
  return {
    startedDateTime: started,
    time: 1,
    request: {
      method,
      url,
      httpVersion: "HTTP/1.1",
      cookies: [],
      headers: [],
      queryString: [],
      headersSize: -1,
      bodySize: 0,
      ...(request
        ? {
            postData: {
              mimeType: "application/json",
              text: JSON.stringify(request),
            },
          }
        : {}),
    },
    response: {
      status: 200,
      statusText: "OK",
      httpVersion: "HTTP/1.1",
      cookies: [],
      headers: [],
      content: {
        size: 0,
        mimeType: "application/json",
        text: JSON.stringify(response),
      },
      redirectURL: "",
      headersSize: -1,
      bodySize: 0,
    },
    cache: {},
    timings: { send: 0, wait: 1, receive: 0 },
  };
}
type Exchange = ReturnType<typeof exchange>;

/** Runs the report over HARs built here, as files in a directory of their own. */
async function reportOn(
  files: Record<string, { entries: Exchange[]; extra?: object }>
) {
  const dir = mkdtempSync(join(tmpdir(), "apicity-har-cost-"));
  try {
    mkdirSync(join(dir, "corpus"));
    for (const [name, { entries, extra }] of Object.entries(files)) {
      writeFileSync(
        join(dir, "corpus", `${name}.har`),
        JSON.stringify({
          log: {
            version: "1.2",
            creator: { name: "test", version: "1" },
            entries,
            ...(extra ?? { _recordingName: `${name.split("-")[0]}/${name}` }),
          },
        })
      );
    }
    return await report([join(dir, "corpus")]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const KIE_CREATE = "https://api.kie.ai/api/v1/jobs/createTask";
const kiePoll = (task: string) =>
  `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${task}`;
const kieSubmit = (task: string, seconds = 5, model = "fixture/matches") =>
  exchange(
    "POST",
    KIE_CREATE,
    {
      model,
      input: { duration: String(seconds), resolution: "720p" },
    },
    { code: 200, data: { taskId: task } }
  );
const kieFinished = (task: string, credits: number) =>
  exchange("GET", kiePoll(task), null, {
    code: 200,
    data: { taskId: task, state: "success", creditsConsumed: credits },
  });

const XAI_RESPONSES = "https://api.x.ai/v1/responses";
const xaiCall = (
  usage: Record<string, unknown>,
  body: Record<string, unknown> = {},
  url = XAI_RESPONSES
) =>
  exchange(
    "POST",
    url,
    { model: "grok-4.6", input: "hello" },
    { id: "resp", status: "completed", model: "grok-4.6", usage, ...body }
  );
const cachedUsage = (ticks: number, extra: object = {}) => ({
  input_tokens: 221,
  input_tokens_details: { cached_tokens: 128 },
  output_tokens: 128,
  cost_in_usd_ticks: ticks,
  ...extra,
});

describe("apicity har cost", () => {
  it.each([
    ["md", []],
    ["json", ["--json"]],
  ])(
    "gives identical bytes twice, pinned to a golden (%s)",
    async (kind, flags) => {
      const actual = await run([corpus, ...flags]);
      expect(await run([corpus, ...flags])).toBe(actual);
      const file = `${root}/report.${kind}.golden`;
      if (process.env.UPDATE_HAR_COST === "1") writeFileSync(file, actual);
      expect(actual).toBe(readFileSync(file, "utf8"));
    },
    120_000
  );

  it("wraps JSON in the versioned envelope", async () => {
    const output = JSON.parse(await run([corpus, "--json"]));
    expect(output.ok).toBe(true);
    expect(output.data.schemaVersion).toBe(1);
  });

  it("solves the xAI cached rates from the stated charge", async () => {
    const data = await report([corpus, "--provider", "xai"]);
    expect(
      data.corrections.map(
        ({ pricingKey, field, current, implied, calls }) => ({
          pricingKey,
          field,
          current,
          implied,
          calls,
        })
      )
    ).toEqual([
      {
        pricingKey: "grok-4",
        field: "cacheRead",
        current: null,
        implied: 0.75,
        calls: 1,
      },
      {
        pricingKey: "grok-4-fast",
        field: "cacheRead",
        current: null,
        implied: 0.05,
        calls: 1,
      },
      {
        pricingKey: "grok-4.6",
        field: "cacheRead",
        current: null,
        implied: 0.5,
        calls: 1,
      },
    ]);
    expect(data.corrections[0]).toMatchObject({
      provider: "xai",
      unit: "USD per 1M tokens",
      files: [`${corpus}/xai-grok-4.har`],
    });
  });

  it("proposes nothing once the table holds the cached rate", async () => {
    const entry = tables.xai!["grok-4.6"];
    tables.xai!["grok-4.6"] = {
      kind: "tokens",
      rate: { input: 2, output: 6, cacheRead: 0.5 },
      source,
    };
    try {
      const data = await report([corpus, "--model", "grok-4.6"]);
      expect(data.corrections).toEqual([]);
    } finally {
      tables.xai!["grok-4.6"] = entry;
    }
  });

  it("reads a request placeholder: actuals, and no recomputed figure", async () => {
    const data = await report([`${corpus}/capture-placeholder.har`]);
    expect(data.summary).toMatchObject({ calls: 1, skippedCalls: 0 });
    const [group] = data.groups;
    expect(group).toMatchObject({
      provider: "openai",
      endpoint: "v1.responses",
      model: "fixture-token",
      settledCalls: 1,
      recomputed: { calls: 0, usd: 0 },
      quoted: { calls: 0, usd: 0 },
      actual: { calls: 1, basis: { derived: 1 } },
      verdicts: { "no-estimate": 1 },
    });
    // 800 uncached at 2 USD, 200 cached at 0.5, and 500 output at 8, per million.
    expect(group!.actual.usd).toBeCloseTo(0.0057, 10);
    expect(group!.usage).toMatchObject({
      inputTokens: 1000,
      outputTokens: 500,
      cacheReadInputTokens: 200,
      reasoningTokens: 100,
    });
  });

  it("counts a capture older than its rate, and proposes nothing from it", async () => {
    const data = await report([corpus, "--model", "fixture/before-rate"]);
    expect(groupFor(data, "fixture/before-rate")[0]).toMatchObject({
      calls: 1,
      capturedBeforeRate: 1,
      actual: { basis: { stated: 1 } },
    });
    expect(data.corrections).toEqual([]);
  });

  it("joins a poll to its submit, and keeps the submit's request", async () => {
    const data = await report([`${corpus}/kie-agrees-a.har`]);
    expect(data.summary.calls).toBe(1);
    expect(data.groups[0]).toMatchObject({
      endpoint: "api.v1.jobs.createTask",
      model: "fixture/agrees",
      settledCalls: 1,
      recomputed: { calls: 1, usd: 0.45 },
      actual: { usd: 0.25, basis: { stated: 1 } },
      ratio: { samples: 1, p50: 1.8 },
      verdicts: { over: 1 },
    });
  });

  it("proposes a per-unit rate only when every call agrees", async () => {
    const data = await report([corpus, "--provider", "kie"]);
    expect(data.corrections).toEqual([
      {
        provider: "kie",
        pricingKey: "fixture/agrees",
        field: 'rates["720p"]',
        unit: "USD per second",
        current: 0.09,
        implied: 0.05,
        calls: 2,
        files: [`${corpus}/kie-agrees-a.har`, `${corpus}/kie-agrees-b.har`],
      },
    ]);
  });

  it("does not settle a running poll, and states no figure from it", async () => {
    const data = await report([`${corpus}/kie-running.har`]);
    expect(data.groups[0]).toMatchObject({
      calls: 1,
      settledCalls: 0,
      actual: { calls: 0, usd: 0 },
      verdicts: { "no-actual": 1 },
    });
  });

  it("gives a poll seen alone no estimate of its own", async () => {
    const data = await report([`${corpus}/kie-poll-alone.har`]);
    expect(data.groups[0]).toMatchObject({
      endpoint: "api.v1.jobs.recordInfo",
      model: "fixture/matches",
      recomputed: { calls: 0 },
      actual: { usd: 0.45 },
      verdicts: { "no-estimate": 1 },
    });
  });

  it("reads a free row as free with no request body", async () => {
    const data = await report([`${corpus}/kie-free.har`]);
    expect(data.groups[0]).toMatchObject({
      endpoint: "api.v1.chat.credit",
      recomputed: { calls: 1, usd: 0 },
      verdicts: { free: 1 },
    });
  });

  it("sums a quote that held, and not one that failed closed", async () => {
    const quoted = await report([`${corpus}/capture-quoted.har`]);
    expect(quoted.groups[0]!.quoted).toEqual({ calls: 1, usd: 0.003 });
    const failed = await report([`${corpus}/capture-failed-quote.har`]);
    expect(failed.groups[0]).toMatchObject({
      quoted: { calls: 0, usd: 0 },
      verdicts: { "no-estimate": 1 },
    });
    expect(failed.groups[0]!.recomputed.calls).toBe(1);
  });

  it("does not settle a stream the capture cut short", async () => {
    const data = await report([`${corpus}/capture-cut-stream.har`]);
    expect(data.groups[0]).toMatchObject({
      settledCalls: 0,
      actual: { calls: 0 },
      verdicts: { "no-actual": 1 },
    });
  });

  it("applies each filter", async () => {
    const all = await report([corpus]);
    expect(all.summary.groups).toBeGreaterThan(3);
    const provider = await report([corpus, "--provider", "openai"]);
    expect(new Set(provider.groups.map((g) => g.provider))).toEqual(
      new Set(["openai"])
    );
    const endpoint = await report([corpus, "--endpoint", "api.v1.chat.credit"]);
    expect(endpoint.groups.map((g) => g.endpoint)).toEqual([
      "api.v1.chat.credit",
    ]);
    const model = await report([corpus, "--model", "grok-4"]);
    expect(model.groups.map((g) => g.model)).toEqual(["grok-4"]);
    const since = await report([corpus, "--since", "2026-06-26"]);
    expect(since.groups.map((g) => g.model)).toEqual([
      "fixture/agrees",
      "grok-4.6",
    ]);
    expect(since.filters.since).toBe("2026-06-26T00:00:00.000Z");
  });

  it("passes the tolerance to the verdicts", async () => {
    const file = `${corpus}/kie-agrees-a.har`;
    expect((await report([file])).groups[0]!.verdicts.over).toBe(1);
    const wide = await report([file, "--tolerance", "1"]);
    expect(wide.filters.tolerance).toBe(1);
    expect(wide.groups[0]!.verdicts.match).toBe(1);
  });

  it("keeps a call whose rate table throws, without that figure", async () => {
    const entry = tables.kie!["fixture/matches"];
    tables.kie!["fixture/matches"] = {
      ...video(0.09),
      units: () => {
        throw new Error("a picker that cannot read this payload");
      },
    };
    try {
      const data = await report([`${corpus}/kie-matches.har`]);
      expect(data.summary).toMatchObject({ calls: 1, skippedCalls: 0 });
      expect(data.groups[0]).toMatchObject({
        recomputed: { calls: 0 },
        actual: { usd: 0.45 },
      });
      expect(data.corrections).toEqual([]);
    } finally {
      tables.kie!["fixture/matches"] = entry;
    }
  });

  describe("which calls a poll belongs to", () => {
    it("keeps interleaved tasks apart", async () => {
      const data = await reportOn({
        "kie-interleaved": {
          entries: [
            kieSubmit("task-a-12345678", 5),
            kieSubmit("task-b-12345678", 10),
            kieFinished("task-b-12345678", 180),
            kieFinished("task-a-12345678", 90),
          ],
        },
      });
      expect(data.summary.calls).toBe(2);
      expect(data.groups[0]).toMatchObject({
        settledCalls: 2,
        actual: { usd: 1.35 },
        verdicts: { match: 2 },
      });
    });

    it("leaves a poll of another task on its own", async () => {
      const data = await reportOn({
        "kie-foreign": {
          entries: [
            kieSubmit("task-a-12345678"),
            kieFinished("task-a-12345678", 90),
            kieFinished("task-other-999999", 500),
          ],
        },
      });
      const submit = data.groups.find(
        (group) => group.endpoint === "api.v1.jobs.createTask"
      );
      expect(submit).toMatchObject({ actual: { usd: 0.45 } });
      expect(data.corrections).toEqual([]);
    });

    it("counts repeated polls of one task once", async () => {
      const data = await reportOn({
        "kie-polls": {
          entries: [
            kieFinished("task-a-12345678", 90),
            kieFinished("task-a-12345678", 90),
          ],
        },
      });
      expect(data.summary.calls).toBe(1);
      expect(data.groups[0]!.actual.usd).toBe(0.45);
    });

    it("lets a poll naming no id follow the call before it", async () => {
      const data = await reportOn({
        "kie-noid": {
          entries: [
            kieSubmit("task-a-12345678"),
            exchange("GET", "https://api.kie.ai/api/v1/jobs/recordInfo", null, {
              code: 200,
              data: { state: "success", creditsConsumed: 90 },
            }),
          ],
        },
      });
      expect(data.summary.calls).toBe(1);
      expect(data.groups[0]!.verdicts.match).toBe(1);
    });

    it("reads a capture's request from its endpoint, not an upload beside it", async () => {
      const data = await reportOn({
        "kie-capture": {
          entries: [
            exchange(
              "POST",
              "https://kieai.redpandaai.co/api/file-base64-upload",
              { model: "not-the-model", input: { resolution: "1K" } },
              { success: true },
              "2026-06-24T23:59:59.000Z"
            ),
            kieSubmit("task-a-12345678"),
            kieFinished("task-a-12345678", 90),
          ],
          extra: {
            _apicity: {
              callId: "c",
              provider: "kie",
              endpoint: "api.v1.jobs.createTask",
              input: {},
              outcome: "ok",
              apicityVersion: "test",
              runtime: "test",
              startedAt: "2026-06-25T00:00:00.000Z",
              durationMs: 1,
            },
          },
        },
      });
      expect(data.groups[0]).toMatchObject({
        model: "fixture/matches",
        recomputed: { calls: 1, usd: 0.45 },
        verdicts: { match: 1 },
      });
      expect(data.corrections).toEqual([]);
    });
  });

  describe("what it refuses to solve from", () => {
    it("solves a clean call, the control for the rest", async () => {
      const data = await reportOn({
        "xai-clean": { entries: [xaiCall(cachedUsage(10_180_000))] },
      });
      expect(data.corrections).toMatchObject([
        { pricingKey: "grok-4.6", field: "cacheRead", implied: 0.5 },
      ]);
    });

    it.each([
      [
        "a server-side tool's fee",
        xaiCall(cachedUsage(60_180_000, { num_server_side_tools_used: 1 })),
      ],
      [
        "a non-standard service tier",
        xaiCall(cachedUsage(20_360_000), { service_tier: "priority" }),
      ],
    ])("proposes nothing from %s", async (_, call) => {
      const data = await reportOn({ "xai-charged": { entries: [call] } });
      expect(data.summary.calls).toBe(1);
      expect(data.corrections).toEqual([]);
    });

    it("lets a miss on known rates veto the row on every endpoint", async () => {
      const data = await reportOn({
        "xai-solves": { entries: [xaiCall(cachedUsage(10_180_000))] },
        "xai-misses": {
          entries: [
            xaiCall(
              {
                prompt_tokens: 100,
                completion_tokens: 100,
                cost_in_usd_ticks: 52_000_000,
              },
              {},
              "https://api.x.ai/v1/chat/completions"
            ),
          ],
        },
      });
      expect(data.groups).toHaveLength(2);
      expect(data.corrections).toEqual([]);
    });

    it("gives no ratio against an estimate that omits output", async () => {
      const data = await reportOn({
        "xai-partial": { entries: [xaiCall(cachedUsage(10_180_000))] },
      });
      expect(data.groups[0]).toMatchObject({
        recomputed: { calls: 0 },
        ratio: { samples: 0 },
        verdicts: { "no-estimate": 1 },
      });
    });
  });

  describe("on real recordings, with the real tables", () => {
    const recordings = "tests/recordings";

    // MachGen bills the reference video's read seconds too. The table adds them
    // and refuses without the length, so these doubled receipts are not a rate.
    it.each([
      "machgen_3663587242/seedance-2-0-mini-r2v-video_417671346",
      "machgen_3663587242/seedance-2-0-fast-r2v-video_2859529951",
      "machgen_3663587242/minimax-h3-omni-r2v-video_116263929",
      // Hand-written: example.com results, and a poll in the submit's millisecond.
      // 18 and 22.5 credits a second are the published rates, not their 10.
      "kie_2079838932/kling-v3-turbo-text-to-video_1058703467",
      "kie_2079838932/kling-v3-turbo-text-to-video-1080p_717102705",
    ])("proposes no rate change from %s", async (recording) => {
      const data = await report([`${recordings}/${recording}/recording.har`]);
      expect(data.summary.calls).toBe(1);
      expect(data.corrections).toEqual([]);
    });
  });

  it.each([
    ["an unknown flag", [corpus, "--nope"]],
    ["no paths", ["--json"]],
    ["a flag with no value", [corpus, "--model"]],
    ["a bad date", [corpus, "--since", "nope"]],
    ["a bad tolerance", [corpus, "--tolerance", "-1"]],
    ["a tolerance that is not a number", [corpus, "--tolerance", "lots"]],
    ["an unknown provider", [corpus, "--provider", "nope"]],
  ])("exits usage on %s", async (_, args) => {
    await expect(
      runHarCommand(["cost", ...args], { out: () => {}, err: () => {} })
    ).rejects.toMatchObject({ code: "usage" });
  });

  it("exits not_found on a missing path or no readable HAR", async () => {
    const empty = mkdtempSync(join(tmpdir(), "apicity-har-cost-"));
    try {
      for (const path of [join(empty, "missing"), empty]) {
        await expect(
          runHarCommand(["cost", path], { out: () => {}, err: () => {} })
        ).rejects.toMatchObject({ code: "not_found" });
      }
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});

describe("the corrections method", () => {
  const base = { provider: "xai", pricingKey: "m", file: "a.har" };
  const entry = (rate: Record<string, number>) => ({
    kind: "tokens" as const,
    rate: { input: 2, output: 6, ...rate },
    source: {},
  });
  const actual = (
    statedUsd: number | null,
    usage: CostHelperActual["usage"],
    statedListUsd: number | null = null
  ): CostHelperActual => ({
    model: "m",
    usage,
    statedUsd,
    statedListUsd,
    usd: statedUsd,
    basis: "stated",
    settled: true,
  });
  const usage = {
    inputTokens: 221,
    cacheReadInputTokens: 128,
    outputTokens: 128,
  };

  it("needs a stated charge", () => {
    expect(tokenVote(actual(null, usage), entry({}), base)).toEqual({});
  });

  it("solves for the one unknown rate", () => {
    const { vote } = tokenVote(actual(0.001018, usage), entry({}), base);
    expect(vote).toMatchObject({ field: "cacheRead", current: null });
    expect(vote!.implied).toBeCloseTo(0.5, 6);
  });

  it("solves from the list price when a provider states one", () => {
    const { vote } = tokenVote(actual(0, usage, 0.001018), entry({}), base);
    expect(vote!.implied).toBeCloseTo(0.5, 6);
  });

  it("takes nothing from a zero charge", () => {
    expect(tokenVote(actual(0, usage), entry({}), base)).toEqual({});
    expect(
      tokenVote(
        actual(0, { inputTokens: 93, outputTokens: 128 }),
        entry({}),
        base
      )
    ).toEqual({});
  });

  it("takes nothing from input smaller than its cached subset", () => {
    expect(
      tokenVote(actual(0.001, { ...usage, inputTokens: 100 }), entry({}), base)
    ).toEqual({});
  });

  it("does not solve for two unknown rates", () => {
    expect(
      tokenVote(
        actual(0.001018, { ...usage, cacheWriteInputTokens: 10 }),
        entry({}),
        base
      )
    ).toEqual({});
  });

  it("ignores an unknown rate with nothing to count", () => {
    expect(
      tokenVote(
        actual(0.000954, { inputTokens: 93, outputTokens: 128 }),
        entry({}),
        base
      )
    ).toEqual({ contradicted: false });
  });

  it("flags known rates that miss the stated charge", () => {
    expect(
      tokenVote(
        actual(0.1, { inputTokens: 93, outputTokens: 128 }),
        entry({}),
        base
      )
    ).toEqual({ contradicted: true });
  });

  it("does not solve where another rate can apply", () => {
    for (const extra of [{ longContext: {} }, { modalityRates: {} }]) {
      expect(
        tokenVote(actual(0.001018, usage), { ...entry({}), ...extra }, base)
      ).toEqual({});
    }
    expect(
      tokenVote(
        actual(0.001018, { ...usage, audioInputTokens: 5 }),
        entry({}),
        base
      )
    ).toEqual({});
  });

  it("reads a negative solve as a known rate that is wrong", () => {
    expect(tokenVote(actual(0.0001, usage), entry({}), base)).toEqual({
      contradicted: true,
    });
  });

  it("reads a cached rate above input as a fee or a wrong rate", () => {
    expect(tokenVote(actual(0.01, usage), entry({}), base)).toEqual({
      contradicted: true,
    });
  });

  it("takes nothing from a call with a fee or a non-standard tier", () => {
    const stated = actual(0.001018, usage);
    expect(
      tokenVote({ ...stated, uncoveredCharge: "a fee" }, entry({}), base)
    ).toEqual({});
    expect(
      tokenVote({ ...stated, serviceTier: "priority" }, entry({}), base)
    ).toEqual({});
    for (const serviceTier of ["default", "auto", "standard"]) {
      expect(
        tokenVote({ ...stated, serviceTier }, entry({}), base).vote
      ).toBeDefined();
    }
  });

  it("does not solve a KIE charge too small for its rounding", () => {
    const kie = { ...base, provider: "kie" };
    const small = {
      inputTokens: 3616,
      cacheReadInputTokens: 3616,
      outputTokens: 1,
    };
    expect(tokenVote(actual(0.0001, small), entry({}), kie)).toEqual({});
    expect(
      tokenVote(
        actual(0.0051, {
          ...small,
          inputTokens: 13_616,
          cacheReadInputTokens: 13_616,
        }),
        entry({}),
        kie
      ).vote
    ).toBeDefined();
  });

  describe("a per-unit rate", () => {
    const row = {
      kind: "perUnit" as const,
      unit: "seconds",
      units: (payload: Record<string, unknown>) =>
        payload.duration as number | undefined,
      select: [
        {
          name: "resolution",
          required: true,
          pick: (payload: Record<string, unknown>) =>
            payload.resolution as string | undefined,
        },
      ],
      rates: { "720p": 0.09 },
      source: {},
    };
    const payload = { duration: 5, resolution: "720p" };

    it("solves stated over the units the request asked for", () => {
      const { vote } = unitVote(actual(0.25, {}), row, payload, base);
      expect(vote).toMatchObject({
        field: 'rates["720p"]',
        unit: "USD per second",
        current: 0.09,
      });
      expect(vote!.implied).toBeCloseTo(0.05, 10);
    });

    it("takes nothing from a failed task's zero charge", () => {
      expect(unitVote(actual(0, {}), row, payload, base)).toEqual({});
    });

    it("counts through the table, which reads reported seconds as a hint", () => {
      const counted = {
        ...row,
        units: (body: Record<string, unknown>, hints?: CostHelperHints) =>
          hints?.durationSeconds ?? (body.duration as number),
      };
      const { vote } = unitVote(
        actual(0.25, { seconds: 10 }),
        counted,
        payload,
        base
      );
      expect(vote!.implied).toBeCloseTo(0.025, 10);
    });

    it("does not count reported seconds the table would not", () => {
      expect(
        unitVote(
          actual(0.25, { seconds: 10 }),
          { ...row, units: () => undefined },
          payload,
          base
        )
      ).toEqual({});
      const { vote } = unitVote(
        actual(0.25, { seconds: 10 }),
        row,
        payload,
        base
      );
      expect(vote!.implied).toBeCloseTo(0.05, 10);
    });

    it("does not solve where the row warns its figure is a floor", () => {
      expect(
        unitVote(
          actual(0.25, {}),
          { ...row, warn: () => ["this is a floor"] },
          payload,
          base
        )
      ).toEqual({});
    });

    it("joins variants as the estimator does, past an empty value", () => {
      const twoAxes = {
        ...row,
        select: [
          {
            name: "mode",
            pick: () => "v2v",
          },
          {
            name: "reference",
            pick: () => "",
          },
          {
            name: "resolution",
            pick: () => "720p",
          },
        ],
        rates: { "v2v|720p": 0.05 },
      };
      const { vote } = unitVote(actual(0.25, {}), twoAxes, payload, base);
      expect(vote).toMatchObject({ field: 'rates["v2v|720p"]', current: 0.05 });
    });

    it("reads a charge below a known extra as a wrong rate", () => {
      expect(
        unitVote(actual(0.01, {}), { ...row, extra: () => 0.05 }, payload, base)
      ).toEqual({ contradicted: true });
    });

    it("takes a known extra charge off first", () => {
      const { vote } = unitVote(
        actual(0.25, {}),
        { ...row, extra: () => 0.05 },
        payload,
        base
      );
      expect(vote!.implied).toBeCloseTo(0.04, 10);
    });

    it("names a variant the table does not have", () => {
      const { vote } = unitVote(
        actual(0.25, {}),
        row,
        { ...payload, resolution: "4k" },
        base
      );
      expect(vote).toMatchObject({ field: 'rates["4k"]', current: null });
    });

    it.each([
      ["no stated charge", actual(null, {}), row, payload],
      ["no request body", actual(0.25, {}), row, null],
      [
        "no units",
        actual(0.25, {}),
        row,
        { resolution: "720p" } as Record<string, unknown>,
      ],
      [
        "a missing required selector",
        actual(0.25, {}),
        row,
        { duration: 5 } as Record<string, unknown>,
      ],
      [
        "an extra charge it cannot price",
        actual(0.25, {}),
        { ...row, extra: () => undefined },
        payload,
      ],
    ])("does not solve with %s", (_, stated, entry, body) => {
      expect(unitVote(stated, entry, body, base)).toEqual({});
    });
  });

  const vote = (implied: number, file = "a.har"): RateVote => ({
    provider: "xai",
    pricingKey: "m",
    field: "cacheRead",
    unit: "USD per 1M tokens",
    current: null,
    implied,
    file,
  });

  it("proposes when every call agrees within 1%", () => {
    expect(
      proposalsFrom([vote(0.5), vote(0.504, "b.har"), vote(0.5, "b.har")])
    ).toMatchObject([{ implied: 0.5, calls: 3, files: ["a.har", "b.har"] }]);
  });

  it("proposes nothing when one call disagrees", () => {
    expect(proposalsFrom([vote(0.5), vote(0.6)])).toEqual([]);
  });

  it("measures agreement across the whole spread", () => {
    expect(proposalsFrom([vote(1), vote(1.0198)])).toEqual([]);
    expect(proposalsFrom([vote(1), vote(1.0099)])).toHaveLength(1);
  });

  it("proposes nothing when the implied rate is the current one", () => {
    const close = { ...vote(0.5), current: 0.502 };
    expect(proposalsFrom([close, close])).toEqual([]);
  });

  it("fills an empty rate from one call, but changes a published one on two", () => {
    expect(proposalsFrom([vote(0.5)])).toHaveLength(1);
    const published = { ...vote(0.5), current: 0.6 };
    expect(proposalsFrom([published])).toEqual([]);
    expect(proposalsFrom([published, published])).toMatchObject([
      { current: 0.6, implied: 0.5, calls: 2 },
    ]);
  });

  it("keeps rates apart", () => {
    expect(
      proposalsFrom([vote(0.5), { ...vote(0.9), field: "cacheWrite" }])
    ).toHaveLength(2);
  });
});
