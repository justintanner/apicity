import type {
  FalEndpointInputMap,
  FalNanoBanana2EditRequest,
  FalNanoBanana2LiteAspectRatio,
  FalNanoBanana2LiteEditResponse,
  FalNanoBanana2LiteOutputFormat,
  FalNanoBanana2LiteSafetyTolerance,
  FalNanoBanana2LiteTextToImageResponse,
  FalNanoBanana2LiteThinkingLevel,
  FalNanoBanana2TextToImageParsedRequest,
  FalNanoBanana2TextToImageRequest,
  FalNanoBananaProEditParsedRequest,
  FalNanoBananaProEditRequest,
  FalProvider,
  FalRunNanoBanana2LiteNamespace,
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

// (e) The nano-banana-2-lite family is reachable from the package entry point.
// All seven names were `export`ed in types.ts and named nowhere in index.ts
// until ac-gvqa18, so before that fix each import below is a hard TS2724
// ('"@apicity/fal"' has no exported member named ...) — text in index.ts is
// not the same claim as importable from "@apicity/fal".
const liteAspectRatio: FalNanoBanana2LiteAspectRatio = "1:1";
const liteOutputFormat: FalNanoBanana2LiteOutputFormat = "png";
const liteSafetyTolerance: FalNanoBanana2LiteSafetyTolerance = "2";
const liteThinkingLevel: FalNanoBanana2LiteThinkingLevel = "minimal";

declare const liteTextToImageResponse: FalNanoBanana2LiteTextToImageResponse;
declare const liteEditResponse: FalNanoBanana2LiteEditResponse;
declare const liteNamespace: FalRunNanoBanana2LiteNamespace;

// The namespace's two methods return exactly those two response types, which
// is why exporting the namespace alone would leave a consumer able to name it
// but not its results.
const liteTextToImageDescription: string = liteTextToImageResponse.description;
const liteEditDescription: string = liteEditResponse.description;
const liteTextToImage: FalRunNanoBanana2LiteNamespace["textToImage"] =
  liteNamespace.textToImage;
const liteEdit: FalRunNanoBanana2LiteNamespace["edit"] = liteNamespace.edit;

void [
  nanoBananaProEditInput,
  nanoBanana2TextToImageInput,
  nanoBananaProEditParsed,
  nanoBanana2TextToImageParsed,
  nanoBananaProEditRoundTrip,
  nanoBananaProEditParsedRoundTrip,
  nanoBanana2EditMapIdentity,
  liteAspectRatio,
  liteOutputFormat,
  liteSafetyTolerance,
  liteThinkingLevel,
  liteTextToImageDescription,
  liteEditDescription,
  liteTextToImage,
  liteEdit,
];
