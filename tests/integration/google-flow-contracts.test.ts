import { afterEach, describe, expect, it } from "vitest";
import { createServer, type IncomingMessage, type Server } from "node:http";
import {
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createGoogle } from "@apicity/google";

const RECORDING_NAME = "google-flow/contracts";
const PORT = 18181;
const LOCAL_FLOW_BASE_URL = `http://127.0.0.1:${PORT}/v1/google-flow`;
const CANONICAL_FLOW_BASE_URL = "https://api.useapi.net/v1/google-flow";

interface FixtureResponse {
  ok: true;
  method: string;
  path: string;
  query: Record<string, string>;
  body?: unknown;
  contentType?: string;
}

function shouldStartServer(ctx: PollyContext): boolean {
  if (ctx.mode === "record" || ctx.mode === "passthrough") return true;
  if (ctx.mode === "record-missing") return !recordingExists(RECORDING_NAME);
  return false;
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function startFixtureServer(): Promise<Server> {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
    const rawBody = await readBody(req);
    const contentType = req.headers["content-type"];
    let body: unknown;

    if (rawBody.length > 0 && contentType === "application/json") {
      body = JSON.parse(rawBody.toString("utf8"));
    } else if (rawBody.length > 0) {
      body = { bytes: rawBody.length };
    }

    const query: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }

    const response: FixtureResponse = {
      ok: true,
      method: req.method ?? "GET",
      path: url.pathname.replace("/v1/google-flow", ""),
      query,
      body,
      contentType: Array.isArray(contentType) ? contentType[0] : contentType,
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  return server;
}

function expectRequest(
  response: Record<string, unknown>,
  method: string,
  path: string,
  query?: Record<string, string>
): void {
  expect(response).toMatchObject({
    ok: true,
    method,
    path,
    ...(query ? { query } : {}),
  });
}

describe("google flow request contracts", () => {
  let ctx: PollyContext;
  let server: Server | undefined;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
      server = undefined;
    }
    await teardownPolly(ctx);
  });

  it("serializes every Google Flow v1 endpoint", async () => {
    ctx = setupPolly(RECORDING_NAME);
    const useFixtureServer = shouldStartServer(ctx);
    if (useFixtureServer) {
      server = await startFixtureServer();
    }

    const google = createGoogle({
      apiKey: "vertex-key",
      flowApiKey: "flow-key",
      flowBaseURL: useFixtureServer
        ? LOCAL_FLOW_BASE_URL
        : CANONICAL_FLOW_BASE_URL,
    });

    expectRequest(
      await google.v1.googleFlow.accounts({ cookies: "SID=fixture;" }),
      "POST",
      "/accounts"
    );
    expectRequest(
      await google.get.v1.googleFlow.accounts({}),
      "GET",
      "/accounts"
    );
    expectRequest(
      await google.get.v1.googleFlow.accounts.retrieve({
        email: "user@example.com",
      }),
      "GET",
      "/accounts/user%40example.com"
    );
    expectRequest(
      await google.delete.v1.googleFlow.accounts({
        email: "user@example.com",
      }),
      "DELETE",
      "/accounts/user%40example.com"
    );
    expectRequest(
      await google.post.v1.googleFlow.accounts.captchaProviders({
        CapSolver: "provider-key",
      }),
      "POST",
      "/accounts/captcha-providers"
    );
    expectRequest(
      await google.get.v1.googleFlow.accounts.captchaProviders({}),
      "GET",
      "/accounts/captcha-providers"
    );
    expectRequest(
      await google.get.v1.googleFlow.accounts.captchaStats({
        date: "2026-06-25",
        limit: 10,
        anonymized: true,
      }),
      "GET",
      "/accounts/captcha-stats",
      { date: "2026-06-25", limit: "10", anonymized: "true" }
    );
    expectRequest(
      await google.post.v1.googleFlow.assets({
        body: "fixture-image-bytes",
        contentType: "image/png",
        email: "user@example.com",
      }),
      "POST",
      "/assets/user%40example.com"
    );
    expectRequest(
      await google.get.v1.googleFlow.assets.retrieve({
        mediaGenerationId: "media-1",
      }),
      "GET",
      "/assets/media-1"
    );
    expectRequest(
      await google.post.v1.googleFlow.characters({
        displayName: "Ari",
        imageReference_1: "media-1",
      }),
      "POST",
      "/characters"
    );
    expectRequest(
      await google.get.v1.googleFlow.characters({
        email: "user@example.com",
      }),
      "GET",
      "/characters",
      { email: "user@example.com" }
    );
    expectRequest(
      await google.get.v1.googleFlow.characters.retrieve({ ref: "char/ref" }),
      "GET",
      "/characters/char%2Fref"
    );
    expectRequest(
      await google.delete.v1.googleFlow.characters({ ref: "char/ref" }),
      "DELETE",
      "/characters/char%2Fref"
    );
    expectRequest(
      await google.post.v1.googleFlow.voices({
        email: "user@example.com",
        voice: "Aoede",
        displayName: "Narrator",
        dialog: "Hello there",
        voicePerformance: "Warm and clear",
      }),
      "POST",
      "/voices"
    );
    expectRequest(
      await google.get.v1.googleFlow.voices({
        email: "user@example.com",
        source: "user",
      }),
      "GET",
      "/voices",
      { email: "user@example.com", source: "user" }
    );
    expectRequest(
      await google.get.v1.googleFlow.voices.retrieve({ ref: "voice/ref" }),
      "GET",
      "/voices/voice%2Fref"
    );
    expectRequest(
      await google.delete.v1.googleFlow.voices({ ref: "voice/ref" }),
      "DELETE",
      "/voices/voice%2Fref"
    );
    expectRequest(
      await google.post.v1.googleFlow.images({
        prompt: "A clean product photo",
        count: 1,
      }),
      "POST",
      "/images"
    );
    expectRequest(
      await google.post.v1.googleFlow.images.upscale({
        mediaGenerationId: "image-1",
        resolution: "2k",
      }),
      "POST",
      "/images/upscale"
    );
    expectRequest(
      await google.post.v1.googleFlow.videos({
        prompt: "A slow camera push through a studio",
        count: 1,
      }),
      "POST",
      "/videos"
    );
    expectRequest(
      await google.post.v1.googleFlow.videos.upscale({
        mediaGenerationId: "video-1",
        resolution: "1080p",
      }),
      "POST",
      "/videos/upscale"
    );
    expectRequest(
      await google.post.v1.googleFlow.videos.gif({
        mediaGenerationId: "video-1",
      }),
      "POST",
      "/videos/gif"
    );
    expectRequest(
      await google.post.v1.googleFlow.videos.extend({
        mediaGenerationId: "video-1",
        prompt: "Continue the motion",
      }),
      "POST",
      "/videos/extend"
    );
    expectRequest(
      await google.post.v1.googleFlow.videos.concatenate({
        media: [
          { mediaGenerationId: "video-1", trimStart: 1 },
          { mediaGenerationId: "video-2", trimEnd: 1 },
        ],
      }),
      "POST",
      "/videos/concatenate"
    );
    expectRequest(
      await google.get.v1.googleFlow.jobs({ options: "history" }),
      "GET",
      "/jobs",
      { options: "history" }
    );
    expectRequest(
      await google.get.v1.googleFlow.jobs.retrieve({ jobId: "job-1" }),
      "GET",
      "/jobs/job-1"
    );
  });
});
