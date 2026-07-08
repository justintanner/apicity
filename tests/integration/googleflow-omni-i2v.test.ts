import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { createServer, type Server } from "node:http";
import {
  recordingExists,
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createGoogleFlow } from "@apicity/googleflow";

const RECORDING_NAME = "google-flow/omni-i2v";
const PORT = 18183;
const LOCAL_FLOW_BASE_URL = `http://127.0.0.1:${PORT}/v1/google-flow`;

function shouldStartServer(ctx: PollyContext): boolean {
  if (ctx.mode === "record" || ctx.mode === "passthrough") return true;
  if (ctx.mode === "record-missing") return !recordingExists(RECORDING_NAME);
  return false;
}

async function startFixtureServer(): Promise<Server> {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);

    if (url.pathname.includes("/assets")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          media: [
            {
              mediaGenerationId: {
                mediaGenerationId: "test-omni-asset-123",
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
          jobId: "omni-job-123",
          media: [
            {
              mediaGenerationId: "test-omni-video-123",
              url: "https://example.com/omni-video.mp4",
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

describe("googleflow omni image-to-video integration", () => {
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

  it("should generate a video from an image with the omni-flash model", async () => {
    const useFixtureServer = shouldStartServer(ctx);
    if (useFixtureServer) {
      server = await startFixtureServer();
    }

    const provider = createGoogleFlow({
      apiKey: process.env.GOOGLE_FLOW_API_KEY ?? "googleflow-test-key",
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
    expect(uploadResult.media).toBeDefined();
    const startImageId =
      uploadResult.media[0].mediaGenerationId.mediaGenerationId;

    const videoRequest = {
      prompt: "The cat slowly blinks and tilts its head toward the camera",
      model: "omni-flash",
      startImage: startImageId,
      aspectRatio: "landscape",
    };

    expect(provider.post.v1.videos.schema.safeParse(videoRequest).success).toBe(
      true
    );

    const videoResult = await provider.post.v1.videos(videoRequest);

    expect(videoResult).toBeDefined();
    expect(videoResult.media).toBeDefined();
    expect(videoResult.media.length).toBeGreaterThan(0);
    expect(typeof videoResult.media[0].url).toBe("string");
  }, 900000);
});
