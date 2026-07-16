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
    // Explicit key forces the request to be issued so Polly replays the HAR.
    // Without it, createQuo() throws QuoError(401) before any fetch when
    // QUO_API_KEY is unset (replay CI), and the fixture is never exercised.
    const quo = createQuo({ apiKey: "test-key" });

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
    // Assert the exact replayed status/code: the 401 missing-key guard can no
    // longer satisfy this, so a green result proves the HAR was replayed.
    expect(error.status).toBe(400);
    expect(error.code).toBe("0202400");
  });
});
