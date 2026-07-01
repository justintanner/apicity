import { afterEach, describe, expect, it } from "vitest";

import { createDropbox } from "@apicity/dropbox";
import {
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";

const RECORDING_NAME = "dropbox/check-user";

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

describe("dropbox check user integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("checks a query with the OAuth token", async () => {
    ctx = setupPolly(RECORDING_NAME);
    const dropbox = createDropbox({
      oauthToken: tokenForMode(ctx),
    });

    const checked = await dropbox.check.user({ query: "justin" });

    expect(checked.result).toBe("justin");
  });

  it("serializes the check user request", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const dropbox = createDropbox({
      oauthToken: "dbx-test-token",
      fetch: async (input, init) => {
        calls.push({ url: inputUrl(input), init });
        return new Response(JSON.stringify({ result: "justin" }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    const checked = await dropbox.check.user({ query: "justin" });

    expect(checked.result).toBe("justin");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.dropboxapi.com/2/check/user");
    expect(new Headers(calls[0].init?.headers).get("Authorization")).toBe(
      "Bearer dbx-test-token"
    );
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      query: "justin",
    });
  });

  it("exposes zod request schemas", () => {
    const dropbox = createDropbox({ oauthToken: "dbx-test-token" });

    expect(
      dropbox.check.user.schema.safeParse({
        query: "justin",
      }).success
    ).toBe(true);
    expect(dropbox.check.user.schema.safeParse({}).success).toBe(false);
  });
});
