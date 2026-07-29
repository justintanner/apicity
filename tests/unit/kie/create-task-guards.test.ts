import { describe, expect, it } from "vitest";
import type { z } from "zod";

import { KIE_MEDIA_MODELS } from "@apicity/kie/zod";
import {
  CREATE_TASK_GUARDS,
  CREATE_TASK_GUARD_EXEMPTIONS,
  GUARD_EXEMPTION_REASONS,
} from "../../../packages/provider/kie/src/kie";

// This file is the runtime half of a compile-pin/runtime-pin pair: the pin in
// kie.ts (`EveryKieMediaModelIsDecided`) fires strictly earlier, at tsc time.
// The pair is deliberate, and all three reasons for it are load-bearing:
//
// 1. Message quality. `Type '"…"' does not satisfy the constraint 'true'` names
//    the id but not the fix. The assertions below say what to do about it.
// 2. Invariants the types cannot see. A model in *both* lists is legal to the
//    compiler (the `Exclude` still empties), and so is an exemption whose
//    reason is `""`. Both are silent regressions of the "excluded only by an
//    explicit, reviewed entry" rule.
// 3. Coverage messages in general. Measured: 1 undecided model → tsc names the
//    id verbatim; ≥ 2 undecided → `Type 'UndecidedKieMediaModel' does not
//    satisfy the constraint 'true'`, the alias name, elaborated with exactly
//    one representative id and never the rest. The compile pin is the earlier,
//    coarser half; this test is the primary mechanism for naming the offending
//    ids, because it enumerates every one of them.
//
// The repo already uses this same pairing for KieMediaModel itself
// (zod.ts's catalogue pin ↔ tests/unit/kie-zod.test.ts).
//
// Scope: registry shape only. Behaviour-level guard coverage lives across
// tests/unit/kie-pixverse-v6.test.ts (whose `describe.each(GUARD_MODELS)` table
// drives 4 of the 8 guarded models, with `pixverse-v6/text-to-video` covered by
// its own describe block above it), tests/unit/kie-request.test.ts
// (`grok-imagine/image-to-video`, `gemini-omni-video`) and
// tests/unit/kie-seedance-2-mini.test.ts — the same split
// tests/unit/kie-model-input-schemas.test.ts already uses.

const guarded = CREATE_TASK_GUARDS.map(([model]) => model as string);
const exempt = Object.keys(CREATE_TASK_GUARD_EXEMPTIONS);

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
    const decided = new Set([...guarded, ...exempt]);
    const undecided = KIE_MEDIA_MODELS.filter((id) => !decided.has(id));
    expect(
      undecided,
      `These kie media models are in neither CREATE_TASK_GUARDS nor ` +
        `CREATE_TASK_GUARD_EXEMPTIONS: ${undecided.join(", ")}. Add a guard ` +
        `row (validates the payload before it leaves the process) or an ` +
        `exemption entry with a reason key (documents that it deliberately ` +
        `is not validated). Both are in packages/provider/kie/src/kie.ts.`
    ).toEqual([]);
  });

  // Legal to the compiler, meaningless at runtime: .find() would hit the guard
  // row and the exemption would be a lie.
  it("never both guards and exempts the same model", () => {
    const both = guarded.filter((id) => exempt.includes(id));
    expect(both, `Guarded AND exempted: ${both.join(", ")}`).toEqual([]);
  });

  // An exemption with an empty or placeholder reason is silence with extra
  // steps.
  //
  // Note: `Object.entries` narrows `key` to the reason-key union here, so the
  // lookup below is typed and non-optional — which makes a `toBeDefined()`
  // check on it dead code. The length assertion is the only live one; do not
  // add the other.
  it("gives every exemption a reason that says something", () => {
    for (const [, key] of Object.entries(CREATE_TASK_GUARD_EXEMPTIONS)) {
      const reason = GUARD_EXEMPTION_REASONS[key];
      expect(reason.trim().length, `reason ${key} is too thin`).toBeGreaterThan(
        80
      );
    }
  });

  // Keeps the reason vocabulary honest as models move between lists.
  it("uses every declared reason", () => {
    const used = new Set(Object.values(CREATE_TASK_GUARD_EXEMPTIONS));
    const dead = Object.keys(GUARD_EXEMPTION_REASONS).filter(
      (key) => !used.has(key as keyof typeof GUARD_EXEMPTION_REASONS)
    );
    expect(dead, `Unused exemption reasons: ${dead.join(", ")}`).toEqual([]);
  });

  // Not a count for its own sake — it makes any change to the guarded set show
  // up as a deliberate edit to this list.
  //
  // The list is the point, not the number: it grows by exactly one deliberate
  // edit per slice of the guard pass tracked by ac-bgkfzh, from the 8 ids below
  // to all 52 of KIE_MEDIA_MODELS. Later slices touch these ids and nothing
  // else — the name deliberately does not cite a commit, so it stays true as
  // the list grows.
  it("guards exactly the models pinned in this list", () => {
    expect([...guarded].sort()).toEqual(
      [
        "grok-imagine/text-to-image",
        "grok-imagine/image-to-image",
        "grok-imagine/text-to-video",
        "grok-imagine/image-to-video",
        "grok-imagine-video-1-5-preview",
        "grok-imagine/extend",
        "grok-imagine/upscale",
        "bytedance/seedance-2-fast",
        "bytedance/seedance-2",
        "bytedance/seedance-2-mini",
        "wan/2-7-image-to-video",
        "wan/2-7-text-to-video",
        "wan/2-7-r2v",
        "wan/2-7-videoedit",
        "wan/2-7-image",
        "wan/2-7-image-pro",
        "gemini-omni-video",
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
