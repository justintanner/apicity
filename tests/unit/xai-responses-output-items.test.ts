import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  XaiResponseOutputItem,
  XaiResponseReasoningItem,
  XaiResponseReasoningSummaryText,
  XaiResponseResponse,
} from "@apicity/xai";

// xAI Responses return `reasoning` items in `output`: the committed
// grok-4.6 recording leads with one, and the docs (read 2026-11-25) show the
// shape and the opt-in `encrypted_content` (ac-50xnm8, planned by
// ac-wrydrp beside OpenAI's ac-puf914).
describe("xai v1.responses reasoning output items", () => {
  it("pins the modelled item kinds", () => {
    // A new member is a Breaking change: update this pin with it.
    expectTypeOf<XaiResponseOutputItem["type"]>().toEqualTypeOf<
      | "message"
      | "function_call"
      | "web_search_call"
      | "file_search_call"
      | "reasoning"
    >();
    expectTypeOf<
      Extract<XaiResponseOutputItem, { type: "reasoning" }>
    >().toEqualTypeOf<XaiResponseReasoningItem>();
  });

  it("types the reasoning item per the docs and the recording", () => {
    expectTypeOf<XaiResponseReasoningItem["id"]>().toEqualTypeOf<string>();
    expectTypeOf<
      XaiResponseReasoningItem["summary"][number]
    >().toEqualTypeOf<XaiResponseReasoningSummaryText>();
    expectTypeOf<XaiResponseReasoningSummaryText>().toEqualTypeOf<{
      type: "summary_text";
      text: string;
    }>();
    expectTypeOf<XaiResponseReasoningItem["encrypted_content"]>().toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<XaiResponseReasoningItem["status"]>().toEqualTypeOf<
      "completed" | "in_progress" | "incomplete"
    >();
  });

  it("narrows an output item to the reasoning item", () => {
    // The shape the docs show with include: ["reasoning.encrypted_content"];
    // the text is invented.
    const output: XaiResponseResponse["output"] = [
      {
        type: "reasoning",
        id: "rs_1",
        status: "completed",
        summary: [{ type: "summary_text", text: "t" }],
        encrypted_content: "opaque",
      },
      {
        type: "message",
        id: "msg_1",
        role: "assistant",
        status: "completed",
        content: [{ type: "output_text", text: "4", annotations: [] }],
      },
    ];
    const blobs: string[] = [];
    for (const item of output) {
      if (item.type === "reasoning" && item.encrypted_content) {
        expectTypeOf(item).toEqualTypeOf<XaiResponseReasoningItem>();
        blobs.push(item.encrypted_content);
      }
    }
    expect(blobs).toEqual(["opaque"]);
  });
});
