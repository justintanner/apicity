import { afterEach, describe, expect, it, vi } from "vitest";

import { KieError } from "@apicity/kie";

import {
  KIE_MEDIA_MODELS,
  type MediaGenerationRequest,
} from "@apicity/kie/zod";
import {
  CREATE_TASK_GUARDS,
  createKie,
} from "../../../packages/provider/kie/src/kie";
import { TEST_PAYGATE_SECRET, mintKieCreateTaskOtp } from "../../harness";

// This file is the runtime companion to CREATE_TASK_GUARDS' `satisfies`
// clause, which enforces total membership earlier, at tsc time. The pair is
// deliberate, and all three reasons for it are load-bearing:
//
// 1. Message quality. TS1360 names missing ids but not the fix. The assertions
//    below say what to do about them.
// 2. Invariants the types cannot see. The schema/key pairing, hand-written
//    removal tripwire, and catalogue order all remain runtime concerns.
// 3. Large-gap coverage. Measured: tsc names every missing id up to five; at
//    six or more it names four and reports `and N more.` This test still
//    enumerates every offending id in a sweep-sized gap.
//
// The repo already uses this same pairing for KieMediaModel itself
// (zod.ts's catalogue pin ↔ tests/unit/kie-zod.test.ts).
//
// Scope: registry shape plus prototype safety for the lookup that reads it.
// Broader behaviour-level guard coverage — that a bad payload actually throws
// — lives across tests/unit/kie-pixverse-v6.test.ts (whose
// `describe.each(GUARD_MODELS)` table drives four pixverse-v6 ids, with
// `pixverse-v6/text-to-video` covered by its own describe block above it),
// tests/unit/kie-request.test.ts (`grok-imagine/image-to-video`,
// `gemini-omni-video`) and tests/unit/kie-seedance-2-mini.test.ts — the same
// split tests/unit/kie-model-input-schemas.test.ts already uses. That set is
// deliberately a sample, not one case per entry: the entries below are checked
// for shape here and for correct pairing by the schema walk further down.

const guarded = Object.keys(CREATE_TASK_GUARDS);

// Every kie media request schema pins its own model id with a z.literal, so the
// schema can be asked which model it is for rather than taken on trust from the
// entry it was written into. The registry's static value type does not expose
// `.shape`, so this diagnostic view keeps each layer optional and lets Vitest
// report a malformed row instead of a property-access TypeError.
//
// zod 4 keeps .refine()/.superRefine() rules on the same ZodObject rather than
// wrapping it, so `.shape.model.value` resolves on refinement-carrying schemas
// too — which is why this can walk the table rather than special-case it.
interface ModelPinnedShape {
  shape?: {
    model?: {
      value?: unknown;
    };
  };
}

const guardedRejectionCases = [
  {
    name: "wan/2-7-image-to-video without a frame or clip URL",
    request: {
      model: "wan/2-7-image-to-video",
      input: { prompt: "Animate this scene." },
    },
  },
  {
    name: "kling/v3-turbo-text-to-video with an empty prompt",
    request: {
      model: "kling/v3-turbo-text-to-video",
      input: { prompt: "" },
    },
  },
  {
    name: "elevenlabs/audio-isolation without audio_url",
    request: {
      model: "elevenlabs/audio-isolation",
      input: {},
    },
  },
  {
    name: "grok image-to-video with multiple 1080p external images",
    request: {
      model: "grok-imagine/image-to-video",
      input: {
        image_urls: [
          "https://example.com/first.png",
          "https://example.com/second.webp",
        ],
        resolution: "1080p",
      },
    },
    expectedPath: "input.image_urls",
  },
  // Both seedream/4.5 rows exercise guards switched on by cataloguing these
  // ids: before promotion these exact payloads transmitted unvalidated.
  {
    name: "seedream/4.5-text-to-image without quality",
    request: {
      model: "seedream/4.5-text-to-image",
      input: { prompt: "A quiet harbour at first light" },
    },
    expectedPath: "input.quality",
  },
  {
    name: "seedream/4.5-edit with 15 image_urls",
    request: {
      model: "seedream/4.5-edit",
      input: {
        prompt: "Change the clothing material",
        image_urls: Array.from(
          { length: 15 },
          (_, index) => `https://example.com/${index}.png`
        ),
        quality: "basic",
      },
    },
    expectedPath: "input.image_urls",
  },
  {
    name: "wan/2-6-text-to-video with an off-enum duration",
    request: {
      model: "wan/2-6-text-to-video",
      input: { prompt: "A slow pan across a frozen lake.", duration: "20" },
    },
    expectedPath: "input.duration",
  },
  {
    name: "wan/2-6-flash-image-to-video without the required audio flag",
    request: {
      model: "wan/2-6-flash-image-to-video",
      input: {
        prompt: "Animate this portrait.",
        image_urls: ["https://example.com/portrait.png"],
      },
    },
    expectedPath: "input.audio",
  },
  // The two video-to-video ids cap duration at "10" while their text- and
  // image-input siblings accept "15", so this payload is off-enum only here.
  {
    name: "wan/2-6-video-to-video with a duration only its siblings allow",
    request: {
      model: "wan/2-6-video-to-video",
      input: {
        prompt: "Restyle the clip as a neon noir chase",
        video_urls: ["https://example.com/source.mp4"],
        duration: "15",
      },
    },
    expectedPath: "input.duration",
  },
  {
    name: "wan/2-6-image-to-video with two image_urls",
    request: {
      model: "wan/2-6-image-to-video",
      input: {
        prompt: "Animate this portrait",
        image_urls: ["https://example.com/a.png", "https://example.com/b.png"],
      },
    },
    expectedPath: "input.image_urls",
  },
] satisfies ReadonlyArray<{
  name: string;
  request: Record<string, unknown>;
  expectedPath?: string;
}>;

afterEach(() => vi.restoreAllMocks());

describe("CREATE_TASK_GUARDS membership rule", () => {
  // The satisfies clause in kie.ts fires first and names the id; this is the
  // readable half of the pair, and the only half that says what to do about it.
  it("decides every listed media model", () => {
    const guardedIds = new Set(guarded);
    const undecided = KIE_MEDIA_MODELS.filter((id) => !guardedIds.has(id));
    expect(
      undecided,
      `These kie media models have no CREATE_TASK_GUARDS entry: ` +
        `${undecided.join(", ")}. Add one — the model id paired with the ` +
        `*RequestSchema that z.literal-pins that same id — in ` +
        `packages/provider/kie/src/kie.ts and add the same id to the explicit ` +
        `membership pin in tests/unit/kie/create-task-guards.test.ts, both ` +
        `in KIE_MEDIA_MODELS order. There is no exemption list to add it to ` +
        `instead; if this model genuinely cannot be validated before ` +
        `transport, reintroducing that list is a reviewed change, not a ` +
        `blank to fill in.`
    ).toEqual([]);
  });

  // Not a count for its own sake — it makes any change to the guarded set show
  // up as a deliberate edit to this list.
  //
  // The list is the point, not the number. It now holds all 118 ids of
  // KIE_MEDIA_MODELS, which is what makes it worth spelling out rather than
  // asserting `guarded.sort()` equals `[...KIE_MEDIA_MODELS].sort()`: that
  // form is self-referential — it passes whatever the catalogue says, so an
  // entry silently dropped alongside its catalogue entry stays green. Written
  // out, removing a model takes two deliberate edits and shows both in the diff.
  it("guards exactly the models pinned in this list", () => {
    expect(
      guarded,
      "Update this deliberate 118-entry pin when the guarded model set changes"
    ).toHaveLength(118);
    expect([...guarded].sort()).toEqual(
      [
        "kling-3.0/video",
        "kling-3.0/motion-control",
        "kling/v3-turbo-image-to-video",
        "kling/v3-turbo-text-to-video",
        "kling-2.6/image-to-video",
        "kling-2.6/motion-control",
        "kling-2.6/text-to-video",
        "kling/ai-avatar-pro",
        "kling/ai-avatar-standard",
        "kling/v2-1-master-image-to-video",
        "kling/v2-1-master-text-to-video",
        "kling/v2-1-pro",
        "kling/v2-1-standard",
        "kling/v2-5-turbo-image-to-video-pro",
        "kling/v2-5-turbo-text-to-video-pro",
        "grok-imagine/text-to-image",
        "grok-imagine/image-to-image",
        "grok-imagine/text-to-video",
        "grok-imagine/image-to-video",
        "grok-imagine-video-1-5-preview",
        "nano-banana-pro",
        "nano-banana-2",
        "nano-banana-2-lite",
        "gpt-image/1.5-image-to-image",
        "gpt-image/1.5-text-to-image",
        "gpt-image-2-image-to-image",
        "gpt-image-2-text-to-image",
        "seedream/5-lite-image-to-image",
        "seedream/5-lite-text-to-image",
        "seedream/5-pro-image-to-image",
        "seedream/5-pro-text-to-image",
        "seedream/4.5-text-to-image",
        "seedream/4.5-edit",
        "grok-imagine/extend",
        "grok-imagine/upscale",
        "qwen2/text-to-image",
        "qwen2/image-edit",
        "qwen/text-to-image",
        "qwen/image-edit",
        "qwen/image-to-image",
        "bytedance/seedance-2-fast",
        "bytedance/seedance-2",
        "bytedance/seedance-2-mini",
        "bytedance/seedance-1.5-pro",
        "bytedance/seedream",
        "bytedance/seedream-v4-edit",
        "bytedance/seedream-v4-text-to-image",
        "bytedance/v1-lite-image-to-video",
        "bytedance/v1-lite-text-to-video",
        "bytedance/v1-pro-fast-image-to-video",
        "bytedance/v1-pro-image-to-video",
        "bytedance/v1-pro-text-to-video",
        "wan/2-7-image-to-video",
        "wan/2-7-text-to-video",
        "wan/2-7-r2v",
        "wan/2-7-videoedit",
        "wan/2-7-image",
        "wan/2-7-image-pro",
        "wan/2-6-flash-image-to-video",
        "wan/2-6-flash-video-to-video",
        "wan/2-6-image-to-video",
        "wan/2-6-text-to-video",
        "wan/2-6-video-to-video",
        "happyhorse/text-to-video",
        "happyhorse/image-to-video",
        "happyhorse/reference-to-video",
        "happyhorse/video-edit",
        "happyhorse-1-1/text-to-video",
        "happyhorse-1-1/image-to-video",
        "happyhorse-1-1/reference-to-video",
        "omnihuman-1-5",
        "omnihuman-1-5/human-identification",
        "omnihuman-1-5/subject-detection",
        "volcengine/video-to-video-lip-sync",
        "gemini-omni-video",
        "elevenlabs/audio-isolation",
        "elevenlabs/text-to-dialogue-v3",
        "elevenlabs/text-to-speech-multilingual-v2",
        "elevenlabs/text-to-speech-turbo-2-5",
        "elevenlabs/sound-effect-v2",
        "sora-watermark-remover",
        "recraft/crisp-upscale",
        "recraft/remove-background",
        "pixverse-v6/text-to-video",
        "pixverse-v6/image-to-video",
        "pixverse-v6/transition",
        "pixverse-v6/extend",
        "pixverse-v6/reference-to-video",
        "minimax-h3/text-to-video",
        "minimax-h3/image-to-video",
        "minimax-h3/reference-to-video",
        "google/gemini-2-5-pro-tts",
        "google/gemini-3-1-flash-tts",
        "google/imagen4",
        "google/imagen4-fast",
        "google/imagen4-ultra",
        "google/nano-banana",
        "google/nano-banana-edit",
        "topaz/image-upscale",
        "topaz/video-upscale",
        "infinitalk/from-audio",
        "z-image",
        "flux-2/flex-image-to-image",
        "flux-2/flex-text-to-image",
        "flux-2/pro-image-to-image",
        "flux-2/pro-text-to-image",
        "ideogram/character",
        "ideogram/character-edit",
        "ideogram/character-remix",
        "ideogram/v3-edit",
        "ideogram/v3-remix",
        "ideogram/v3-text-to-image",
        "hailuo/02-image-to-video-pro",
        "hailuo/02-image-to-video-standard",
        "hailuo/02-text-to-video-pro",
        "hailuo/02-text-to-video-standard",
        "hailuo/2-3-image-to-video-pro",
        "hailuo/2-3-image-to-video-standard",
      ].sort()
    );
  });
});

// Membership says each model is decided; these say each decided entry says
// what it means to say. Both are invisible to the satisfies clause, which only
// ever sees the set of ids.
describe("CREATE_TASK_GUARDS entries", () => {
  // The one assertion that survives 44 hand-written entries being added by
  // hand. An entry pairing `seedream/5-lite-text-to-image` with
  // `SeedreamProTextToImageRequestSchema` type-checks (both sides are valid
  // members of their own type), passes every other test in this file, and
  // silently validates the wrong contract — four seedream names differing by
  // one word each are one slip apart. Reading the id back off the schema is the
  // only check here that a reviewer's eye is not the last line of defence.
  it("pairs each guarded model with the schema that pins its id", () => {
    expect(
      guarded,
      "CREATE_TASK_GUARDS must not be empty before checking schema pairings"
    ).not.toHaveLength(0);
    for (const [model, schema] of Object.entries(CREATE_TASK_GUARDS)) {
      const pinned =
        typeof schema === "object" && schema !== null
          ? (schema as ModelPinnedShape).shape?.model?.value
          : undefined;
      expect(
        pinned,
        `CREATE_TASK_GUARDS entry ${model} must expose a literal model at ` +
          `shape.model.value`
      ).toBeTypeOf("string");
      expect(
        pinned,
        `entry ${model} is paired with a schema pinning ${String(pinned)}`
      ).toBe(model);
    }
  });

  // Catalogue order is how a reader checks the table against KIE_MEDIA_MODELS
  // at a glance, and how each slice knows where to insert. Asserted rather than
  // left to convention so the final table diffs cleanly against the catalogue.
  it("lists its entries in KIE_MEDIA_MODELS order", () => {
    expect(
      guarded,
      "CREATE_TASK_GUARDS must not be empty before checking catalogue order"
    ).not.toHaveLength(0);
    const catalogueOrder = [...KIE_MEDIA_MODELS];
    expect(
      guarded,
      `CREATE_TASK_GUARDS entries are out of KIE_MEDIA_MODELS order; expected ` +
        `${catalogueOrder.join(", ")}`
    ).toEqual(catalogueOrder);
  });
});

describe("CREATE_TASK_GUARDS provider-boundary rejection", () => {
  it.each(guardedRejectionCases)(
    "rejects $name before transport",
    async ({ request, expectedPath }) => {
      const mockFetch = vi.fn<typeof fetch>(() => {
        throw new Error("fetch must not run for a guarded invalid request");
      });
      const provider = createKie({
        apiKey: "test-key",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });

      const rejection = await provider.post.api.v1.jobs
        .createTask(
          // These fixtures are intentionally invalid for their paired schemas.
          request as unknown as MediaGenerationRequest,
          mintKieCreateTaskOtp(request)
        )
        .then(
          () => undefined,
          (error: unknown) => error
        );

      expect(rejection).toBeInstanceOf(KieError);
      if (!(rejection instanceof KieError)) {
        throw new Error("Expected createTask to reject with KieError");
      }
      expect(rejection.status).toBe(400);
      expect(
        rejection.message.startsWith("Invalid Kie createTask request: ")
      ).toBe(true);
      const issues =
        typeof rejection.body === "object" &&
        rejection.body !== null &&
        "issues" in rejection.body
          ? rejection.body.issues
          : undefined;
      expect(Array.isArray(issues)).toBe(true);
      expect(issues).not.toHaveLength(0);
      if (expectedPath && Array.isArray(issues)) {
        expect(
          issues.some((issue: unknown) => {
            if (typeof issue !== "object" || issue === null) return false;
            const path = "path" in issue ? issue.path : undefined;
            return Array.isArray(path) && path.join(".") === expectedPath;
          })
        ).toBe(true);
      }
      expect(mockFetch).not.toHaveBeenCalled();
    }
  );
});

describe("CREATE_TASK_GUARDS lookup", () => {
  it.each(["toString", "constructor", "valueOf"])(
    "sends %s unvalidated instead of resolving an inherited member",
    async (model) => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            msg: "success",
            data: { taskId: "t_1" },
          }),
          { status: 200 }
        )
      );
      const provider = createKie({
        apiKey: "test-key",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });
      const request = { model, input: {} };

      await expect(
        provider.post.api.v1.jobs.createTask(
          request as unknown as MediaGenerationRequest,
          mintKieCreateTaskOtp(request)
        )
      ).resolves.toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }
  );
});
