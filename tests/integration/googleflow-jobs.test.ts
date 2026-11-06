import { afterEach, describe, expect, it } from "vitest";
import { createGoogleFlow } from "@apicity/googleflow";
import {
  setupPollyWithPersistScrubber,
  teardownPolly,
  type PersistedHarRecording,
  type PollyContext,
} from "../harness";

function scrubAccountEmail(recording: PersistedHarRecording): void {
  const content = recording.response?.content;
  if (content?.text) {
    content.text = content.text.replace(
      /[\w.+-]+@[\w.-]+\.[a-zA-Z]+/g,
      "account@example.com"
    );
  }
}

async function readJobs(options?: "summary" | "executing" | "history") {
  const googleFlow = createGoogleFlow({
    apiKey: process.env.GOOGLE_FLOW_API_KEY ?? "replay-key",
  });
  // Query requests require /jobs/?options=..., while default uses /jobs.
  // Polly matches the complete recorded URL, catching a missing slash.
  const result = await googleFlow.get.v1.jobs({ options });
  expect(result).toMatchObject({
    emails: expect.any(Array),
    videos: { summary: expect.any(Object) },
    images: { summary: expect.any(Object) },
    combined: { summary: expect.any(Object) },
  });
  return result;
}

describe("google flow jobs", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("reads default jobs without query parameters", async () => {
    ctx = setupPollyWithPersistScrubber(
      "google-flow/jobs-default",
      scrubAccountEmail
    );
    await readJobs();
  });

  it("reads summary jobs with the required slash", async () => {
    ctx = setupPollyWithPersistScrubber(
      "google-flow/jobs-summary",
      scrubAccountEmail
    );
    await readJobs("summary");
  });

  it("reads executing jobs with the required slash", async () => {
    ctx = setupPollyWithPersistScrubber(
      "google-flow/jobs-executing",
      scrubAccountEmail
    );
    const result = await readJobs("executing");
    expect(result.videos).toHaveProperty("executing");
    expect(result.images).toHaveProperty("executing");
  });

  it("reads job history with the required slash", async () => {
    ctx = setupPollyWithPersistScrubber(
      "google-flow/jobs-history",
      scrubAccountEmail
    );
    const result = await readJobs("history");
    expect(result.videos).toHaveProperty("executing");
    expect(result.images).toHaveProperty("executing");
    expect(result.videos).toHaveProperty("history");
    expect(result.images).toHaveProperty("history");
  });
});
