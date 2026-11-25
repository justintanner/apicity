// Shared inputs for the charsheet umbrella-pratfall bake-off (ac-gupjgo):
// one reference-to-video recording per top-10 model, every one fed the same
// character sheet and the same prompt so the recordings compare like for like.

/**
 * tests/fixtures/charsheet.png: a 3x3 character turnaround sheet (1104x1584
 * RGB PNG) of the man in tests/fixtures/man.jpg. Olive-green crew-neck
 * T-shirt, black shorts, black flip-flops, an open red umbrella; a red
 * folding bike stands beside him in the first panel.
 * sha256 856312a21002008bde10a4ead84954643adbe4b09179e764ebc7cda3cda3d118.
 */
export const CHARSHEET_FIXTURE = "charsheet.png";

/**
 * The same bytes as a public URL, for providers that fetch their inputs
 * (MachGen, WaveSpeed, and any fal or KIE field that takes a URL). Pinned to
 * the commit that added the sheet, so a recorded request body stays
 * byte-identical; tests/machgen-helpers.ts pins cat1.jpg the same way.
 */
export const CHARSHEET_URL =
  "https://raw.githubusercontent.com/justintanner/apicity/483c0b7bbed4232eeed9af3e2624a4d8b12b4ef2/tests/fixtures/charsheet.png";

/** The sheet's MIME type, for uploads and data URIs. */
export const CHARSHEET_MIME_TYPE = "image/png";

/**
 * The scene every model is asked for: a silent, real-life prat fall with the
 * red umbrella, shot like an ordinary vertical phone clip. Never edit it per
 * model; a model that needs a reference token (for example `@Image1`) gets
 * that token prepended in its own test.
 */
export const CHARSHEET_PRATFALL_PROMPT = [
  "Real-life vertical smartphone video, filmed handheld by a friend on a",
  "Bangkok sidewalk during light afternoon rain. Natural daylight, real skin",
  "and fabric texture, ordinary phone-camera look: no film grade, no CGI.",
  "",
  "The man from the reference character sheet (short tousled light-brown",
  "hair, olive-green crew-neck T-shirt, black shorts, black flip-flops)",
  "strolls toward the camera holding his open red umbrella high, looking",
  "pleased with himself. His flip-flop skids on a wet painted curb line and",
  "he does a classic silent-film prat fall: both feet fly up and he lands",
  "flat on his back on the wet pavement. The red umbrella pops out of his",
  "hand, bounces once and lands upside down beside him, filling with rain.",
  "He lies still for a beat, then lifts his head and gives the camera a",
  "deadpan look. He is unhurt.",
  "",
  "The reference image is a turnaround sheet of one man: use it only for his",
  "face, hair and outfit. Do not show the grid, the grey studio backdrop or",
  "the bicycle. Silent comedy: no dialogue, no speech, no music, no text or",
  "captions. One continuous shot, no cuts.",
].join("\n");

/**
 * The retry wording after a content-moderation refusal of the first prompt:
 * the same gag told as a gentle comic slip, with no fall-onto-the-back image.
 */
export const CHARSHEET_PRATFALL_SOFT_PROMPT = [
  "Real-life vertical smartphone video on a rainy Bangkok sidewalk, natural",
  "daylight, ordinary phone-camera look.",
  "",
  "The man from the reference character sheet (short tousled light-brown",
  "hair, olive-green crew-neck T-shirt, black shorts, black flip-flops)",
  "strolls toward the camera with his open red umbrella. His flip-flop",
  "slides on a wet curb line, his legs shoot out in a comic slapstick slip",
  "and he sits down hard on the pavement, laughing it off. The red umbrella",
  "tumbles away and lands upside down beside him. He gives the camera a",
  "deadpan look.",
  "",
  "Use the reference sheet only for his face, hair and outfit; do not show",
  "the grid, backdrop or bicycle. No dialogue, no music, no text. One",
  "continuous shot.",
].join("\n");
