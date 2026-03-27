import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";
import type {
  OpenAiResponseOutputMessage,
  OpenAiResponseFunctionCallItem,
  OpenAiResponseOutputText,
} from "@nakedapi/openai";

describe("openai responses integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a response with string input", async () => {
    ctx = setupPolly("openai/responses-hello");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: "Say hello in one sentence.",
      temperature: 0,
      max_output_tokens: 100,
    });
    expect(result.id).toBeTruthy();
    expect(result.object).toBe("response");
    expect(result.status).toBe("completed");
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.output[0].type).toBe("message");
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });

  it("should create a response with instructions", async () => {
    ctx = setupPolly("openai/responses-instructions");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: "What is 2 + 2?",
      instructions: "You are a math tutor. Always show your work step by step.",
      temperature: 0,
      max_output_tokens: 200,
    });
    expect(result.id).toBeTruthy();
    expect(result.status).toBe("completed");
    expect(result.instructions).toBe(
      "You are a math tutor. Always show your work step by step."
    );
    const message = result.output[0] as OpenAiResponseOutputMessage;
    expect(message.type).toBe("message");
    expect(message.content.length).toBeGreaterThan(0);
    const text = message.content[0] as OpenAiResponseOutputText;
    expect(text.type).toBe("output_text");
    expect(text.text).toBeTruthy();
  });

  it("should create a response with structured output (JSON schema)", async () => {
    ctx = setupPolly("openai/responses-structured");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: "Extract: The capital of France is Paris.",
      temperature: 0,
      max_output_tokens: 200,
      text: {
        format: {
          type: "json_schema",
          name: "capital_info",
          strict: true,
          schema: {
            type: "object",
            properties: {
              country: { type: "string" },
              capital: { type: "string" },
            },
            required: ["country", "capital"],
            additionalProperties: false,
          },
        },
      },
    });
    expect(result.id).toBeTruthy();
    expect(result.status).toBe("completed");
    const message = result.output[0] as OpenAiResponseOutputMessage;
    const text = message.content[0] as OpenAiResponseOutputText;
    const parsed = JSON.parse(text.text) as {
      country: string;
      capital: string;
    };
    expect(parsed.country).toBe("France");
    expect(parsed.capital).toBe("Paris");
  });

  it("should handle function calling round-trip", async () => {
    ctx = setupPolly("openai/responses-function-call");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    // Step 1: Send a request that triggers a function call
    const step1 = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: "What is the weather in San Francisco?",
      temperature: 0,
      tools: [
        {
          type: "function",
          name: "get_weather",
          description: "Get current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "City name" },
            },
            required: ["location"],
          },
          strict: true,
        },
      ],
      tool_choice: "required",
    });

    expect(step1.status).toBe("completed");
    const fnCall = step1.output.find(
      (item) => item.type === "function_call"
    ) as OpenAiResponseFunctionCallItem;
    expect(fnCall).toBeTruthy();
    expect(fnCall.name).toBe("get_weather");
    const args = JSON.parse(fnCall.arguments) as { location: string };
    expect(args.location).toBeTruthy();

    // Step 2: Send the function output back
    const step2 = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: [
        { role: "user", content: "What is the weather in San Francisco?" },
        {
          type: "function_call_output",
          call_id: fnCall.call_id,
          output: JSON.stringify({ temperature: 62, condition: "foggy" }),
        },
      ],
      temperature: 0,
      tools: [
        {
          type: "function",
          name: "get_weather",
          description: "Get current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "City name" },
            },
            required: ["location"],
          },
          strict: true,
        },
      ],
    });

    expect(step2.status).toBe("completed");
    const finalMsg = step2.output.find(
      (item) => item.type === "message"
    ) as OpenAiResponseOutputMessage;
    expect(finalMsg).toBeTruthy();
    const finalText = finalMsg.content[0] as OpenAiResponseOutputText;
    expect(finalText.text.toLowerCase()).toMatch(/san francisco|foggy|62/);
  });

  it("should create a response with web search tool", async () => {
    ctx = setupPolly("openai/responses-web-search");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: "What is the current population of Tokyo?",
      temperature: 0,
      tools: [
        {
          type: "web_search_preview",
          search_context_size: "low",
        },
      ],
    });
    expect(result.id).toBeTruthy();
    expect(result.status).toBe("completed");
    // Should have web_search_call and message items in output
    const hasWebSearch = result.output.some(
      (item) => item.type === "web_search_call"
    );
    const hasMessage = result.output.some((item) => item.type === "message");
    expect(hasWebSearch).toBe(true);
    expect(hasMessage).toBe(true);
    // The message should contain annotations (citations)
    const message = result.output.find(
      (item) => item.type === "message"
    ) as OpenAiResponseOutputMessage;
    const text = message.content[0] as OpenAiResponseOutputText;
    expect(text.text).toBeTruthy();
    expect(text.annotations).toBeDefined();
    expect(text.annotations!.length).toBeGreaterThan(0);
  });

  it("should create a response with reasoning config", async () => {
    ctx = setupPolly("openai/responses-reasoning");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      timeout: 60000,
    });
    const result = await provider.v1.responses({
      model: "o4-mini",
      input: "How many r's are in the word strawberry?",
      reasoning: {
        effort: "low",
        summary: "concise",
      },
      max_output_tokens: 500,
    });
    expect(result.id).toBeTruthy();
    expect(result.status).toBe("completed");
    expect(result.reasoning).toBeDefined();
    const message = result.output[0] as OpenAiResponseOutputMessage;
    const text = message.content[0] as OpenAiResponseOutputText;
    expect(text.text).toMatch(/3/);
    expect(result.usage?.output_tokens_details?.reasoning_tokens).toBeDefined();
  });

  it("should create a response with image input", async () => {
    ctx = setupPolly("openai/responses-image");
    const pngPath = resolve(__dirname, "../fixtures/red.png");
    const pngBuffer = readFileSync(pngPath);
    const base64 = pngBuffer.toString("base64");

    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/png;base64,${base64}`,
              detail: "low",
            },
            {
              type: "input_text",
              text: "What color is this image? Reply with just the color name.",
            },
          ],
        },
      ],
      temperature: 0,
      max_output_tokens: 50,
    });
    expect(result.id).toBeTruthy();
    expect(result.status).toBe("completed");
    const message = result.output[0] as OpenAiResponseOutputMessage;
    const text = message.content[0] as OpenAiResponseOutputText;
    expect(text.text.toLowerCase()).toMatch(/red/);
  });

  it("should support multi-turn with previous_response_id", async () => {
    ctx = setupPolly("openai/responses-multi-turn");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    // Turn 1: introduce a fact
    const turn1 = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: "My name is Alice and I live in Wonderland.",
      temperature: 0,
      max_output_tokens: 100,
      store: true,
    });
    expect(turn1.id).toBeTruthy();
    expect(turn1.status).toBe("completed");

    // Turn 2: reference previous context
    const turn2 = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: "What is my name and where do I live?",
      previous_response_id: turn1.id,
      temperature: 0,
      max_output_tokens: 100,
      store: true,
    });
    expect(turn2.status).toBe("completed");
    expect(turn2.previous_response_id).toBe(turn1.id);
    const message = turn2.output[0] as OpenAiResponseOutputMessage;
    const text = message.content[0] as OpenAiResponseOutputText;
    expect(text.text.toLowerCase()).toMatch(/alice/);
    expect(text.text.toLowerCase()).toMatch(/wonderland/);
  });

  it("should get a response by ID", async () => {
    ctx = setupPolly("openai/responses-get");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    // Create a stored response
    const created = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: "Say the word 'pineapple' and nothing else.",
      temperature: 0,
      max_output_tokens: 50,
      store: true,
    });
    expect(created.id).toBeTruthy();
    expect(created.status).toBe("completed");

    // Retrieve it by ID
    const fetched = await provider.v1.responses.get(created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.object).toBe("response");
    expect(fetched.status).toBe("completed");
    expect(fetched.output.length).toBeGreaterThan(0);
    const message = fetched.output[0] as OpenAiResponseOutputMessage;
    const text = message.content[0] as OpenAiResponseOutputText;
    expect(text.text.toLowerCase()).toMatch(/pineapple/);
  });
});
