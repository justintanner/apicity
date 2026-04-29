// Tests for @apicity/free helper functions — no API calls, mocks the provider
import { describe, it, expect, vi, type Mock } from "vitest";
import { uploadToAnyHost } from "../../packages/provider/free/src/uploadToAnyHost";
import {
  FreeError,
  type FreeProvider,
  type UguuUploadResponse,
  type TflinkUploadResponse,
} from "../../packages/provider/free/src/types";

interface StubOverrides {
  litterbox?: () => Promise<string>;
  uguu?: () => Promise<UguuUploadResponse>;
  tflink?: () => Promise<TflinkUploadResponse>;
}

interface StubProvider {
  provider: FreeProvider;
  litterbox: Mock;
  uguu: Mock;
  tflink: Mock;
}

function rejectStub(host: string): () => Promise<never> {
  return () => Promise.reject(new Error(`${host} not stubbed`));
}

function makeStubProvider(overrides: StubOverrides): StubProvider {
  const litterbox = vi.fn(overrides.litterbox ?? rejectStub("litterbox"));
  const uguu = vi.fn(overrides.uguu ?? rejectStub("uguu"));
  const tflink = vi.fn(overrides.tflink ?? rejectStub("tflink"));

  // Tests don't exercise schemas; cast once at the boundary to satisfy
  // FreeProvider's structural .schema field on each upload method.
  const provider = {
    tmpfiles: { api: { v1: { upload: vi.fn() } } },
    uguu: { upload: uguu },
    catbox: { upload: vi.fn() },
    litterbox: { upload: litterbox },
    gofile: { upload: vi.fn() },
    filebin: { upload: vi.fn() },
    tempsh: { upload: vi.fn() },
    tflink: { upload: tflink },
  } as unknown as FreeProvider;

  return { provider, litterbox, uguu, tflink };
}

const file = new Blob(["hello"], { type: "text/plain" });

const uguuOk: UguuUploadResponse = {
  success: true,
  files: [
    {
      hash: "h",
      filename: "f",
      url: "https://a.uguu.se/x.txt",
      size: 5,
      dupe: false,
    },
  ],
};

const tflinkOk: TflinkUploadResponse = {
  fileName: "f",
  downloadLink: "https://tmpfile.link/x.txt",
  downloadLinkEncoded: "",
  size: 5,
  type: "text/plain",
  uploadedTo: "",
};

describe("uploadToAnyHost", () => {
  it("returns the URL when litterbox succeeds", async () => {
    const { provider } = makeStubProvider({
      litterbox: () => Promise.resolve("https://litter.catbox.moe/abc.txt"),
    });

    const url = await uploadToAnyHost(provider, {
      file,
      filename: "test.txt",
      hosts: ["litterbox"],
    });

    expect(url).toBe("https://litter.catbox.moe/abc.txt");
  });

  it("normalizes uguu response to a URL", async () => {
    const { provider } = makeStubProvider({
      uguu: () => Promise.resolve(uguuOk),
    });

    const url = await uploadToAnyHost(provider, {
      file,
      filename: "test.txt",
      hosts: ["uguu"],
    });

    expect(url).toBe("https://a.uguu.se/x.txt");
  });

  it("normalizes tflink response to a URL", async () => {
    const { provider } = makeStubProvider({
      tflink: () => Promise.resolve(tflinkOk),
    });

    const url = await uploadToAnyHost(provider, {
      file,
      filename: "test.txt",
      hosts: ["tflink"],
    });

    expect(url).toBe("https://tmpfile.link/x.txt");
  });

  it("falls through to the next host when one fails", async () => {
    const { provider } = makeStubProvider({
      litterbox: () => Promise.reject(new Error("litterbox down")),
      uguu: () => Promise.resolve(uguuOk),
    });

    const url = await uploadToAnyHost(provider, {
      file,
      filename: "test.txt",
      hosts: ["litterbox", "uguu"],
    });

    expect(url).toBe("https://a.uguu.se/x.txt");
  });

  it("throws FreeError aggregating per-host failures when all hosts fail", async () => {
    const { provider } = makeStubProvider({
      litterbox: () => Promise.reject(new Error("litterbox 503")),
      uguu: () => Promise.reject(new Error("uguu 500")),
      tflink: () => Promise.reject(new Error("tflink timeout")),
    });

    const promise = uploadToAnyHost(provider, {
      file,
      filename: "test.txt",
      hosts: ["litterbox", "uguu", "tflink"],
    });

    await expect(promise).rejects.toBeInstanceOf(FreeError);
    await expect(promise).rejects.toMatchObject({ status: 500 });
    await expect(promise).rejects.toThrow(/litterbox 503/);
    await expect(promise).rejects.toThrow(/uguu 500/);
    await expect(promise).rejects.toThrow(/tflink timeout/);
  });

  it("treats uguu response with empty files array as a failure and falls through", async () => {
    const { provider } = makeStubProvider({
      uguu: () => Promise.resolve({ success: true, files: [] }),
      litterbox: () => Promise.resolve("https://litter.catbox.moe/abc.txt"),
    });

    const url = await uploadToAnyHost(provider, {
      file,
      filename: "test.txt",
      hosts: ["uguu", "litterbox"],
    });

    expect(url).toBe("https://litter.catbox.moe/abc.txt");
  });

  it("rejects an empty hosts list", async () => {
    const { provider } = makeStubProvider({});

    await expect(
      uploadToAnyHost(provider, { file, filename: "test.txt", hosts: [] })
    ).rejects.toMatchObject({ name: "FreeError", status: 400 });
  });

  it("forwards the litterbox time parameter", async () => {
    const { provider, litterbox } = makeStubProvider({
      litterbox: () => Promise.resolve("https://litter.catbox.moe/abc.txt"),
    });

    await uploadToAnyHost(provider, {
      file,
      filename: "test.txt",
      hosts: ["litterbox"],
      time: "24h",
    });

    expect(litterbox).toHaveBeenCalledWith(
      { file, filename: "test.txt", time: "24h" },
      undefined
    );
  });
});
