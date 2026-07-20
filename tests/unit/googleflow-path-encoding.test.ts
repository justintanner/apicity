// Tests for the Google Flow path-identifier encoding policy (REQ-005/AC-005).
//
// useapi.net carries `:` and `@` as significant bytes inside a path segment —
// its documented `GET /jobs/{jobId}` example is
// `/jobs/j1731859234567v-u12345-email:jo***@gmail.com-bot:google-flow`. Both
// are legal unescaped in a path segment per RFC 3986 section 3.3 (`pchar`),
// so `encodePathSegment` must preserve them while still escaping the
// characters that genuinely break path parsing.
import { describe, it, expect } from "vitest";
import { createGoogleFlow } from "@apicity/googleflow";
import { encodePathSegment } from "../../packages/provider/googleflow/src/google";

const BASE_URL = "https://api.useapi.net/v1/google-flow";

describe("encodePathSegment", () => {
  it("preserves upstream-significant characters", () => {
    expect(encodePathSegment("job:123@account")).toBe("job:123@account");
  });

  it("preserves the colons in a real character reference-id", () => {
    const ref = "user:12345-email:6a6f-character:f470f1b5-imgs:2";
    expect(encodePathSegment(ref)).toBe(ref);
  });

  it("still escapes path-breaking characters", () => {
    expect(encodePathSegment("char/ref")).toBe("char%2Fref");
    expect(encodePathSegment("with space")).toBe("with%20space");
    expect(encodePathSegment("q?a")).toBe("q%3Fa");
    expect(encodePathSegment("frag#ment")).toBe("frag%23ment");
    expect(encodePathSegment("pct%enc")).toBe("pct%25enc");
    expect(encodePathSegment("ctrl\u0001x")).toBe("ctrl%01x");
  });

  it("does not corrupt an already-escaped-looking literal", () => {
    // A literal "%3A" must survive as an escaped percent, not collapse to ":".
    expect(encodePathSegment("a%3Ab")).toBe("a%253Ab");
  });

  it("escapes non-ASCII as UTF-8", () => {
    expect(encodePathSegment("café")).toBe("caf%C3%A9");
  });
});

/**
 * Drives every endpoint that interpolates an identifier into the path and
 * returns the request path that was actually sent.
 *
 * AC-005 requires the policy to hold at all nine call sites, not one, so each
 * site is exercised through the public factory rather than asserted against
 * the helper alone.
 */
async function pathFor(
  call: (flow: ReturnType<typeof createGoogleFlow>) => Promise<unknown>
): Promise<string> {
  let captured = "";
  const flow = createGoogleFlow({
    apiKey: "test-key",
    fetch: (async (input: string | URL | Request) => {
      captured = String(
        typeof input === "string" || input instanceof URL ? input : input.url
      );
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch,
  });
  await call(flow);
  return captured.slice(BASE_URL.length);
}

describe("path identifiers survive transport at all nine call sites", () => {
  const EMAIL = "user:12345@example.com";
  const REF = "user:12345-character:f470@acct";
  const MEDIA_ID = "user:12345-image:ff9aa5cc@acct";
  const JOB_ID = "job:123@account";

  it("POST /assets/{email}", async () => {
    expect(
      await pathFor((flow) =>
        flow.post.v1.assets({
          body: "bytes",
          contentType: "image/png",
          email: EMAIL,
        })
      )
    ).toBe(`/assets/${EMAIL}`);
  });

  it("GET /accounts/{email}", async () => {
    expect(
      await pathFor((flow) => flow.get.v1.accounts.retrieve({ email: EMAIL }))
    ).toBe(`/accounts/${EMAIL}`);
  });

  it("GET /assets/{mediaGenerationId}", async () => {
    expect(
      await pathFor((flow) =>
        flow.get.v1.assets.retrieve({ mediaGenerationId: MEDIA_ID })
      )
    ).toBe(`/assets/${MEDIA_ID}`);
  });

  it("GET /characters/{ref}", async () => {
    expect(
      await pathFor((flow) => flow.get.v1.characters.retrieve({ ref: REF }))
    ).toBe(`/characters/${REF}`);
  });

  it("GET /voices/{ref}", async () => {
    expect(
      await pathFor((flow) => flow.get.v1.voices.retrieve({ ref: REF }))
    ).toBe(`/voices/${REF}`);
  });

  it("GET /jobs/{jobId}", async () => {
    expect(
      await pathFor((flow) => flow.get.v1.jobs.retrieve({ jobId: JOB_ID }))
    ).toBe(`/jobs/${JOB_ID}`);
  });

  it("DELETE /accounts/{email}", async () => {
    expect(
      await pathFor((flow) => flow.delete.v1.accounts({ email: EMAIL }))
    ).toBe(`/accounts/${EMAIL}`);
  });

  it("DELETE /characters/{ref}", async () => {
    expect(
      await pathFor((flow) => flow.delete.v1.characters({ ref: REF }))
    ).toBe(`/characters/${REF}`);
  });

  it("DELETE /voices/{ref}", async () => {
    expect(await pathFor((flow) => flow.delete.v1.voices({ ref: REF }))).toBe(
      `/voices/${REF}`
    );
  });

  it("keeps a slash inside a ref escaped at every ref site", async () => {
    // The boundary pair for AC-005: `/` must stay escaped even though `:` and
    // `@` do not, or the identifier would split into two path segments.
    expect(
      await pathFor((flow) =>
        flow.get.v1.characters.retrieve({ ref: "char/ref" })
      )
    ).toBe("/characters/char%2Fref");
    expect(
      await pathFor((flow) => flow.delete.v1.voices({ ref: "voice/ref" }))
    ).toBe("/voices/voice%2Fref");
  });
});
