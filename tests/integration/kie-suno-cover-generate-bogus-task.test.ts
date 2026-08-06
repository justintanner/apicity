import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieSunoOtp, TEST_PAYGATE_SECRET } from "../harness";

// Free error path: bogus taskId — do not create a real cover generation job.
describe("kie suno cover.generate (error envelope)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/cover-generate-bogus-task");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a recognizable envelope when taskId does not exist", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    const request = {
      taskId: "apicity-test-bogus-cover-task-id",
      callBackUrl: "https://example.com/cb",
    };

    const generate = provider.suno.post.api.v1.suno.cover.generate;
    const result = await generate(
      request,
      mintKieSunoOtp("api.v1.suno.cover.generate", request)
    );

    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("msg");
    expect([400, 404, 422, 500]).toContain(result.code);
    expect(generate.schema.safeParse(request).success).toBe(true);
  });
});
