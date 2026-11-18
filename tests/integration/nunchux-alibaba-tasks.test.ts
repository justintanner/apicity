import { afterEach, describe, expect, it } from "vitest";
import { createNunchux, NunchuxError } from "@apicity/nunchux";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const TASK_ID = "bbd7fb24-1bc7-45ee-8c8b-c34d4c64c292";

describe("nunchux v1.alibaba.tasks integration", () => {
  let ctx: PollyContext;
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("reports an unknown task without submitting a job", async () => {
    ctx = setupPolly("nunchux/alibaba-task-not-found");
    const client = createNunchux({
      apiKey: process.env.NUNCHUX_API_KEY ?? "nunchux-test-key",
    });
    const error = await client.v1.alibaba
      .tasks(TASK_ID)
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(NunchuxError);
    // Nunchux rejects an invented UUID as an invalid task handle, rather
    // than returning DashScope's UNKNOWN status or HTTP 404.
    expect(error).toMatchObject({
      status: 401,
      body: { detail: "Invalid task handle" },
    });
  });
});
