import { afterEach, describe, expect, it } from "vitest";
import { createNunchux, NunchuxError } from "@apicity/nunchux";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// A well-formed task ID that names no task. The poll is free.
const TASK_ID = "5f0c6c7e-2d3b-4f6a-9c1e-7b2a0d4e8f13";

describe("nunchux v1.bytedance.contents.generations.tasks.retrieve integration", () => {
  let ctx: PollyContext;
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("reports an unknown Seedance task without submitting a job", async () => {
    ctx = setupPolly("nunchux/bytedance-task-not-found");
    const client = createNunchux({
      apiKey: process.env.NUNCHUX_API_KEY ?? "nunchux-test-key",
    });
    const error = await client.v1.bytedance.contents.generations.tasks
      .retrieve(TASK_ID)
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(NunchuxError);
    // Like the Wan/HappyHorse poll, Nunchux rejects an invented ID as an
    // invalid task handle (HTTP 401) rather than answering 404.
    expect(error).toMatchObject({
      status: 401,
      body: { detail: "Invalid task handle" },
    });
  });
});
