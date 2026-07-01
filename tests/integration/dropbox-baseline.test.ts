import { afterEach, describe, expect, it } from "vitest";

import { createDropbox, DropboxError } from "@apicity/dropbox";
import {
  recordingExists,
  setupPollyWithPersistScrubber,
  teardownPolly,
  type PersistedHarRecording,
  type PollyContext,
} from "../harness";

const CURRENT_TOKEN_RECORDING_NAME = "dropbox/current-token-baseline";

interface FetchCall {
  url: string;
  init?: RequestInit;
}

function shouldUseLiveToken(ctx: PollyContext, recordingName: string): boolean {
  if (ctx.mode === "record" || ctx.mode === "passthrough") return true;
  if (ctx.mode === "record-missing") return !recordingExists(recordingName);
  return false;
}

function tokenForMode(ctx: PollyContext, recordingName: string): string {
  if (!shouldUseLiveToken(ctx, recordingName)) return "***";
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

function rewriteJsonResponse(
  recording: PersistedHarRecording,
  rewrite: (body: Record<string, unknown>) => void
): void {
  const content = recording.response?.content;
  if (typeof content?.text !== "string") return;
  const parsed = JSON.parse(content.text) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return;
  }
  rewrite(parsed as Record<string, unknown>);
  content.text = JSON.stringify(parsed);
  content.size = content.text.length;
  if (recording.response) recording.response.bodySize = content.text.length;
}

function scrubDropboxRecording(recording: PersistedHarRecording): void {
  if (!recording.request?.url?.endsWith("/users/get_current_account")) return;
  rewriteJsonResponse(recording, (body) => {
    body.account_id = "dbid:***";
    body.country = "**";
    body.email = "user@example.com";
    body.referral_link = "https://www.dropbox.com/referrals/***";
    body.name = {
      abbreviated_name: "**",
      display_name: "Example User",
      familiar_name: "Example",
      given_name: "Example",
      surname: "User",
    };

    if (
      body.root_info !== null &&
      typeof body.root_info === "object" &&
      !Array.isArray(body.root_info)
    ) {
      const rootInfo = body.root_info as Record<string, unknown>;
      rootInfo.home_namespace_id = "***";
      rootInfo.root_namespace_id = "***";
    }
  });
}

describe("dropbox baseline integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("exercises endpoints reachable by the current OAuth token", async () => {
    ctx = setupPollyWithPersistScrubber(
      CURRENT_TOKEN_RECORDING_NAME,
      scrubDropboxRecording
    );
    const dropbox = createDropbox({
      oauthToken: tokenForMode(ctx, CURRENT_TOKEN_RECORDING_NAME),
      timeout: 60000,
    });

    const checked = await dropbox.check.user({ query: "justin" });
    const account = await dropbox.users.getCurrentAccount();

    expect(checked.result).toBe("justin");
    expect(account.account_id).toEqual(expect.any(String));
  });

  it("serializes auth, JSON bodies, and content headers", async () => {
    const calls: FetchCall[] = [];
    const fileMetadata = {
      ".tag": "file",
      name: "demo.txt",
      path_lower: "/demo.txt",
      path_display: "/demo.txt",
      id: "id:demo",
      client_modified: "2026-06-29T00:00:00Z",
      server_modified: "2026-06-29T00:00:00Z",
      rev: "rev",
      size: 5,
    };
    const folderMetadata = {
      ".tag": "folder",
      name: "demo",
      path_lower: "/demo",
      path_display: "/demo",
      id: "id:folder",
    };
    const sharedLink = {
      url: "https://www.dropbox.com/s/demo",
      name: "demo.txt",
      path_lower: "/demo.txt",
    };
    const dropbox = createDropbox({
      oauthToken: "dbx-test-token",
      fetch: async (input, init) => {
        const url = inputUrl(input);
        calls.push({ url, init });
        if (url.endsWith("/files/download")) {
          return new Response("hello", {
            headers: {
              "Content-Type": "text/plain",
              "Dropbox-API-Result": JSON.stringify(fileMetadata),
            },
          });
        }
        if (url.endsWith("/files/create_folder_v2")) {
          return Response.json({ metadata: folderMetadata });
        }
        if (url.endsWith("/files/list_folder")) {
          return Response.json({
            entries: [fileMetadata],
            cursor: "cursor-1",
            has_more: true,
          });
        }
        if (url.endsWith("/files/list_folder/continue")) {
          return Response.json({
            entries: [{ ...fileMetadata, name: "second.txt" }],
            cursor: "cursor-2",
            has_more: false,
          });
        }
        if (
          url.endsWith("/files/delete_v2") ||
          url.endsWith("/files/copy_v2") ||
          url.endsWith("/files/move_v2")
        ) {
          return Response.json({ metadata: fileMetadata });
        }
        if (url.endsWith("/sharing/create_shared_link_with_settings")) {
          return Response.json(sharedLink);
        }
        if (url.endsWith("/sharing/list_shared_links")) {
          return Response.json({ links: [sharedLink], has_more: false });
        }
        return Response.json(fileMetadata);
      },
    });

    const folder = await dropbox.files.createFolderV2({ path: "/demo" });
    await dropbox.files.upload({
      path: "/demo.txt",
      mode: { ".tag": "overwrite" },
      mute: true,
      contents: "hello",
    });
    const metadata = await dropbox.files.getMetadata({ path: "/demo.txt" });
    const copied = await dropbox.files.copyV2({
      from_path: "/demo.txt",
      to_path: "/copy.txt",
    });
    const moved = await dropbox.files.moveV2({
      from_path: "/copy.txt",
      to_path: "/moved.txt",
    });
    const listed = await dropbox.files.listFolder({
      path: "/demo",
      limit: 1,
    });
    const continued = await dropbox.files.listFolderContinue({
      cursor: listed.cursor,
    });
    const downloaded = await dropbox.files.download({ path: "/demo.txt" });
    const createdLink = await dropbox.sharing.createSharedLinkWithSettings({
      path: "/demo.txt",
    });
    const links = await dropbox.sharing.listSharedLinks({
      path: "/demo.txt",
      direct_only: true,
    });
    const deleted = await dropbox.files.deleteV2({ path: "/demo.txt" });

    expect(folder.metadata[".tag"]).toBe("folder");
    expect(metadata[".tag"]).toBe("file");
    expect(copied.metadata[".tag"]).toBe("file");
    expect(moved.metadata[".tag"]).toBe("file");
    expect(listed.entries).toHaveLength(1);
    expect(continued.entries[0].name).toBe("second.txt");
    expect(downloaded.text()).toBe("hello");
    expect(createdLink.url).toBe(sharedLink.url);
    expect(links.links[0].url).toBe(sharedLink.url);
    expect(deleted.metadata[".tag"]).toBe("file");
    expect(calls.map((call) => new URL(call.url).pathname)).toEqual([
      "/2/files/create_folder_v2",
      "/2/files/upload",
      "/2/files/get_metadata",
      "/2/files/copy_v2",
      "/2/files/move_v2",
      "/2/files/list_folder",
      "/2/files/list_folder/continue",
      "/2/files/download",
      "/2/sharing/create_shared_link_with_settings",
      "/2/sharing/list_shared_links",
      "/2/files/delete_v2",
    ]);
    expect(
      calls.every(
        (call) =>
          headersOf(call.init).get("Authorization") === "Bearer dbx-test-token"
      )
    ).toBe(true);

    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ path: "/demo" });
    expect(calls[1].url).toBe("https://content.dropboxapi.com/2/files/upload");
    expect(headersOf(calls[1].init).get("Authorization")).toBe(
      "Bearer dbx-test-token"
    );
    expect(headersOf(calls[1].init).get("Content-Type")).toBe(
      "application/octet-stream"
    );
    expect(dropboxApiArg(calls[1].init)).toEqual({
      path: "/demo.txt",
      mode: { ".tag": "overwrite" },
      mute: true,
    });
    expect(calls[1].init?.body).toBe("hello");

    expect(calls[7].url).toBe(
      "https://content.dropboxapi.com/2/files/download"
    );
    expect(dropboxApiArg(calls[7].init)).toEqual({ path: "/demo.txt" });
    expect(calls[7].init?.body).toBeUndefined();
    expect(JSON.parse(String(calls[8].init?.body))).toEqual({
      path: "/demo.txt",
    });
    expect(JSON.parse(String(calls[9].init?.body))).toEqual({
      path: "/demo.txt",
      direct_only: true,
    });
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
