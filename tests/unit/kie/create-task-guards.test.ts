import { describe, expect, it } from "vitest";
import type { z } from "zod";

import { KIE_MEDIA_MODELS } from "@apicity/kie/zod";
import { CREATE_TASK_GUARDS } from "../../../packages/provider/kie/src/kie";

// This file is the runtime half of a compile-pin/runtime-pin pair: the pin in
// kie.ts (`EveryKieMediaModelIsDecided`) fires strictly earlier, at tsc time.
// The pair is deliberate, and all three reasons for it are load-bearing:
//
// 1. Message quality. `Type '"…"' does not satisfy the constraint 'true'` names
//    the id but not the fix. The assertions below say what to do about it.
// 2. Invariants the types cannot see. A duplicate row in CREATE_TASK_GUARDS is
//    legal to the compiler — the `Exclude` still empties — and `.find()`
//    silently uses whichever copy comes first, so a second row pairing that id
//    with a different schema never runs and never fails.
// 3. Coverage messages in general. Measured: 1 unguarded model → tsc names the
//    id verbatim; ≥ 2 unguarded → `Type 'UndecidedKieMediaModel' does not
//    satisfy the constraint 'true'`, the alias name, elaborated with exactly
//    one representative id and never the rest. The compile pin is the earlier,
//    coarser half; this test is the primary mechanism for naming the offending
//    ids, because it enumerates every one of them.
//
// The repo already uses this same pairing for KieMediaModel itself
// (zod.ts's catalogue pin ↔ tests/unit/kie-zod.test.ts).
//
// Scope: registry shape only. Behaviour-level guard coverage — that a bad
// payload actually throws — lives across tests/unit/kie-pixverse-v6.test.ts
// (whose `describe.each(GUARD_MODELS)` table drives four pixverse-v6 ids, with
// `pixverse-v6/text-to-video` covered by its own describe block above it),
// tests/unit/kie-request.test.ts (`grok-imagine/image-to-video`,
// `gemini-omni-video`) and tests/unit/kie-seedance-2-mini.test.ts — the same
// split tests/unit/kie-model-input-schemas.test.ts already uses. That set is
// deliberately a sample, not one case per row: the rows below are checked for
// shape here and for correct pairing by the schema walk further down.

const guarded = CREATE_TASK_GUARDS.map(([model]) => model as string);

// Every kie media request schema pins its own model id with a z.literal, so the
// schema can be asked which model it is for rather than taken on trust from the
// row it was written into. `as unknown as` is load-bearing: a row's static
// schema type is the union of the concrete schema types, and the z.ZodType the
// table is declared against has no `.shape` at all.
//
// zod 4 keeps .refine()/.superRefine() rules on the same ZodObject rather than
// wrapping it, so `.shape.model.value` resolves on refinement-carrying schemas
// too — which is why this can walk the table rather than special-case it.
type ModelPinned = z.ZodObject<{ model: z.ZodLiteral<string> }>;

describe("CREATE_TASK_GUARDS membership rule", () => {
  // The compile pin in kie.ts fires first and names the id; this is the
  // readable half of the pair, and the only half that says what to do about it.
  it("decides every listed media model", () => {
    const guardedIds = new Set(guarded);
    const undecided = KIE_MEDIA_MODELS.filter((id) => !guardedIds.has(id));
    expect(
      undecided,
      `These kie media models have no CREATE_TASK_GUARDS row: ` +
        `${undecided.join(", ")}. Add one — the model id paired with the ` +
        `*RequestSchema that z.literal-pins that same id — in ` +
        `packages/provider/kie/src/kie.ts, in KIE_MEDIA_MODELS order. There ` +
        `is no exemption list to add it to instead; if this model genuinely ` +
        `cannot be validated before transport, reintroducing that list is a ` +
        `reviewed change, not a blank to fill in.`
    ).toEqual([]);
  });

  // Legal to the compiler — a duplicate id does not stop the `Exclude` in
  // `UndecidedKieMediaModel` from emptying — and silent at runtime: `.find()`
  // returns the first row, so a second row pairing that id with a different
  // schema never runs. This replaces the old "never both guards and exempts
  // the same model", whose two-list invariant died with the exemption table;
  // the hazard it protected against did not.
  it("never lists the same model twice", () => {
    const duplicates = guarded.filter(
      (id, index) => guarded.indexOf(id) !== index
    );
    expect(
      duplicates,
      `Listed more than once in CREATE_TASK_GUARDS: ` +
        `${duplicates.join(", ")}. Only the first row of a duplicated id is ` +
        `ever reached by .find(); the rest validate nothing.`
    ).toEqual([]);
  });

  // Not a count for its own sake — it makes any change to the guarded set show
  // up as a deliberate edit to this list.
  //
  // The list is the point, not the number. It now holds all 52 ids of
  // KIE_MEDIA_MODELS, which is what makes it worth spelling out rather than
  // asserting `guarded.sort()` equals `[...KIE_MEDIA_MODELS].sort()`: that
  // form is self-referential — it passes whatever the catalogue says, so a row
  // silently dropped alongside its catalogue entry stays green. Written out,
  // removing a model takes two deliberate edits and shows both in the diff.
  it("guards exactly the models pinned in this list", () => {
    expect([...guarded].sort()).toEqual(
      [
        "kling-3.0/video",
        "kling-3.0/motion-control",
        "kling/v3-turbo-image-to-video",
        "kling/v3-turbo-text-to-video",
        "grok-imagine/text-to-image",
        "grok-imagine/image-to-image",
        "grok-imagine/text-to-video",
        "grok-imagine/image-to-video",
        "grok-imagine-video-1-5-preview",
        "nano-banana-pro",
        "nano-banana-2",
        "gpt-image/1.5-image-to-image",
        "gpt-image-2-image-to-image",
        "gpt-image-2-text-to-image",
        "seedream/5-lite-image-to-image",
        "seedream/5-lite-text-to-image",
        "seedream/5-pro-image-to-image",
        "seedream/5-pro-text-to-image",
        "grok-imagine/extend",
        "grok-imagine/upscale",
        "qwen2/text-to-image",
        "qwen2/image-edit",
        "bytedance/seedance-2-fast",
        "bytedance/seedance-2",
        "bytedance/seedance-2-mini",
        "wan/2-7-image-to-video",
        "wan/2-7-text-to-video",
        "wan/2-7-r2v",
        "wan/2-7-videoedit",
        "wan/2-7-image",
        "wan/2-7-image-pro",
        "happyhorse/text-to-video",
        "happyhorse/image-to-video",
        "happyhorse/reference-to-video",
        "happyhorse/video-edit",
        "happyhorse-1-1/text-to-video",
        "happyhorse-1-1/image-to-video",
        "happyhorse-1-1/reference-to-video",
        "omnihuman-1-5",
        "volcengine/video-to-video-lip-sync",
        "gemini-omni-video",
        "elevenlabs/audio-isolation",
        "elevenlabs/text-to-dialogue-v3",
        "elevenlabs/text-to-speech-multilingual-v2",
        "elevenlabs/text-to-speech-turbo-2-5",
        "elevenlabs/sound-effect-v2",
        "sora-watermark-remover",
        "pixverse-v6/text-to-video",
        "pixverse-v6/image-to-video",
        "pixverse-v6/transition",
        "pixverse-v6/extend",
        "pixverse-v6/reference-to-video",
      ].sort()
    );
  });
});

// Membership says each model is decided; these say each decided row says what
// it means to say. Both are invisible to the compile pin, which only ever sees
// the set of ids.
describe("CREATE_TASK_GUARDS rows", () => {
  // The one assertion that survives 44 hand-written rows being added by hand.
  // A row pairing `seedream/5-lite-text-to-image` with
  // `SeedreamProTextToImageRequestSchema` type-checks (both sides are valid
  // members of their own type), passes every other test in this file, and
  // silently validates the wrong contract — four seedream names differing by
  // one word each are one slip apart. Reading the id back off the schema is the
  // only check here that a reviewer's eye is not the last line of defence.
  it("pairs each guarded model with the schema that pins its id", () => {
    for (const [model, schema] of CREATE_TASK_GUARDS) {
      const pinned = (schema as unknown as ModelPinned).shape.model.value;
      expect(
        pinned,
        `row ${model} is paired with a schema pinning ${pinned}`
      ).toBe(model);
    }
  });

  // Catalogue order is how a reader checks the table against KIE_MEDIA_MODELS
  // at a glance, and how each slice knows where to insert. Asserted rather than
  // left to convention so the final table diffs cleanly against the catalogue.
  it("lists its rows in KIE_MEDIA_MODELS order", () => {
    const catalogueOrder = KIE_MEDIA_MODELS.filter((id) =>
      guarded.includes(id)
    );
    expect(
      guarded,
      `CREATE_TASK_GUARDS rows are out of KIE_MEDIA_MODELS order; expected ` +
        `${catalogueOrder.join(", ")}`
    ).toEqual(catalogueOrder);
  });
});
