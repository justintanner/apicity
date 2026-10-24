import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Har } from "@apicity/har";
import { parseGlobalFlags } from "../../packages/cli/src/args";
import { captureSettings } from "../../packages/cli/src/har";
import { runMain, type EndpointOptions } from "../../packages/cli/src/main";
import {
  instantiateProvider,
  PROVIDERS,
} from "../../packages/cli/src/providers";
import { collectDoctorRows } from "../../packages/cli/src/doctor";
import { setupPolly, teardownPolly } from "../harness";

let home: string;
let dir: string;
let env: NodeJS.ProcessEnv;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "cli-har-"));
  dir = join(home, "captures");
  env = {
    HOME: home,
    PATH: "",
    OPENAI_API_KEY: "sk-test-key",
    APICITY_HAR_DIR: dir,
  };
});
afterEach(() => {
  vi.unstubAllGlobals();
  rmSync(home, { recursive: true, force: true });
});
async function run(args: string[], options: EndpointOptions = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const exit = await runMain(
    args,
    { out: (s) => out.push(s), err: (s) => err.push(s) },
    { env, stdoutIsTTY: false, ...options }
  );
  return { exit, out, err };
}
const endpoint = ["openai", "v1.models", "--method", "GET"];
function index() {
  return readFileSync(join(dir, "index.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map(
      (s) => JSON.parse(s) as { file: string; callId: string; outcome: string }
    );
}
function har(): Har {
  return JSON.parse(readFileSync(join(dir, index()[0].file), "utf8")) as Har;
}

function fake(
  outcome: "ok" | "provider_error" | "local_error" | "network_error"
): EndpointOptions {
  vi.stubGlobal("fetch", async () => {
    if (outcome === "network_error")
      throw Object.assign(new TypeError("fetch failed"), {
        cause: { code: "ECONNREFUSED" },
      });
    return Response.json(
      { data: [] },
      { status: outcome === "provider_error" ? 403 : 200 }
    );
  });
  return {
    instantiate: async (_name, _spec, _secret, overrides) => ({
      get: {
        v1: {
          models: async () => {
            if (outcome === "local_error") throw new Error("local refusal");
            const response = await (overrides.fetch ?? fetch)(
              "https://api.openai.com/v1/models",
              { headers: { Authorization: "Bearer fake-secret" } }
            );
            if (!response.ok)
              throw Object.assign(new Error("provider refusal"), {
                status: response.status,
              });
            return response.json();
          },
        },
      },
    }),
  };
}

describe("CLI HAR capture", () => {
  it("parses bare and valued flags and applies flag > env > off", () => {
    expect(parseGlobalFlags(["--capture-har"]).flags.captureHar).toBe("all");
    expect(
      parseGlobalFlags(["--capture-har", "failures"]).flags.captureHar
    ).toBe("failures");
    expect(parseGlobalFlags(["--capture-har=all"]).flags.captureHar).toBe(
      "all"
    );
    expect(() => parseGlobalFlags(["--capture-har=off"])).toThrow();
    expect(captureSettings(undefined, env).mode).toBe("off");
    expect(
      captureSettings(undefined, { ...env, APICITY_HAR_CAPTURE: "failures" })
        .mode
    ).toBe("failures");
    expect(
      captureSettings("all", { ...env, APICITY_HAR_CAPTURE: "off" }).mode
    ).toBe("all");
    expect(captureSettings(undefined, { HOME: home }).dir).toBe(
      join(home, ".config/apicity/har")
    );
    expect(() =>
      captureSettings(undefined, { APICITY_HAR_CAPTURE: "typo" })
    ).toThrow();
  });
  it.each([undefined, "off"])(
    "writes nothing when mode is %s",
    async (mode) => {
      env.APICITY_HAR_CAPTURE = mode;
      expect((await run(endpoint, fake("ok"))).exit).toBe(0);
      expect(existsSync(dir)).toBe(false);
    }
  );
  it.each(["commands", "describe", "providers", "doctor"])(
    "refuses capture flags on %s",
    async (command) => {
      expect((await run([command, "--capture-har=all"])).exit).toBe(1);
    }
  );
  it.each(["ok", "provider_error", "local_error", "network_error"] as const)(
    "captures %s with classified errors and envelopes",
    async (outcome) => {
      const result = await run(
        [
          ...endpoint,
          "--capture-har",
          "--verbose",
          "--data",
          '{"api_key":"fake-body-secret"}',
        ],
        { ...fake(outcome), installVerbose: () => {} }
      );
      const document = har();
      expect(document.log._apicity?.outcome).toBe(outcome);
      expect(document.log._apicity?.context?.cwd).toBeUndefined();
      expect(index()).toHaveLength(1);
      expect(document.log.entries).toHaveLength(1);
      expect(JSON.stringify(document)).not.toContain("fake-secret");
      expect(JSON.stringify(document)).not.toContain("fake-body-secret");
      expect(statSync(dir).mode & 0o777).toBe(0o700);
      const envelope = JSON.parse(
        (outcome === "ok"
          ? result.out
          : result.err.filter((s) => s.startsWith("{")))[0]
      );
      expect(envelope.meta.har).toBe(join(dir, index()[0].file));
      expect(result.err).toContain(`[apicity] HAR: ${envelope.meta.har}`);
      if (outcome !== "ok")
        expect(document.log._apicity?.error?.code).toBe(envelope.code);
      if (outcome === "provider_error")
        expect(document.log._apicity?.status).toBe(403);
    }
  );
  it("drops successful captures in failures mode", async () => {
    env.APICITY_HAR_CAPTURE = "failures";
    const result = await run(endpoint, fake("ok"));
    expect(result.exit).toBe(0);
    expect(JSON.parse(result.out[0]).meta).toBeUndefined();
    expect(existsSync(dir)).toBe(false);
  });
  it("replays a real endpoint and forwards fetch through the provider factory", async () => {
    const ctx = setupPolly("openai/models-list");
    try {
      const result = await run([...endpoint, "--capture-har"], {
        instantiate: async (name, spec, secret, overrides) => {
          expect(overrides.fetch).toBeTypeOf("function");
          // Explicit fake key: never depend on an operator credential.
          const instance = await instantiateProvider(
            name,
            { ...spec, envVar: "" },
            secret,
            overrides
          );
          return instance;
        },
      });
      expect(result.exit, result.err.join("\n")).toBe(0);
      expect(har().log.entries[0].response.status).toBe(200);
      expect(index()).toHaveLength(1);
    } finally {
      await teardownPolly(ctx);
    }
  });
  it("factory uses an injected fetch", async () => {
    let calls = 0;
    const instance = await instantiateProvider(
      "openai",
      { ...PROVIDERS.openai, envVar: "" },
      undefined,
      {
        fetch: async () => {
          calls++;
          return Response.json({ data: [] });
        },
      }
    );
    const tree = instance as { get: { v1: { models(): Promise<unknown> } } };
    await tree.get.v1.models();
    expect(calls).toBe(1);
  });
  it("does not capture media downloads", async () => {
    const opts = fake("ok");
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input);
      return url.includes("api.openai.com")
        ? Response.json({ url: "https://example.test/image.png" })
        : new Response(new Uint8Array([1, 2]), {
            headers: { "content-type": "image/png" },
          });
    });
    const result = await run(
      [...endpoint, "--capture-har", "--output-dir", home],
      opts
    );
    expect(result.exit).toBe(0);
    expect(har().log.entries).toHaveLength(1);
  });
  it("capture write failure preserves endpoint success", async () => {
    writeFileSync(dir, "occupied");
    const result = await run([...endpoint, "--capture-har"], fake("ok"));
    expect(result.exit).toBe(0);
    expect(JSON.parse(result.out[0]).meta).toBeUndefined();
    expect(result.err.join("\n")).toContain("capture failed");
  });
});

describe("HAR management", () => {
  it("lists and filters, resolves callId, hides bodies and scrubs before sharing", async () => {
    await run([...endpoint, "--capture-har"], fake("ok"));
    await run([...endpoint, "--capture-har"], fake("provider_error"));
    const listed = await run([
      "har",
      "list",
      "--dir",
      dir,
      "--failures",
      "--provider",
      "openai",
      "--since",
      "2000-01-01",
      "--json",
    ]);
    expect(JSON.parse(listed.out[0]).data).toHaveLength(1);
    const row = index()[0];
    const file = join(dir, row.file);
    const doc = har();
    doc.log.entries[0].request.headers.push({
      name: "Authorization",
      value: "Bearer dirty-secret",
    });
    writeFileSync(file, JSON.stringify(doc));
    const shown = await run([
      "har",
      "show",
      row.callId,
      "--dir",
      dir,
      "--json",
    ]);
    expect(shown.exit).toBe(0);
    expect(shown.out[0]).not.toContain("dirty-secret");
    expect(JSON.parse(shown.out[0]).data.entries[0].response).toBeUndefined();
    const bodies = await run(["har", "show", file, "--bodies", "--json"]);
    expect(JSON.parse(bodies.out[0]).data.entries[0].response.text).toContain(
      "data"
    );
    const check = await run(["har", "scrub", file, "--check"]);
    expect(check.exit).toBe(1);
    expect(check.err.join()).toContain(file);
    expect(readFileSync(file, "utf8")).toContain("dirty-secret");
    expect((await run(["har", "scrub", file])).exit).toBe(0);
    expect(readFileSync(file, "utf8")).not.toContain("dirty-secret");
    expect((await run(["har", "scrub", file, "--check"])).exit).toBe(0);
  });
  it("reports empty directories and usage failures", async () => {
    const result = await run(["har", "list"]);
    expect(JSON.parse(result.out[0]).data).toEqual([]);
    for (const args of [
      ["show"],
      ["scrub"],
      ["list", "--since", "bad"],
      ["list", "--typo"],
    ]) {
      expect((await run(["har", ...args])).exit).toBe(1);
    }
  });
  it("doctor reports mode, path and writability without creating the directory", async () => {
    env.APICITY_HAR_CAPTURE = "failures";
    const rows = await collectDoctorRows({ env, home });
    expect(rows.find((r) => r.name === "HAR Capture")).toMatchObject({
      status: "ok",
      message: `failures; ${dir}; writable: yes`,
    });
    expect(existsSync(dir)).toBe(false);
  });
});
