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
    expect(table).toContain("5/10");
    expect(table).toContain("2026-11-11");
    expect(table).toContain("derived");
    expect(table).toContain("6/6");
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
    expect(i2v).toMatchObject({ models: "5/10", captured: "2026-11-11" });
    const t2i = envelope.data.find((row) => row.type === "t2i");
    expect(t2i).toMatchObject({ models: "8/10", captured: "2026-11-11" });
    const i2i = envelope.data.find((row) => row.type === "i2i");
    expect(i2i).toMatchObject({ models: "6/10", captured: "2026-11-11" });
    const t2v = envelope.data.find((row) => row.type === "t2v");
    expect(t2v).toMatchObject({ models: "7/10", captured: "2026-11-11" });
    const v2v = envelope.data.find((row) => row.type === "v2v");
    expect(v2v).toMatchObject({ models: "8/10", captured: "2026-11-11" });
    const derived = envelope.data.find((row) => row.type === "r2v");
    expect(derived).toMatchObject({
      leaderboard: "derived",
      models: "6/6",
      captured: "2026-11-11",
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
      model: "Dreamina Seedance 2.5",
      provider: "fal",
      dotPath: "bytedance.seedance2p5.imageToVideo",
      modelId: "-",
      price: { unit: "dynamic" },
      configured: false,
    });
    expect(
      envelope.data.find(
        (row) => row.model === "MiniMax H3 (768p)" && row.provider === "fal"
      )
    ).toMatchObject({
      rank: 4,
      dotPath: "minimax.h3.imageToVideo",
      modelId: "-",
      price: { unit: "seconds", min: 0.05, max: 0.16 },
      configured: false,
    });
    const kie = envelope.data.find((row) => row.provider === "kie");
    expect(kie?.configured).toBe(true);
    expect(kie?.modelId).not.toBe("-");
    expect(kie?.price).toMatchObject({
      unit: "seconds",
      min: 0.085,
      max: 0.79,
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
    expect(table).toContain(
      "not yet in apicity: Utopai X, SkyReels V4, Hyperflow H3, P-Video-2-Pro, Pika H3 Flex"
    );
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
    expect(table).toContain("openai.gptImage2");
    expect(table).toContain("grok-imagine-image-2.0");
    expect(table).toContain("gemini-3.1-flash-image");
    expect(table).toContain("GPT-Image-2.5-Sunburst");
    expect(table).toContain("not yet in apicity: MAI-Image-2.6, Seedream 5.5");
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
    expect(table).toContain("openai.gptImage2p5.flare.edit");
    expect(table).toContain("nanoBanana2p1.edit");
    expect(table).not.toContain("kie");
    expect(table).toContain("Krea 3 (Ultra)");
    expect(table).toContain("krea.v3.edit");
    expect(table).toContain(
      "not yet in apicity: MAI-Image-2.7-Preview, Seedream 5.5, MAI-Image-2.6, MAI-Image-2.6-Flash"
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
    expect(table).toContain("MiniMax-H3");
    expect(table).toContain(
      "not yet in apicity: Utopai X, Gemini Omni Flash 1.2, SkyReels V4"
    );
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
    expect(table).toContain("happyhorse/video-edit");
    expect(table).toContain("alibaba.happyHorse.videoEdit");
    expect(table).toContain("api.v3.alibaba.wan3p0.videoEdit");
    expect(table).toContain("api.v3.wavespeedAi.minimaxH3.videoEdit");
    expect(table).toContain("api.v3.bytedance.seedance2p0.videoEdit");
    expect(table).toContain("api.v3.runwayml.aleph2");
    expect(table).toContain(
      "not yet in apicity: Gemini Omni Flash 1.2, Hyperflow H3"
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
    expect([...new Set(envelope.data.map((row) => row.model))]).toHaveLength(6);
    expect(envelope.data[0]).toMatchObject({
      rank: 1,
      model: "Wan 3.0",
      provider: "fal",
    });
    // Dreamina Seedance 2.0 reaches r2v from the i2v board alone.
    expect(
      envelope.data.some(
        (row) => row.model === "Dreamina Seedance 2.0" && row.provider === "kie"
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

  it("filters the image and video types to MachGen's generate rows", async () => {
    const env = { MACHGEN_API_KEY: "present" };
    const counts: Record<string, number> = {};
    for (const type of ["t2i", "i2i", "t2v", "i2v", "r2v"]) {
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
    expect(counts).toEqual({ t2i: 5, i2i: 3, t2v: 3, i2v: 3, r2v: 4 });

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
