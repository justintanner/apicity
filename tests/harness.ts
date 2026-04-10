import { Polly, Timing } from "@pollyjs/core";
import FetchAdapter from "@pollyjs/adapter-fetch";
import FSPersister from "@pollyjs/persister-fs";
import path from "path";
import fs from "fs";

Polly.register(FetchAdapter);
Polly.register(FSPersister);

export interface PollyContext {
  polly: Polly;
  mode: string;
}

export function setupPolly(recordingName: string): PollyContext {
  return setupPollyWithOptions(recordingName, {});
}

export function setupPollyForFileUploads(recordingName: string): PollyContext {
  // Disable body matching for FormData compatibility
  return setupPollyWithOptions(recordingName, {
    matchRequestsBy: {
      headers: { exclude: ["authorization", "user-agent", "x-api-key"] },
      body: false,
    },
  });
}

type RawPollyMode = "record" | "replay" | "passthrough" | "record-missing";
type PollyAdapterMode = "record" | "replay" | "passthrough";

function resolvePollyMode(): {
  raw: RawPollyMode;
  adapter: PollyAdapterMode;
  recordIfMissing: boolean;
} {
  const raw = (process.env.POLLY_MODE ?? "replay") as RawPollyMode;
  if (raw === "record-missing") {
    return { raw, adapter: "replay", recordIfMissing: true };
  }
  return { raw, adapter: raw, recordIfMissing: false };
}

function setupPollyWithOptions(
  recordingName: string,
  options: { matchRequestsBy?: Record<string, unknown> }
): PollyContext {
  const { raw, adapter, recordIfMissing } = resolvePollyMode();
  const recordingsDir = path.resolve(import.meta.dirname, "recordings");

  const defaultMatchRequestsBy = {
    headers: { exclude: ["authorization", "user-agent", "x-api-key"] },
  };

  const polly = new Polly(recordingName, {
    mode: adapter,
    adapters: [FetchAdapter],
    persister: FSPersister,
    persisterOptions: {
      fs: { recordingsDir },
    },
    recordIfMissing,
    recordFailedRequests: true,
    timing: Timing.fixed(0),
    matchRequestsBy: options.matchRequestsBy ?? defaultMatchRequestsBy,
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

  return { polly, mode: raw };
}

export async function teardownPolly(ctx: PollyContext): Promise<void> {
  await ctx.polly.stop();
}

export function recordingExists(recordingName: string): boolean {
  const recordingsDir = path.resolve(import.meta.dirname, "recordings");

  // For nested recording names like 'anthropic/skills-create',
  // Polly creates: provider_<hash>/endpoint_<hash>/recording.har
  const parts = recordingName.split("/");

  // Find a provider directory that matches
  const dirs = fs.readdirSync(recordingsDir);
  for (const dir of dirs) {
    // Check if this dir starts with the provider name
    if (parts.length > 1 && dir.startsWith(parts[0] + "_")) {
      // Check for endpoint subdirectory
      const subdirs = fs.readdirSync(path.join(recordingsDir, dir));
      for (const subdir of subdirs) {
        // Last part of the recording name should match the endpoint
        const endpointName = parts[parts.length - 1];
        if (subdir.startsWith(endpointName + "_")) {
          const harPath = path.join(
            recordingsDir,
            dir,
            subdir,
            "recording.har"
          );
          if (fs.existsSync(harPath)) {
            return true;
          }
        }
      }
    } else if (parts.length === 1 && dir.startsWith(parts[0] + "_")) {
      // Single-level recording name
      const harPath = path.join(recordingsDir, dir, "recording.har");
      if (fs.existsSync(harPath)) {
        return true;
      }
    }
  }

  return false;
}

export function getPollyMode(): RawPollyMode {
  return (process.env.POLLY_MODE ?? "replay") as RawPollyMode;
}
