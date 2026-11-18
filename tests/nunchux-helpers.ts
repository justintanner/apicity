import { expect } from "vitest";
import {
  createNunchux,
  type NunchuxAlibabaVideoSynthesisRequest,
} from "@apicity/nunchux";
import type { PollyContext } from "./harness";

const fixtures =
  "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures";
export const NUNCHUX_IMAGE = fixtures + "/cat1.jpg";
export const NUNCHUX_MAN_IMAGE = fixtures + "/man.jpg";
export const NUNCHUX_VIDEO = fixtures + "/cat1-kling-o3-3s.mp4";

const LIVE_WINDOW_MS = 60 * 60_000;
export const NUNCHUX_TEST_TIMEOUT_MS = LIVE_WINDOW_MS + 5 * 60_000;

export function nunchuxClient() {
  return createNunchux({
    apiKey: process.env.NUNCHUX_API_KEY ?? "nunchux-test-key",
  });
}

interface TaskAdapter<T> {
  submit: () => Promise<string>;
  poll: (id: string) => Promise<T>;
  status: (task: T) => string;
  isSuccess: (status: string) => boolean;
  isFailure: (status: string) => boolean;
  outputUrl: (task: T) => string | undefined;
}

export async function recordNunchuxTask<T>(
  adapter: TaskAdapter<T>,
  ctx: PollyContext
): Promise<T> {
  // A partial HAR replays its submit and existing polls immediately. Start
  // backing off once Polly reaches the live tail of the same task.
  let live = ctx.mode !== "replay";
  ctx.polly.server.any().on("response", (req) => {
    live = req.action !== "replay";
  });
  const id = await adapter.submit();
  expect(id).toBeTruthy();
  if (live) process.stdout.write(`Nunchux task ${id}\n`);
  const start = Date.now();
  for (let i = 0; i < 2000; i++) {
    if (live) {
      const elapsed = Date.now() - start;
      if (elapsed >= LIVE_WINDOW_MS) break;
      const delay =
        elapsed < 120_000 ? 5000 : elapsed < 600_000 ? 15_000 : 30_000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    const task = await adapter.poll(id);
    const status = adapter.status(task);
    if (adapter.isFailure(status))
      throw new Error(`Nunchux task ${id} ended with ${status}`);
    if (adapter.isSuccess(status)) {
      expect(adapter.outputUrl(task)).toMatch(/^https:\/\//);
      return task;
    }
  }
  throw new Error(
    `Nunchux task ${id} is still pending. Keep its task ID and HAR, then rerun dev:record in record-missing mode to resume polling.`
  );
}

export async function recordNunchuxAlibabaTask(
  body: NunchuxAlibabaVideoSynthesisRequest,
  ctx: PollyContext
) {
  const alibaba = nunchuxClient().v1.alibaba;
  const task = await recordNunchuxTask(
    {
      submit: async () => {
        const submitted =
          await alibaba.services.aigc.videoGeneration.videoSynthesis(body);
        expect(submitted.output.task_status).toBe("PENDING");
        return submitted.output.task_id;
      },
      poll: alibaba.tasks,
      status: (task) => task.output.task_status,
      isSuccess: (status) => status === "SUCCEEDED",
      isFailure: (status) => status === "FAILED" || status === "CANCELED",
      outputUrl: (task) => task.output.video_url,
    },
    ctx
  );
  expect(task.output.model).toBe(body.model);
  return task;
}

// bytedance adapter (ac-1zu8fr.11)
export async function recordNunchuxBytedanceTask(
  body: import("@apicity/nunchux").NunchuxBytedanceGenerationTasksRequest,
  ctx: PollyContext
) {
  const tasks = nunchuxClient().v1.bytedance.contents.generations.tasks;
  const task = await recordNunchuxTask(
    {
      submit: async () => (await tasks(body)).id,
      poll: tasks.retrieve,
      status: (task) => task.status,
      isSuccess: (status) => status === "succeeded",
      isFailure: (status) =>
        ["failed", "cancelled", "expired"].includes(status),
      outputUrl: (task) => task.content?.video_url,
    },
    ctx
  );
  expect(task.model).toBe(body.model);
  return task;
}

// minimax adapter (ac-1zu8fr.14)
