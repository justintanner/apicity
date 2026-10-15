import { createServer } from "node:http";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createDropbox, DropboxError } from "@apicity/dropbox";

const received: Array<{
  path: string;
  body: Buffer;
  arg: Record<string, unknown>;
}> = [];
const server = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const body = Buffer.concat(chunks);
  const path = req.url ?? "/";
  const arg = JSON.parse(
    String(req.headers["dropbox-api-arg"] ?? "{}")
  ) as Record<string, unknown>;
  received.push({ path, body, arg });
  res.setHeader("Content-Type", "application/json");
  if (path === "/oauth2/token") {
    const form = new URLSearchParams(body.toString());
    if (form.get("client_id") !== "app-id") {
      res.writeHead(401).end(JSON.stringify({ error: "invalid_client" }));
      return;
    }
    res.end(
      JSON.stringify({
        access_token: "access",
        refresh_token: "refresh",
        token_type: "bearer",
        expires_in: 14400,
      })
    );
    return;
  }
  if (req.headers.authorization !== "Bearer access") {
    res
      .writeHead(401)
      .end(JSON.stringify({ error_summary: "expired_access_token/" }));
    return;
  }
  if (path.endsWith("/start"))
    res.end(JSON.stringify({ session_id: "session-1" }));
  else if (path.endsWith("/append_v2")) res.end("null");
  else
    res.end(
      JSON.stringify({
        ".tag": "file",
        id: "id:1",
        name: "clip.mp4",
        rev: "1",
        size: 6,
        content_hash: "hash",
        client_modified: "2026-10-01T00:00:00Z",
        server_modified: "2026-10-01T00:00:00Z",
      })
    );
});
let baseURL: string;
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing HTTP address");
  baseURL = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
});

it("uploads binary chunks with the cursor and commit in Dropbox-API-Arg", async () => {
  const client = createDropbox({
    oauthToken: "access",
    contentBaseURL: `${baseURL}/2`,
  });
  const start = await client.files.uploadSession.start({ contents: "ab" });
  expect(start.session_id).toBe("session-1");
  expect(
    await client.files.uploadSession.appendV2({
      contents: "cd",
      cursor: { session_id: start.session_id, offset: 2 },
    })
  ).toBeNull();
  const file = await client.files.uploadSession.finish({
    contents: "ef",
    cursor: { session_id: start.session_id, offset: 4 },
    commit: { path: "/clip.mp4", mode: "add", autorename: false },
  });
  expect(file.id).toBe("id:1");
  expect(
    Buffer.concat(received.slice(-3).map((request) => request.body)).toString()
  ).toBe("abcdef");
  expect(received.at(-1)?.arg).toEqual({
    cursor: { session_id: "session-1", offset: 4 },
    commit: { path: "/clip.mp4", mode: "add", autorename: false },
  });
  expect(
    client.files.uploadSession.appendV2.schema.safeParse({
      contents: "",
      cursor: { session_id: "id", offset: -1 },
    }).success
  ).toBe(false);
  await expect(
    createDropbox({
      oauthToken: "expired",
      contentBaseURL: `${baseURL}/2`,
    }).files.uploadSession.start({ contents: "" })
  ).rejects.toBeInstanceOf(DropboxError);
});

it("exchanges PKCE codes and refreshes through the form-encoded OAuth endpoint", async () => {
  const client = createDropbox({ clientId: "app-id", oauthBaseURL: baseURL });
  await client.oauth2.token({
    grant_type: "authorization_code",
    code: "one-time",
    code_verifier: "verifier",
    redirect_uri: "http://127.0.0.1/callback",
  });
  expect(
    new URLSearchParams(received.at(-1)?.body.toString()).get("code_verifier")
  ).toBe("verifier");
  const result = await client.oauth2.token({
    grant_type: "refresh_token",
    refresh_token: "refresh",
  });
  expect(result.expires_in).toBe(14400);
  expect(
    new URLSearchParams(received.at(-1)?.body.toString()).get("refresh_token")
  ).toBe("refresh");
});
