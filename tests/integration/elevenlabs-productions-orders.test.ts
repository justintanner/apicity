import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPollyForFileUploads, teardownPolly } from "../harness";
import type { PollyContext } from "../harness";
import { createElevenLabs, ElevenLabsError } from "@apicity/elevenlabs";

// The ElevenProductions (Orders) API is gated behind a workspace entitlement.
// This workspace does not have it enabled, so every endpoint returns
// 403 `forbidden`. The recording captures that real upstream response; the
// assertions confirm each method builds the correct request and surfaces the
// error as an `ElevenLabsError`. (Same pattern as the PVC sample tests.)
//
// All calls live in one test so they share a single recording — separate
// `it` blocks with the same recording name would clobber each other's HAR.
const ORDER_ID = "prodorder_01jgatk6h0fwxrtbjade61yqhx";
const ITEM_ID = "proditem_01jgd3qhejfs7rm6swknz2ytjb";
const MEDIA_ID = "prodmedia_01jgb2zd68f8f9tfvbb968wb8z";

describe("elevenlabs v1.productions.orders", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyForFileUploads("elevenlabs/productions-orders");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  function makeProvider() {
    return createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });
  }

  async function expectForbidden(promise: Promise<unknown>): Promise<void> {
    try {
      await promise;
      throw new Error("Expected the productions request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect((error as ElevenLabsError).status).toBe(403);
    }
  }

  it(
    "routes every productions order endpoint",
    { timeout: 60000 },
    async () => {
      const provider = makeProvider();

      // The same endpoint functions are reachable under the HTTP-method
      // namespaces and the canonical `v1` namespace.
      expect(provider.get.v1.productions.orders.list).toBe(
        provider.v1.productions.orders.list
      );
      expect(provider.post.v1.productions.orders.create).toBe(
        provider.v1.productions.orders.create
      );
      expect(provider.patch.v1.productions.orders.update).toBe(
        provider.v1.productions.orders.update
      );
      expect(provider.delete.v1.productions.orders.items.remove).toBe(
        provider.v1.productions.orders.items.remove
      );
      expect(provider.post.v1.productions.orders.media.register).toBe(
        provider.v1.productions.orders.media.register
      );
      expect(provider.get.v1.productions.orders.media.get).toBe(
        provider.v1.productions.orders.media.get
      );

      await expectForbidden(
        provider.v1.productions.orders.list({ page_size: 5 })
      );
      await expectForbidden(
        provider.v1.productions.orders.create({ sandbox: true })
      );
      await expectForbidden(provider.v1.productions.orders.get(ORDER_ID));
      await expectForbidden(
        provider.v1.productions.orders.update(ORDER_ID, {
          name: "Spanish Dubs",
        })
      );
      await expectForbidden(provider.v1.productions.orders.submit(ORDER_ID));
      await expectForbidden(
        provider.v1.productions.orders.deliverables(ORDER_ID)
      );
      await expectForbidden(
        provider.v1.productions.orders.items.upsert(ORDER_ID, {
          item: {
            kind: "dub",
            media_id: MEDIA_ID,
            source_language: "en",
            destination_languages: ["es", "fr"],
            include_captions: true,
            include_source_captions: false,
          },
        })
      );
      await expectForbidden(
        provider.v1.productions.orders.items.remove(ORDER_ID, ITEM_ID)
      );
      await expectForbidden(
        provider.v1.productions.orders.media.register(ORDER_ID, {
          declared_language: "en",
          media_url: "https://example.com/example.mp4",
          media_url_filename: "example.mp4",
          media_url_content_type: "video/mp4",
        })
      );
      await expectForbidden(
        provider.v1.productions.orders.media.get(ORDER_ID, MEDIA_ID)
      );
      await expectForbidden(provider.v1.productions.orders.languages("dub"));
    }
  );
});
