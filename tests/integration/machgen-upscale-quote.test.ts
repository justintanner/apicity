import { describe, expect, it } from "vitest";
import {
  createMachGen,
  MachGenUpscaleQuoteRequestSchema,
  type MachGenUpscaleQuoteRequest,
} from "@apicity/machgen";
import { setupPolly, teardownPolly } from "../harness";
import { MACHGEN_UPSCALE_SOURCE } from "../machgen-helpers";

const issues = (overrides: Record<string, unknown>) => {
  const result = MachGenUpscaleQuoteRequestSchema.safeParse({
    prompt: "",
    model: "Topaz-Video-Precision",
    task_type: "UPSCALE",
    src_task_ids: [MACHGEN_UPSCALE_SOURCE],
    video_config: { height: 1080, duration_secs: 4 },
    ...overrides,
  });
  return result.success
    ? []
    : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

describe("MachGen upscale quote", () => {
  it("takes only an UPSCALE task input and keeps generate's checks", () => {
    const machgen = createMachGen({ apiKey: "test-key" });
    expect(machgen.api.v0.upscale.quote.schema).toBe(
      MachGenUpscaleQuoteRequestSchema
    );
    expect(MachGenUpscaleQuoteRequestSchema.description).toContain(
      "MachGen's REST docs do not list this endpoint"
    );
    expect(issues({})).toEqual([]);
    expect(issues({ task_type: "T2V" })).toEqual([
      'task_type: Invalid input: expected "UPSCALE"',
    ]);
    expect(issues({ model: "Veo-3.1" })).toEqual([
      "task_type: Veo-3.1 does not support task_type=UPSCALE; allowed task types: T2V",
    ]);
    expect(issues({ src_task_ids: undefined })).toEqual([
      "src_task_ids: a source video or image is required for UPSCALE",
    ]);
    expect(issues({ video_config: { height: 1, duration_secs: 4 } })).toEqual([
      "video_config.height: Topaz-Video-Precision does not support UPSCALE height=1; allowed heights: 1080, 1440, 2160, 4320",
    ]);
    expect(issues({ upscale_config: { engine: "starlight-hq" } })).toEqual([
      "upscale_config.engine: Topaz-Video-Precision does not support UPSCALE engine=starlight-hq; allowed engines: artemis-hq, artemis-lq, artemis-mq, gaia-cg, gaia-hq, proteus",
    ]);
    // An id outside the matrix is accepted unchecked, as by generate.
    expect(issues({ model: "Vidu-Upscale-Pro" })).toEqual([]);
  });
  // The quote is free and creates no task. MachGen's REST docs do not list
  // the endpoint; this recording is the dated capture of a real answer.
  it("prices a Topaz upscale of an owned video", async () => {
    const ctx = setupPolly("machgen/topaz-video-generative-fast-upscale-quote");
    try {
      const machgen = createMachGen({
        apiKey: process.env.MACHGEN_API_KEY ?? "test-key",
      });
      const request: MachGenUpscaleQuoteRequest = {
        prompt: "",
        model: "Topaz-Video-Generative-Fast",
        task_type: "UPSCALE",
        src_task_ids: [MACHGEN_UPSCALE_SOURCE],
        upscale_config: { engine: "starlight-fast-2" },
        video_config: { height: 2160, duration_secs: 4 },
      };
      expect(
        machgen.api.v0.upscale.quote.schema.safeParse(request).success
      ).toBe(true);
      // 0.596 USD on 2026-10-26, as on 2026-10-25 for the same request.
      expect(await machgen.api.v0.upscale.quote(request)).toEqual({
        cost_micros: 596000,
      });
    } finally {
      await teardownPolly(ctx);
    }
  });
});
