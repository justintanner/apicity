import { afterEach, describe, expect, it } from "vitest";
import { createServer, type IncomingMessage, type Server } from "node:http";
import {
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createGoogleFlow } from "@apicity/googleflow";

const RECORDING_NAME = "google-flow/contracts";
const PORT = 18181;
const LOCAL_FLOW_BASE_URL = `http://127.0.0.1:${PORT}/v1/google-flow`;

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

    const googleFlow = createGoogleFlow({
      apiKey: "flow-key",
      baseURL: LOCAL_FLOW_BASE_URL,
    });

    expectRequest(
      await googleFlow.v1.accounts({ cookies: "SID=fixture;" }),
      "POST",
      "/accounts"
    );
    expectRequest(await googleFlow.get.v1.accounts({}), "GET", "/accounts");
    expectRequest(
      await googleFlow.get.v1.accounts.retrieve({
        email: "user@example.com",
      }),
      "GET",
      "/accounts/user%40example.com"
    );
    expectRequest(
      await googleFlow.delete.v1.accounts({
        email: "user@example.com",
      }),
      "DELETE",
      "/accounts/user%40example.com"
    );
    expectRequest(
      await googleFlow.post.v1.accounts.captchaProviders({
        CapSolver: "provider-key",
      }),
      "POST",
      "/accounts/captcha-providers"
    );
    expectRequest(
      await googleFlow.get.v1.accounts.captchaProviders({}),
      "GET",
      "/accounts/captcha-providers"
    );
    expectRequest(
      await googleFlow.get.v1.accounts.captchaStats({
        date: "2026-06-25",
        limit: 10,
        anonymized: true,
      }),
      "GET",
      "/accounts/captcha-stats",
      { date: "2026-06-25", limit: "10", anonymized: "true" }
    );
    expectRequest(
      await googleFlow.post.v1.assets({
        body: "fixture-image-bytes",
        contentType: "image/png",
        email: "user@example.com",
      }),
      "POST",
      "/assets/user%40example.com"
    );
    expectRequest(
      await googleFlow.get.v1.assets.retrieve({
        mediaGenerationId: "media-1",
      }),
      "GET",
      "/assets/media-1"
    );
    expectRequest(
      await googleFlow.post.v1.characters({
        displayName: "Ari",
        imageReference_1: "media-1",
      }),
      "POST",
      "/characters"
    );
    expectRequest(
      await googleFlow.get.v1.characters({
        email: "user@example.com",
      }),
      "GET",
      "/characters",
      { email: "user@example.com" }
    );
    expectRequest(
      await googleFlow.get.v1.characters.retrieve({ ref: "char/ref" }),
      "GET",
      "/characters/char%2Fref"
    );
    expectRequest(
      await googleFlow.delete.v1.characters({ ref: "char/ref" }),
      "DELETE",
      "/characters/char%2Fref"
    );
    expectRequest(
      await googleFlow.post.v1.voices({
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
      await googleFlow.get.v1.voices({
        email: "user@example.com",
        source: "user",
      }),
      "GET",
      "/voices",
      { email: "user@example.com", source: "user" }
    );
    expectRequest(
      await googleFlow.get.v1.voices.retrieve({ ref: "voice/ref" }),
      "GET",
      "/voices/voice%2Fref"
    );
    expectRequest(
      await googleFlow.delete.v1.voices({ ref: "voice/ref" }),
      "DELETE",
      "/voices/voice%2Fref"
    );
    expectRequest(
      await googleFlow.post.v1.images({
        prompt: "A clean product photo",
        count: 1,
      }),
      "POST",
      "/images"
    );
    expectRequest(
      await googleFlow.post.v1.images.upscale({
        mediaGenerationId: "image-1",
        resolution: "2k",
      }),
      "POST",
      "/images/upscale"
    );
    expectRequest(
      await googleFlow.post.v1.videos({
        prompt: "A slow camera push through a studio",
        count: 1,
      }),
      "POST",
      "/videos"
    );
    expectRequest(
      await googleFlow.post.v1.videos.upscale({
        mediaGenerationId: "video-1",
        resolution: "1080p",
      }),
      "POST",
      "/videos/upscale"
    );
    expectRequest(
      await googleFlow.post.v1.videos.gif({
        mediaGenerationId: "video-1",
      }),
      "POST",
      "/videos/gif"
    );
    expectRequest(
      await googleFlow.post.v1.videos.extend({
        mediaGenerationId: "video-1",
        prompt: "Continue the motion",
      }),
      "POST",
      "/videos/extend"
    );
    expectRequest(
      await googleFlow.post.v1.videos.concatenate({
        media: [
          { mediaGenerationId: "video-1", trimStart: 1 },
          { mediaGenerationId: "video-2", trimEnd: 1 },
        ],
      }),
      "POST",
      "/videos/concatenate"
    );
    expectRequest(
      await googleFlow.get.v1.jobs({ options: "history" }),
      "GET",
      "/jobs",
      { options: "history" }
    );
    expectRequest(
      await googleFlow.get.v1.jobs.retrieve({ jobId: "job-1" }),
      "GET",
      "/jobs/job-1"
    );
  });
});
