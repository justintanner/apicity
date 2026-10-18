import { describe, expect, it, vi } from "vitest";
import { getPollyMode, setupPolly, teardownPolly } from "../harness";

// A committed recording with one GET entry. The miss below is a request it
// does not hold; only replay reports a miss instead of reaching the network,
// so the record modes skip this file.
const RECORDING = "fireworks/rlor-trainer-jobs-list";
const JOBS_URL =
  "https://api.fireworks.ai/v1/accounts/test-account/rlorTrainerJobs";

describe.runIf(getPollyMode() === "replay")("teardownPolly", () => {
  it("fails when a request had no recording to replay", async () => {
    // Polly logs each miss with the whole request; keep it out of the run.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      const ctx = setupPolly(RECORDING);
      const url = `${JOBS_URL}?pageSize=1`;
      await expect(fetch(url)).rejects.toThrow(
        "Recording for the following request is not found"
      );
      await expect(teardownPolly(ctx)).rejects.toThrow(
        `Polly replay found no recording in "${RECORDING}" for GET ${url}.`
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("resolves when every request replays", async () => {
    const ctx = setupPolly(RECORDING);
    const response = await fetch(`${JOBS_URL}?pageSize=5`);
    expect(response.status).toBe(200);
    await expect(teardownPolly(ctx)).resolves.toBeUndefined();
  });
});
