import { afterEach, describe, expect, it } from "vitest";

import { createDropbox, DropboxError } from "@apicity/dropbox";
import {
  getPollyMode,
  recordingExists,
  setupPollyWithPersistScrubber,
  teardownPolly,
  type PersistedHarRecording,
  type PollyContext,
} from "../harness";

const CURRENT_TOKEN_RECORDING_NAME = "dropbox/current-token-baseline";
const FULL_BASELINE_RECORDING_NAME = ["dropbox", "full-baseline"].join("/");
const TEST_ROOT = "/apicity-tests/dropbox-baseline-v1";
const canRunCurrentTokenBaseline =
  recordingExists(CURRENT_TOKEN_RECORDING_NAME) ||
  (getPollyMode() !== "replay" && Boolean(process.env.DROPBOX_OAUTH_TOKEN));
const canRunFullBaseline =
  recordingExists(FULL_BASELINE_RECORDING_NAME) ||
  (getPollyMode() !== "replay" &&
    process.env.DROPBOX_RECORD_FULL_BASELINE === "1");

const currentTokenReachability = {
  reachable: ["check.user", "users.getCurrentAccount"],
  optional: [
    {
      dotPath: "files.listFolder",
      status: 401,
      error_summary: "missing_scope/",
      required_scope: "files.metadata.read",
    },
    {
      dotPath: "files.listFolderContinue",
      status: 401,
      error_summary: "missing_scope/",
      required_scope: "files.metadata.read",
    },
    {
      dotPath: "files.getMetadata",
      status: 401,
      error_summary: "missing_scope/",
      required_scope: "files.metadata.read",
    },
    {
      dotPath: "files.createFolderV2",
      status: 401,
      error_summary: "missing_scope/",
      required_scope: "files.content.write",
    },
    {
      dotPath: "files.deleteV2",
      status: 401,
      error_summary: "missing_scope/",
      required_scope: "files.content.write",
    },
    {
      dotPath: "files.copyV2",
      status: 401,
      error_summary: "missing_scope/",
      required_scope: "files.content.write",
    },
    {
      dotPath: "files.moveV2",
      status: 401,
      error_summary: "missing_scope/",
      required_scope: "files.content.write",
    },
    {
      dotPath: "files.upload",
      status: 401,
      error_summary: "missing_scope/...",
      required_scope: "files.content.write",
    },
    {
      dotPath: "files.download",
      status: 401,
      error_summary: "other/...",
      note: "Current token cannot set up or read a file for content download.",
    },
    {
      dotPath: "sharing.createSharedLinkWithSettings",
      status: 401,
      error_summary: "missing_scope/",
      required_scope: "sharing.write",
    },
    {
      dotPath: "sharing.listSharedLinks",
      status: 401,
      error_summary: "missing_scope/",
      required_scope: "sharing.read",
    },
  ],
} as const;

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

  it.skipIf(!canRunCurrentTokenBaseline)(
    "exercises endpoints reachable by the current OAuth token",
    async () => {
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
    }
  );

  it("documents current OAuth token scope boundaries", () => {
    const implemented = [
      "check.user",
      "users.getCurrentAccount",
      "files.listFolder",
      "files.listFolderContinue",
      "files.getMetadata",
      "files.createFolderV2",
      "files.deleteV2",
      "files.copyV2",
      "files.moveV2",
      "files.upload",
      "files.download",
      "sharing.createSharedLinkWithSettings",
      "sharing.listSharedLinks",
    ];

    const classified = [
      ...currentTokenReachability.reachable,
      ...currentTokenReachability.optional.map((entry) => entry.dotPath),
    ];

    expect([...classified].sort()).toEqual([...implemented].sort());
    expect(currentTokenReachability.reachable).toEqual([
      "check.user",
      "users.getCurrentAccount",
    ]);
    expect(currentTokenReachability.optional).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dotPath: "files.listFolder",
          required_scope: "files.metadata.read",
        }),
        expect.objectContaining({
          dotPath: "files.upload",
          required_scope: "files.content.write",
        }),
        expect.objectContaining({
          dotPath: "sharing.createSharedLinkWithSettings",
          required_scope: "sharing.write",
        }),
        expect.objectContaining({
          dotPath: "sharing.listSharedLinks",
          required_scope: "sharing.read",
        }),
      ])
    );
  });

  it.skipIf(!canRunFullBaseline)(
    "exercises users, files, content, and sharing endpoints with full scopes",
    async () => {
      ctx = setupPollyWithPersistScrubber(
        FULL_BASELINE_RECORDING_NAME,
        scrubDropboxRecording
      );
      const dropbox = createDropbox({
        oauthToken: tokenForMode(ctx, FULL_BASELINE_RECORDING_NAME),
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
