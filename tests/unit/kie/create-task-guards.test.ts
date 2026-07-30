import { describe, expect, it } from "vitest";

import { KIE_MEDIA_MODELS } from "@apicity/kie/zod";
import { CREATE_TASK_GUARDS } from "../../../packages/provider/kie/src/kie";

// This file is the runtime half of a compile-pin/runtime-pin pair: the pin in
// kie.ts (`EveryKieMediaModelIsDecided`) fires strictly earlier, at tsc time.
// The pair is deliberate, and all three reasons for it are load-bearing:
//
// 1. Message quality. `Type '"…"' does not satisfy the constraint 'true'` names
//    the id but not the fix. The assertions below say what to do about it.
// 2. Invariants the types cannot see. Two rows for the same id are legal to the
//    compiler — `GuardedKieMediaModel` is a union, so the duplicate collapses
//    and the `Exclude` still empties — but `.find()` only ever reaches the
//    first, which makes the second a guard that looks present and never runs.
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
// There is no longer a second list. Until this commit the rule was "every
// catalogue id is in exactly one of CREATE_TASK_GUARDS or
// CREATE_TASK_GUARD_EXEMPTIONS", and two assertions here read the exemption
// map and its reason keys. All 52 ids are guarded now, both structures are
// deleted, and those two assertions are retired with their subjects rather
// than left to pass vacuously over `{}` — a green assertion over an empty map
// is the same silence as no assertion at all.
//
// Scope: registry shape only, for all 52 rows. Behaviour-level coverage is
// thinner than the row count and splits three ways:
//
// - Through the guard (a payload reaches `createTask` and the guard's throw or
//   pass is observed): tests/unit/kie-pixverse-v6.test.ts (whose
//   `describe.each(GUARD_MODELS)` table drives 4 rows, with
//   `pixverse-v6/text-to-video` covered by its own describe block above it),
//   tests/unit/kie-request.test.ts (`grok-imagine/image-to-video`,
//   `gemini-omni-video`) and tests/unit/kie-seedance-2-mini.test.ts.
// - At the schema boundary only (the row's `*RequestSchema` is exercised
//   directly, so the pairing is proven but the guard's throw path is not):
//   20 of the 52 ids are named in tests/unit/kie/validate.test.ts, the four
//   seedream ids in the four tests/integration/kie-seedream-5-*.test.ts files
//   plus the "Seedream quality stays required" block of
//   tests/unit/kie-model-input-schemas.test.ts, `nano-banana-pro`/
//   `nano-banana-2` in tests/integration/kie-more-models.test.ts, the
//   gpt-image-2 pair in its two tests/integration/kie-gpt-image-2-*.test.ts
//   files, and `omnihuman-1-5`/`volcengine/video-to-video-lip-sync` in
//   tests/functional/kie-omnihuman.test.ts and tests/functional/schemas.test.ts.
// - Pinned here and nowhere else: `gpt-image/1.5-image-to-image` and
//   `sora-watermark-remover` have no createTask call site and no recording
//   anywhere in the repo, so their rows rest on their schemas' own
//   `model: z.literal(...)` and on the assertions below.
//
// That split is the same one tests/unit/kie-model-input-schemas.test.ts
// already uses. It is a gap in guard-throw coverage, not in membership.

const guarded = CREATE_TASK_GUARDS.map(([model]) => model as string);

describe("CREATE_TASK_GUARDS membership rule", () => {
  // The compile pin in kie.ts fires first and names the id; this is the
  // readable half of the pair, and the only half that says what to do about it.
  it("guards every listed media model", () => {
    const rows = new Set(guarded);
    const unguarded = KIE_MEDIA_MODELS.filter((id) => !rows.has(id));
    expect(
      unguarded,
      `These kie media models have no row in CREATE_TASK_GUARDS: ` +
        `${unguarded.join(", ")}. Add a guard row pairing each with its own ` +
        `*RequestSchema — the one whose model field is z.literal(<that id>) — ` +
        `in packages/provider/kie/src/kie.ts. Every catalogue id is validated ` +
        `before transport; there is no exemption list to add it to instead.`
    ).toEqual([]);
  });

  // Legal to the compiler, dormant at runtime: `.find()` stops at the first
  // row for an id, so a second row is a guard that never runs. This replaces
  // the retired "never both guards and exempts the same model" invariant —
  // same class of defect, the only form it can still take.
  it("has no duplicate guard rows", () => {
    const seen = new Set<string>();
    const duplicated = guarded.filter((id) => {
      if (seen.has(id)) {
        return true;
      }
      seen.add(id);
      return false;
    });
    expect(
      duplicated,
      `Duplicate CREATE_TASK_GUARDS rows: ${duplicated.join(", ")}. ` +
        `validateCreateTaskRequest uses .find(), so only the first row for an ` +
        `id ever runs and the rest are dormant guards.`
    ).toEqual([]);
  });

  // Not a count for its own sake — it makes any change to the guarded set show
  // up as a deliberate edit to this list. Deleting a row fails here and the
  // failure names the id.
  it("guards exactly the 52 catalogued media models", () => {
    expect([...guarded].sort()).toEqual(
      [
        "bytedance/seedance-2",
        "bytedance/seedance-2-fast",
        "bytedance/seedance-2-mini",
        "elevenlabs/audio-isolation",
        "elevenlabs/sound-effect-v2",
        "elevenlabs/text-to-dialogue-v3",
        "elevenlabs/text-to-speech-multilingual-v2",
        "elevenlabs/text-to-speech-turbo-2-5",
        "gemini-omni-video",
        "gpt-image-2-image-to-image",
        "gpt-image-2-text-to-image",
        "gpt-image/1.5-image-to-image",
        "grok-imagine-video-1-5-preview",
        "grok-imagine/extend",
        "grok-imagine/image-to-image",
        "grok-imagine/image-to-video",
        "grok-imagine/text-to-image",
        "grok-imagine/text-to-video",
        "grok-imagine/upscale",
        "happyhorse-1-1/image-to-video",
        "happyhorse-1-1/reference-to-video",
        "happyhorse-1-1/text-to-video",
        "happyhorse/image-to-video",
        "happyhorse/reference-to-video",
        "happyhorse/text-to-video",
        "happyhorse/video-edit",
        "kling-3.0/motion-control",
        "kling-3.0/video",
        "kling/v3-turbo-image-to-video",
        "kling/v3-turbo-text-to-video",
        "nano-banana-2",
        "nano-banana-pro",
        "omnihuman-1-5",
        "pixverse-v6/extend",
        "pixverse-v6/image-to-video",
        "pixverse-v6/reference-to-video",
        "pixverse-v6/text-to-video",
        "pixverse-v6/transition",
        "qwen2/image-edit",
        "qwen2/text-to-image",
        "seedream/5-lite-image-to-image",
        "seedream/5-lite-text-to-image",
        "seedream/5-pro-image-to-image",
        "seedream/5-pro-text-to-image",
        "sora-watermark-remover",
        "volcengine/video-to-video-lip-sync",
        "wan/2-7-image",
        "wan/2-7-image-pro",
        "wan/2-7-image-to-video",
        "wan/2-7-r2v",
        "wan/2-7-text-to-video",
        "wan/2-7-videoedit",
      ].sort()
    );
  });
});
