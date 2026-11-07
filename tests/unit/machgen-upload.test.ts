import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { zodToJsonSchema } from "../../packages/cli/src/schema";
import {
  createMachGen,
  MachGenUploadRequestSchema,
  MachGenUpscaleQuoteRequestSchema,
} from "@apicity/machgen";

async function withServer(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  run: (baseURL: string) => Promise<void>
) {
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No address");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("MachGen upload transport", () => {
  it("accepts a returned upload reference in an upscale quote", () => {
    const request = {
      model: "Topaz-Video-Precision",
      task_type: "UPSCALE",
      prompt: "",
      src_video_urls: ["@input/owner/id__seedance-ref.mp4"],
      video_config: { height: 1080, duration_secs: 4 },
      upscale_config: { engine: "proteus" },
    };
    expect(MachGenUpscaleQuoteRequestSchema.safeParse(request).success).toBe(
      true
    );
    expect(
      MachGenUpscaleQuoteRequestSchema.safeParse({
        ...request,
        src_video_urls: ["@input/"],
      }).success
    ).toBe(false);
  });

  it("exposes Blob metadata and a schema safe for CLI discovery", () => {
    expect(
      MachGenUploadRequestSchema.safeParse({
        file: new Blob(),
        filename: "clip.mp4",
      }).success
    ).toBe(true);
    expect(
      MachGenUploadRequestSchema.safeParse({ file: "clip.mp4", filename: "" })
        .success
    ).toBe(false);
    expect(() => zodToJsonSchema(MachGenUploadRequestSchema)).not.toThrow();
  });

  it.each(["video/mp4", ""])(
    "preserves bytes, filename and MIME (%s) over HTTP",
    async (type) => {
      const bytes = new Uint8Array([0, 255, 13, 10, 128, 1, 2]);
      let received: {
        contentType?: string;
        authorization?: string;
        data: Buffer;
      };
      await withServer(
        async (req, res) => {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          received = {
            contentType: req.headers["content-type"],
            authorization: req.headers.authorization,
            data: Buffer.concat(chunks),
          };
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              artifact_path: "clip.mp4",
              duration_secs: null,
              extra: "kept",
            })
          );
        },
        async (baseURL) => {
          const client = createMachGen({ baseURL, apiKey: "local-key" });
          expect(client.api.v0.upload.schema).toBe(MachGenUploadRequestSchema);
          expect(
            await client.api.v0.upload({
              file: new Blob([bytes], { type }),
              filename: "original.mp4",
            })
          ).toEqual({
            artifact_path: "clip.mp4",
            duration_secs: null,
            extra: "kept",
          });
          expect(received!.authorization).toBe("Bearer local-key");
          expect(received!.contentType).toMatch(
            /^multipart\/form-data; boundary=/
          );
          const parsed = await new Response(new Uint8Array(received!.data), {
            headers: { "Content-Type": received!.contentType! },
          }).formData();
          const file = parsed.get("file") as File;
          expect(file.name).toBe("original.mp4");
          expect(file.type).toBe(type || "application/octet-stream");
          expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes);
          expect([...parsed.keys()]).toEqual(["file"]);
        }
      );
    }
  );

  it("keeps JSON requests, binary assets and injected fetch working", async () => {
    const received: Array<{
      url: string;
      mime: string | undefined;
      body: string;
    }> = [];
    const asset = new Uint8Array([0, 255, 10, 128]);
    await withServer(
      async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        received.push({
          url: req.url!,
          mime: req.headers["content-type"],
          body: Buffer.concat(chunks).toString(),
        });
        if (req.url!.startsWith("/api/v0/assets/")) {
          res.end(asset);
        } else {
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify(
              req.url!.endsWith("quote")
                ? { cost_micros: 1 }
                : { task_id: "local-task" }
            )
          );
        }
      },
      async (baseURL) => {
        let fetches = 0;
        const client = createMachGen({
          baseURL,
          apiKey: "local-key",
          fetch: (...args) => {
            fetches++;
            return fetch(...args);
          },
        });
        const body = {
          model: "Topaz-Video-Precision",
          task_type: "UPSCALE" as const,
          prompt: "",
          src_video_urls: ["@input/clip.mp4"],
          video_config: { height: 1080, duration_secs: 4 },
        };
        await client.api.v0.generate(body);
        await client.api.v0.upscale.quote(body);
        expect(new Uint8Array(await client.api.v0.assets("folder/id"))).toEqual(
          asset
        );
        expect(fetches).toBe(3);
        expect(received.slice(0, 2).map((request) => request.mime)).toEqual([
          "application/json",
          "application/json",
        ]);
        expect(
          received.slice(0, 2).map((request) => JSON.parse(request.body))
        ).toEqual([body, body]);
        expect(received[2]).toEqual({
          url: "/api/v0/assets/folder%2Fid",
          mime: undefined,
          body: "",
        });
      }
    );
  });

  it("retains status/detail and redacts upstream key echoes", async () => {
    await withServer(
      (_req, res) => {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ detail: "too large local-secret" }));
      },
      async (baseURL) => {
        const client = createMachGen({ baseURL, apiKey: "local-secret" });
        await expect(
          client.api.v0.upload({ file: new Blob(["x"]), filename: "x" })
        ).rejects.toMatchObject({
          status: 413,
          detail: "too large [REDACTED]",
          body: { detail: "too large [REDACTED]" },
        });
      }
    );
  });

  it.each(["timeout", "abort"])("maps %s without retrying", async (mode) => {
    let calls = 0;
    await withServer(
      (_req, _res) => {
        calls++;
      },
      async (baseURL) => {
        const client = createMachGen({
          baseURL,
          apiKey: "local-key",
          timeout: mode === "timeout" ? 100 : 10000,
        });
        const controller = new AbortController();
        const timer =
          mode === "abort"
            ? setTimeout(() => controller.abort(), 100)
            : undefined;
        try {
          await expect(
            client.api.v0.upload(
              { file: new Blob(["x"]), filename: "x" },
              controller.signal
            )
          ).rejects.toMatchObject({ status: mode === "timeout" ? 408 : 499 });
          expect(calls).toBe(1);
        } finally {
          clearTimeout(timer);
        }
      }
    );
  });
});
