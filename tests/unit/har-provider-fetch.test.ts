import { afterEach, expect, it, vi } from "vitest";
import { createAlibaba, uploadFile as uploadAlibaba } from "@apicity/alibaba";
import { createFal, uploadFile as uploadFal } from "@apicity/fal";

afterEach(() => vi.unstubAllGlobals());

it("Alibaba policy and OSS upload both use the factory's injected fetch", async () => {
  const globalFetch = vi.fn(() => {
    throw new Error("unexpected global fetch");
  });
  vi.stubGlobal("fetch", globalFetch);
  const calls: Request[] = [];
  const injected: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    calls.push(request);
    if (calls.length === 1)
      return Response.json({
        data: {
          upload_dir: "uploads",
          upload_host: "https://oss.example/upload",
          oss_access_key_id: "fake",
          policy: "fake",
          signature: "fake",
          x_oss_object_acl: "private",
          x_oss_forbid_overwrite: "true",
        },
      });
    const form = await request.formData();
    expect(form.get("key")).toBe("uploads/test.txt");
    expect(await (form.get("file") as Blob).text()).toBe("hello");
    return new Response(null, { status: 200 });
  };
  const provider = createAlibaba({ apiKey: "fake", fetch: injected });
  await expect(
    uploadAlibaba(provider, {
      model: "wan",
      data: new TextEncoder().encode("hello"),
      filename: "test.txt",
      contentType: "text/plain",
    })
  ).resolves.toBe("oss://uploads/test.txt");
  expect(calls.map((r) => r.method)).toEqual(["GET", "POST"]);
  expect(calls[1].url).toBe("https://oss.example/upload");
  expect(globalFetch).not.toHaveBeenCalled();
});

it("fal initiation and signed PUT both use the factory's injected fetch", async () => {
  const globalFetch = vi.fn(() => {
    throw new Error("unexpected global fetch");
  });
  vi.stubGlobal("fetch", globalFetch);
  const calls: Request[] = [];
  const injected: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    calls.push(request);
    if (calls.length === 1)
      return Response.json({
        file_url: "https://cdn.example/test.txt",
        upload_url: "https://storage.example/put",
      });
    expect(await request.text()).toBe("hello");
    expect(request.headers.get("content-type")).toBe("text/plain");
    return new Response(null, { status: 200 });
  };
  const provider = createFal({ apiKey: "fake", fetch: injected });
  await expect(
    uploadFal(provider, {
      data: new TextEncoder().encode("hello"),
      filename: "test.txt",
      contentType: "text/plain",
    })
  ).resolves.toBe("https://cdn.example/test.txt");
  expect(calls.map((r) => r.method)).toEqual(["POST", "PUT"]);
  expect(calls[1].url).toBe("https://storage.example/put");
  expect(globalFetch).not.toHaveBeenCalled();
});
