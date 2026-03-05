import { Polly, Timing } from "@pollyjs/core";
import FetchAdapter from "@pollyjs/adapter-fetch";
import FSPersister from "@pollyjs/persister-fs";
import path from "path";

Polly.register(FetchAdapter);
Polly.register(FSPersister);

export interface PollyContext {
  polly: Polly;
  mode: string;
}

export function setupPolly(recordingName: string): PollyContext {
  const mode = (process.env.POLLY_MODE ?? "replay") as
    | "record"
    | "replay"
    | "passthrough";
  const recordingsDir = path.resolve(import.meta.dirname, "recordings");

  const polly = new Polly(recordingName, {
    mode,
    adapters: [FetchAdapter],
    persister: FSPersister,
    persisterOptions: {
      fs: { recordingsDir },
    },
    recordFailedRequests: true,
    timing: Timing.fixed(0),
    matchRequestsBy: {
      headers: { exclude: ["authorization", "user-agent", "x-api-key"] },
    },
  });

  // Redact Authorization headers before persisting to disk
  polly.server.any().on("beforePersist", (_req, recording) => {
    const entries = recording.request?.headers ?? [];
    for (const header of entries) {
      if (header.name?.toLowerCase() === "authorization") {
        header.value = "Bearer ***";
      }
      if (header.name?.toLowerCase() === "x-api-key") {
        header.value = "***";
      }
    }
  });

  return { polly, mode };
}

export async function teardownPolly(ctx: PollyContext): Promise<void> {
  await ctx.polly.stop();
}
