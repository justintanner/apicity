import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { createServer, type IncomingMessage, type Server } from "node:http";
import {
  recordingExists,
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createGoogleFlow } from "@apicity/googleflow";

const RECORDING_NAME = "google-flow/i2v";
const PORT = 18182;
const LOCAL_FLOW_BASE_URL = `http://127.0.0.1:${PORT}/v1/google-flow`;
const CANONICAL_FLOW_BASE_URL = "https://api.useapi.net/v1/google-flow";

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
    }

    if (url.pathname.includes("/assets")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          media: [
            {
              mediaGenerationId: {
                mediaGenerationId: "test-asset-123",
              },
            },
          ],
        })
      );
      return;
    }

    if (url.pathname.includes("/videos")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          jobId: "job-123",
          media: [
            {
              mediaGenerationId: "test-video-123",
              url: "https://example.com/video.mp4",
            },
          ],
        })
      );
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
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

describe("googleflow image-to-video integration", () => {
  let ctx: PollyContext;
  let server: Server | undefined;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody(RECORDING_NAME);
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
      server = undefined;
    }
    await teardownPolly(ctx);
  });

  it("should generate a video from an image", async () => {
    const useFixtureServer = shouldStartServer(ctx);
    if (useFixtureServer) {
      server = await startFixtureServer();
    }

    const provider = createGoogleFlow({
      apiKey: process.env.GOOGLEFLOW_API_KEY ?? "googleflow-test-key",
      baseURL: LOCAL_FLOW_BASE_URL,
      timeout: 900000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "cat1.jpg"
    );
    const buffer = fs.readFileSync(fixturePath);
    const blob = new Blob([buffer], { type: "image/jpeg" });

    const uploadResult = await provider.post.v1.assets({
      body: blob,
      contentType: "image/jpeg",
    });

    expect(uploadResult).toBeDefined();
    const uploadData = uploadResult as any;
    expect(uploadData.media).toBeDefined();
    const startImageId =
      uploadData.media[0].mediaGenerationId.mediaGenerationId;

    const videoResult = await provider.post.v1.videos({
      prompt: "The cat gently swats at a floating dust particle",
      model: "veo-3.1-quality",
      startImage: startImageId,
      aspectRatio: "16:9",
    } as any);

    expect(videoResult).toBeDefined();
    const videoData = videoResult as any;
    expect(videoData.media).toBeDefined();
    expect(videoData.media.length).toBeGreaterThan(0);
    expect(typeof videoData.media[0].url).toBe("string");
  }, 900000);
});
