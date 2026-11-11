import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createMachGen,
  MachGenAdapterCreateRequestSchema,
  type MachGenAdapterCreateRequest,
} from "@apicity/machgen";
import { setupPollyWithPersistScrubber, teardownPolly } from "../harness";
import {
  isRedactedUploadUrl,
  MACHGEN_SYNTHETIC_LORA_ID,
  MACHGEN_LORA_ADAPTER_CONFIG,
  MACHGEN_LORA_INFERENCE_CONFIG,
  md5Hex,
  putAdapterWeights,
  redactMachGenUploadUrls,
  syntheticH3Lora,
  uploadUrlsIn,
} from "../machgen-adapter-helpers";
import evidence from "../fixtures/machgen-evidence/machgen-adapter-reserve-2026-11-11.json";

const weights = syntheticH3Lora();
const RESERVE: MachGenAdapterCreateRequest = {
  model: "MiniMax-H3",
  size_bytes: weights.length,
  md5: md5Hex(weights),
  adapter_config: MACHGEN_LORA_ADAPTER_CONFIG,
  inference_config: MACHGEN_LORA_INFERENCE_CONFIG,
};

type Overrides = Partial<Record<keyof MachGenAdapterCreateRequest, unknown>>;
const issues = (overrides: Overrides) => {
  const result = MachGenAdapterCreateRequestSchema.safeParse({
    ...RESERVE,
    ...overrides,
  });
  return result.success
    ? []
    : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};
const sampling = (overrides: Record<string, unknown>) => ({
  inference_config: {
    ...MACHGEN_LORA_INFERENCE_CONFIG,
    sampling: { ...MACHGEN_LORA_INFERENCE_CONFIG.sampling, ...overrides },
  },
});

function machgenRecordings(): string[] {
  const root = new URL("../recordings/", import.meta.url);
  return readdirSync(root, { recursive: true, encoding: "utf8" })
    .filter((file) => file.startsWith("machgen_"))
    .filter((file) => file.endsWith("recording.har"))
    .map((file) => new URL(file, root).pathname);
}

describe("MachGen custom-LoRA reserve", () => {
  it("builds the same valid synthetic safetensors file every time", () => {
    // The reserve request carries this size and MD5, so its recording replays
    // only while the bytes stay the same.
    expect(weights.length).toBe(408);
    expect(md5Hex(weights)).toBe("4836aa15066d5e124172cdb1954c3616");
    expect(md5Hex(syntheticH3Lora())).toBe(md5Hex(weights));

    const view = new DataView(weights.buffer);
    const headerLength = Number(view.getBigUint64(0, true));
    expect(headerLength % 8).toBe(0);
    const header = JSON.parse(
      new TextDecoder().decode(weights.subarray(8, 8 + headerLength))
    ) as Record<
      string,
      { dtype: string; shape: number[]; data_offsets: number[] }
    >;
    const tensors = Object.entries(header).filter(
      ([k]) => k !== "__metadata__"
    );
    expect(tensors.map(([name]) => name)).toEqual([
      "blocks.0.attn.to_q.lora_A.weight",
      "blocks.0.attn.to_q.lora_B.weight",
    ]);
    let offset = 0;
    for (const [, tensor] of tensors) {
      expect(tensor.dtype).toBe("BF16");
      const bytes = tensor.shape[0] * tensor.shape[1] * 2;
      expect(tensor.data_offsets).toEqual([offset, offset + bytes]);
      offset += bytes;
    }
    expect(weights.length).toBe(8 + headerLength + offset);
  });

  it("pins the request schema to MachGen's 2026-11-11 reserve 400s", () => {
    const machgen = createMachGen({ apiKey: "test-key" });
    expect(machgen.api.v0.adapters.create.schema).toBe(
      MachGenAdapterCreateRequestSchema
    );
    expect(MachGenAdapterCreateRequestSchema.description).toContain(
      "treat it like a password"
    );
    expect(issues({})).toEqual([]);
    // p1: the query parameter is required.
    expect(issues({ model: undefined })).toHaveLength(1);
    // p2, p10: more than 8 bytes and at most 5 GB; a lowercase hex MD5.
    expect(issues({ size_bytes: 8 })).toEqual([
      "size_bytes: Too small: expected number to be >=9",
    ]);
    expect(issues({ size_bytes: 5_000_000_000 })).toEqual([]);
    expect(issues({ size_bytes: 5_000_000_001 })).toEqual([
      "size_bytes: Too big: expected number to be <=5000000000",
    ]);
    expect(issues({ md5: RESERVE.md5.toUpperCase() })).toEqual([
      "md5: Invalid string: must match pattern /^[0-9a-f]{32}$/",
    ]);
    // p3-p5: every adapter_config field is required, and unknown keys fail.
    expect(
      issues({
        adapter_config: {
          ...MACHGEN_LORA_ADAPTER_CONFIG,
          base_partition: "bogus",
          scaling: { mode: "alpha_over_rank" },
          extra_field: 1,
        },
      })
    ).toEqual([
      'adapter_config.base_partition: Invalid option: expected one of "FL2VA"|"Ref2VA"',
      "adapter_config.scaling.alpha: Invalid input: expected number, received undefined",
      'adapter_config: Unrecognized key: "extra_field"',
    ]);
    // p6, p7, p9: the sampling bounds and the sampler list, renoise included.
    expect(issues(sampling({ sampler: "renoise" }))).toEqual([]);
    expect(
      issues(
        sampling({
          num_inference_steps: 1001,
          guidance_scale: 0.5,
          video_shift: 0,
          sampler: "bogus",
        })
      )
    ).toEqual([
      "inference_config.sampling.num_inference_steps: Too big: expected number to be <=1000",
      "inference_config.sampling.guidance_scale: Invalid input: expected 1",
      "inference_config.sampling.video_shift: Too small: expected number to be >0",
      'inference_config.sampling.sampler: Invalid option: expected one of "euler"|"res_multistep"|"renoise"',
    ]);
    // c1-c4: the three sampling rules the docs list.
    expect(issues(sampling({ sampler: "res_multistep" }))).toEqual([
      "inference_config.sampling.sigma_grid: res_multistep requires the simple sigma grid",
    ]);
    expect(issues(sampling({ sigma_grid: "simple", audio_shift: 2 }))).toEqual([
      "inference_config.sampling.audio_shift: simple and fixed grids require audio_shift 3.0",
    ]);
    const fixed = (fixed_sigmas?: number[]) =>
      issues(
        sampling({ num_inference_steps: 2, sigma_grid: "fixed", fixed_sigmas })
      );
    expect(fixed([1, 0.5, 0])).toEqual([]);
    for (const sigmas of [undefined, [1, 0], [1, 0.5, 0.5, 0], [0.9, 0.5, 0]])
      expect(fixed(sigmas)).toEqual([
        "inference_config.sampling.fixed_sigmas: fixed_sigmas must decrease strictly from 1 to 0 with steps+1 entries",
      ]);

    // MachGen refused every probe, and so does the schema.
    expect(evidence.probes).toHaveLength(20);
    for (const probe of evidence.probes) {
      const model = new URLSearchParams(probe.query).get("model") ?? undefined;
      expect(
        MachGenAdapterCreateRequestSchema.safeParse({ ...probe.body, model })
          .success,
        probe.name
      ).toBe(false);
    }
  });

  // Reserving is free (the wallet read the same before and after). MachGen
  // hands out a one-time upload_url that anyone holding can write to for 7
  // days, so the persist scrubber replaces it before the HAR is written.
  it("reserves the synthetic LoRA upload", async () => {
    const ctx = setupPollyWithPersistScrubber(
      "machgen/adapters-create-synthetic-h3-lora",
      redactMachGenUploadUrls
    );
    try {
      const machgen = createMachGen({
        apiKey: process.env.MACHGEN_API_KEY ?? "test-key",
      });
      expect(
        machgen.api.v0.adapters.create.schema.safeParse(RESERVE).success
      ).toBe(true);
      const upload = await machgen.api.v0.adapters.create(RESERVE);
      // The id derives from the file and both configs, so a re-record
      // reserves the same one; a later commit makes the re-run answer ready.
      expect(upload).toMatchObject({
        adapter: MACHGEN_SYNTHETIC_LORA_ID,
        model: "MiniMax-H3",
        size_bytes: weights.length,
        chunk_size: 8388608,
      });
      expect(["pending", "ready"]).toContain(upload.status);
      if (upload.status === "ready") {
        expect(upload.upload_url).toBeNull();
      } else {
        // Recorded 2026-11-11T03:48:39Z: pending for 7 days.
        expect(upload.expires_at! - upload.created_at).toBe(7 * 86400);
        if (ctx.mode === "replay")
          expect(upload.upload_url).toBe("https://storage.googleapis.com/***");
        else expect(upload.upload_url).toMatch(/^https:\/\//);
      }
    } finally {
      await teardownPolly(ctx);
    }
  });

  // Reserve again (free; same id, fresh upload_url), send the weights, commit
  // (free). The PUT goes to Google Cloud Storage, not MachGen, and runs only
  // against a live upload_url: through node:https, so Polly never records it.
  // On replay the reserve answers the redacted URL and the PUT is skipped.
  it("commits the synthetic LoRA", async () => {
    const ctx = setupPollyWithPersistScrubber(
      "machgen/adapters-commit-synthetic-h3-lora",
      redactMachGenUploadUrls
    );
    try {
      const machgen = createMachGen({
        apiKey: process.env.MACHGEN_API_KEY ?? "test-key",
      });
      const reserved = await machgen.api.v0.adapters.create(RESERVE);
      expect(reserved.adapter).toBe(MACHGEN_SYNTHETIC_LORA_ID);
      if (
        reserved.status === "pending" &&
        !isRedactedUploadUrl(reserved.upload_url)
      )
        expect([200, 201]).toContain(
          await putAdapterWeights(reserved.upload_url!, weights)
        );
      const committed = await machgen.api.v0.adapters.commit(reserved.adapter);
      expect(committed).toMatchObject({
        adapter: MACHGEN_SYNTHETIC_LORA_ID,
        model: "MiniMax-H3",
        status: "ready",
        size_bytes: weights.length,
      });
      expect(committed.upload_url ?? null).toBeNull();
    } finally {
      await teardownPolly(ctx);
    }
  });

  it("keeps no live upload_url in any MachGen recording", () => {
    const files = machgenRecordings();
    expect(files.length).toBeGreaterThan(0);
    let redacted = 0;
    for (const file of files) {
      const har = JSON.parse(readFileSync(file, "utf8")) as {
        log: {
          entries: {
            request: { url: string };
            response: { content?: { text?: string } };
          }[];
        };
      };
      for (const entry of har.log.entries) {
        // A GCS resumable upload session URL is the same write capability.
        expect(entry.request.url, file).not.toMatch(/[?&]upload_id=/);
        let body: unknown;
        try {
          body = JSON.parse(entry.response.content?.text ?? "");
        } catch {
          continue;
        }
        for (const url of uploadUrlsIn(body)) {
          expect(isRedactedUploadUrl(url), file).toBe(true);
          if (url !== null) redacted++;
        }
      }
    }
    // The reserve recording above carries one, so the scan is not vacuous.
    expect(redacted).toBeGreaterThan(0);
  });
});
