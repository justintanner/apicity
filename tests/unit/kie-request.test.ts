import { afterEach, describe, it, expect, vi } from "vitest";

import { createKie } from "../../packages/provider/kie/src/kie";
import { mintOtp } from "../../packages/provider/kie/src/paygate";
import { kieRequest } from "../../packages/provider/kie/src/request";
import { KieError } from "../../packages/provider/kie/src/types";
import type {
  GrokImageToVideoRequest,
  HappyHorse11ImageToVideoRequest,
  HappyHorse11ReferenceToVideoRequest,
  HappyHorse11TextToVideoRequest,
  VolcengineVideoToVideoLipSyncRequest,
} from "../../packages/provider/kie/src/types";

describe("KIE request utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("kieRequest", () => {
    it("should make successful POST request", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: "result" }),
      });

      const result = await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        body: { test: "data" },
        timeout: 30000,
        doFetch: mockFetch,
      });

      expect(result).toEqual({ data: "result" });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.kie.ai/test",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ test: "data" }),
        })
      );
    });

    it("should make successful GET request", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "ok" }),
      });

      const result = await kieRequest("https://api.kie.ai/status", {
        method: "GET",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      expect(result).toEqual({ status: "ok" });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.kie.ai/status",
        expect.objectContaining({
          method: "GET",
          headers: {
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("should not include body for GET requests", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await kieRequest("https://api.kie.ai/test", {
        method: "GET",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      const init = mockFetch.mock.calls[0][1];
      expect(init.body).toBeUndefined();
    });

    it("should throw KieError on non-ok response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ msg: "Bad Request" }),
      });

      await expect(
        kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        })
      ).rejects.toBeInstanceOf(KieError);
    });

    it("should include error message from response body", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ msg: "Invalid parameters" }),
      });

      try {
        await kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(KieError);
        expect(error.message).toBe("Kie API error 400: Invalid parameters");
        expect(error.status).toBe(400);
      }
    });

    it("should use generic error message when no msg in body", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      try {
        await kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(KieError);
        expect(error.message).toBe("Kie API error: 500");
      }
    });

    it("should handle JSON parse errors in error response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Parse error")),
      });

      try {
        await kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(KieError);
        expect(error.message).toBe("Kie API error: 500");
      }
    });

    it("should throw KieError on network error", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));

      try {
        await kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(KieError);
        expect(error.message).toContain("Request failed");
        expect(error.status).toBe(500);
      }
    });

    it("should throw KieError on timeout", async () => {
      const mockFetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error("The operation was aborted");
            (error as Error & { name: string }).name = "AbortError";
            reject(error);
          }, 10);
        });
      });

      await expect(
        kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 5,
          doFetch: mockFetch,
        })
      ).rejects.toBeInstanceOf(KieError);
    });

    it("should rethrow existing KieError", async () => {
      const existingError = new KieError("Existing", 400);
      const mockFetch = vi.fn().mockRejectedValue(existingError);

      await expect(
        kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        })
      ).rejects.toBe(existingError);
    });

    it("should set correct authorization header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "my-api-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      const init = mockFetch.mock.calls[0][1];
      expect(init.headers.Authorization).toBe("Bearer my-api-key");
    });

    it("should set correct content-type header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      const init = mockFetch.mock.calls[0][1];
      expect(init.headers["Content-Type"]).toBe("application/json");
    });

    it("should stringify body as JSON", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const body = { key: "value", nested: { data: 123 } };

      await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        body,
        timeout: 30000,
        doFetch: mockFetch,
      });

      const init = mockFetch.mock.calls[0][1];
      expect(init.body).toBe(JSON.stringify(body));
    });

    it("should use abort controller for timeout", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      const init = mockFetch.mock.calls[0][1];
      expect(init.signal).toBeDefined();
    });

    it("should handle request without body", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: "success" }),
      });

      const result = await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      expect(result).toEqual({ result: "success" });
      const init = mockFetch.mock.calls[0][1];
      expect(init.body).toBeUndefined();
    });

    it("should clear timeout on success", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await kieRequest("https://api.kie.ai/test", {
        method: "POST",
        apiKey: "test-key",
        timeout: 30000,
        doFetch: mockFetch,
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it("should preserve body in error when available", async () => {
      const errorBody = { error: "details", code: 123 };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve(errorBody),
      });

      try {
        await kieRequest("https://api.kie.ai/test", {
          method: "POST",
          apiKey: "test-key",
          timeout: 30000,
          doFetch: mockFetch,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(KieError);
        expect(error.body).toEqual(errorBody);
      }
    });
  });

  describe("top-level KIE provider helpers", () => {
    it("should serialize Volcengine lip sync createTask requests", async () => {
      const secret = "test-paygate-secret";
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            msg: "success",
            data: {
              taskId: "task_volcengine-video-to-video-lip-sync_1234567890",
            },
          }),
          { status: 200 }
        )
      );

      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret },
      });
      const request: VolcengineVideoToVideoLipSyncRequest = {
        model: "volcengine/video-to-video-lip-sync",
        input: {
          mode: "basic",
          video_url: "https://example.com/source-video.mp4",
          audio_url: "https://example.com/target-vocal.wav",
          separate_vocal: false,
          open_scenedet: true,
          align_audio: true,
          align_audio_reverse: false,
          templ_start_seconds: 0,
        },
        callBackUrl: "https://example.com/callback",
      };

      const result = await provider.post.api.v1.jobs.createTask(request, {
        otp: mintOtp(secret, {
          dotPath: "api.v1.jobs.createTask",
          request,
        }),
      });

      expect(result.data?.taskId).toBe(
        "task_volcengine-video-to-video-lip-sync_1234567890"
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({
        Authorization: "Bearer test-key",
        "Content-Type": "application/json",
      });
      expect(JSON.parse(init.body as string)).toEqual(request);
    });

    it("should serialize Grok Imagine image-to-video createTask requests", async () => {
      const secret = "test-paygate-secret";
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            msg: "success",
            data: {
              taskId: "task_grok-imagine-image-to-video_1234567890",
            },
          }),
          { status: 200 }
        )
      );

      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret },
      });
      const request: GrokImageToVideoRequest = {
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: [
            "https://tempfileb.aiquickdraw.com/kieai/market/1782021652978_JJVOCSKk.jpg",
            "https://tempfileb.aiquickdraw.com/kieai/market/1782021652866_7WyovwDT.jpeg",
            "https://tempfileb.aiquickdraw.com/kieai/market/1782021653019_DJmk5khc.jpeg",
          ],
          index: 0,
          prompt:
            "the thai sergent arrests the tourist for petting the cat wrong",
          duration: 8,
          resolution: "480p",
          aspect_ratio: "16:9",
          mode: "normal",
          nsfw_checker: true,
        },
        callBackUrl: "https://example.com/kie-callback",
      };

      const result = await provider.post.api.v1.jobs.createTask(request, {
        otp: mintOtp(secret, {
          dotPath: "api.v1.jobs.createTask",
          request,
        }),
      });

      expect(result.data?.taskId).toBe(
        "task_grok-imagine-image-to-video_1234567890"
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({
        Authorization: "Bearer test-key",
        "Content-Type": "application/json",
      });
      expect(JSON.parse(init.body as string)).toEqual(request);
    });

    it("should serialize HappyHorse 1.1 createTask requests", async () => {
      const secret = "test-paygate-secret";
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              code: 200,
              msg: "success",
              data: {
                taskId: "task_happyhorse_11_1234567890",
              },
            }),
            { status: 200 }
          )
        )
      );

      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret },
      });
      const requests: Array<
        | HappyHorse11TextToVideoRequest
        | HappyHorse11ImageToVideoRequest
        | HappyHorse11ReferenceToVideoRequest
      > = [
        {
          model: "happyhorse-1-1/text-to-video",
          input: {
            prompt: "A dog running on the earth",
            resolution: "1080p",
            aspect_ratio: "16:9",
            duration: 5,
          },
          callBackUrl: "https://example.com/kie-callback",
        },
        {
          model: "happyhorse-1-1/image-to-video",
          input: {
            image_urls: ["https://example.com/first-frame.png"],
            prompt: "A cat running on the grass",
            resolution: "1080p",
            duration: 5,
          },
        },
        {
          model: "happyhorse-1-1/reference-to-video",
          input: {
            reference_image: ["https://example.com/reference.png"],
            prompt: "A cat running on the grass",
            resolution: "1080p",
            aspect_ratio: "16:9",
            duration: 5,
          },
        },
      ];

      for (const request of requests) {
        const result = await provider.post.api.v1.jobs.createTask(request, {
          otp: mintOtp(secret, {
            dotPath: "api.v1.jobs.createTask",
            request,
          }),
        });

        expect(result.data?.taskId).toBe("task_happyhorse_11_1234567890");
      }

      expect(mockFetch).toHaveBeenCalledTimes(3);
      for (const [index, [, init]] of mockFetch.mock.calls.entries()) {
        expect(init.method).toBe("POST");
        expect(init.headers).toEqual({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        });
        expect(JSON.parse(init.body as string)).toEqual(requests[index]);
      }
    });

    it("should map HappyHorse 1.1 createTask API errors", async () => {
      const secret = "test-paygate-secret";
      const errorBody = {
        code: 422,
        msg: "Invalid HappyHorse 1.1 request",
      };
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(errorBody), { status: 422 })
        );

      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret },
      });
      const request: HappyHorse11ImageToVideoRequest = {
        model: "happyhorse-1-1/image-to-video",
        input: {
          image_urls: ["https://example.com/first-frame.png"],
          prompt: "A cat running on the grass",
          resolution: "1080p",
          duration: 5,
        },
      };

      await expect(
        provider.post.api.v1.jobs.createTask(request, {
          otp: mintOtp(secret, {
            dotPath: "api.v1.jobs.createTask",
            request,
          }),
        })
      ).rejects.toMatchObject({
        status: 422,
        body: errorBody,
      });
    });

    it("should serialize seven Grok Imagine image-to-video URLs", async () => {
      const secret = "test-paygate-secret";
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            msg: "success",
            data: {
              taskId: "task_grok-imagine-image-to-video_1234567890",
            },
          }),
          { status: 200 }
        )
      );

      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret },
      });
      const imageUrls = Array.from(
        { length: 7 },
        (_, i) => `https://example.com/reference-${i + 1}.jpg`
      );
      const request: GrokImageToVideoRequest = {
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: imageUrls,
          duration: 8,
          resolution: "480p",
          aspect_ratio: "16:9",
          mode: "normal",
          nsfw_checker: true,
        },
      };

      await provider.post.api.v1.jobs.createTask(request, {
        otp: mintOtp(secret, {
          dotPath: "api.v1.jobs.createTask",
          request,
        }),
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, init] = mockFetch.mock.calls[0];
      expect(JSON.parse(init.body as string).input.image_urls).toEqual(
        imageUrls
      );
    });

    it("should reject eight Grok Imagine image-to-video URLs before fetch", async () => {
      const secret = "test-paygate-secret";
      const mockFetch = vi.fn();
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret },
      });
      const request: GrokImageToVideoRequest = {
        model: "grok-imagine/image-to-video",
        input: {
          image_urls: Array.from(
            { length: 8 },
            (_, i) => `https://example.com/reference-${i + 1}.jpg`
          ),
          duration: 8,
          resolution: "480p",
          aspect_ratio: "16:9",
          mode: "normal",
          nsfw_checker: true,
        },
      };

      await expect(
        provider.post.api.v1.jobs.createTask(request, {
          otp: mintOtp(secret, {
            dotPath: "api.v1.jobs.createTask",
            request,
          }),
        })
      ).rejects.toThrow("at most 7 image_urls");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should build multipart uploads with inferred MIME type", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: {} }), {
          status: 200,
        })
      );

      const provider = createKie({
        apiKey: "test-key",
        uploadBaseURL: "https://uploads.kie.ai",
        fetch: mockFetch,
      });

      await provider.post.api.fileStreamUpload({
        file: new Blob(["image-bytes"]),
        filename: "sample.png",
        uploadPath: "images/user-uploads",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://uploads.kie.ai/api/file-stream-upload");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({
        Authorization: "Bearer test-key",
      });
      expect(init.body).toBeInstanceOf(FormData);

      const formData = init.body as FormData;
      expect(formData.get("uploadPath")).toBe("images/user-uploads");
      expect(formData.get("fileName")).toBeNull();

      const uploadedFile = formData.get("file");
      expect(uploadedFile).toBeInstanceOf(File);
      expect((uploadedFile as File).name).toBe("sample.png");
      expect((uploadedFile as File).type).toBe("image/png");
      await expect((uploadedFile as File).text()).resolves.toBe("image-bytes");
    });

    it("should pass optional fileName in multipart uploads", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: {} }), {
          status: 200,
        })
      );

      const provider = createKie({
        apiKey: "test-key",
        uploadBaseURL: "https://uploads.kie.ai",
        fetch: mockFetch,
      });

      await provider.post.api.fileStreamUpload({
        file: new Blob(["image-bytes"]),
        filename: "sample.png",
        uploadPath: "images/user-uploads",
        fileName: "custom-name.png",
      });

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get("fileName")).toBe("custom-name.png");
    });

    it("should JSON-encode URL uploads with fileUrl field", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: {} }), {
          status: 200,
        })
      );

      const provider = createKie({
        apiKey: "test-key",
        uploadBaseURL: "https://uploads.kie.ai",
        fetch: mockFetch,
      });

      await provider.post.api.fileUrlUpload({
        fileUrl: "https://cdn.example.com/assets/source-image.png",
        uploadPath: "images/downloads",
      });

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://uploads.kie.ai/api/file-url-upload");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({
        Authorization: "Bearer test-key",
        "Content-Type": "application/json",
      });
      expect(JSON.parse(init.body as string)).toEqual({
        fileUrl: "https://cdn.example.com/assets/source-image.png",
        uploadPath: "images/downloads",
      });
    });

    it("should pass optional fileName for URL uploads", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: {} }), {
          status: 200,
        })
      );

      const provider = createKie({
        apiKey: "test-key",
        uploadBaseURL: "https://uploads.kie.ai",
        fetch: mockFetch,
      });

      await provider.post.api.fileUrlUpload({
        fileUrl: "https://cdn.example.com/video.mov",
        uploadPath: "custom/path",
        fileName: "my-video.mov",
      });

      const [, init] = mockFetch.mock.calls[0];
      expect(JSON.parse(init.body as string)).toEqual({
        fileUrl: "https://cdn.example.com/video.mov",
        uploadPath: "custom/path",
        fileName: "my-video.mov",
      });
    });

    it("should map base64 uploads to the API payload shape", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: {} }), {
          status: 200,
        })
      );

      const provider = createKie({
        apiKey: "test-key",
        uploadBaseURL: "https://uploads.kie.ai",
        fetch: mockFetch,
      });

      await provider.post.api.fileBase64Upload({
        base64Data: "aGVsbG8=",
        uploadPath: "videos/uploads",
        fileName: "clip.mp4",
        mimeType: "video/mp4",
      });

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://uploads.kie.ai/api/file-base64-upload");
      expect(init.headers).toEqual({
        Authorization: "Bearer test-key",
        "Content-Type": "application/json",
      });
      expect(JSON.parse(init.body as string)).toEqual({
        base64Data: "aGVsbG8=",
        uploadPath: "videos/uploads",
        fileName: "clip.mp4",
        mimeType: "video/mp4",
      });
    });

    it("should omit optional fields from base64 upload when not provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: {} }), {
          status: 200,
        })
      );

      const provider = createKie({
        apiKey: "test-key",
        uploadBaseURL: "https://uploads.kie.ai",
        fetch: mockFetch,
      });

      await provider.post.api.fileBase64Upload({
        base64Data: "aGVsbG8=",
        uploadPath: "uploads",
      });

      const [, init] = mockFetch.mock.calls[0];
      expect(JSON.parse(init.body as string)).toEqual({
        base64Data: "aGVsbG8=",
        uploadPath: "uploads",
      });
    });

    it("should fetch credit balance from the chat credit endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: { balance: 12 } }), {
          status: 200,
        })
      );

      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
      });

      const result = await provider.get.api.v1.chat.credit();

      expect(result).toEqual({ code: 200, data: { balance: 12 } });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.kie.ai/api/v1/chat/credit",
        expect.objectContaining({
          method: "GET",
          headers: {
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("should surface credit lookup failures as KieError", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ msg: "Insufficient credits" }), {
          status: 402,
        })
      );

      const provider = createKie({
        apiKey: "test-key",
        fetch: mockFetch,
      });

      await expect(provider.get.api.v1.chat.credit()).rejects.toMatchObject({
        message: "Failed to get credits: 402",
        status: 402,
        body: { msg: "Insufficient credits" },
      });
    });
  });
});
