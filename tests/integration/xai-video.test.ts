import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

const cat1Base64 = readFileSync(
  resolve(__dirname, "../../public/cat1.jpg")
).toString("base64");
const cat2Base64 = readFileSync(
  resolve(__dirname, "../../public/cat2.jpg")
).toString("base64");
const jumpBase64 = readFileSync(
  resolve(__dirname, "../../public/jump.mp4")
).toString("base64");
const cat1DataUri = `data:image/jpeg;base64,${cat1Base64}`;
const cat2DataUri = `data:image/jpeg;base64,${cat2Base64}`;
const jumpDataUri = `data:video/mp4;base64,${jumpBase64}`;

describe("xai video integration", () => {
  let ctx: PollyContext;

  describe("text-to-video", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/video-text-to-video");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should generate a video from a prompt", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "A white cat with heterochromia eyes playing with a ball",
        model: "grok-imagine-video",
      });

      expect(result.request_id).toBeTruthy();
      expect(typeof result.request_id).toBe("string");
    });

    it("should generate a video with explicit model", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "A white cat sitting in the rain, cinematic",
        model: "grok-imagine-video",
      });

      expect(result.request_id).toBeTruthy();
    });

    it("should support duration parameter", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "A white cat watching a sunset over the ocean",
        model: "grok-imagine-video",
        duration: 6,
      });

      expect(result.request_id).toBeTruthy();
    });

    it("should support aspect_ratio parameter", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "A white cat jumping onto a shelf, vertical phone video",
        model: "grok-imagine-video",
        aspect_ratio: "9:16",
      });

      expect(result.request_id).toBeTruthy();
    });

    it("should support resolution parameter", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "Timelapse of a white cat grooming itself",
        model: "grok-imagine-video",
        resolution: "720p",
      });

      expect(result.request_id).toBeTruthy();
    });

    it("should support all configuration parameters together", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt:
          "A white cat with heterochromia eyes walking across a rooftop " +
          "at golden hour, cinematic drone shot",
        model: "grok-imagine-video",
        duration: 10,
        aspect_ratio: "16:9",
        resolution: "720p",
      });

      expect(result.request_id).toBeTruthy();
    });
  });

  describe("image-to-video", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/video-image-to-video");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should generate a video from an image", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt:
          "The white cat slowly turns its head toward the camera, " +
          "soft bokeh background",
        model: "grok-imagine-video",
        image: { url: cat1DataUri },
      });

      expect(result.request_id).toBeTruthy();
      expect(typeof result.request_id).toBe("string");
    });

    it("should support duration and aspect_ratio with image", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "Camera slowly zooms in on the cat, shallow depth of field",
        model: "grok-imagine-video",
        image: { url: cat2DataUri },
        duration: 5,
        aspect_ratio: "16:9",
        resolution: "720p",
      });

      expect(result.request_id).toBeTruthy();
    });
  });

  describe("video-editing", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/video-editing");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it(
      "should edit an existing video and poll to completion",
      async () => {
        const provider = xai({
          apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
        });
        const gen = await provider.v1.videos.generations({
          prompt: "Edit the video so the cat jumps on a giant ball of yarn",
          model: "grok-imagine-video",
          video: {
            url: jumpDataUri,
          },
        });

        expect(gen.request_id).toBeTruthy();

        let result = await provider.v1.videos(gen.request_id);
        while (result.status === "pending") {
          await new Promise((r) => setTimeout(r, 5000));
          result = await provider.v1.videos(gen.request_id);
        }

        expect(result.status).toBe("done");
        expect(result.video).toBeTruthy();
        expect(result.video!.url).toBeTruthy();
      },
      { timeout: 300_000 }
    );
  });

  describe("reference-images", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/video-reference-images");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should generate a video with multiple reference images", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt:
          "The white cat with heterochromia eyes from <IMAGE_1> and " +
          "<IMAGE_2> jumps onto a monitor on a desk, " +
          "fixed camera, cinematic lighting",
        model: "grok-imagine-video",
        reference_images: [{ url: cat1DataUri }, { url: cat2DataUri }],
        duration: 6,
        aspect_ratio: "16:9",
        resolution: "720p",
      });

      expect(result.request_id).toBeTruthy();
      expect(typeof result.request_id).toBe("string");
    });

    it("should support a single reference image", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt:
          "The white cat from <IMAGE_1> jumps onto a table, " +
          "cinematic lighting",
        model: "grok-imagine-video",
        reference_images: [{ url: cat1DataUri }],
      });

      expect(result.request_id).toBeTruthy();
    });
  });

  describe("video-extension", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/video-extension");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it(
      "should extend a video with duration and poll to completion",
      async () => {
        const provider = xai({
          apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
        });
        const gen = await provider.v1.videos.extensions({
          prompt:
            "The shot pans to an over the shoulder perspective. " +
            "Calm controlled scene.",
          model: "grok-imagine-video",
          video: {
            url: "https://data.x.ai/docs/video-generation/portrait-wave.mp4",
          },
          duration: 10,
        });

        expect(gen.request_id).toBeTruthy();

        let result = await provider.v1.videos(gen.request_id);
        while (result.status === "pending") {
          await new Promise((r) => setTimeout(r, 5000));
          result = await provider.v1.videos(gen.request_id);
        }

        expect(result.status).toBe("done");
        expect(result.video).toBeTruthy();
        expect(result.video!.url).toBeTruthy();
      },
      { timeout: 300_000 }
    );
  });

  describe("poll-status", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/video-poll-status");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should poll video status and return structured result", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const gen = await provider.v1.videos.generations({
        prompt: "A white cat blinking slowly",
        model: "grok-imagine-video",
      });
      const result = await provider.v1.videos(gen.request_id);

      expect(result.status).toBeTruthy();
      expect(["pending", "done", "expired", "failed"]).toContain(result.status);
    });
  });

  describe("cat-image-to-video", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/video-cat-image-to-video");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it(
      "should generate a video from a cat photo and poll to completion",
      async () => {
        const provider = xai({
          apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
        });
        const gen = await provider.v1.videos.generations({
          prompt:
            "The white cat with heterochromia eyes slowly turns its head " +
            "and jumps onto a monitor, fixed camera, cinematic lighting",
          model: "grok-imagine-video",
          image: { url: cat1DataUri },
          duration: 6,
          aspect_ratio: "16:9",
          resolution: "720p",
        });

        expect(gen.request_id).toBeTruthy();

        let result = await provider.v1.videos(gen.request_id);
        while (result.status === "pending") {
          await new Promise((r) => setTimeout(r, 5000));
          result = await provider.v1.videos(gen.request_id);
        }

        expect(result.status).toBe("done");
        expect(result.video).toBeTruthy();
        expect(result.video!.url).toBeTruthy();
      },
      { timeout: 300_000 }
    );
  });
});
