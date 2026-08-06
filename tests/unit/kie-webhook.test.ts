import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

import {
  signKieWebhook,
  verifyKieWebhookSignature,
  verifyKieWebhookRequest,
  extractKieWebhookTaskId,
} from "../../packages/provider/kie/src/webhook";

// Drive the shipped helper with known-good and known-bad signatures.
// Signature rule (docs.kie.ai/common-api/webhook-verification):
//   Base64(HMAC-SHA256(taskId + "." + timestampSeconds, secret))

const SECRET = "test-webhook-hmac-key";
const TASK_ID = "ee9c2715375b7837f8bb51d641ff5863";
const TIMESTAMP = "1769670760";

function independentSign(
  taskId: string,
  timestamp: string,
  secret: string
): string {
  return createHmac("sha256", secret)
    .update(`${taskId}.${timestamp}`, "utf8")
    .digest("base64");
}

describe("kie webhook HMAC helper", () => {
  describe("signKieWebhook", () => {
    it("matches an independent HMAC-SHA256 Base64 computation", () => {
      const fromHelper = signKieWebhook(TASK_ID, TIMESTAMP, SECRET);
      const independent = independentSign(TASK_ID, TIMESTAMP, SECRET);
      expect(fromHelper).toBe(independent);
      expect(fromHelper.length).toBeGreaterThan(0);
    });

    it("accepts numeric timestamps", () => {
      expect(signKieWebhook(TASK_ID, Number(TIMESTAMP), SECRET)).toBe(
        independentSign(TASK_ID, TIMESTAMP, SECRET)
      );
    });
  });

  describe("verifyKieWebhookSignature", () => {
    it("accepts a known-good signature", () => {
      const signature = independentSign(TASK_ID, TIMESTAMP, SECRET);
      expect(
        verifyKieWebhookSignature({
          secret: SECRET,
          taskId: TASK_ID,
          timestamp: TIMESTAMP,
          signature,
        })
      ).toBe(true);
    });

    it("rejects a tampered signature", () => {
      const signature = independentSign(TASK_ID, TIMESTAMP, SECRET);
      const bad =
        signature.slice(0, -1) + (signature.endsWith("A") ? "B" : "A");
      expect(
        verifyKieWebhookSignature({
          secret: SECRET,
          taskId: TASK_ID,
          timestamp: TIMESTAMP,
          signature: bad,
        })
      ).toBe(false);
    });

    it("rejects a wrong secret", () => {
      const signature = independentSign(TASK_ID, TIMESTAMP, SECRET);
      expect(
        verifyKieWebhookSignature({
          secret: "wrong-secret",
          taskId: TASK_ID,
          timestamp: TIMESTAMP,
          signature,
        })
      ).toBe(false);
    });

    it("rejects a wrong taskId", () => {
      const signature = independentSign(TASK_ID, TIMESTAMP, SECRET);
      expect(
        verifyKieWebhookSignature({
          secret: SECRET,
          taskId: "other-task",
          timestamp: TIMESTAMP,
          signature,
        })
      ).toBe(false);
    });

    it("rejects a wrong timestamp", () => {
      const signature = independentSign(TASK_ID, TIMESTAMP, SECRET);
      expect(
        verifyKieWebhookSignature({
          secret: SECRET,
          taskId: TASK_ID,
          timestamp: "1769670761",
          signature,
        })
      ).toBe(false);
    });

    it("rejects a signature of the wrong length without throwing", () => {
      const signature = independentSign(TASK_ID, TIMESTAMP, SECRET);
      expect(
        verifyKieWebhookSignature({
          secret: SECRET,
          taskId: TASK_ID,
          timestamp: TIMESTAMP,
          signature: signature.slice(0, -4),
        })
      ).toBe(false);
    });

    it("rejects empty or missing inputs", () => {
      const signature = independentSign(TASK_ID, TIMESTAMP, SECRET);
      expect(
        verifyKieWebhookSignature({
          secret: "",
          taskId: TASK_ID,
          timestamp: TIMESTAMP,
          signature,
        })
      ).toBe(false);
      expect(
        verifyKieWebhookSignature({
          secret: SECRET,
          taskId: "",
          timestamp: TIMESTAMP,
          signature,
        })
      ).toBe(false);
      expect(
        verifyKieWebhookSignature({
          secret: SECRET,
          taskId: TASK_ID,
          timestamp: TIMESTAMP,
          signature: "",
        })
      ).toBe(false);
    });
  });

  describe("extractKieWebhookTaskId", () => {
    it("prefers top-level taskId", () => {
      expect(
        extractKieWebhookTaskId({
          taskId: TASK_ID,
          data: { task_id: "nested" },
        })
      ).toBe(TASK_ID);
    });

    it("falls back to data.taskId", () => {
      expect(extractKieWebhookTaskId({ data: { taskId: TASK_ID } })).toBe(
        TASK_ID
      );
    });

    it("falls back to data.task_id", () => {
      expect(extractKieWebhookTaskId({ data: { task_id: TASK_ID } })).toBe(
        TASK_ID
      );
    });
  });

  describe("verifyKieWebhookRequest", () => {
    it("verifies a full request with headers and body", () => {
      const signature = signKieWebhook(TASK_ID, TIMESTAMP, SECRET);
      expect(
        verifyKieWebhookRequest({
          secret: SECRET,
          headers: {
            "X-Webhook-Timestamp": TIMESTAMP,
            "X-Webhook-Signature": signature,
          },
          body: {
            taskId: TASK_ID,
            code: 200,
            data: { task_id: TASK_ID, callbackType: "task_completed" },
          },
        })
      ).toBe(true);
    });

    it("verifies a request carrying Fetch Headers", () => {
      const signature = signKieWebhook(TASK_ID, TIMESTAMP, SECRET);
      expect(
        verifyKieWebhookRequest({
          secret: SECRET,
          headers: new Headers({
            "X-Webhook-Timestamp": TIMESTAMP,
            "X-Webhook-Signature": signature,
          }),
          body: { taskId: TASK_ID },
        })
      ).toBe(true);
    });

    it("accepts Express-style string[] header values", () => {
      const signature = signKieWebhook(TASK_ID, TIMESTAMP, SECRET);
      expect(
        verifyKieWebhookRequest({
          secret: SECRET,
          headers: {
            "x-webhook-timestamp": [TIMESTAMP, "1769670761"],
            "x-webhook-signature": [signature, "ignored"],
          },
          body: { taskId: TASK_ID },
        })
      ).toBe(true);
    });

    it("rejects missing signature headers", () => {
      expect(
        verifyKieWebhookRequest({
          secret: SECRET,
          headers: {},
          body: { taskId: TASK_ID },
        })
      ).toBe(false);
    });
  });
});
