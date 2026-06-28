import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  ElevenLabsError,
  type ElevenLabsCreatePhoneNumberRequest,
  type ElevenLabsUpdatePhoneNumberRequest,
  type ElevenLabsTwilioOutboundCallRequest,
  type ElevenLabsSipTrunkOutboundCallRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai.phoneNumbers", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-phone-numbers");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("imports, reads, lists, updates, and deletes a phone number", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // Endpoints are exposed both on the ergonomic `v1` tree and the
    // method-grouped trees — they must be the same function references.
    expect(provider.post.v1.convai.phoneNumbers.create).toBe(
      provider.v1.convai.phoneNumbers.create
    );
    expect(provider.get.v1.convai.phoneNumbers.list).toBe(
      provider.v1.convai.phoneNumbers.list
    );
    expect(provider.get.v1.convai.phoneNumbers.get).toBe(
      provider.v1.convai.phoneNumbers.get
    );
    expect(provider.patch.v1.convai.phoneNumbers.update).toBe(
      provider.v1.convai.phoneNumbers.update
    );
    expect(provider.delete.v1.convai.phoneNumbers.delete).toBe(
      provider.v1.convai.phoneNumbers.delete
    );

    const createReq: ElevenLabsCreatePhoneNumberRequest = {
      phone_number: "+12025550168",
      label: "Apicity phone-number route test",
      provider: "sip_trunk",
      outbound_trunk_config: {
        address: "sip.apicity-route-test.invalid",
        transport: "udp",
      },
    };
    expect(
      provider.v1.convai.phoneNumbers.create.schema.safeParse(createReq).success
    ).toBe(true);

    // 1. Import (create)
    const created = await provider.v1.convai.phoneNumbers.create(createReq);
    expect(typeof created.phone_number_id).toBe("string");
    expect(created.phone_number_id.length).toBeGreaterThan(0);
    const phoneNumberId = created.phone_number_id;

    // 2. Get
    const fetched = await provider.v1.convai.phoneNumbers.get(phoneNumberId);
    expect(fetched.phone_number_id).toBe(phoneNumberId);
    expect(typeof fetched.phone_number).toBe("string");
    expect(typeof fetched.provider).toBe("string");

    // 3. List
    const listed = await provider.v1.convai.phoneNumbers.list();
    expect(Array.isArray(listed)).toBe(true);

    // 4. Update
    const updateReq: ElevenLabsUpdatePhoneNumberRequest = {
      label: "Apicity phone-number route test (updated)",
    };
    expect(
      provider.v1.convai.phoneNumbers.update.schema.safeParse(updateReq).success
    ).toBe(true);
    const updated = await provider.v1.convai.phoneNumbers.update(
      phoneNumberId,
      updateReq
    );
    expect(updated.phone_number_id).toBe(phoneNumberId);

    // 5. Delete
    await expect(
      provider.v1.convai.phoneNumbers.delete(phoneNumberId)
    ).resolves.toBeDefined();
  });
});

describe("elevenlabs v1.convai outbound calls", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-outbound-calls");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("validates outbound-call schemas and surfaces API errors", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // Both outbound-call endpoints are exposed on the ergonomic `v1` tree and
    // the method-grouped `post` tree — same function references.
    expect(provider.post.v1.convai.twilio.outboundCall).toBe(
      provider.v1.convai.twilio.outboundCall
    );
    expect(provider.post.v1.convai.sipTrunk.outboundCall).toBe(
      provider.v1.convai.sipTrunk.outboundCall
    );

    const twilioReq: ElevenLabsTwilioOutboundCallRequest = {
      agent_id: "apicity-route-test-agent",
      agent_phone_number_id: "apicity-route-test-phone",
      to_number: "+15005550006",
    };
    expect(
      provider.v1.convai.twilio.outboundCall.schema.safeParse(twilioReq).success
    ).toBe(true);

    const sipReq: ElevenLabsSipTrunkOutboundCallRequest = {
      agent_id: "apicity-route-test-agent",
      agent_phone_number_id: "apicity-route-test-phone",
      to_number: "+15005550006",
    };
    expect(
      provider.v1.convai.sipTrunk.outboundCall.schema.safeParse(sipReq).success
    ).toBe(true);

    // The agent / phone-number ids are bogus, so the API rejects the request
    // before placing any call. We assert the error surfaces as ElevenLabsError.
    await expect(
      provider.v1.convai.twilio.outboundCall(twilioReq)
    ).rejects.toBeInstanceOf(ElevenLabsError);
    await expect(
      provider.v1.convai.sipTrunk.outboundCall(sipReq)
    ).rejects.toBeInstanceOf(ElevenLabsError);
  });
});
