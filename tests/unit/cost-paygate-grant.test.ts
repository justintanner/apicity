import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ENDPOINT_BILLING,
  GRANT_CLOCK_SKEW_SECONDS,
  GRANT_DEFAULT_TTL_SECONDS,
  GRANT_MAX_TTL_SECONDS,
  GRANT_TOKEN_PREFIX,
  PAID_ENDPOINTS,
  canonicalHash,
  dispatchGated,
  dispatchWithPaidGate,
  grantDirectory,
  grantFileName,
  isGrantProviderName,
  mintGrant,
  mintOtp,
  verifyGrant,
  verifyOtp,
} from "@apicity/cost";

const SECRET = "grant-unit-test-secret";

function decodePayload(token: string): Record<string, unknown> {
  const segment = token.slice(GRANT_TOKEN_PREFIX.length).split(".")[0]!;
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as Record<
    string,
    unknown
  >;
}

describe("cost paygate provider grants", () => {
  it("exports expected constants and token structure", () => {
    expect(GRANT_TOKEN_PREFIX).toBe("apicity-grant-v1.");
    expect(GRANT_DEFAULT_TTL_SECONDS).toBe(3600);
    expect(GRANT_MAX_TTL_SECONDS).toBe(86400);
    expect(GRANT_CLOCK_SKEW_SECONDS).toBe(300);

    const token = mintGrant(SECRET, { provider: "fal" });
    expect(token.startsWith(GRANT_TOKEN_PREFIX)).toBe(true);
    expect(token.slice(GRANT_TOKEN_PREFIX.length).split(".")).toHaveLength(2);

    const payload = decodePayload(token);
    expect(Object.keys(payload).sort()).toEqual([
      "exp",
      "iat",
      "jti",
      "provider",
      "v",
    ]);
    expect(payload.v).toBe(1);
    expect(payload.provider).toBe("fal");
    expect(typeof payload.jti).toBe("string");
    expect((payload.jti as string).length).toBe(32);
    expect(Number(payload.exp) - Number(payload.iat)).toBe(3600);
  });

  it("validates TTL limits, secret, and provider name on mintGrant", () => {
    expect(() => mintGrant("", { provider: "fal" })).toThrow(
      /non-empty secret/
    );
    expect(() => mintGrant(SECRET, { provider: "../fal" })).toThrow(
      /Invalid provider/
    );
    expect(() => mintGrant(SECRET, { provider: "OpenAI" })).toThrow(
      /Invalid provider/
    );
    expect(() => mintGrant(SECRET, { provider: "fal", ttl: 0 })).toThrow(
      /above 0/
    );
    expect(() => mintGrant(SECRET, { provider: "fal", ttl: 1.5 })).toThrow(
      /whole number/
    );
    expect(() => mintGrant(SECRET, { provider: "fal", ttl: "0s" })).toThrow(
      /above 0/
    );
    expect(() =>
      mintGrant(SECRET, { provider: "fal", ttl: GRANT_MAX_TTL_SECONDS + 1 })
    ).toThrow(/24-hour/);
    expect(() => mintGrant(SECRET, { provider: "fal", ttl: "25h" })).toThrow(
      /24-hour/
    );
    expect(() => mintGrant(SECRET, { provider: "fal", ttl: "2d" })).toThrow(
      /24-hour/
    );

    const maxToken = mintGrant(SECRET, { provider: "fal", ttl: "24h" });
    const verified = verifyGrant({
      token: maxToken,
      secret: SECRET,
      provider: "fal",
    });
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.payload.exp - verified.payload.iat).toBe(86400);
    }
  });

  it("verifies signature before parsing payload and rejects all invalid states", () => {
    const now = 1_700_000_000;
    const token = mintGrant(SECRET, {
      provider: "fal",
      ttl: 120,
      now: () => now * 1000,
    });

    // Reusable until expiry (inclusive of exp).
    expect(
      verifyGrant({ token, secret: SECRET, provider: "fal", nowSeconds: now })
        .ok
    ).toBe(true);
    expect(
      verifyGrant({
        token,
        secret: SECRET,
        provider: "fal",
        nowSeconds: now + 120,
      }).ok
    ).toBe(true);

    // Wrong secret or tampered payload -> grant-invalid-signature.
    expect(
      verifyGrant({
        token,
        secret: "other-secret",
        provider: "fal",
        nowSeconds: now,
      })
    ).toMatchObject({ ok: false, code: "grant-invalid-signature" });

    // Non-JSON payload with bad signature still returns grant-invalid-signature
    // because signature is checked before parsing JSON.
    const rawBadJsonSeg = Buffer.from("{not-json", "utf8").toString(
      "base64url"
    );
    const bogusSig = Buffer.from("bad-sig").toString("base64url");
    expect(
      verifyGrant({
        token: `${GRANT_TOKEN_PREFIX}${rawBadJsonSeg}.${bogusSig}`,
        secret: SECRET,
        provider: "fal",
        nowSeconds: now,
      })
    ).toMatchObject({ ok: false, code: "grant-invalid-signature" });

    // Signed token whose lifetime exceeds 24h -> grant-malformed.
    const longSeg = Buffer.from(
      JSON.stringify({
        v: 1,
        jti: "abc",
        provider: "fal",
        iat: now,
        exp: now + GRANT_MAX_TTL_SECONDS + 1,
      }),
      "utf8"
    ).toString("base64url");
    const longSig = createHmac("sha256", SECRET)
      .update(`${GRANT_TOKEN_PREFIX}${longSeg}`, "utf8")
      .digest()
      .toString("base64url");
    expect(
      verifyGrant({
        token: `${GRANT_TOKEN_PREFIX}${longSeg}.${longSig}`,
        secret: SECRET,
        provider: "fal",
        nowSeconds: now,
      })
    ).toMatchObject({ ok: false, code: "grant-malformed" });

    // Clock skew (> 300s ahead) -> grant-not-yet-valid; exactly 300s succeeds.
    expect(
      verifyGrant({
        token,
        secret: SECRET,
        provider: "fal",
        nowSeconds: now - 300,
      }).ok
    ).toBe(true);
    expect(
      verifyGrant({
        token,
        secret: SECRET,
        provider: "fal",
        nowSeconds: now - 301,
      })
    ).toMatchObject({ ok: false, code: "grant-not-yet-valid" });

    // Past exp -> grant-expired.
    expect(
      verifyGrant({
        token,
        secret: SECRET,
        provider: "fal",
        nowSeconds: now + 121,
      })
    ).toMatchObject({ ok: false, code: "grant-expired" });

    // Wrong provider -> grant-mismatched-provider.
    expect(
      verifyGrant({
        token,
        secret: SECRET,
        provider: "openai",
        nowSeconds: now,
      })
    ).toMatchObject({ ok: false, code: "grant-mismatched-provider" });
  });

  it("keeps OTPs and grants cryptographically and syntactically distinct", async () => {
    const request = { model: "veo3", prompt: "cat" };
    const otp = mintOtp(SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      request,
    });
    const grant = mintGrant(SECRET, { provider: "kie" });

    // OTP cannot verify as a grant even if relabeled with grant prefix + payload.
    expect(
      verifyGrant({ token: otp, secret: SECRET, provider: "kie" })
    ).toMatchObject({ ok: false, code: "grant-malformed" });
    const [otpSeg, otpSig] = otp.split(".") as [string, string];
    expect(
      verifyGrant({
        token: `${GRANT_TOKEN_PREFIX}${otpSeg}.${otpSig}`,
        secret: SECRET,
        provider: "kie",
      })
    ).toMatchObject({ ok: false, code: "grant-invalid-signature" });

    // Grant cannot verify as an OTP.
    expect(
      verifyOtp({
        nowSeconds: Math.floor(Date.now() / 1000),
        secret: SECRET,
        expected: {
          provider: "kie",
          method: "POST",
          dotPath: "api.v1.jobs.createTask",
        },
        payloadHash: canonicalHash(request),
        otp: grant,
        isJtiConsumed: () => false,
      })
    ).toMatchObject({ ok: false, code: "otp-malformed" });

    await expect(
      dispatchGated(
        "openai",
        "POST",
        "v1.embeddings",
        {},
        { otp: grant },
        async () => "ok",
        { secret: SECRET }
      )
    ).rejects.toMatchObject({ name: "PayGateError", code: "otp-malformed" });

    // Every PAID_ENDPOINTS entry refuses a grant passed to dispatchWithPaidGate.
    for (const { key } of PAID_ENDPOINTS) {
      const providerGrant = mintGrant(SECRET, { provider: key.provider });
      await expect(
        dispatchWithPaidGate(
          key.provider,
          key.method,
          key.dotPath,
          {},
          { otp: providerGrant },
          async () => "ok",
          { secret: SECRET }
        ),
        `${key.provider} ${key.method} ${key.dotPath}`
      ).rejects.toMatchObject({ name: "PayGateError", code: "otp-malformed" });
    }
  });

  it("derives known provider names, grant filenames, and grant directories", () => {
    const known = new Set([
      ...ENDPOINT_BILLING.map((p) => p.match.provider),
      ...PAID_ENDPOINTS.map((e) => e.key.provider),
    ]);
    for (const name of known) {
      expect(isGrantProviderName(name), name).toBe(true);
    }
    expect(isGrantProviderName("nope")).toBe(false);
    expect(isGrantProviderName("../fal")).toBe(false);
    expect(grantFileName("openai")).toBe("openai.grant");
    expect(() => grantFileName("../openai")).toThrow(/Invalid provider/);

    expect(
      grantDirectory({
        APICITY_PAYGATE_GRANT_DIR: "/tmp/custom-grants",
        HOME: "/home/user",
      })
    ).toBe("/tmp/custom-grants");
    expect(grantDirectory({ HOME: "/home/user" })).toBe(
      join("/home/user", ".config", "apicity", "paygate-grants")
    );
  });

  it("keeps grant logic absent from SDK paygate files and kie/xai copies", () => {
    const files = [
      "packages/provider/cost/src/paygate.ts",
      "packages/provider/cost/src/with-paid-gate.ts",
      "packages/provider/cost/src/paid-endpoints.ts",
      "packages/provider/kie/src/paygate.ts",
      "packages/provider/xai/src/paygate.ts",
    ];
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/grant/i);
    }
  });
});
