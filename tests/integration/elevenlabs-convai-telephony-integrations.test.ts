import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  ElevenLabsError,
  type ElevenLabsExotelOutboundCallRequest,
  type ElevenLabsRegisterTwilioCallRequest,
  type ElevenLabsUpdateWhatsAppAccountRequest,
  type ElevenLabsWhatsAppOutboundCallRequest,
  type ElevenLabsWhatsAppOutboundMessageRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.convai telephony integrations", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/convai-telephony-integrations");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("exposes SIP messages, Twilio register-call, Exotel, and WhatsApp routes", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.get.v1.convai.phoneNumbers.sipMessages).toBe(
      provider.v1.convai.phoneNumbers.sipMessages
    );
    expect(provider.post.v1.convai.twilio.registerCall).toBe(
      provider.v1.convai.twilio.registerCall
    );
    expect(provider.post.v1.convai.exotel.outboundCall).toBe(
      provider.v1.convai.exotel.outboundCall
    );
    expect(provider.post.v1.convai.whatsapp.outboundCall).toBe(
      provider.v1.convai.whatsapp.outboundCall
    );
    expect(provider.post.v1.convai.whatsapp.outboundMessage).toBe(
      provider.v1.convai.whatsapp.outboundMessage
    );
    expect(provider.get.v1.convai.whatsappAccounts.list).toBe(
      provider.v1.convai.whatsappAccounts.list
    );
    expect(provider.get.v1.convai.whatsappAccounts.get).toBe(
      provider.v1.convai.whatsappAccounts.get
    );
    expect(provider.patch.v1.convai.whatsappAccounts.update).toBe(
      provider.v1.convai.whatsappAccounts.update
    );
    expect(provider.delete.v1.convai.whatsappAccounts.delete).toBe(
      provider.v1.convai.whatsappAccounts.delete
    );

    expect(
      provider.v1.convai.phoneNumbers.sipMessages.schema.safeParse({
        page_size: 1,
        cursor: null,
      }).success
    ).toBe(true);

    const registerReq: ElevenLabsRegisterTwilioCallRequest = {
      agent_id: "apicity-route-test-agent",
      from_number: "+15005550006",
      to_number: "+15005550006",
      direction: "inbound",
      conversation_initiation_client_data: {
        dynamic_variables: {
          source: "apicity",
        },
      },
    };
    expect(
      provider.v1.convai.twilio.registerCall.schema.safeParse(registerReq)
        .success
    ).toBe(true);

    const exotelReq: ElevenLabsExotelOutboundCallRequest = {
      agent_id: "apicity-route-test-agent",
      agent_phone_number_id: "apicity-route-test-phone",
      to_number: "+15005550006",
      telephony_call_config: {
        ringing_timeout_secs: 30,
      },
    };
    expect(
      provider.v1.convai.exotel.outboundCall.schema.safeParse(exotelReq).success
    ).toBe(true);

    const whatsAppCallReq: ElevenLabsWhatsAppOutboundCallRequest = {
      whatsapp_phone_number_id: "apicity-route-test-whatsapp-phone",
      whatsapp_user_id: "15555550123",
      whatsapp_call_permission_request_template_name: "apicity_call_permission",
      whatsapp_call_permission_request_template_language_code: "en_US",
      agent_id: "apicity-route-test-agent",
    };
    expect(
      provider.v1.convai.whatsapp.outboundCall.schema.safeParse(whatsAppCallReq)
        .success
    ).toBe(true);

    const whatsAppMessageReq: ElevenLabsWhatsAppOutboundMessageRequest = {
      whatsapp_phone_number_id: "apicity-route-test-whatsapp-phone",
      whatsapp_user_id: "15555550123",
      template_name: "apicity_template",
      template_language_code: "en_US",
      template_params: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: "hello",
            },
          ],
        },
      ],
      agent_id: "apicity-route-test-agent",
    };
    expect(
      provider.v1.convai.whatsapp.outboundMessage.schema.safeParse(
        whatsAppMessageReq
      ).success
    ).toBe(true);

    expect(
      provider.v1.convai.whatsappAccounts.list.schema.safeParse({
        agent_id: null,
      }).success
    ).toBe(true);
    const updateAccountReq: ElevenLabsUpdateWhatsAppAccountRequest = {
      assigned_agent_id: null,
      enable_messaging: true,
      enable_audio_message_response: false,
    };
    expect(
      provider.v1.convai.whatsappAccounts.update.schema.safeParse(
        updateAccountReq
      ).success
    ).toBe(true);

    await expect(
      provider.v1.convai.phoneNumbers.sipMessages("apicity-route-test-phone", {
        page_size: 1,
      })
    ).rejects.toBeInstanceOf(ElevenLabsError);

    try {
      const twiml = await provider.v1.convai.twilio.registerCall(registerReq);
      expect(typeof twiml).toBe("string");
      expect(twiml.length).toBeGreaterThan(0);
    } catch (error) {
      expect(error).toBeInstanceOf(ElevenLabsError);
    }

    await expect(
      provider.v1.convai.exotel.outboundCall(exotelReq)
    ).rejects.toBeInstanceOf(ElevenLabsError);
    await expect(
      provider.v1.convai.whatsapp.outboundCall(whatsAppCallReq)
    ).rejects.toBeInstanceOf(ElevenLabsError);
    await expect(
      provider.v1.convai.whatsapp.outboundMessage(whatsAppMessageReq)
    ).rejects.toBeInstanceOf(ElevenLabsError);

    const accounts = await provider.v1.convai.whatsappAccounts.list({
      agent_id: null,
    });
    expect(Array.isArray(accounts.items)).toBe(true);

    await expect(
      provider.v1.convai.whatsappAccounts.get(
        "apicity-route-test-whatsapp-phone"
      )
    ).rejects.toBeInstanceOf(ElevenLabsError);
    await expect(
      provider.v1.convai.whatsappAccounts.update(
        "apicity-route-test-whatsapp-phone",
        updateAccountReq
      )
    ).rejects.toBeInstanceOf(ElevenLabsError);
    await expect(
      provider.v1.convai.whatsappAccounts.delete(
        "apicity-route-test-whatsapp-phone"
      )
    ).rejects.toBeInstanceOf(ElevenLabsError);
  });
});
