import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks audio streaming transcriptions", () => {
  it("should expose streaming method with schema and validation", () => {
    const provider = fireworks({
      apiKey: "fw-test-key",
    });

    expect(provider.v1.audio.transcriptions.streaming).toBeDefined();
    expect(typeof provider.v1.audio.transcriptions.streaming).toBe("function");
    expect(provider.v1.audio.transcriptions.streaming.schema).toBeDefined();
    expect(
      typeof provider.v1.audio.transcriptions.streaming.schema.safeParse
    ).toBe("function");
    expect(
      typeof provider.v1.audio.transcriptions.streaming.schema.safeParse
    ).toBe("function");
  });

  it("should validate streaming options correctly", () => {
    const provider = fireworks({
      apiKey: "fw-test-key",
    });

    const valid = provider.v1.audio.transcriptions.streaming.schema.safeParse({
      language: "en",
      temperature: 0,
    });
    expect(valid.success).toBe(true);
    // errors checked via success;

    const invalid = provider.v1.audio.transcriptions.streaming.schema.safeParse(
      {
        temperature: "not-a-number",
      }
    );
    expect(invalid.success).toBe(false);
    expect(invalid.error?.issues.length).toBeGreaterThan(0);
  });

  it("should create a streaming session with expected API", () => {
    // Mock WebSocket to avoid real connection
    const mockSend = vi.fn();
    const mockAddEventListener = vi.fn();
    class MockWebSocket {
      send = mockSend;
      addEventListener = mockAddEventListener;
      constructor(
        public url: string,
        _protocols?: string | string[]
      ) {}
    }

    const provider = fireworks({
      apiKey: "fw-test-key",
      WebSocket: MockWebSocket as unknown as typeof globalThis.WebSocket,
    });

    const session = provider.v1.audio.transcriptions.streaming({
      language: "en",
      timestamp_granularities: ["word", "segment"],
    });

    expect(session).toBeDefined();
    expect(typeof session.send).toBe("function");
    expect(typeof session.clearState).toBe("function");
    expect(typeof session.trace).toBe("function");
    expect(typeof session.close).toBe("function");
    expect(typeof session[Symbol.asyncIterator]).toBe("function");
  });

  it("should construct WebSocket URL with query params", () => {
    let capturedUrl = "";
    class MockWebSocket {
      send = vi.fn();
      addEventListener = vi.fn();
      constructor(
        public url: string,
        _protocols?: string | string[]
      ) {
        capturedUrl = url;
      }
    }

    const provider = fireworks({
      apiKey: "fw-test-key",
      WebSocket: MockWebSocket as unknown as typeof globalThis.WebSocket,
    });

    provider.v1.audio.transcriptions.streaming({
      language: "en",
      prompt: "technical discussion",
      temperature: 0,
      timestamp_granularities: ["word", "segment"],
    });

    expect(capturedUrl).toContain(
      "wss://audio-streaming.api.fireworks.ai/v1/audio/transcriptions/streaming"
    );
    expect(capturedUrl).toContain("Authorization=fw-test-key");
    expect(capturedUrl).toContain("language=en");
    expect(capturedUrl).toContain("prompt=technical+discussion");
    expect(capturedUrl).toContain("temperature=0");
    expect(capturedUrl).toContain(
      "timestamp_granularities=" + encodeURIComponent("word,segment")
    );
  });

  it("should allow custom audioStreamingBaseURL", () => {
    let capturedUrl = "";
    class MockWebSocket {
      send = vi.fn();
      addEventListener = vi.fn();
      constructor(
        public url: string,
        _protocols?: string | string[]
      ) {
        capturedUrl = url;
      }
    }

    const provider = fireworks({
      apiKey: "fw-test-key",
      audioStreamingBaseURL: "wss://audio-streaming-v2.api.fireworks.ai",
      WebSocket: MockWebSocket as unknown as typeof globalThis.WebSocket,
    });

    provider.v1.audio.transcriptions.streaming({
      language: "en",
    });

    expect(capturedUrl).toContain(
      "wss://audio-streaming-v2.api.fireworks.ai/v1/audio/transcriptions/streaming"
    );
  });

  it("should allow per-session baseURL override", () => {
    let capturedUrl = "";
    class MockWebSocket {
      send = vi.fn();
      addEventListener = vi.fn();
      constructor(
        public url: string,
        _protocols?: string | string[]
      ) {
        capturedUrl = url;
      }
    }

    const provider = fireworks({
      apiKey: "fw-test-key",
      WebSocket: MockWebSocket as unknown as typeof globalThis.WebSocket,
    });

    provider.v1.audio.transcriptions.streaming({
      language: "en",
      baseURL: "wss://audio-streaming.us-virginia-1.direct.fireworks.ai",
    });

    expect(capturedUrl).toContain(
      "wss://audio-streaming.us-virginia-1.direct.fireworks.ai/v1/audio/transcriptions/streaming"
    );
  });

  it("should send binary audio data via session.send", () => {
    const mockSend = vi.fn();
    class MockWebSocket {
      send = mockSend;
      addEventListener = vi.fn();
      constructor(_url: string, _protocols?: string | string[]) {}
    }

    const provider = fireworks({
      apiKey: "fw-test-key",
      WebSocket: MockWebSocket as unknown as typeof globalThis.WebSocket,
    });

    const session = provider.v1.audio.transcriptions.streaming();
    const audioChunk = new Uint8Array([1, 2, 3, 4]);
    session.send(audioChunk);

    expect(mockSend).toHaveBeenCalledWith(audioChunk);
  });

  it("should send clearState event", () => {
    const mockSend = vi.fn();
    class MockWebSocket {
      send = mockSend;
      addEventListener = vi.fn();
      constructor(_url: string, _protocols?: string | string[]) {}
    }

    const provider = fireworks({
      apiKey: "fw-test-key",
      WebSocket: MockWebSocket as unknown as typeof globalThis.WebSocket,
    });

    const session = provider.v1.audio.transcriptions.streaming();
    session.clearState("reset-123");

    expect(mockSend).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(mockSend.mock.calls[0][0]);
    expect(parsed.object).toBe("stt.state.clear");
    expect(parsed.reset_id).toBe("reset-123");
    expect(parsed.event_id).toBeDefined();
  });

  it("should send trace event", () => {
    const mockSend = vi.fn();
    class MockWebSocket {
      send = mockSend;
      addEventListener = vi.fn();
      constructor(_url: string, _protocols?: string | string[]) {}
    }

    const provider = fireworks({
      apiKey: "fw-test-key",
      WebSocket: MockWebSocket as unknown as typeof globalThis.WebSocket,
    });

    const session = provider.v1.audio.transcriptions.streaming();
    session.trace("trace-456");

    expect(mockSend).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(mockSend.mock.calls[0][0]);
    expect(parsed.object).toBe("stt.input.trace");
    expect(parsed.trace_id).toBe("trace-456");
    expect(parsed.event_id).toBeDefined();
  });

  it("should send final checkpoint on close", () => {
    const mockSend = vi.fn();
    class MockWebSocket {
      send = mockSend;
      addEventListener = vi.fn();
      constructor(_url: string, _protocols?: string | string[]) {}
    }

    const provider = fireworks({
      apiKey: "fw-test-key",
      WebSocket: MockWebSocket as unknown as typeof globalThis.WebSocket,
    });

    const session = provider.v1.audio.transcriptions.streaming();
    session.close();

    expect(mockSend).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(mockSend.mock.calls[0][0]);
    expect(parsed.checkpoint_id).toBe("final");
  });

  it("should yield transcription messages via async iterator", async () => {
    type Listener = (event: { data: string }) => void;
    const listeners: Record<string, Listener[]> = {};

    class MockWebSocket {
      send = vi.fn();
      addEventListener(event: string, fn: Listener) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(fn);
      }
      constructor(_url: string, _protocols?: string | string[]) {}
    }

    const provider = fireworks({
      apiKey: "fw-test-key",
      WebSocket: MockWebSocket as unknown as typeof globalThis.WebSocket,
    });

    const session = provider.v1.audio.transcriptions.streaming({
      language: "en",
    });

    const transcriptionResult = {
      task: "transcribe",
      language: "en",
      text: "Hello world",
      segments: [{ id: 0, text: "Hello world", language: "en" }],
    };

    const checkpoint = { checkpoint_id: "final" };

    // Simulate server messages
    setTimeout(() => {
      for (const fn of listeners["message"] ?? []) {
        fn({ data: JSON.stringify(transcriptionResult) });
      }
      for (const fn of listeners["message"] ?? []) {
        fn({ data: JSON.stringify(checkpoint) });
      }
      for (const fn of listeners["close"] ?? []) {
        (fn as () => void)();
      }
    }, 10);

    const messages = [];
    for await (const msg of session) {
      messages.push(msg);
      if ("checkpoint_id" in msg && msg.checkpoint_id === "final") {
        break;
      }
    }

    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual(transcriptionResult);
    expect(messages[1]).toEqual(checkpoint);
  });
});
