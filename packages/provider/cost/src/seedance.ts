// [width, height] by resolution and aspect ratio, copied from ByteDance's
// table: one column for the 2.0 series (2.0, 2.0 Fast and 2.0 US), and one
// for 2.5 (2.5 US and the draft completion too), which has no 4k.
export type SeedanceSizes = Readonly<
  Record<string, Readonly<Record<string, readonly [number, number]>>>
>;

export const SEEDANCE_2P0_SIZES: SeedanceSizes = {
  "480p": {
    "16:9": [864, 496],
    "4:3": [752, 560],
    "1:1": [640, 640],
    "3:4": [560, 752],
    "9:16": [496, 864],
    "21:9": [992, 432],
  },
  "720p": {
    "16:9": [1280, 720],
    "4:3": [1112, 834],
    "1:1": [960, 960],
    "3:4": [834, 1112],
    "9:16": [720, 1280],
    "21:9": [1470, 630],
  },
  "1080p": {
    "16:9": [1920, 1080],
    "4:3": [1664, 1248],
    "1:1": [1440, 1440],
    "3:4": [1248, 1664],
    "9:16": [1080, 1920],
    "21:9": [2206, 946],
  },
  "4k": {
    "16:9": [3840, 2160],
    "4:3": [3326, 2494],
    "1:1": [2880, 2880],
    "3:4": [2494, 3326],
    "9:16": [2160, 3840],
    "21:9": [4398, 1886],
  },
};

export const SEEDANCE_2P5_SIZES: SeedanceSizes = {
  "480p": {
    "16:9": [854, 480],
    "4:3": [752, 560],
    "1:1": [640, 640],
    "3:4": [560, 752],
    "9:16": [480, 854],
    "21:9": [992, 432],
  },
  "720p": {
    "16:9": [1280, 720],
    "4:3": [1112, 834],
    "1:1": [960, 960],
    "3:4": [834, 1112],
    "9:16": [720, 1280],
    "21:9": [1470, 630],
  },
  "1080p": {
    "16:9": [1920, 1080],
    "4:3": [1664, 1248],
    "1:1": [1440, 1440],
    "3:4": [1248, 1664],
    "9:16": [1080, 1920],
    "21:9": [2206, 946],
  },
};

/** Output includes its initial frame. Input clips contribute 24 frames per second. */
export function seedanceTokens(
  [width, height]: readonly [number, number],
  outputSeconds: number,
  inputSeconds = 0,
  divisor = 1024
): number {
  return (
    (width * height * (24 * inputSeconds + 24 * outputSeconds + 1)) / divisor
  );
}
