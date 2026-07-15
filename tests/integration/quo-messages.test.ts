import { afterEach, describe, expect, it } from "vitest";

import { createQuo, QuoError } from "@apicity/quo";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const FIXTURE_SENDER = "+15555550101";
const FIXTURE_RECIPIENT = "+15555550102";

describe("Quo messages integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("replays a safely rejected fictional message request", async () => {
    ctx = setupPolly("quo/messages-fixture-rejection");
    const quo = createQuo();

    let captured: unknown;
    try {
      await quo.v1.messages({
        content: "Apicity replay fixture. Do not deliver.",
        from: FIXTURE_SENDER,
        to: [FIXTURE_RECIPIENT],
      });
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(QuoError);
    const error = captured as QuoError;
    expect(error.status).toBeGreaterThanOrEqual(400);
    expect(error.status).toBeLessThan(600);
  });
});
