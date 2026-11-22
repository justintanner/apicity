import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  getPollyMode,
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";
import {
  createGoogle,
  GoogleError,
  type GoogleInteractionContent,
  type GoogleInteractionResponse,
} from "@apicity/google";

const RECORDING_NOT_FOUND = "google/omni-interactions-not-found";
const RECORDING_OMNI_1_2 = "google/omni-1-2-flash-t2v";
const RECORDING_OMNI_1_1_EDIT = "google/omni-1-1-flash-edit";
const DEFAULT_PROJECT = "apicity-youtube";
const FIXTURE_VIDEO = path.resolve(
  import.meta.dirname,
  "../fixtures/cat1-kling-o3-3s.mp4"
);

interface ServiceAccountJson {
  client_email: string;
  private_key: string;
  token_uri: string;
  project_id?: string;
}

let cachedAuth: Promise<{ oauthToken: string; project: string }> | undefined;

function needsLiveRecording(recordingName: string): boolean {
  const mode = getPollyMode();
  if (mode === "record" || mode === "passthrough") return true;
  if (mode === "record-missing") return !recordingExists(recordingName);
  return false;
}

async function mintServiceAccountAuth(): Promise<{
  oauthToken: string;
  project: string;
}> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is required to record Vertex Interactions HARs"
    );
  }
  const sa = JSON.parse(raw) as ServiceAccountJson;
  const now = Math.floor(Date.now() / 1000);
  const b64u = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const header = b64u({ alg: "RS256", typ: "JWT" });
  const claim = b64u({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  });
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(`${header}.${claim}`)
    .sign(sa.private_key, "base64url");

  const tokenRes = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(
      `Failed to mint Google OAuth token (${tokenRes.status}): ${await tokenRes.text()}`
    );
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("Google OAuth token response omitted access_token");
  }
  return {
    oauthToken: tokenJson.access_token,
    project:
      process.env.GOOGLE_CLOUD_PROJECT ?? sa.project_id ?? DEFAULT_PROJECT,
  };
}

/**
 * Resolves auth BEFORE `setupPolly` is called so the OAuth2 token exchange
 * never passes through Polly or gets recorded into the HAR.
 */
async function resolveAuth(
  recordingName: string
): Promise<{ oauthToken: string; project: string }> {
  if (!needsLiveRecording(recordingName)) {
    return { oauthToken: "test-oauth-token", project: DEFAULT_PROJECT };
  }
  cachedAuth ??= mintServiceAccountAuth();
  return cachedAuth;
}

function findInlineVideo(
  result: GoogleInteractionResponse
): Extract<GoogleInteractionContent, { type: "video" }> | undefined {
  for (const step of result.steps ?? []) {
    if (!("content" in step) || !Array.isArray(step.content)) continue;
    for (const part of step.content) {
      if (
        part.type === "video" &&
        typeof part.data === "string" &&
        part.data.length > 1000
      ) {
        return part;
      }
    }
  }
  return undefined;
}

describe("google Gemini Omni Flash via Vertex Interactions API (global)", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("returns 404 not_found for a bogus interaction id", async () => {
    const { oauthToken, project } = await resolveAuth(RECORDING_NOT_FOUND);
    ctx = setupPolly(RECORDING_NOT_FOUND);
    const google = createGoogle({ apiKey: "", oauthToken, timeout: 30000 });

    let caught: unknown;
    try {
      await google.get.v1.projects.locations.global.interactions(
        project,
        "nonexistent-interaction-id"
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(GoogleError);
    expect(caught).toMatchObject({ status: 404, code: "not_found" });
  });

  it("generates a minimal 3s 360p video with gemini-omni-1.2-flash", async () => {
    const { oauthToken, project } = await resolveAuth(RECORDING_OMNI_1_2);
    ctx = setupPolly(RECORDING_OMNI_1_2);
    const google = createGoogle({ apiKey: "", oauthToken, timeout: 300000 });

    const result = await google.v1.projects.locations.global.interactions(
      project,
      {
        model: "gemini-omni-1.2-flash",
        store: false,
        input: [
          {
            type: "user_input",
            content: [
              {
                type: "text",
                text: "A red paper boat drifts slowly across a still pond.",
              },
            ],
          },
        ],
        response_format: [
          {
            type: "video",
            delivery: "inline",
            aspect_ratio: "16:9",
            resolution: "360p",
            duration: "3s",
          },
        ],
      }
    );

    expect(result.status).toBe("completed");
    const video = findInlineVideo(result);
    expect(video?.mime_type).toMatch(/^video\//);
    expect(video?.data?.length ?? 0).toBeGreaterThan(1000);
    expect(result.usage?.total_output_tokens).toBeGreaterThan(0);
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  }, 300000);

  it("edits a 3s 360p video with gemini-omni-1.1-flash-preview", async () => {
    const { oauthToken, project } = await resolveAuth(RECORDING_OMNI_1_1_EDIT);
    ctx = setupPolly(RECORDING_OMNI_1_1_EDIT);
    const google = createGoogle({ apiKey: "", oauthToken, timeout: 300000 });
    const videoBase64 = fs.readFileSync(FIXTURE_VIDEO).toString("base64");

    const result = await google.v1.projects.locations.global.interactions(
      project,
      {
        model: "gemini-omni-1.1-flash-preview",
        store: false,
        input: [
          {
            type: "user_input",
            content: [
              {
                type: "text",
                text: "Shift the lighting to warm golden sunset tones.",
              },
              {
                type: "video",
                data: videoBase64,
                mime_type: "video/mp4",
              },
            ],
          },
        ],
        response_format: [
          {
            type: "video",
            delivery: "inline",
            resolution: "360p",
            duration: "3s",
          },
        ],
        generation_config: {
          video_config: {
            task: "edit",
          },
        },
      }
    );

    expect(result.status).toBe("completed");
    const video = findInlineVideo(result);
    expect(video?.mime_type).toMatch(/^video\//);
    expect(video?.data?.length ?? 0).toBeGreaterThan(1000);
    expect(result.usage?.total_input_tokens).toBeGreaterThan(0);
    expect(result.usage?.total_output_tokens).toBeGreaterThan(0);
  }, 300000);
});
