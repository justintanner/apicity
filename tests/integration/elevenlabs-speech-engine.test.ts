import { describe, it, expect } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsCreateSpeechEngineRequest,
} from "@apicity/elevenlabs";

interface FetchCall {
  url: string;
  init?: RequestInit;
}

const SPEECH_ENGINE_ID = "seng_3701k3ttaq12ewp8b7qv5rfyszkz";

function inputUrl(input: string | URL | Request): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function speechEngineResponse() {
  return {
    speech_engine_id: SPEECH_ENGINE_ID,
    name: "Apicity Speech Engine route test",
    speech_engine: {
      ws_url: "wss://example.com/transcript",
      request_headers: {
        authorization: { variable_name: "transcript_auth" },
      },
    },
    asr: {},
    tts: {},
    turn: {},
    conversation: {},
    privacy: {},
    call_limits: {},
    language: "en",
    tags: ["apicity"],
    overrides: {},
    metadata: {},
  };
}

function requestBody(init: RequestInit | undefined): Record<string, unknown> {
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
}

describe("elevenlabs v1.speechEngine", () => {
  it("routes every speech engine endpoint without replaying auth failures", async () => {
    const calls: FetchCall[] = [];
    const provider = createElevenLabs({
      apiKey: "elevenlabs-test-key",
      fetch: async (input, init) => {
        const url = inputUrl(input);
        const pathname = new URL(url).pathname;
        calls.push({ url, init });

        if (pathname === "/v1/speech-engine" && init?.method === "GET") {
          return jsonResponse({
            speech_engines: [
              {
                speech_engine_id: SPEECH_ENGINE_ID,
                name: "Apicity Speech Engine route test",
                created_at_unix_secs: 1_788_000_000,
                tags: ["apicity"],
                access_info: { is_creator: true, creator_name: "Apicity" },
              },
            ],
            has_more: false,
          });
        }

        if (pathname === "/v1/speech-engine" && init?.method === "POST") {
          return jsonResponse(speechEngineResponse());
        }

        if (pathname === `/v1/speech-engine/${SPEECH_ENGINE_ID}`) {
          if (init?.method === "DELETE")
            return new Response(null, { status: 204 });
          return jsonResponse(speechEngineResponse());
        }

        return jsonResponse({ detail: "unexpected request" }, 500);
      },
    });
    const createRequest: ElevenLabsCreateSpeechEngineRequest = {
      name: "Apicity Speech Engine route test",
      speech_engine: {
        ws_url: "wss://example.com/transcript",
        request_headers: {
          authorization: { variable_name: "transcript_auth" },
        },
      },
      language: "en",
      tags: ["apicity"],
    };

    expect(provider.get.v1.speechEngine.list).toBe(
      provider.v1.speechEngine.list
    );
    expect(provider.post.v1.speechEngine.create).toBe(
      provider.v1.speechEngine.create
    );
    expect(provider.get.v1.speechEngine.get).toBe(provider.v1.speechEngine.get);
    expect(provider.patch.v1.speechEngine.update).toBe(
      provider.v1.speechEngine.update
    );
    expect(provider.delete.v1.speechEngine.delete).toBe(
      provider.v1.speechEngine.delete
    );
    expect(
      provider.v1.speechEngine.create.schema.safeParse(createRequest).success
    ).toBe(true);
    expect(
      provider.v1.speechEngine.update.schema.safeParse({ name: "Updated" })
        .success
    ).toBe(true);

    await provider.v1.speechEngine.list({
      page_size: 1,
      search: "apicity",
      sort_direction: "desc",
      sort_by: "created_at",
    });
    await provider.v1.speechEngine.create(createRequest);
    await provider.v1.speechEngine.get(SPEECH_ENGINE_ID);
    await provider.v1.speechEngine.update(SPEECH_ENGINE_ID, {
      name: "Updated Speech Engine",
    });
    await provider.v1.speechEngine.delete(SPEECH_ENGINE_ID);

    expect(calls.map((call) => new URL(call.url).pathname)).toEqual([
      "/v1/speech-engine",
      "/v1/speech-engine",
      `/v1/speech-engine/${SPEECH_ENGINE_ID}`,
      `/v1/speech-engine/${SPEECH_ENGINE_ID}`,
      `/v1/speech-engine/${SPEECH_ENGINE_ID}`,
    ]);
    expect(calls.map((call) => call.init?.method)).toEqual([
      "GET",
      "POST",
      "GET",
      "PATCH",
      "DELETE",
    ]);
    expect(
      calls.every(
        (call) =>
          new Headers(call.init?.headers).get("xi-api-key") ===
          "elevenlabs-test-key"
      )
    ).toBe(true);

    const listUrl = new URL(calls[0].url);
    expect(listUrl.searchParams.get("page_size")).toBe("1");
    expect(listUrl.searchParams.get("search")).toBe("apicity");
    expect(listUrl.searchParams.get("sort_direction")).toBe("desc");
    expect(listUrl.searchParams.get("sort_by")).toBe("created_at");
    expect(requestBody(calls[1].init)).toMatchObject(createRequest);
    expect(requestBody(calls[3].init)).toEqual({
      name: "Updated Speech Engine",
    });
    expect(calls[4].init?.body).toBeUndefined();
  });
});
