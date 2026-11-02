import { describe, expect, it } from "vitest";

import { computeEstimate } from "@apicity/cost";
import type { CostHints } from "@apicity/cost";

const estimate = (
  endpoint: string,
  payload: Record<string, unknown>,
  costHints?: CostHints
) => computeEstimate({ provider: "wavespeed", endpoint, payload, costHints });

const PROMPT = "A red paper boat drifts across a calm pond at sunrise.";

describe("wavespeed alibaba/wan-3.0/text-to-video", () => {
  const model = "alibaba/wan-3.0/text-to-video";

  it("prices the recorded payload at the 0.10 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      resolution: "480p",
      duration: 2,
      generate_audio: false,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.1, 9);
  });

  it("bills 1080p at twice the 720p rate, up to 30 s", () => {
    expect(
      estimate(model, { prompt: PROMPT, resolution: "1080p", duration: 30 }).usd
    ).toBeCloseTo(6, 9);
  });

  it("bills the 2 s floor at the 720p default", () => {
    expect(estimate(model, { prompt: PROMPT, duration: 1 }).usd).toBeCloseTo(
      0.2,
      9
    );
  });

  it("fails closed on a duration that is not a number", () => {
    const result = estimate(model, { prompt: PROMPT, duration: "5" });

    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
  });
});

describe("wavespeed heygen/video-1.0/text-to-video", () => {
  const model = "heygen/video-1.0/text-to-video";

  it("prices the recorded payload at the 0.125 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      duration: 5,
      resolution: "480p",
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.125, 9);
  });

  it("bills 768p at 0.045 USD/s", () => {
    expect(
      estimate(model, { prompt: PROMPT, resolution: "768p", duration: 15 }).usd
    ).toBeCloseTo(0.675, 9);
  });
});

describe("wavespeed minimax/h3/text-to-video", () => {
  const model = "minimax/h3/text-to-video";

  it("prices the recorded payload at the 0.40 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      resolution: "768p",
      duration: 4,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.4, 9);
  });

  it("bills 2k at 1.4 times the 768p rate", () => {
    expect(
      estimate(model, { prompt: PROMPT, resolution: "2k", duration: 15 }).usd
    ).toBeCloseTo(2.1, 9);
  });
});

describe("wavespeed bytedance/seedance-2.5/text-to-video", () => {
  const model = "bytedance/seedance-2.5/text-to-video";
  const video = "https://example.com/reference.mp4";

  it("prices the recorded payload at the 0.72 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      resolution: "480p",
      duration: 4,
      generate_audio: false,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.72, 9);
  });

  it("bills a reference video's length on top of the output", () => {
    const result = estimate(
      model,
      {
        prompt: PROMPT,
        resolution: "720p",
        duration: 5,
        reference_videos: [video],
      },
      { inputDurationSeconds: 6 }
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.22 * (6 + 5), 9);
  });

  it("fails closed on reference videos without their length", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      reference_videos: [video],
    });

    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(
      "costHints.inputDurationSeconds"
    );
  });
});

describe("wavespeed black-forest-labs/flux-3/text-to-video", () => {
  const model = "black-forest-labs/flux-3/text-to-video";

  it("prices the recorded payload at the 0.85 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      resolution: "720p",
      duration: 5,
      generate_audio: false,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.85, 9);
  });

  it("bills 1080p at 29/17 of the 720p rate", () => {
    expect(
      estimate(model, { prompt: PROMPT, resolution: "1080p", duration: 20 }).usd
    ).toBeCloseTo(5.8, 9);
  });
});

describe("wavespeed bytedance/seedance-2.0/text-to-video", () => {
  const model = "bytedance/seedance-2.0/text-to-video";
  const video = "https://example.com/reference.mp4";

  it("prices the recorded payload at the 0.48 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      resolution: "480p",
      duration: 4,
      generate_audio: false,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.48, 9);
  });

  it("bills a reference video's length on top of the output", () => {
    const result = estimate(
      model,
      {
        prompt: PROMPT,
        resolution: "720p",
        duration: 5,
        reference_videos: [video],
      },
      { inputDurationSeconds: 6 }
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.15 * (6 + 5), 9);
  });

  it("caps the reference length at 15 s", () => {
    expect(
      estimate(
        model,
        { prompt: PROMPT, duration: 4, reference_videos: [video] },
        { inputDurationSeconds: 40 }
      ).usd
    ).toBeCloseTo(0.15 * (15 + 4), 9);
  });

  it("fails closed on reference videos without their length", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      reference_videos: [video],
    });

    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(
      "costHints.inputDurationSeconds"
    );
  });
});

describe("wavespeed google/gemini-omni-1.1-flash/text-to-video", () => {
  const model = "google/gemini-omni-1.1-flash/text-to-video";

  it("prices the recorded payload at the 0.09 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      resolution: "360p",
      duration: 3,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.09, 9);
  });

  it("bills 8 s at 720p by default", () => {
    expect(estimate(model, { prompt: PROMPT }).usd).toBeCloseTo(0.8, 9);
  });
});

describe("wavespeed minimax/h3/image-to-video", () => {
  const model = "minimax/h3/image-to-video";
  const image = "https://example.com/cat.jpg";

  it("prices the recorded payload at the 0.40 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      image,
      resolution: "768p",
      duration: 4,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.4, 9);
  });

  it("bills 2k at 1.4 times the 768p rate", () => {
    expect(
      estimate(model, { prompt: PROMPT, image, resolution: "2k", duration: 15 })
        .usd
    ).toBeCloseTo(2.1, 9);
  });
});

describe("wavespeed bytedance/seedance-2.5/image-to-video", () => {
  const model = "bytedance/seedance-2.5/image-to-video";
  const image = "https://example.com/cat.jpg";

  it("prices the recorded payload at the 0.72 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      image,
      resolution: "480p",
      duration: 4,
      generate_audio: false,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.72, 9);
  });

  it("bills 4k at ten times the 480p rate", () => {
    expect(
      estimate(model, { prompt: PROMPT, image, resolution: "4k", duration: 10 })
        .usd
    ).toBeCloseTo(18, 9);
  });
});

describe("wavespeed google/gemini-omni-1.1-flash/image-to-video", () => {
  const model = "google/gemini-omni-1.1-flash/image-to-video";
  const image = "https://example.com/cat.jpg";

  it("prices the recorded payload at the 0.09 USD list quote", () => {
    const result = estimate(model, {
      image,
      prompt: PROMPT,
      resolution: "360p",
      duration: 3,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.09, 9);
  });

  it("bills 8 s at 720p by default", () => {
    expect(estimate(model, { image, prompt: PROMPT }).usd).toBeCloseTo(0.8, 9);
  });
});

describe("wavespeed alibaba/wan-3.0/image-to-video", () => {
  const model = "alibaba/wan-3.0/image-to-video";
  const image = "https://example.com/cat.jpg";

  it("prices the recorded payload at the 0.10 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      image,
      resolution: "480p",
      duration: 2,
      generate_audio: false,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.1, 9);
  });

  it("bills 1080p at twice the 720p rate, up to 30 s", () => {
    expect(
      estimate(model, {
        prompt: PROMPT,
        image,
        resolution: "1080p",
        duration: 30,
      }).usd
    ).toBeCloseTo(6, 9);
  });
});

describe("wavespeed bytedance/seedance-2.0/image-to-video", () => {
  const model = "bytedance/seedance-2.0/image-to-video";
  const image = "https://example.com/cat.jpg";

  it("prices the recorded payload at the 0.48 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      image,
      resolution: "480p",
      duration: 4,
      generate_audio: false,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.48, 9);
  });

  it("bills 1080p at five times the 480p rate", () => {
    expect(
      estimate(model, {
        prompt: PROMPT,
        image,
        resolution: "1080p",
        duration: 15,
      }).usd
    ).toBeCloseTo(9, 9);
  });
});

describe("wavespeed black-forest-labs/flux-3/image-to-video", () => {
  const model = "black-forest-labs/flux-3/image-to-video";
  const image = "https://example.com/cat.jpg";

  it("prices the recorded payload at the 0.85 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      image,
      resolution: "720p",
      duration: 5,
      generate_audio: false,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.85, 9);
  });

  it("bills 1080p at 29/17 of the 720p rate", () => {
    expect(
      estimate(model, {
        prompt: PROMPT,
        image,
        resolution: "1080p",
        duration: 20,
      }).usd
    ).toBeCloseTo(5.8, 9);
  });
});
