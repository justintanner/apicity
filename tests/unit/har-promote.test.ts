import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ESLint } from "eslint";
import { createFal } from "@apicity/fal";
import { createKie } from "@apicity/kie";
import {
  createHarCapture,
  pollyEntryId,
  pollyRecordingDir,
  scrubHar,
  type Har,
} from "@apicity/har";
import { main, promote, PAID_OTP_HELPERS } from "../../scripts/har-promote.mjs";
import { PAID_ENDPOINTS } from "../../packages/provider/cost/src/paid-endpoints";
import { auditFalCredentialWiring } from "../../scripts/lib/fal-credential-hosts.mjs";
import { runHarCommand } from "../../packages/cli/src/har";
import * as harness from "../harness";

const repo = path.resolve(import.meta.dirname, "../..");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "har-promote-test-"));
const captures: Record<string, string> = {};
function read(file: string): Har {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function findHar(dir: string): string {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name);
    if (e.isDirectory()) {
      const nested = findHar(file);
      if (nested) return nested;
    } else if (file.endsWith(".har")) return file;
  }
  return "";
}
async function fixture(provider: "fal" | "kie") {
  const base = path.join(repo, "tests/recordings");
  const parent = path.join(
    base,
    fs.readdirSync(base).find((n) => n.startsWith(provider + "_"))!
  );
  const prefix =
    provider === "fal"
      ? "alibaba-happy-horse-v1-1-image-to-video_"
      : "flux3-klein-text-to-image_";
  const original = read(
    path.join(
      parent,
      fs.readdirSync(parent).find((n) => n.startsWith(prefix))!,
      "recording.har"
    )
  );
  const queue = original.log.entries.slice();
  const previous = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init);
    const e = queue.shift();
    if (!e || e.request.url !== req.url || e.request.method !== req.method)
      throw new Error("unexpected fixture request");
    return new Response(e.response.content.text, {
      status: e.response.status,
      statusText: e.response.statusText,
      headers: e.response.headers.map((h): [string, string] => [
        h.name,
        h.value,
      ]),
    });
  };
  const dir = path.join(scratch, provider, "capture");
  const capture = createHarCapture({
    dir,
    mode: "all",
    idFactory: () => "promotion-fixture",
    clock: () => Date.parse("2026-10-24T00:00:00Z"),
  });
  const input = JSON.parse(
    original.log.entries[0].request.postData!.text!
  ) as Record<string, unknown>;
  try {
    await capture.call(
      {
        provider,
        endpoint:
          provider === "fal"
            ? "alibaba.happyHorse.v1p1.imageToVideo"
            : "api.v1.jobs.createTask",
        input,
      },
      async () => {
        if (provider === "fal") {
          const client = createFal({
            apiKey: "test-key",
            fetch: capture.fetch,
          });
          await client.run.alibaba.happyHorse.v1p1.imageToVideo(input as never);
        } else {
          const client = createKie({
            apiKey: "test-key",
            fetch: capture.fetch,
          });
          const result = await client.post.api.v1.jobs.createTask(
            input as never
          );
          for (let n = 0; n < 10; n++) {
            const poll = await client.get.api.v1.jobs.recordInfo(
              result.data!.taskId
            );
            if (poll.data?.state === "success") break;
          }
        }
      }
    );
    expect(queue).toHaveLength(0);
  } finally {
    await capture.close();
    globalThis.fetch = previous;
  }
  captures[provider] = findHar(dir);
}
const logs = () => {
  const lines: string[] = [];
  return {
    lines,
    log: (s: string) => lines.push(s),
    error: (s: string) => lines.push(s),
  };
};
function root(label: string) {
  return fs.mkdtempSync(path.join(scratch, label + "-"));
}
function changed(label: string, mutate: (har: Har) => void, provider = "fal") {
  const har = read(captures[provider]);
  mutate(har);
  const file = path.join(scratch, label + ".har");
  fs.writeFileSync(file, JSON.stringify(har));
  return file;
}
beforeAll(async () => {
  await fixture("fal");
  await fixture("kie");
}, 30000);
afterAll(() => fs.rmSync(scratch, { recursive: true, force: true }));

describe("HAR promotion", () => {
  it.each(["fal", "kie"])(
    "promotes %s through typecheck and real Polly replay",
    async (provider) => {
      const dir = root(provider);
      const name = `${provider}/promoted-fixture`;
      const io = logs();
      const result = await main(
        [captures[provider], "--name", name, "--root", dir],
        io
      );
      expect(io.lines.join("\n")).toContain("har:promote: replay passed");
      expect(result).toBe(0);
      const rec = read(
        path.join(
          dir,
          "tests/recordings",
          pollyRecordingDir(name),
          "recording.har"
        )
      );
      expect(rec.log.creator.name).toBe("Polly.JS");
      expect(rec.log._apicity?.outcome).toBe("ok");
      expect(rec.log).toHaveProperty("_recordingName", name);
      for (const e of rec.log.entries) expect(e._id).toBe(pollyEntryId(e));
      const file = path.join(
        dir,
        `tests/integration/${provider}-promoted-fixture.test.ts`
      );
      const text = fs.readFileSync(file, "utf8");
      expect(text).toContain("setupPoll" + `y("${name}")`);
      expect(text).toContain(`process.env.${provider.toUpperCase()}_API_KEY`);
      if (provider === "kie") {
        expect(read(captures.kie).log.entries).toHaveLength(3);
        expect(rec.log.entries.map((e) => e._order)).toEqual([0, 0, 1, 2]);
        expect(text).toContain("mintKieCreateTaskOtp");
        expect(text).toContain("TEST_PAYGATE_SECRET");
        expect(text).toContain("toBe(4)");
      } else
        expect(
          auditFalCredentialWiring({
            recordingsRoot: path.join(dir, "tests/recordings"),
            testsDir: path.join(dir, "tests"),
          }).failures
        ).toEqual([]);
      const lint = await new ESLint().lintText(text, {
        filePath: path.join(repo, "tests/integration", path.basename(file)),
      });
      expect(lint.flatMap((r) => r.messages)).toEqual([]);
      const duplicate = logs();
      expect(
        await main(
          [captures[provider], "--name", name, "--root", dir],
          duplicate
        )
      ).toBe(2);
      expect(duplicate.lines.join()).toContain("(exists)");
    },
    120000
  );

  const refusals: Array<[string, (h: Har) => void, string?]> = [
    [
      "outcome-not-ok",
      (h) => {
        h.log._apicity!.outcome = "provider_error";
      },
    ],
    [
      "exchange-failed",
      (h) => {
        h.log.entries[0].response.content.text = '{"code":422,"msg":"failure"}';
      },
      "kie",
    ],
    [
      "needs-scrub",
      (h) => {
        h.log.entries[0].request.headers.push({
          name: "authorization",
          value: "Bearer sk-live-planted",
        });
      },
    ],
    [
      "endpoint-not-in-catalog",
      (h) => {
        h.log._apicity!.endpoint = "alibaba.happyHorse.v9.nothing";
      },
    ],
    [
      "fal-mixed-hosts",
      (h) => {
        const e = structuredClone(h.log.entries[0]);
        e.request.url = "https://api.fal.ai/v1/models";
        h.log.entries.push(e);
      },
    ],
    [
      "streamed",
      (h) => {
        h.log.entries[0]._apicity!.streamed = true;
      },
    ],
    [
      "multipart-body",
      (h) => {
        h.log.entries[0].request.postData!.mimeType = "multipart/form-data";
      },
    ],
    [
      "query-shape",
      (h) => {
        h.log.entries[0].request.url += "?a=one&a=two";
        Object.assign(h, scrubHar(h));
      },
    ],
    [
      "dry-replay:identity",
      (h) => {
        h.log.entries[0].request.headers.push({
          name: "x-not-sent",
          value: "yes",
        });
      },
    ],
    [
      "too-many-exchanges",
      (h) => {
        h.log.entries[0]._apicity!.pollRepeat = 500;
      },
    ],
    [
      "dry-replay:unmatched-exchange",
      (h) => {
        const e = structuredClone(h.log.entries[0]);
        e.request.url = "https://fal.run/not-a-catalog-path";
        h.log.entries.push(e);
      },
    ],
  ];
  it.each(refusals)(
    "refuses %s without writing",
    async (code, mutate, provider = "fal") => {
      const capture = changed(code.replaceAll(":", "-"), mutate, provider);
      const dir = root("refusal");
      const io = logs();
      expect(
        await main(
          [capture, "--name", `${provider}/refused`, "--root", dir],
          io
        )
      ).toBe(2);
      expect(io.lines).toHaveLength(1);
      expect(io.lines[0]).toContain(`(${code})`);
      expect(fs.readdirSync(dir)).toEqual([]);
      if (code === "needs-scrub") {
        expect(
          await runHarCommand(["scrub", "--check", capture], {
            out: io.log,
            err: io.error,
          })
        ).toBe(1);
        expect(
          await runHarCommand(["scrub", "--check", captures.fal], {
            out: io.log,
            err: io.error,
          })
        ).toBe(0);
      }
    }
  );
  it("dry-runs the full async plan without writing", async () => {
    const dir = root("dry");
    const io = logs();
    expect(
      await main(
        [captures.kie, "--name=kie/dry-fixture", `--root=${dir}`, "--dry-run"],
        io
      )
    ).toBe(0);
    expect(io.lines.join()).toContain("call 4:");
    expect(io.lines.join()).toContain("toBe(4)");
    expect(fs.readdirSync(dir)).toEqual([]);
  });
  it.each([false, true])(
    "rolls back failed replay, keep=%s",
    async (keep) => {
      const dir = root("rollback");
      const io = logs();
      await expect(
        promote(
          {
            capture: captures.fal,
            name: "fal/rollback",
            root: dir,
            keep,
            checks: { replay: async () => false },
          },
          io
        )
      ).rejects.toThrow("injected replay failure");
      expect(fs.existsSync(path.join(dir, "tests"))).toBe(keep);
      if (!keep) expect(fs.readdirSync(dir)).toEqual([]);
    },
    120000
  );
  it("restores clean tracked files on forced failure and refuses dirty replacements", async () => {
    const dir = root("force");
    const io = logs();
    const options = { capture: captures.fal, name: "fal/forced", root: dir };
    const paths = await promote(
      { ...options, checks: { replay: async () => true } },
      io
    );
    const git = (args: string[]) =>
      execFileSync("git", args, { cwd: dir, stdio: "pipe" });
    git(["init"]);
    git(["add", "."]);
    git([
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "commit",
      "-m",
      "fixture",
    ]);
    const before = [paths.recFile, paths.testFile].map((f) =>
      fs.readFileSync(f, "utf8")
    );
    await expect(
      promote(
        { ...options, force: true, checks: { replay: async () => false } },
        io
      )
    ).rejects.toThrow("injected replay failure");
    expect(
      [paths.recFile, paths.testFile].map((f) => fs.readFileSync(f, "utf8"))
    ).toEqual(before);
    fs.appendFileSync(paths.testFile, "\n// unfinished change\n");
    await expect(
      promote({ ...options, force: true }, io)
    ).rejects.toMatchObject({ code: "force-unrecoverable" });
  }, 120000);
  it("pins every paid endpoint to an existing helper", () => {
    expect(Object.keys(PAID_OTP_HELPERS).sort()).toEqual(
      PAID_ENDPOINTS.map(
        ({ key }) => `${key.provider}\t${key.method}\t${key.dotPath}`
      ).sort()
    );
    for (const { helper } of Object.values(PAID_OTP_HELPERS))
      expect(harness).toHaveProperty(helper);
  });
  it("refuses alternate recording roots outside replay", () => {
    const mode = process.env.POLLY_MODE;
    const dir = process.env.POLLY_RECORDINGS_DIR;
    try {
      process.env.POLLY_MODE = "record-missing";
      process.env.POLLY_RECORDINGS_DIR = scratch;
      expect(() =>
        harness[("setupPoll" + "y") as "setupPolly"]("kie/override-probe")
      ).toThrow(/replay-only/);
    } finally {
      if (mode === undefined) delete process.env.POLLY_MODE;
      else process.env.POLLY_MODE = mode;
      if (dir === undefined) delete process.env.POLLY_RECORDINGS_DIR;
      else process.env.POLLY_RECORDINGS_DIR = dir;
    }
  });
});
