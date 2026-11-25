import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";
import type {
  OpenAiResponseOutputMessage,
  OpenAiResponseOutputText,
  OpenAiResponseReasoningItem,
  OpenAiResponseRequest,
} from "@apicity/openai";
import { OpenAiResponseRequestSchema } from "@apicity/openai/zod";

describe("openai responses integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a response with string input", async () => {
    ctx = setupPolly("openai/responses-hello");
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.v1.responses({
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
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.v1.responses({
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
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.v1.responses({
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

  it("should create a response with web search tool", async () => {
    ctx = setupPolly("openai/responses-web-search");
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.v1.responses({
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
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      timeout: 60000,
    });
    const result = await provider.post.v1.responses({
      model: "o4-mini",
      input: "How many r's are in the word strawberry?",
      reasoning: {
        effort: "low",
        summary: "detailed",
      },
      max_output_tokens: 500,
    });
    expect(result.id).toBeTruthy();
    expect(result.status).toBe("completed");
    // `reasoning` is present in the recorded response and declared on the
    // OpenAiResponseResponse type.
    expect(result.reasoning).toBeDefined();
    const message = result.output.find(
      (item) => item.type === "message"
    ) as OpenAiResponseOutputMessage;
    const text = message.content[0] as OpenAiResponseOutputText;
    expect(text.text).toMatch(/3|three/i);
    // The recorded o4-mini response leads with a reasoning item, which
    // carries neither `status` nor `encrypted_content`.
    const reasoning = result.output[0];
    expect(reasoning.type).toBe("reasoning");
    if (reasoning.type !== "reasoning") throw new Error("not reasoning");
    expect(reasoning.id).toMatch(/^rs_/);
    expect(reasoning.summary).toEqual([]);
    expect(reasoning.status).toBeUndefined();
    expect(reasoning.encrypted_content).toBeUndefined();
    expect(result.usage?.output_tokens_details?.reasoning_tokens).toBeDefined();
  });

  it("should round-trip a reasoning item with encrypted_content in stateless multi-turn input", async () => {
    ctx = setupPolly("openai/responses-reasoning-round-trip");
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      timeout: 60000,
    });

    const turn1Prompt =
      "A crate holds 7 rows of 6 apples. If 13 apples are removed, how many remain? Reply with just the number.";
    const turn1 = await provider.post.v1.responses({
      model: "gpt-5.6-luna",
      input: [{ role: "user", content: turn1Prompt }],
      reasoning: { effort: "medium" },
      store: false,
      include: ["reasoning.encrypted_content"],
      max_output_tokens: 500,
    });

    expect(turn1.id).toBeTruthy();
    expect(turn1.status).toBe("completed");

    const reasoningItems: OpenAiResponseReasoningItem[] = [];
    let turn1Text = "";
    for (const item of turn1.output) {
      if (item.type === "reasoning") {
        reasoningItems.push(item);
      } else if (item.type === "message") {
        for (const part of item.content) {
          if (part.type === "output_text") {
            turn1Text += part.text;
          }
        }
      }
    }

    expect(reasoningItems.length).toBeGreaterThan(0);
    const firstReasoning = reasoningItems[0]!;
    expect(firstReasoning.id).toMatch(/^rs_/);
    expect(typeof firstReasoning.encrypted_content).toBe("string");
    expect(firstReasoning.encrypted_content!.length).toBeGreaterThan(0);
    expect(turn1Text.length).toBeGreaterThan(0);

    // Send the Turn 1 reasoning item(s) back in Turn 2 input with no cast.
    const turn2Request: OpenAiResponseRequest = {
      model: "gpt-5.6-luna",
      input: [
        { role: "user", content: turn1Prompt },
        ...reasoningItems,
        { role: "assistant", content: turn1Text },
        {
          role: "user",
          content:
            "If 11 more apples are added to the remaining ones, how many are in the crate now? Reply with just the number.",
        },
      ],
      reasoning: { effort: "medium" },
      store: false,
      include: ["reasoning.encrypted_content"],
      max_output_tokens: 500,
    };

    const turn2 = await provider.post.v1.responses(turn2Request);

    expect(OpenAiResponseRequestSchema.safeParse(turn2Request).success).toBe(
      true
    );
    expect(turn1Text).toMatch(/\b29\b/);
    expect(turn2.id).toBeTruthy();
    expect(turn2.status).toBe("completed");
    expect(turn2.input_transformations).toEqual([]);

    let turn2Text = "";
    for (const item of turn2.output) {
      if (item.type === "message") {
        for (const part of item.content) {
          if (part.type === "output_text") {
            turn2Text += part.text;
          }
        }
      }
    }
    expect(turn2Text).toMatch(/\b40\b/);
  });

  it("should create a response with image input", async () => {
    ctx = setupPolly("openai/responses-image");
    const pngPath = resolve(__dirname, "../fixtures/red.png");
    const pngBuffer = readFileSync(pngPath);
    const base64 = pngBuffer.toString("base64");

    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.v1.responses({
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
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    // Turn 1: introduce a fact
    const turn1 = await provider.post.v1.responses({
      model: "gpt-4o-mini",
      input: "My name is Alice and I live in Wonderland.",
      temperature: 0,
      max_output_tokens: 100,
      store: true,
    });
    expect(turn1.id).toBeTruthy();
    expect(turn1.status).toBe("completed");

    // Turn 2: reference previous context
    const turn2 = await provider.post.v1.responses({
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
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    // Create a stored response
    const created = await provider.post.v1.responses({
      model: "gpt-4o-mini",
      input: "Say the word 'pineapple' and nothing else.",
      temperature: 0,
      max_output_tokens: 50,
      store: true,
    });
    expect(created.id).toBeTruthy();
    expect(created.status).toBe("completed");

    // Retrieve it by ID
    const fetched = await provider.get.v1.responses(created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.object).toBe("response");
    expect(fetched.status).toBe("completed");
    expect(fetched.output.length).toBeGreaterThan(0);
    const message = fetched.output[0] as OpenAiResponseOutputMessage;
    const text = message.content[0] as OpenAiResponseOutputText;
    expect(text.text.toLowerCase()).toMatch(/pineapple/);
  });
});
