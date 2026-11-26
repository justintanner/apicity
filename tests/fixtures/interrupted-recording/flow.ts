// A submit-then-poll recording flow for tests/unit/harness-interrupted-
// recording.test.ts. Run it in the test's own process, or as a child that
// kills itself the moment the submit is accepted:
//
//   TSX_TSCONFIG_PATH=tests/tsconfig.json node --import tsx \
//     tests/fixtures/interrupted-recording/flow.ts <json options>
//
// It talks to a local server only; nothing here can bill a provider.
import { pathToFileURL } from "node:url";
import {
  lastExchangeWasLive,
  openRecordingSandbox,
  teardownPolly,
  type PollyContext,
  type RecordingSandbox,
} from "../../harness";

export const FLOW_RECORDING = "harness/interrupted-recording";
export const FLOW_KEY = "sk-live-secret-do-not-persist";

export interface FlowOptions {
  base: string;
  sandbox: RecordingSandbox;
  /** The submit's prompt; changing it changes the request's identity. */
  prompt?: string;
  /** SIGKILL this process as soon as the submit's response is in hand. */
  dieAfterSubmit?: boolean;
  /** SIGKILL this process after this many polls. */
  dieAfterPolls?: number;
}

export interface FlowResult {
  taskId: string;
  status: string;
  polls: number;
  /** Per exchange, in order: true when it reached the network. */
  live: boolean[];
}

function die(): never {
  process.kill(process.pid, "SIGKILL");
  // SIGKILL is not instant from the process's own point of view.
  for (;;) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
}

/** Submits once, then polls until the task completes. */
export async function runFlow(
  options: FlowOptions,
  onContext?: (ctx: PollyContext) => void
): Promise<FlowResult> {
  const ctx = openRecordingSandbox(FLOW_RECORDING, options.sandbox);
  onContext?.(ctx);
  const live: boolean[] = [];
  const headers = {
    authorization: `Bearer ${FLOW_KEY}`,
    "content-type": "application/json",
  };
  try {
    const submitted = await fetch(`${options.base}/v1/submit`, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt: options.prompt ?? "a red paper boat" }),
    });
    if (options.dieAfterSubmit) die();
    live.push(lastExchangeWasLive(FLOW_RECORDING));
    const { id } = (await submitted.json()) as { id: string };

    let status = "processing";
    let polls = 0;
    while (status !== "completed" && polls < 20) {
      const response = await fetch(`${options.base}/v1/result/${id}`, {
        headers,
      });
      live.push(lastExchangeWasLive(FLOW_RECORDING));
      status = ((await response.json()) as { status: string }).status;
      polls++;
      if (options.dieAfterPolls === polls) die();
    }
    return { taskId: id, status, polls, live };
  } finally {
    await teardownPolly(ctx);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = await runFlow(JSON.parse(process.argv[2]) as FlowOptions);
  process.stdout.write(JSON.stringify(result) + "\n");
}
