import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFreeMediaUpload } from "@apicity/free-media-upload";

interface HarFixture {
  path: string;
  expected: Record<string, unknown>;
}

const tmpfilesHarFixtures: HarFixture[] = [
  {
    path: "../recordings/free-media-upload_1393460724/tmpfiles-upload_4132818341/recording.har",
    expected: {
      _multipart: true,
      file: {
        _file: true,
        filename: "test.txt",
        contentType: "text/plain",
        size: 16,
      },
    },
  },
  {
    path: "../recordings/free-media-upload_1393460724/tmpfiles-upload-image_3924478405/recording.har",
    expected: {
      _multipart: true,
      file: {
        _file: true,
        filename: "cat1.jpg",
        contentType: "image/jpeg",
        size: 83558,
      },
    },
  },
  {
    path: "../recordings/free-media-upload_1393460724/tmpfiles-upload-video_466177323/recording.har",
    expected: {
      _multipart: true,
      file: {
        _file: true,
        filename: "jump.mp4",
        contentType: "video/mp4",
        size: 1318021,
      },
    },
  },
];

function readFixturePostData(fixturePath: string): {
  mimeType?: string;
  text?: string;
} {
  const har = JSON.parse(
    readFileSync(resolve(__dirname, fixturePath), "utf-8")
  ) as {
    log?: {
      entries?: Array<{
        request?: { postData?: { mimeType?: string; text?: string } };
      }>;
    };
  };
  return har.log?.entries?.[0]?.request?.postData ?? {};
}

describe("free-media-upload tmpfiles upload", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should upload a file and return a URL", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/tmpfiles-upload");
    const provider = createFreeMediaUpload();

    const content = "Hello, tmpfiles!";
    const file = new Blob([content], { type: "text/plain" });

    const result = await provider.tmpfiles.api.v1.upload({
      file,
      filename: "test.txt",
    });

    expect(result.status).toBe("success");
    expect(result.data.url).toContain("tmpfiles.org");
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/tmpfiles-upload-image");
    const provider = createFreeMediaUpload();

    const imgPath = resolve(__dirname, "../fixtures/cat1.jpg");
    const imgBuffer = readFileSync(imgPath);
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const result = await provider.tmpfiles.api.v1.upload({
      file,
      filename: "cat1.jpg",
    });

    expect(result.status).toBe("success");
    expect(result.data.url).toContain("tmpfiles.org");
  });

  it("should upload a video", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/tmpfiles-upload-video");
    const provider = createFreeMediaUpload();

    const vidPath = resolve(__dirname, "../fixtures/jump.mp4");
    const vidBuffer = readFileSync(vidPath);
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const result = await provider.tmpfiles.api.v1.upload({
      file,
      filename: "jump.mp4",
    });

    expect(result.status).toBe("success");
    expect(result.data.url).toContain("tmpfiles.org");
  });

  it("should keep multipart summaries in tmpfiles HAR fixtures", () => {
    for (const fixture of tmpfilesHarFixtures) {
      const postData = readFixturePostData(fixture.path);

      expect(postData.mimeType).toBe("multipart/form-data");
      expect(JSON.parse(postData.text ?? "")).toEqual(fixture.expected);
    }
  });

  it("should expose schema on upload", () => {
    const provider = createFreeMediaUpload();
    const schema = provider.tmpfiles.api.v1.upload.schema;

    expect(typeof schema.safeParse).toBe("function");
    expect(typeof schema.parse).toBe("function");
  });

  it("should validate payload - missing file", () => {
    const provider = createFreeMediaUpload();
    const result = provider.tmpfiles.api.v1.upload.schema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });
});
