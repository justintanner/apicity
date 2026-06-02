import { createSign, generateKeyPairSync, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

import { canonicalHash } from "./paygate";

/**
 * Encode a buffer to unpadded base64url.
 */
function base64urlEncode(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Mint an OTP for a specific request.
 *
 * Requires `APICITY_PAYGATE_PRIVATE_KEY_PATH` to point to an Ed25519 private key PEM.
 */
export function mintOtp(
  provider: string,
  method: string,
  dotPath: string,
  payload: Record<string, unknown>,
  maxSpendUsd: number,
  ttlSeconds: number
): string {
  const privateKeyPath = process.env.APICITY_PAYGATE_PRIVATE_KEY_PATH;
  if (!privateKeyPath) {
    throw new Error(
      "APICITY_PAYGATE_PRIVATE_KEY_PATH is not set. " +
        "Export the path to your Ed25519 private key PEM."
    );
  }

  const privateKeyPem = readFileSync(privateKeyPath, "utf8");

  const jti = randomBytes(16).toString("hex");
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;

  const payloadObj = {
    v: 1 as const,
    jti,
    provider,
    method,
    dotPath,
    requestHash: canonicalHash(payload),
    maxSpendUsd,
    iat,
    exp,
  };

  const payloadJson = JSON.stringify(payloadObj);
  const payloadSegment = base64urlEncode(Buffer.from(payloadJson, "utf8"));

  const signer = createSign("sha256");
  signer.update(payloadSegment, "utf8");
  const signature = signer.sign(privateKeyPem);

  const signatureSegment = base64urlEncode(signature);

  return `${payloadSegment}.${signatureSegment}`;
}

/**
 * Generate a fresh Ed25519 key pair for the pay gate.
 */
export function generateKeyPair(): {
  publicKeyPem: string;
  privateKeyPem: string;
} {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}
