import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  createMachGen,
  type MachGenUpscaleQuoteRequest,
} from "@apicity/machgen";
import { setupPollyForFileUploads, teardownPolly } from "../harness";

// ac-2h3t3v authorizes exactly one upload and one quote, no generation.
// Keep both in one HAR so replay uses the returned artifact without live state.
it("uploads a local video and quotes Topaz without generating", async () => {
  const ctx = setupPollyForFileUploads("machgen/machgen-upload-topaz-quote");
  const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
  const account = async () => {
    const response = await fetch(
      "https://api.machgen.ai/api/v0/billing/account",
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { balance_micros: number };
    expect(Number.isFinite(body.balance_micros)).toBe(true);
    return body.balance_micros;
  };
  const reportBalance = (phase: string, before: number, after: number) => {
    console.log(
      JSON.stringify({
        phase,
        before_balance_micros: before,
        after_balance_micros: after,
        observed_delta_micros: before - after,
      })
    );
  };
  try {
    const machgen = createMachGen({ apiKey, timeout: 120000 });
    const beforeUpload = await account();
    // The upload and these two balances are already recorded. Never re-record
    // them: continuation requires ac-9qfdel and only permits the unused quote.
    let upload;
    try {
      upload = await machgen.api.v0.upload({
        file: new Blob([readFileSync("tests/fixtures/seedance-ref.mp4")], {
          type: "video/mp4",
        }),
        filename: "seedance-ref.mp4",
      });
    } finally {
      reportBalance("upload", beforeUpload, await account());
    }
    expect(upload.artifact_path.length).toBeGreaterThan(0);
    for (const key of ["duration_secs", "fps", "frame_count"] as const) {
      if (upload[key] != null) expect(typeof upload[key]).toBe("number");
    }
    const request: MachGenUpscaleQuoteRequest = {
      prompt: "",
      model: "Topaz-Video-Precision",
      task_type: "UPSCALE",
      src_video_urls: ["@input/" + upload.artifact_path],
      video_config: { height: 1080, duration_secs: 4 },
      upscale_config: { engine: "proteus" },
    };
    expect(machgen.api.v0.upscale.quote.schema.safeParse(request).success).toBe(
      true
    );
    const beforeQuote = await account();
    try {
      const quote = await machgen.api.v0.upscale.quote(request);
      expect(Number.isFinite(quote.cost_micros)).toBe(true);
      expect(quote.cost_micros).toBeGreaterThanOrEqual(0);
    } finally {
      reportBalance("quote", beforeQuote, await account());
    }
  } finally {
    await teardownPolly(ctx);
  }
}, 180000);
