/**
 * `apicity frontier` follows the discovery output rule: a table at a
 * terminal, the success envelope when piped or `--json`, and the data alone
 * for `--quiet`.
 */
import { describe, expect, it } from "vitest";
import type { CliWriter } from "../../packages/cli/src/envelope";
import { runMain } from "../../packages/cli/src/main";

interface Capture {
  writer: CliWriter;
  out: string[];
  err: string[];
}

function capture(): Capture {
  const out: string[] = [];
  const err: string[] = [];
  return {
    writer: { out: (text) => out.push(text), err: (text) => err.push(text) },
    out,
    err,
  };
}

const QUIET_ENV = { KIE_API_KEY: "present" };

describe("apicity frontier", () => {
  it("prints the six types as a table at a terminal", async () => {
    const { writer, out, err } = capture();
    await expect(
      runMain(["frontier"], writer, { stdoutIsTTY: true, env: QUIET_ENV })
    ).resolves.toBe(0);
    expect(err).toEqual([]);
    const table = out.join("\n");
    expect(table.split("\n")[0]).toContain("type");
    expect(table).toContain("leaderboard");
    expect(table).toContain("i2v");
    expect(table).toContain("image-to-video");
    expect(table).toContain("10/10");
    expect(table).toContain("2026-10-22");
    expect(table).toContain("derived");
    expect(table).toContain("5/9");
    expect(table).toContain("8/8");
    expect(table).not.toContain("0/0");
    expect(table).not.toContain("present");
  });

  it("prints the type list as an envelope when stdout is not a terminal", async () => {
    const { writer, out } = capture();
    await expect(
      runMain(["frontier"], writer, { stdoutIsTTY: false, env: {} })
    ).resolves.toBe(0);
    const envelope = JSON.parse(out.join("\n")) as {
      ok: boolean;
      data: Array<{ type: string; models: string; leaderboard: string }>;
    };
    expect(envelope.ok).toBe(true);
    expect(envelope.data).toHaveLength(6);
    expect(envelope.data.map((row) => row.type)).toEqual([
      "t2i",
      "i2i",
      "t2v",
      "i2v",
      "v2v",
      "r2v",
    ]);
    const i2v = envelope.data.find((row) => row.type === "i2v");
    expect(i2v).toMatchObject({ models: "10/10", captured: "2026-10-22" });
    const t2i = envelope.data.find((row) => row.type === "t2i");
    expect(t2i).toMatchObject({ models: "8/10", captured: "2026-10-22" });
    const i2i = envelope.data.find((row) => row.type === "i2i");
    expect(i2i).toMatchObject({ models: "7/10", captured: "2026-10-22" });
    const t2v = envelope.data.find((row) => row.type === "t2v");
    expect(t2v).toMatchObject({ models: "9/10", captured: "2026-10-22" });
    const v2v = envelope.data.find((row) => row.type === "v2v");
    expect(v2v).toMatchObject({ models: "5/9", captured: "2026-10-22" });
    const derived = envelope.data.find((row) => row.type === "r2v");
    expect(derived).toMatchObject({
      leaderboard: "derived",
      models: "8/8",
      captured: "2026-10-22",
    });
  });

  it("prints i2v rows for --json and the data alone for --quiet", async () => {
    const json = capture();
    await expect(
      runMain(["frontier", "i2v", "--json"], json.writer, {
        stdoutIsTTY: true,
        env: QUIET_ENV,
      })
    ).resolves.toBe(0);
    const envelope = JSON.parse(json.out.join("\n")) as {
      ok: boolean;
      data: Array<{
        model: string;
        provider: string;
        dotPath: string;
        modelId: string;
        price: { unit: string; min?: number; max?: number } | null;
        configured: boolean;
      }>;
    };
    expect(envelope.ok).toBe(true);
    expect(envelope.data.length).toBeGreaterThan(10);
    expect(envelope.data[0]).toMatchObject({
      rank: 1,
      model: "MiniMax H3 (768p)",
      provider: "fal",
      dotPath: "minimax.h3.imageToVideo",
      modelId: "-",
      price: { unit: "dynamic" },
      configured: false,
    });
    const kie = envelope.data.find((row) => row.provider === "kie");
    expect(kie?.configured).toBe(true);
    expect(kie?.modelId).not.toBe("-");
    expect(kie?.price).toMatchObject({
      unit: "seconds",
      min: 0.04,
      max: 0.065,
    });

    const quiet = capture();
    await expect(
      runMain(["frontier", "image-to-video", "--quiet"], quiet.writer, {
        stdoutIsTTY: true,
        env: QUIET_ENV,
      })
    ).resolves.toBe(0);
    const data = JSON.parse(quiet.out.join("\n")) as { model: string }[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.map((row) => row.model)).toEqual(
      envelope.data.map((row) => row.model)
    );
    expect(quiet.out.join("\n")).not.toContain('"ok"');
  });

  it("prints an i2v table with configured yes or no", async () => {
    const { writer, out } = capture();
    await expect(
      runMain(["frontier", "i2v", "--provider", "kie"], writer, {
        stdoutIsTTY: true,
        env: QUIET_ENV,
      })
    ).resolves.toBe(0);
    const table = out.join("\n");
    expect(table.split("\n")[0]).toContain("modelId");
    expect(table.split("\n")[0]).toContain("price");
    expect(table).toContain("configured");
    expect(table).toContain("api.v1.jobs.createTask");
    expect(table).toContain("minimax-h3/image-to-video");
    expect(table).toContain("0.04-0.065 USD/s");
    expect(table).toContain("yes");
    expect(table).not.toContain("fal");
    expect(table).not.toContain("not yet in apicity");
    expect(table).not.toContain("present");
  });

  it("prints t2i rows and names the unmapped image models", async () => {
    const { writer, out, err } = capture();
    await expect(
      runMain(["frontier", "t2i"], writer, {
        stdoutIsTTY: true,
        env: QUIET_ENV,
      })
    ).resolves.toBe(0);
    expect(err).toEqual([]);
    const table = out.join("\n");
    expect(table).toContain("GPT Image 2.5 Sunburst (max)");
    expect(table).toContain("openai.gptImage2p5.sunburst.textToImage");
    expect(table).toContain("gpt-image-2-5-sunburst-text-to-image");
    expect(table).toContain("nano-banana-2");
    expect(table).toContain("v1.images");
    expect(table).toContain(
      "not yet in apicity: MAI-Image-2.6, MAI-Image-2.6-Flash"
    );
  });

  it("prints i2i fal rows and keeps the gaps", async () => {
    const { writer, out } = capture();
    await expect(
      runMain(["frontier", "i2i", "--provider", "fal"], writer, {
        stdoutIsTTY: true,
        env: {},
      })
    ).resolves.toBe(0);
    const table = out.join("\n");
    expect(table).toContain("openai.gptImage2p5.sunburst.edit");
    expect(table).toContain("nanoBanana2p1.edit");
    expect(table).toContain("bytedance.seedream.v5.pro.edit");
    expect(table).toContain("meta.museImage.edit");
    expect(table).toContain("microsoft.maiImage2p5Pro.edit");
    expect(table).not.toContain("kie");
    expect(table).toContain("Krea 3 (Ultra)");
    expect(table).toContain(
      "not yet in apicity: MAI-Image-2.6, Krea 3 (Ultra), MAI-Image-2.6-Flash"
    );
  });

  it("prints t2v rows and names the unmapped video models", async () => {
    const { writer, out, err } = capture();
    await expect(
      runMain(["frontier", "t2v"], writer, {
        stdoutIsTTY: true,
        env: QUIET_ENV,
      })
    ).resolves.toBe(0);
    expect(err).toEqual([]);
    const table = out.join("\n");
    expect(table).toContain("alibaba.wan3p0.textToVideo");
    expect(table).toContain("wan/3-0-video-prime");
    expect(table).toContain("omni-flash");
    expect(table).toContain("not yet in apicity: Utopai X");
  });

  it("prints v2v rows through the video-editing alias", async () => {
    const { writer, out } = capture();
    await expect(
      runMain(["frontier", "video-editing"], writer, {
        stdoutIsTTY: true,
        env: {},
      })
    ).resolves.toBe(0);
    const table = out.join("\n");
    expect(table).toContain("geminiOmniFlash.v1p1.edit");
    expect(table).toContain("wan.v2p7.editVideo");
    expect(table).toContain("wan2.7-videoedit");
    expect(table).toContain("kling-3.0-omni/transformation");
    expect(table).toContain(
      "not yet in apicity: Wan 3.0, MiniMax H3 (768p), Dreamina Seedance 2.0, Aleph 2.0"
    );
  });

  it("prints the derived r2v rows with no gaps", async () => {
    const { writer, out } = capture();
    await expect(
      runMain(["frontier", "r2v", "--json"], writer, {
        stdoutIsTTY: true,
        env: {},
      })
    ).resolves.toBe(0);
    const envelope = JSON.parse(out.join("\n")) as {
      ok: boolean;
      data: Array<{ rank: number; model: string; provider: string }>;
    };
    expect(envelope.ok).toBe(true);
    expect([...new Set(envelope.data.map((row) => row.model))]).toHaveLength(8);
    expect(envelope.data[0]).toMatchObject({
      rank: 1,
      model: "Wan 3.0",
      provider: "fal",
    });
    expect(
      envelope.data.some(
        (row) =>
          row.model === "Grok Imagine Video 1.5" && row.provider === "xai"
      )
    ).toBe(true);

    const table = capture();
    await expect(
      runMain(["frontier", "reference-to-video"], table.writer, {
        stdoutIsTTY: true,
        env: {},
      })
    ).resolves.toBe(0);
    expect(table.out.join("\n")).not.toContain("not yet in apicity");
  });

  it("filters the video types to MachGen's generate rows", async () => {
    const env = { MACHGEN_API_KEY: "present" };
    const counts: Record<string, number> = {};
    for (const type of ["t2v", "i2v", "r2v"]) {
      const { writer, out } = capture();
      await expect(
        runMain(["frontier", type, "--provider", "machgen", "--json"], writer, {
          stdoutIsTTY: true,
          env,
        })
      ).resolves.toBe(0);
      const envelope = JSON.parse(out.join("\n")) as {
        data: Array<{ dotPath: string; modelId: string; configured: boolean }>;
      };
      expect(
        envelope.data.every(
          (row) => row.dotPath === "api.v0.generate" && row.configured
        )
      ).toBe(true);
      counts[type] = envelope.data.length;
    }
    expect(counts).toEqual({ t2v: 4, i2v: 6, r2v: 5 });

    const { writer, err } = capture();
    await expect(
      runMain(["frontier", "v2v", "--provider", "machgen"], writer, {
        stdoutIsTTY: false,
        env: {},
      })
    ).resolves.toBe(2);
    expect(err.join("\n")).toContain("run: apicity frontier v2v");
  });

  it("rejects an unknown type and names the six codes", async () => {
    const { writer, out, err } = capture();
    await expect(
      runMain(["frontier", "audio"], writer, { stdoutIsTTY: false, env: {} })
    ).resolves.toBe(2);
    expect(out).toEqual([]);
    const envelope = JSON.parse(err.join("\n")) as {
      ok: boolean;
      code: string;
      hint: string;
    };
    expect(envelope.ok).toBe(false);
    expect(envelope.code).toBe("not_found");
    expect(envelope.hint).toContain("t2i, i2i, t2v, i2v, v2v, r2v");
  });

  it("rejects a provider filter that leaves no rows", async () => {
    const { writer, err } = capture();
    await expect(
      runMain(["frontier", "i2v", "--provider", "openai"], writer, {
        stdoutIsTTY: false,
        env: {},
      })
    ).resolves.toBe(2);
    const envelope = JSON.parse(err.join("\n")) as { hint: string };
    expect(envelope.hint).toBe("run: apicity frontier i2v");
  });
});
