import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "vitest";
import {
  createWaveSpeed,
  type WaveSpeedPrediction,
  type WaveSpeedPredictionResponse,
} from "@apicity/wavespeed";
import { recordingExists } from "./harness";

// Media inputs are public URLs that WaveSpeed fetches. Pinned to commit
// ba051bee, so a recorded request body stays byte-identical.
/** tests/fixtures/cat1.jpg, 768x1024. */
export const WAVESPEED_IMAGE =
  "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg";
/** tests/fixtures/cat1-kling-o3-3s.mp4: 3.0 s, 720x960, no audio. */
export const WAVESPEED_VIDEO =
  "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4";
/** tests/fixtures/seedance-ref.mp4: 4.0 s of colour bars and tone. */
export const WAVESPEED_VIDEO_4S =
  "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/seedance-ref.mp4";

const TERMINAL = new Set([
  "completed",
  "failed",
  "cancelled",
  "timeout",
  "deleted",
]);
// A render can queue for a long time (Wan 3.0 sat at `processing` for over
// 15 min on 2026-11-02), so live polls back off: every 5 s for the first
// 2 min, every 15 s to 10 min, then every 30 s, for at most 60 min. Replay
// reads the recorded polls at once.
const LIVE_WINDOW_MS = 60 * 60_000;
const liveDelayMs = (elapsedMs: number) =>
  elapsedMs < 2 * 60_000 ? 5000 : elapsedMs < 10 * 60_000 ? 15_000 : 30_000;
const MAX_REPLAY_POLLS = 2000;

/** The operator's key while recording; replay never sends a real one. */
export function wavespeedClient() {
  return createWaveSpeed({
    apiKey: process.env.WAVESPEED_API_KEY ?? "wavespeed-test-key",
  });
}

const liveFor = (recording: string) =>
  process.env.POLLY_MODE === "record" ||
  (process.env.POLLY_MODE === "record-missing" && !recordingExists(recording));

/**
 * Submits `payload` once through `submit`, polls `api.v3.predictions.result`
 * until the prediction is terminal and asserts a completed prediction of
 * `modelId` whose first output is an https URL. Returns the final prediction.
 *
 * A submit is never retried: one whose answer was lost may still have
 * created, and billed, a task. When the live window ends first, the saved
 * recording holds the submit and the polls so far. Rerun `dev:record` once
 * the prediction is terminal: record-missing replays the recorded exchanges,
 * so nothing is resubmitted, and records only the polls after them.
 */
export async function recordWaveSpeed<T>(
  submit: (payload: T) => Promise<WaveSpeedPredictionResponse>,
  payload: T,
  recording: string,
  modelId: string
): Promise<WaveSpeedPrediction> {
  const live = liveFor(recording);
  const submitted = await submit(payload);
  expect(submitted.data.model).toBe(modelId);
  const id = submitted.data.id;
  expect(id).toBeTruthy();
  if (live) {
    console.log(`Submitted ${recording}: prediction ${id}`);
    // Recovery journal for paid recording sessions; never written in replay.
    appendFileSync(
      process.env.WAVESPEED_RECORDING_LEDGER ??
        join(tmpdir(), "apicity-wavespeed-submissions.jsonl"),
      JSON.stringify({
        utc: new Date().toISOString(),
        recording,
        model: modelId,
        prediction_id: id,
      }) + "\n"
    );
  }

  const results = wavespeedClient().api.v3.predictions;
  let prediction = submitted.data;
  const started = Date.now();
  for (let poll = 0; poll < MAX_REPLAY_POLLS; poll++) {
    if (live) {
      const elapsedMs = Date.now() - started;
      if (elapsedMs >= LIVE_WINDOW_MS) break;
      await new Promise((resolve) =>
        setTimeout(resolve, liveDelayMs(elapsedMs))
      );
    }
    prediction = (await results.result(id)).data;
    if (TERMINAL.has(prediction.status)) break;
  }

  expect(
    prediction.status,
    prediction.error ||
      `prediction ${id} is still ${prediction.status}; rerun dev:record once it is terminal`
  ).toBe("completed");
  expect(prediction.id).toBe(id);
  expect(prediction.model).toBe(modelId);
  expect(prediction.outputs?.[0]).toMatch(/^https:\/\//);
  if (live)
    console.log(
      JSON.stringify({ recording, prediction: id, timings: prediction.timings })
    );
  return prediction;
}
