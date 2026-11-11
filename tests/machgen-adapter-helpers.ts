import { createHash } from "node:crypto";
import type {
  MachGenAdapterConfig,
  MachGenAdapterInferenceConfig,
} from "@apicity/machgen";
import type { PersistedHarRecording } from "./harness";

// Shared by the MachGen custom-LoRA recordings (machgen.api.v0.adapters).

/** BF16 tensors of the synthetic LoRA: one lora_A / lora_B pair, rank 4. */
const SYNTHETIC_LORA_TENSORS: ReadonlyArray<
  readonly [name: string, shape: readonly [number, number]]
> = [
  ["blocks.0.attn.to_q.lora_A.weight", [4, 8]],
  ["blocks.0.attn.to_q.lora_B.weight", [8, 4]],
];

/**
 * A synthetic MiniMax-H3 LoRA: a valid `.safetensors` file of a few hundred
 * bytes. It holds one BF16 `lora_A` / `lora_B` pair of zeros, so it changes
 * nothing even if a generation used it, and it was never trained. MachGen's
 * commit checks only the size, the MD5 and the safetensors header; tensor
 * names are checked at generation time, which these recordings never run.
 * The bytes are built here rather than committed, and are the same on every
 * call, so the reserve request (size and MD5) replays from its recording.
 */
export function syntheticH3Lora(): Uint8Array {
  const header: Record<string, unknown> = {
    __metadata__: {
      format: "pt",
      source: "apicity synthetic test fixture, not a trained LoRA",
    },
  };
  let offset = 0;
  for (const [name, [rows, cols]] of SYNTHETIC_LORA_TENSORS) {
    const bytes = rows * cols * 2;
    header[name] = {
      dtype: "BF16",
      shape: [rows, cols],
      data_offsets: [offset, offset + bytes],
    };
    offset += bytes;
  }
  // safetensors pads the JSON header with spaces to an 8-byte boundary.
  const json = JSON.stringify(header);
  const headerBytes = new TextEncoder().encode(
    json.padEnd(Math.ceil(json.length / 8) * 8, " ")
  );
  const file = new Uint8Array(8 + headerBytes.length + offset);
  new DataView(file.buffer).setBigUint64(0, BigInt(headerBytes.length), true);
  file.set(headerBytes, 8);
  return file;
}

/**
 * The id MachGen derived from `syntheticH3Lora()` and the two documented
 * configs below when it reserved them (2026-11-11). It names the same upload
 * for every later call on it.
 */
export const MACHGEN_SYNTHETIC_LORA_ID =
  "up-ccd9a6ae2539f829f226d9a439452835e065ce30";

export function md5Hex(bytes: Uint8Array): string {
  return createHash("md5").update(bytes).digest("hex");
}

/** MachGen's documented adapter_config example (custom-loras, 2026-11-11). */
export const MACHGEN_LORA_ADAPTER_CONFIG: MachGenAdapterConfig = {
  base_model: "minimax-h3",
  base_partition: "FL2VA",
  export_format: "h3-native-v1",
  scaling: { mode: "unit" },
};

/** MachGen's documented inference_config example (custom-loras, 2026-11-11). */
export const MACHGEN_LORA_INFERENCE_CONFIG: MachGenAdapterInferenceConfig = {
  default_strength: 1.0,
  trigger_prompt: "",
  sampling: {
    num_inference_steps: 6,
    guidance_scale: 1.0,
    video_shift: 12.0,
    audio_shift: 3.0,
    sampler: "euler",
    sigma_grid: "linspace",
  },
};

/**
 * What a recording keeps of a live `upload_url`: its origin and `/***`. The
 * URL takes a PUT of the weights for 7 days, and anyone holding it can write
 * the file, so no recording may keep one.
 */
export function redactedUploadUrl(url: string): string {
  try {
    return `${new URL(url).origin}/***`;
  } catch {
    return "***";
  }
}

/** True for `null` and for what `redactedUploadUrl` writes. */
export function isRedactedUploadUrl(value: unknown): boolean {
  return (
    value === null ||
    value === "***" ||
    (typeof value === "string" && /^https:\/\/[^/?#]+\/\*\*\*$/.test(value))
  );
}

/** Every `upload_url` value in a parsed JSON value, at any depth. */
export function uploadUrlsIn(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(uploadUrlsIn);
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) =>
    key === "upload_url" ? [item] : uploadUrlsIn(item)
  );
}

function redactUploadUrls(value: unknown): boolean {
  if (Array.isArray(value)) {
    let redacted = false;
    for (const item of value) redacted = redactUploadUrls(item) || redacted;
    return redacted;
  }
  if (value === null || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  let redacted = false;
  for (const [key, item] of Object.entries(record)) {
    if (key === "upload_url" && typeof item === "string") {
      if (!isRedactedUploadUrl(item)) {
        record[key] = redactedUploadUrl(item);
        redacted = true;
      }
    } else {
      redacted = redactUploadUrls(item) || redacted;
    }
  }
  return redacted;
}

/**
 * The persist scrubber for `setupPollyWithPersistScrubber`: it rewrites every
 * live `upload_url` in a JSON response body before the recording reaches
 * disk, so a committed HAR never carries one.
 */
export function redactMachGenUploadUrls(
  recording: PersistedHarRecording
): void {
  const content = recording.response?.content;
  if (typeof content?.text !== "string") return;
  let body: unknown;
  try {
    body = JSON.parse(content.text);
  } catch {
    return;
  }
  if (!redactUploadUrls(body)) return;
  content.text = JSON.stringify(body);
  const bytes = new TextEncoder().encode(content.text).length;
  content.size = bytes;
  if (!recording.response) return;
  recording.response.bodySize = bytes;
  for (const header of recording.response.headers ?? []) {
    if (header.name?.toLowerCase() === "content-length")
      header.value = String(bytes);
  }
}
