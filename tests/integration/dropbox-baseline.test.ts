import { afterEach, describe, expect, it } from "vitest";

import { createDropbox, DropboxError } from "@apicity/dropbox";
import {
  getPollyMode,
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";

const RECORDING_NAME = ["dropbox", "baseline"].join("/");
const TEST_ROOT = "/apicity-tests/dropbox-baseline-v1";
const canRunLiveBaseline =
  recordingExists(RECORDING_NAME) ||
  (getPollyMode() !== "replay" &&
    process.env.DROPBOX_RECORD_FULL_BASELINE === "1");

interface FetchCall {
  url: string;
  init?: RequestInit;
}

function shouldUseLiveToken(ctx: PollyContext): boolean {
  if (ctx.mode === "record" || ctx.mode === "passthrough") return true;
  if (ctx.mode === "record-missing") return !recordingExists(RECORDING_NAME);
  return false;
}

function tokenForMode(ctx: PollyContext): string {
  if (!shouldUseLiveToken(ctx)) return "***";
  const token = process.env.DROPBOX_OAUTH_TOKEN;
  if (!token) {
    throw new Error("DROPBOX_OAUTH_TOKEN is required to record Dropbox HARs");
  }
  return token;
}

function inputUrl(input: string | URL | Request): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function headersOf(init: RequestInit | undefined): Headers {
  return new Headers(init?.headers);
}

function dropboxApiArg(init: RequestInit | undefined): Record<string, unknown> {
  const raw = headersOf(init).get("Dropbox-API-Arg");
  expect(raw).toEqual(expect.any(String));
  return JSON.parse(raw ?? "{}") as Record<string, unknown>;
}

async function deleteIfExists(
  dropbox: ReturnType<typeof createDropbox>,
  path: string
): Promise<void> {
  try {
    await dropbox.files.deleteV2({ path });
  } catch (error) {
    if (error instanceof DropboxError && error.status === 409) return;
    throw error;
  }
}

describe("dropbox baseline integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it.skipIf(!canRunLiveBaseline)(
    "exercises users, files, content, and sharing endpoints",
    async () => {
      ctx = setupPolly(RECORDING_NAME);
      const dropbox = createDropbox({
        oauthToken: tokenForMode(ctx),
        timeout: 60000,
      });

      const sourcePath = `${TEST_ROOT}/source.txt`;
      const secondPath = `${TEST_ROOT}/second.txt`;
      const copiedPath = `${TEST_ROOT}/copy.txt`;
      const movedPath = `${TEST_ROOT}/moved.txt`;
      const sourceBody = "hello from @apicity/dropbox baseline\n";

      await deleteIfExists(dropbox, TEST_ROOT);

      try {
        const account = await dropbox.users.getCurrentAccount();
        expect(account.account_id).toEqual(expect.any(String));

        const folder = await dropbox.files.createFolderV2({ path: TEST_ROOT });
        expect(folder.metadata[".tag"]).toBe("folder");

        const uploaded = await dropbox.files.upload({
          path: sourcePath,
          mode: { ".tag": "overwrite" },
          mute: true,
          contents: sourceBody,
        });
        expect(uploaded[".tag"]).toBe("file");
        expect(uploaded.name).toBe("source.txt");

        await dropbox.files.upload({
          path: secondPath,
          mode: { ".tag": "overwrite" },
          mute: true,
          contents: "second file for list_folder pagination\n",
        });

        const metadata = await dropbox.files.getMetadata({ path: sourcePath });
        expect(metadata[".tag"]).toBe("file");

        const copied = await dropbox.files.copyV2({
          from_path: sourcePath,
          to_path: copiedPath,
        });
        expect(copied.metadata.name).toBe("copy.txt");

        const moved = await dropbox.files.moveV2({
          from_path: copiedPath,
          to_path: movedPath,
        });
        expect(moved.metadata.name).toBe("moved.txt");

        const listed = await dropbox.files.listFolder({
          path: TEST_ROOT,
          limit: 1,
        });
        const continued = await dropbox.files.listFolderContinue({
          cursor: listed.cursor,
        });
        const names = [...listed.entries, ...continued.entries].map(
          (entry) => entry.name
        );
        expect(names).toContain("source.txt");
        expect(names).toContain("second.txt");

        const downloaded = await dropbox.files.download({ path: movedPath });
        expect(downloaded.metadata.name).toBe("moved.txt");
        expect(downloaded.text()).toBe(sourceBody);

        const shared = await dropbox.sharing.createSharedLinkWithSettings({
          path: movedPath,
        });
        expect(shared.url).toMatch(/^https:\/\/www\.dropbox\.com\//);

        const links = await dropbox.sharing.listSharedLinks({
          path: movedPath,
          direct_only: true,
        });
        expect(links.links.some((link) => link.url === shared.url)).toBe(true);
      } finally {
        await deleteIfExists(dropbox, TEST_ROOT);
      }
    }
  );

  it("serializes auth, JSON bodies, and content headers", async () => {
    const calls: FetchCall[] = [];
    const dropbox = createDropbox({
      oauthToken: "dbx-test-token",
      fetch: async (input, init) => {
        calls.push({ url: inputUrl(input), init });
        if (inputUrl(input).endsWith("/files/download")) {
          return new Response("hello", {
            headers: {
              "Content-Type": "text/plain",
              "Dropbox-API-Result": JSON.stringify({
                ".tag": "file",
                name: "demo.txt",
                path_lower: "/demo.txt",
                path_display: "/demo.txt",
                id: "id:demo",
                client_modified: "2026-06-29T00:00:00Z",
                server_modified: "2026-06-29T00:00:00Z",
                rev: "rev",
                size: 5,
              }),
            },
          });
        }
        return new Response(
          JSON.stringify({
            ".tag": "file",
            name: "demo.txt",
            path_lower: "/demo.txt",
            path_display: "/demo.txt",
            id: "id:demo",
            client_modified: "2026-06-29T00:00:00Z",
            server_modified: "2026-06-29T00:00:00Z",
            rev: "rev",
            size: 5,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    });

    await dropbox.files.upload({
      path: "/demo.txt",
      mode: { ".tag": "overwrite" },
      mute: true,
      contents: "hello",
    });
    const downloaded = await dropbox.files.download({ path: "/demo.txt" });

    expect(downloaded.text()).toBe("hello");
    expect(calls).toHaveLength(2);

    expect(calls[0].url).toBe("https://content.dropboxapi.com/2/files/upload");
    expect(headersOf(calls[0].init).get("Authorization")).toBe(
      "Bearer dbx-test-token"
    );
    expect(headersOf(calls[0].init).get("Content-Type")).toBe(
      "application/octet-stream"
    );
    expect(dropboxApiArg(calls[0].init)).toEqual({
      path: "/demo.txt",
      mode: { ".tag": "overwrite" },
      mute: true,
    });
    expect(calls[0].init?.body).toBe("hello");

    expect(calls[1].url).toBe(
      "https://content.dropboxapi.com/2/files/download"
    );
    expect(dropboxApiArg(calls[1].init)).toEqual({ path: "/demo.txt" });
    expect(calls[1].init?.body).toBeUndefined();
  });

  it("preserves Dropbox error fields", async () => {
    const dropbox = createDropbox({
      oauthToken: "dbx-test-token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            error_summary: "path/not_found/.",
            error: { ".tag": "path", path: { ".tag": "not_found" } },
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        ),
    });

    await expect(
      dropbox.files.getMetadata({ path: "/missing.txt" })
    ).rejects.toMatchObject({
      name: "DropboxError",
      status: 409,
      error_summary: "path/not_found/.",
      error: { ".tag": "path", path: { ".tag": "not_found" } },
      body: {
        error_summary: "path/not_found/.",
        error: { ".tag": "path", path: { ".tag": "not_found" } },
      },
    } satisfies Partial<DropboxError>);
  });

  it("exposes zod request schemas", () => {
    const dropbox = createDropbox({ oauthToken: "dbx-test-token" });

    expect(
      dropbox.files.upload.schema.safeParse({
        path: "/demo.txt",
        contents: "hello",
        mode: { ".tag": "overwrite" },
      }).success
    ).toBe(true);
    expect(
      dropbox.files.upload.schema.safeParse({
        contents: "hello",
      }).success
    ).toBe(false);
    expect(
      dropbox.files.upload.schema.safeParse({
        path: "/demo.txt",
      }).success
    ).toBe(false);
  });
});
