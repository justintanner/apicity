import type {
  FalEndpointInputMap,
  FalNanoBanana2EditRequest,
  FalNanoBanana2TextToImageParsedRequest,
  FalNanoBanana2TextToImageRequest,
  FalNanoBananaProEditParsedRequest,
  FalNanoBananaProEditRequest,
  FalProvider,
} from "@apicity/fal";

declare const fal: FalProvider;

// (a) Payloads omitting optional fields (safety_tolerance, num_images)
// satisfy the z.input-derived request aliases.
const nanoBananaProEditInput: FalNanoBananaProEditRequest = {
  prompt: "Add a party hat",
  image_urls: ["https://example.com/cat.png"],
};

const nanoBanana2TextToImageInput: FalNanoBanana2TextToImageRequest = {
  prompt: "A small red square",
};

// parse() results are assignable to the z.output-derived parsed aliases.
const nanoBananaProEditParsed: FalNanoBananaProEditParsedRequest =
  fal.run.nanoBananaPro.edit.schema.parse(nanoBananaProEditInput);

const nanoBanana2TextToImageParsed: FalNanoBanana2TextToImageParsedRequest =
  fal.run.nanoBanana2.textToImage.schema.parse(nanoBanana2TextToImageInput);

// Request and ParsedRequest are MUTUALLY assignable today because fal's zod.ts
// contains no `.default()` calls, so `z.input` and `z.output` are identical
// for every fal schema. If a `.default()` is ever added, this identity breaks
// by design — replace these two assignments with the original
// required-vs-omittable assertion (input omits the defaulted field, parsed
// requires it).
const nanoBananaProEditRoundTrip: FalNanoBananaProEditRequest =
  nanoBananaProEditParsed;
const nanoBananaProEditParsedRoundTrip: FalNanoBananaProEditParsedRequest =
  nanoBananaProEditInput;

// (b) queue.submit infers the input type from a known endpoint-ID literal.
void fal.v1.queue.submit({
  endpoint_id: "fal-ai/nano-banana-2/edit",
  input: {
    prompt: "x",
    image_urls: ["https://example.com/a.png"],
  },
});

void fal.v1.queue.submit({
  endpoint_id: "fal-ai/nano-banana-2/edit",
  input: {
    // @ts-expect-error known endpoint ids reject wrong-shape input
    prompt: 42,
    image_urls: ["https://example.com/a.png"],
  },
});

// (c) Unknown endpoint ids fall back to Record<string, unknown> input, and an
// endpoint_id held in a plain `string` variable stays accepted.
void fal.v1.queue.submit({
  endpoint_id: "fal-ai/some-brand-new-model",
  input: { any_field: true, nested: { ok: 1 } },
});

const dynamicEndpointId: string = "fal-ai/selected-at-runtime";
const dynamicInput: Record<string, unknown> = { prompt: "x" };
void fal.v1.queue.submit({
  endpoint_id: dynamicEndpointId,
  input: dynamicInput,
});

// (d) The endpoint→input map entry is exactly the request alias (identity in
// both directions).
type AssertEqual<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : never
  : never;

const nanoBanana2EditMapIdentity: AssertEqual<
  FalEndpointInputMap["fal-ai/nano-banana-2/edit"],
  FalNanoBanana2EditRequest
> = true;

void [
  nanoBananaProEditInput,
  nanoBanana2TextToImageInput,
  nanoBananaProEditParsed,
  nanoBanana2TextToImageParsed,
  nanoBananaProEditRoundTrip,
  nanoBananaProEditParsedRoundTrip,
  nanoBanana2EditMapIdentity,
];
