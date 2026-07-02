import { afterEach, describe, expect, it } from "vitest";
import { createOpenAi } from "@apicity/openai";
import {
  getPollyMode,
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";

const recordingNameParts = ["openai", "organization-audit-logs-list"];

function recordingName(): string {
  return recordingNameParts.join("/");
}

function openAiAdminKeyForRecording(): string {
  const key = process.env.OPENAI_ADMIN_KEY;
  if (!key) {
    throw new Error("OPENAI_ADMIN_KEY is required to record audit log HARs");
  }
  return key;
}

describe("openai organization audit logs integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("lists audit logs", async () => {
    const name = recordingName();
    if (getPollyMode() === "replay" && !recordingExists(name)) {
      return;
    }

    ctx = setupPolly(name);

    const provider = createOpenAi({
      apiKey:
        ctx.mode === "replay" ? "sk-test-key" : openAiAdminKeyForRecording(),
    });

    const result = await provider.get.v1.organization.auditLogs({ limit: 1 });

    expect(result.object).toBe("list");
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.has_more).toBe("boolean");
    if (result.data.length > 0) {
      const first = result.data[0];
      expect(first).toBeDefined();
      if (!first) return;
      expect(typeof first.id).toBe("string");
      expect(typeof first.effective_at).toBe("number");
      expect(typeof first.type).toBe("string");
    }
  });
});
