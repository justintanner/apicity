import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic admin usage and cost reports", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/admin-usage-cost");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get messages usage report", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });

    const result = await provider.v1.organizations.usage_report.messages({
      start_date: "2026-03-01",
      end_date: "2026-03-30",
    });

    expect(result).toBeDefined();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.total).toBeDefined();
    expect(typeof result.total.api_calls).toBe("number");
    expect(typeof result.total.input_tokens).toBe("number");
    expect(typeof result.total.output_tokens).toBe("number");
  });

  it("should get cost report", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });

    const result = await provider.v1.organizations.cost_report.get({
      start_date: "2026-03-01",
      end_date: "2026-03-30",
    });

    expect(result).toBeDefined();
    expect(result.data).toBeInstanceOf(Array);
    expect(typeof result.total_cost_usd).toBe("number");
  });

  it("should get claude code usage report", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });

    const result = await provider.v1.organizations.usage_report.claude_code({
      start_date: "2026-03-01",
      end_date: "2026-03-30",
    });

    expect(result).toBeDefined();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.total).toBeDefined();
    expect(typeof result.total.api_calls).toBe("number");
    expect(typeof result.total.input_tokens).toBe("number");
    expect(typeof result.total.output_tokens).toBe("number");
    expect(typeof result.total.cost_usd).toBe("number");
  });
});
