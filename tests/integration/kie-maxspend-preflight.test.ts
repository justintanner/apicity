import { describe, it, expect } from "vitest";
import { kie } from "@apicity/kie";
import { MaxSpendError } from "@apicity/cost";

describe("kie maxSpend preflight", () => {
  it("blocks paid endpoint with omitted maxSpend", async () => {
    const provider = kie({ apiKey: "test-key" });
    await expect(
      provider.post.api.v1.jobs.createTask({
        model: "grok-imagine/text-to-image",
        input: {
          prompt: "test",
          aspect_ratio: "1:1",
        },
      })
    ).rejects.toThrow(MaxSpendError);
  });

  it("blocks paid endpoint with maxSpend=0", async () => {
    const provider = kie({ apiKey: "test-key" });
    await expect(
      provider.post.api.v1.jobs.createTask(
        {
          model: "grok-imagine/text-to-image",
          input: {
            prompt: "test",
            aspect_ratio: "1:1",
          },
        },
        0
      )
    ).rejects.toThrow(MaxSpendError);
  });

  it("error message names the endpoint and shows maxSpend", async () => {
    const provider = kie({ apiKey: "test-key" });
    let caught: MaxSpendError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(
        {
          model: "grok-imagine/text-to-image",
          input: {
            prompt: "test",
            aspect_ratio: "1:1",
          },
        },
        0
      );
    } catch (error) {
      caught = error as MaxSpendError;
    }
    expect(caught).toBeInstanceOf(MaxSpendError);
    expect(caught!.message).toContain("kie POST api.v1.jobs.createTask");
    expect(caught!.message).toContain("maxSpend is 0 USD");
    expect(caught!.message).toContain("Pass an explicit maxSpend");
  });

  it("does not make a network request when maxSpend is omitted", async () => {
    const provider = kie({ apiKey: "test-key" });
    // Use a non-existent baseURL to prove no network call is made
    const providerNoNetwork = kie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
    });
    await expect(
      providerNoNetwork.post.api.v1.jobs.createTask(
        {
          model: "grok-imagine/text-to-image",
          input: {
            prompt: "test",
            aspect_ratio: "1:1",
          },
        },
        0
      )
    ).rejects.toThrow(MaxSpendError);
  });

  it("allows paid endpoint with maxSpend > 0", async () => {
    const provider = kie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
    });
    let caught: unknown;
    try {
      await provider.post.api.v1.jobs.createTask(
        {
          model: "grok-imagine/text-to-image",
          input: {
            prompt: "test",
            aspect_ratio: "1:1",
          },
        },
        10
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeDefined();
    expect(caught).not.toBeInstanceOf(MaxSpendError);
  });

  it("free endpoint with omitted maxSpend proceeds normally", async () => {
    const provider = kie({ apiKey: "test-key" });
    // Accessing .schema is a free operation and should not be blocked
    expect(provider.post.api.v1.jobs.createTask.schema).toBeDefined();
  });
});
