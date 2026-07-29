import { describe, expect, it } from "vitest";

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
  it("guards exactly the models guarded at f6c99b54", () => {
    expect([...guarded].sort()).toEqual(
      [
        "bytedance/seedance-2-mini",
        "gemini-omni-video",
        "grok-imagine/image-to-video",
        "happyhorse-1-1/image-to-video",
        "happyhorse-1-1/reference-to-video",
        "happyhorse-1-1/text-to-video",
        "happyhorse/image-to-video",
        "happyhorse/reference-to-video",
        "happyhorse/text-to-video",
        "happyhorse/video-edit",
        "pixverse-v6/extend",
        "pixverse-v6/image-to-video",
        "pixverse-v6/reference-to-video",
        "pixverse-v6/text-to-video",
        "pixverse-v6/transition",
      ].sort()
    );
  });
});
