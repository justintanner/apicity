import { describe, expect, it } from "vitest";
import {
  OpenLigaDBError,
  buildOpenLigaDBPath,
  createOpenLigaDB,
  createOpenLigaDBRequest,
} from "../../packages/provider/openligadb/src/index";

describe("OpenLigaDB provider core", () => {
  it("uses baseURL override and sends GET requests", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    const provider = createOpenLigaDB({
      baseURL: "https://example.test/root/",
      fetch: async (input, init) => {
        capturedUrl = String(input);
        capturedMethod = init?.method ?? "";
        return new Response(
          JSON.stringify({
            openapi: "3.0.4",
            info: { title: "OpenLigaDB-API", version: "v1" },
            paths: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await provider.swagger.v1.swaggerJson();

    expect(capturedUrl).toBe(
      "https://example.test/root/swagger/v1/swagger.json"
    );
    expect(capturedMethod).toBe("GET");
  });

  it("encodes path segments", () => {
    expect(buildOpenLigaDBPath("getmatchdata", "bl 1/ä")).toBe(
      "/getmatchdata/bl%201%2F%C3%A4"
    );
  });

  it("parses JSON success responses", async () => {
    const request = createOpenLigaDBRequest({
      fetch: async () =>
        new Response(JSON.stringify({ leagueId: 1, leagueShortcut: "bl1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    });

    const result = await request<{ leagueShortcut: string }>({
      path: "/getavailableleagues",
    });

    expect(result.leagueShortcut).toBe("bl1");
  });

  it("preserves text error bodies", async () => {
    const request = createOpenLigaDBRequest({
      fetch: async () =>
        new Response("No match data found", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        }),
    });

    await expect(request({ path: ["getmatchdata", 999999] })).rejects.toEqual(
      expect.objectContaining({
        body: "No match data found",
        status: 404,
      })
    );
  });

  it("returns null for empty success bodies by default", async () => {
    const request = createOpenLigaDBRequest({
      fetch: async () => new Response("", { status: 200 }),
    });

    await expect(request({ path: "/empty" })).resolves.toBeNull();
  });

  it("supports custom empty-body values", async () => {
    const request = createOpenLigaDBRequest({
      fetch: async () => new Response("", { status: 200 }),
    });

    await expect(
      request({ path: "/empty", emptyResponse: { ok: true } })
    ).resolves.toEqual({ ok: true });
  });

  it("propagates caller aborts to the injected fetch signal", async () => {
    const controller = new AbortController();
    controller.abort();

    const provider = createOpenLigaDB({
      fetch: async (_input, init) => {
        expect(init?.signal).toBeDefined();
        expect(init?.signal?.aborted).toBe(true);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });

    await provider.swagger.v1.swaggerJson(controller.signal);
  });

  it("aborts requests when the timeout elapses", async () => {
    let aborted = false;
    const request = createOpenLigaDBRequest({
      timeout: 1,
      fetch: async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              aborted = true;
              reject(
                new DOMException("The operation was aborted.", "AbortError")
              );
            },
            { once: true }
          );
        }),
    });

    await expect(request({ path: "/slow" })).rejects.toBeInstanceOf(
      OpenLigaDBError
    );
    expect(aborted).toBe(true);
  });
});
