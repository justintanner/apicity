import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { loadCatalog } from "../../packages/cli/src/catalog";
import { instantiateForIntrospection } from "../../packages/cli/src/discovery";
import { callEndpoint } from "../../packages/cli/src/invoke";
import {
  loadTsv,
  resolveEndpoint,
  resolveEndpointFn,
  type EndpointFn,
} from "../../packages/cli/src/registry";
import {
  PAID_ENDPOINTS,
  isPaidEndpoint,
} from "../../packages/provider/cost/src/paid-endpoints";
import { createKie } from "../../packages/provider/kie/src/index";
import { createXai } from "../../packages/provider/xai/src/index";
import { scrubHar, type Har } from "@apicity/har";
import {
  planCalls,
  validateBodies,
  validateCapture,
} from "../../scripts/lib/har-promote-plan.mjs";

// Every catalog row must reach a function through the CLI's own resolver, so
// `apicity describe` has a schema and `apicity <provider> <dotPath>` can call
// it (ac-chttrw: 31 rows failed before sending). An exception needs a reasoned
// entry here and shows up in review.
const UNRESOLVED_ALLOWLIST = new Map<string, string>();

// The kie Suno tree is mounted at kie.suno, but its URLs (and so its dot paths)
// do not name it. These are the rows only the sub-provider fallback reaches.
const SUNO_ROOT_ROWS = [
  "GET api.v1.generate.recordInfo",
  "GET api.v1.lyrics.recordInfo",
  "GET api.v1.midi.recordInfo",
  "GET api.v1.mp4.recordInfo",
  "GET api.v1.vocalRemoval.recordInfo",
  "GET api.v1.voice.recordInfo",
  "GET api.v1.voice.validateInfo",
  "GET api.v1.wav.recordInfo",
  "POST api.v1.generate",
  "POST api.v1.generate.addInstrumental",
  "POST api.v1.generate.addVocals",
  "POST api.v1.generate.extend",
  "POST api.v1.generate.generatePersona",
  "POST api.v1.generate.getTimestampedLyrics",
  "POST api.v1.generate.mashup",
  "POST api.v1.generate.replaceSection",
  "POST api.v1.generate.sounds",
  "POST api.v1.generate.uploadCover",
  "POST api.v1.generate.uploadExtend",
  "POST api.v1.lyrics",
  "POST api.v1.midi.generate",
  "POST api.v1.mp4.generate",
  "POST api.v1.style.generate",
  "POST api.v1.vocalRemoval.generate",
  "POST api.v1.voice.checkVoice",
  "POST api.v1.voice.generate",
  "POST api.v1.voice.regenerate",
  "POST api.v1.voice.validate",
  "POST api.v1.wav.generate",
];

const instances = new Map<string, Promise<unknown>>();
function instance(provider: string): Promise<unknown> {
  if (!instances.has(provider))
    instances.set(provider, instantiateForIntrospection(provider));
  return instances.get(provider)!;
}

describe("catalog resolution", () => {
  it("resolves every endpoint-docs.tsv row, or names the reason", async () => {
    const unresolved: string[] = [];
    const viaSubProvider: string[] = [];
    for (const row of await loadTsv()) {
      const key = `${row.provider} ${row.method} ${row.dotPath}`;
      const result = resolveEndpoint(
        (await instance(row.provider)) as Record<string, unknown>,
        row.method,
        row.dotPath
      );
      if (result.fn === null) {
        if (!UNRESOLVED_ALLOWLIST.has(key))
          unresolved.push(`${key} (${result.reason})`);
        continue;
      }
      if (result.via === "sub-provider")
        viaSubProvider.push(
          `${row.provider} ${result.root} ${row.method} ${row.dotPath}`
        );
    }
    expect(unresolved).toEqual([]);
    expect(viaSubProvider.sort()).toEqual(
      SUNO_ROOT_ROWS.map((row) => `kie suno ${row}`).sort()
    );
  }, 60_000);

  it("refuses two sub-providers that serve one path, in either key order", () => {
    const first = Object.assign(async () => "a", {});
    const second = Object.assign(async () => "b", {});
    const trees = [
      {
        a: { post: { api: { x: first } } },
        b: { post: { api: { x: second } } },
      },
      {
        b: { post: { api: { x: second } } },
        a: { post: { api: { x: first } } },
      },
    ];
    for (const tree of trees) {
      expect(resolveEndpoint(tree, "POST", "api.x")).toEqual({
        fn: null,
        reason: "ambiguous",
        roots: ["a", "b"],
      });
      expect(resolveEndpointFn(tree, "POST", "api.x")).toBeNull();
    }
  });

  it("sorts every ambiguous root even when two roots alias a function", () => {
    const shared = async () => "shared";
    const other = async () => "other";
    const tree = {
      c: { post: { api: { x: shared } } },
      b: { post: { api: { x: other } } },
      a: { post: { api: { x: shared } } },
    };
    expect(resolveEndpoint(tree, "POST", "api.x")).toEqual({
      fn: null,
      reason: "ambiguous",
      roots: ["a", "b", "c"],
    });
  });

  it("plans a Suno promotion with the same nested accessor", async () => {
    let dir = join(import.meta.dirname, "../recordings");
    for (const prefix of ["kie_", "suno_", "generate-submit_"]) {
      dir = join(
        dir,
        readdirSync(dir).find((name) => name.startsWith(prefix))!
      );
    }
    const recording = JSON.parse(
      readFileSync(join(dir, "recording.har"), "utf8")
    ) as Har;
    const input = JSON.parse(recording.log.entries[0].request.postData!.text!);
    recording.log._apicity = {
      provider: "kie",
      endpoint: "api.v1.generate",
      input,
      outcome: "ok",
      callId: "suno-resolver-regression",
      apicityVersion: "test",
      runtime: "test",
      startedAt: recording.log.entries[0].startedDateTime,
      durationMs: 0,
    };
    const context = validateCapture(scrubHar(recording));
    validateBodies(context);
    const calls = await planCalls(context);
    expect(calls).toHaveLength(1);
    expect(`provider${calls[0].accessor}`).toBe(
      "provider.suno.post.api.v1.generate"
    );
    expect(calls[0].entries).toEqual([0]);
    expect(calls[0].paid).toBe(true);
  });

  it("accepts one function mounted under two keys", () => {
    const shared = Object.assign(async () => "s", {});
    const tree = {
      a: { post: { api: { x: shared } } },
      b: { post: { api: { x: shared } } },
    };
    const result = resolveEndpoint(tree, "POST", "api.x");
    expect(result.fn).toBe(shared);
  });

  it("never consults a sub-provider when a path strategy resolves", () => {
    const direct = Object.assign(async () => "d", {});
    const other = Object.assign(async () => "o", {});
    const tree = {
      post: { api: { x: direct } },
      a: { post: { api: { x: other } } },
    };
    expect(resolveEndpoint(tree, "POST", "api.x")).toEqual({
      fn: direct,
      via: "path",
    });
  });

  it("keeps method-leaf, callable-namespace and stream-leaf shapes", async () => {
    const del = Object.assign(async () => "del", {});
    const child = Object.assign(async () => "child", {});
    const parent = Object.assign(async () => "parent", { child });
    const tree = {
      delete: { api: { panels: { delete: del } } },
      post: { api: { generate: parent } },
    };
    expect(resolveEndpointFn(tree, "DELETE", "api.panels")).toBe(del);
    expect(resolveEndpointFn(tree, "POST", "api.generate")).toBe(parent);
    expect(resolveEndpointFn(tree, "POST", "api.generate.child")).toBe(child);
    const fal = (await instance("fal")) as Record<string, unknown>;
    const logs = resolveEndpointFn(fal, "POST", "v1.serverless.logs.stream");
    expect(typeof logs).toBe("function");
    expect((logs as EndpointFn).schema).toBeDefined();
  });

  it("names an ambiguous row when the CLI is asked to call it", async () => {
    const tree = {
      a: { post: { api: { x: async () => "a" } } },
      b: { post: { api: { x: async () => "b" } } },
    };
    await expect(
      callEndpoint(
        tree,
        {
          provider: "fake",
          dotPath: "api.x",
          method: "POST",
          fullUrl: "",
          docsUrl: "",
          pathParams: [],
          requestParams: [],
          paid: false,
          configured: true,
        },
        []
      )
    ).rejects.toMatchObject({
      message: expect.stringContaining("resolves under a, b"),
    });
  });
});

describe("paid-gate invariants through the resolver (no network)", () => {
  function gated() {
    const calls: string[] = [];
    const fetch = (async (input: unknown) => {
      calls.push(String(input instanceof Request ? input.url : input));
      throw new Error("no network in this test");
    }) as unknown as typeof globalThis.fetch;
    const paygate = { secret: "catalog-resolution-test" };
    return {
      calls,
      kie: createKie({ apiKey: "k", fetch, paygate }) as unknown as Record<
        string,
        unknown
      >,
      xai: createXai({ apiKey: "k", fetch, paygate }) as unknown as Record<
        string,
        unknown
      >,
    };
  }

  it("refuses every paid endpoint without an OTP before any request", async () => {
    const env = gated();
    for (const { key } of PAID_ENDPOINTS) {
      const tree = key.provider === "kie" ? env.kie : env.xai;
      const fn = resolveEndpointFn(tree, key.method, key.dotPath);
      expect(fn, `${key.provider} ${key.method} ${key.dotPath}`).toBeTypeOf(
        "function"
      );
      await expect(
        (fn as EndpointFn)({}, undefined) as Promise<unknown>,
        `${key.provider} ${key.method} ${key.dotPath}`
      ).rejects.toMatchObject({ name: "PayGateError", code: "otp-missing" });
    }
    expect(env.calls).toEqual([]);
  });

  it("lets every unlisted Suno row reach the transport with the gate armed", async () => {
    const env = gated();
    for (const row of SUNO_ROOT_ROWS) {
      const [method, dotPath] = row.split(" ");
      if (isPaidEndpoint("kie", method, dotPath)) continue;
      const fn = resolveEndpointFn(env.kie, method, dotPath) as EndpointFn;
      const before = env.calls.length;
      const error = await Promise.resolve()
        .then(() => fn(method === "GET" ? "task-1" : { prompt: "p" }))
        .then(
          () => null,
          (e: unknown) => e as { name?: string }
        );
      expect(error?.name, row).not.toBe("PayGateError");
      expect(env.calls.length, row).toBe(before + 1);
    }
  });

  it("marks exactly the paid rows paid in the CLI catalog", async () => {
    const homeDir = mkdtempSync(join(tmpdir(), "apicity-resolution-home-"));
    const catalog = await loadCatalog({ env: { HOME: homeDir } }).finally(() =>
      rmSync(homeDir, { recursive: true, force: true })
    );
    const mismatched = catalog.filter(
      (entry) =>
        entry.paid !==
        isPaidEndpoint(entry.provider, entry.method, entry.dotPath)
    );
    expect(mismatched).toEqual([]);
    const paidRows = catalog
      .filter((entry) => entry.paid)
      .map((e) => `${e.provider} ${e.method} ${e.dotPath}`);
    expect(paidRows.sort()).toEqual(
      PAID_ENDPOINTS.map(
        ({ key }) => `${key.provider} ${key.method} ${key.dotPath}`
      ).sort()
    );
  });
});
