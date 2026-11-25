import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  OpenAiResponseAccessPrograms,
  OpenAiResponseImageOptions,
  OpenAiResponseInputTransformation,
  OpenAiResponseModeration,
  OpenAiResponseOutputItem,
  OpenAiResponseOutputMessage,
  OpenAiResponseReasoningItem,
  OpenAiResponseResponse,
  OpenAiResponseResponseReasoning,
  OpenAiResponseToolUsage,
  OpenAiTranscribeResponse,
  OpenAiTranscriptionLanguage,
} from "@apicity/openai";

// HAR learning pass 2 (ac-11lqw3) found these keys on the 210 v1.responses
// calls of the 2026-11-25 videobook capture corpus (204 gpt-5.6-sol, 6
// gpt-6-astra; image on 145, input_transformations on 86, the rest on all
// 210), and the closed OpenAiResponseResponse hid them. Shapes follow the API
// reference read 2026-11-25 (ac-14k4jm). The literal below uses the values
// the captures carried; its text is invented.
describe("openai v1.responses response fields", () => {
  it("types the documented top-level fields", () => {
    expectTypeOf<OpenAiResponseResponse["access_programs"]>().toEqualTypeOf<
      OpenAiResponseAccessPrograms | null | undefined
    >();
    expectTypeOf<OpenAiResponseAccessPrograms["cyber"]>().toEqualTypeOf<
      "standard" | "daybreak_blue" | "daybreak_red"
    >();
    expectTypeOf<OpenAiResponseResponse["image"]>().toEqualTypeOf<
      OpenAiResponseImageOptions | undefined
    >();
    expectTypeOf<
      OpenAiResponseResponse["input_transformations"]
    >().toEqualTypeOf<OpenAiResponseInputTransformation[] | undefined>();
    expectTypeOf<OpenAiResponseResponse["moderation"]>().toEqualTypeOf<
      OpenAiResponseModeration | null | undefined
    >();
    expectTypeOf<OpenAiResponseResponse["tool_usage"]>().toEqualTypeOf<
      OpenAiResponseToolUsage | undefined
    >();
    expectTypeOf<
      OpenAiResponseResponse["prompt_cache_retention"]
    >().toEqualTypeOf<"in_memory" | "24h" | null | undefined>();
  });

  it("types the effective reasoning context and mode", () => {
    expectTypeOf<OpenAiResponseResponse["reasoning"]>().toEqualTypeOf<
      OpenAiResponseResponseReasoning | null | undefined
    >();
    expectTypeOf<OpenAiResponseResponseReasoning["context"]>().toEqualTypeOf<
      "auto" | "current_turn" | "all_turns" | null | undefined
    >();
    expectTypeOf<"pro">().toExtend<
      NonNullable<OpenAiResponseResponseReasoning["mode"]>
    >();
  });

  it("types the message phase", () => {
    expectTypeOf<OpenAiResponseOutputMessage["phase"]>().toEqualTypeOf<
      "commentary" | "final_answer" | null | undefined
    >();
  });

  it("accepts a response shaped like the captured ones", () => {
    const captured: OpenAiResponseResponse = {
      id: "resp_1",
      object: "response",
      created_at: 1,
      status: "completed",
      model: "gpt-5.6-sol",
      output: [
        {
          type: "message",
          id: "msg_1",
          role: "assistant",
          status: "completed",
          phase: "final_answer",
          content: [{ type: "output_text", text: "t", annotations: [] }],
        },
      ],
      reasoning: { effort: "medium", context: "all_turns", mode: "standard" },
      access_programs: null,
      image: { context_compression: "disabled" },
      input_transformations: [],
      moderation: null,
      tool_usage: {
        image_gen: {
          input_tokens: 0,
          input_tokens_details: { image_tokens: 0, text_tokens: 0 },
          output_tokens: 0,
          output_tokens_details: { image_tokens: 0, text_tokens: 0 },
          total_tokens: 0,
        },
        web_search: { num_requests: 0 },
      },
      prompt_cache_retention: "24h",
    };
    expect(captured.tool_usage?.web_search.num_requests).toBe(0);
    expect(captured.reasoning?.context).toBe("all_turns");
  });
});

// Reasoning models return `reasoning` items in `output`: the committed
// o4-mini recording holds one, and 205 of the 210 v1.responses calls in
// the 2026-11-25 videobook capture corpus held 230 (204 of 204 on
// gpt-5.6-sol), each with `encrypted_content` and none with `status`.
describe("openai v1.responses reasoning output items", () => {
  it("pins the modelled item kinds", () => {
    // A new member is a Breaking change: update this pin with it.
    expectTypeOf<OpenAiResponseOutputItem["type"]>().toEqualTypeOf<
      | "message"
      | "function_call"
      | "web_search_call"
      | "file_search_call"
      | "reasoning"
    >();
    expectTypeOf<
      Extract<OpenAiResponseOutputItem, { type: "reasoning" }>
    >().toEqualTypeOf<OpenAiResponseReasoningItem>();
  });

  it("types the reasoning item per the API reference", () => {
    expectTypeOf<
      OpenAiResponseReasoningItem["encrypted_content"]
    >().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<OpenAiResponseReasoningItem["status"]>().toEqualTypeOf<
      "in_progress" | "completed" | "incomplete" | undefined
    >();
    expectTypeOf<
      OpenAiResponseReasoningItem["summary"][number]
    >().toEqualTypeOf<{ type: "summary_text"; text: string }>();
    expectTypeOf<
      NonNullable<OpenAiResponseReasoningItem["content"]>[number]
    >().toEqualTypeOf<{ type: "reasoning_text"; text: string }>();
  });

  it("makes status optional on an item that is not narrowed", () => {
    expectTypeOf<OpenAiResponseOutputItem["status"]>().toEqualTypeOf<
      "in_progress" | "completed" | "incomplete" | undefined
    >();
    expectTypeOf<OpenAiResponseOutputItem["id"]>().toEqualTypeOf<string>();
  });

  it("narrows an output item to the reasoning item", () => {
    // The key set every captured reasoning item carried; the text is
    // invented.
    const captured: OpenAiResponseResponse["output"] = [
      {
        type: "reasoning",
        id: "rs_1",
        summary: [],
        content: [],
        encrypted_content: "opaque",
      },
      {
        type: "message",
        id: "msg_1",
        role: "assistant",
        status: "completed",
        phase: "final_answer",
        content: [{ type: "output_text", text: "t", annotations: [] }],
      },
    ];
    const blobs: string[] = [];
    for (const item of captured) {
      if (item.type === "reasoning" && item.encrypted_content) {
        expectTypeOf(item).toEqualTypeOf<OpenAiResponseReasoningItem>();
        blobs.push(item.encrypted_content);
      }
    }
    expect(blobs).toEqual(["opaque"]);
  });
});

describe("openai transcription languages", () => {
  it("types the detected languages gpt-transcribe returns", () => {
    expectTypeOf<OpenAiTranscribeResponse["languages"]>().toEqualTypeOf<
      OpenAiTranscriptionLanguage[] | undefined
    >();
    // All 12 gpt-transcribe captures returned an empty array: no language
    // was reliably detected.
    const captured: OpenAiTranscribeResponse = { text: "t", languages: [] };
    const detected: OpenAiTranscribeResponse = {
      text: "t",
      languages: [{ code: "en" }],
    };
    expect(captured.languages).toEqual([]);
    expect(detected.languages?.[0]?.code).toBe("en");
  });
});
