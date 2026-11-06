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

describe("wavespeed x-ai/grok-imagine-video-v1.5/image-to-video", () => {
  const model = "x-ai/grok-imagine-video-v1.5/image-to-video";
  const image = "https://example.com/cat.jpg";

  it("prices the recorded payload at the 0.09 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      image,
      duration: 1,
      resolution: "480p",
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.09, 9);
  });

  it("bills 6 s at 720p plus the input image by default", () => {
    expect(estimate(model, { prompt: PROMPT, image }).usd).toBeCloseTo(0.85, 9);
  });
});

describe("wavespeed alibaba/happyhorse-1.1/image-to-video", () => {
  const model = "alibaba/happyhorse-1.1/image-to-video";
  const image = "https://example.com/cat.jpg";

  it("prices the recorded payload at the 0.21 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      image,
      resolution: "480p",
      duration: 3,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.21, 9);
  });

  it("bills 1080p at 0.18 USD/s", () => {
    expect(
      estimate(model, {
        prompt: PROMPT,
        image,
        resolution: "1080p",
        duration: 15,
      }).usd
    ).toBeCloseTo(2.7, 9);
  });
});

describe("wavespeed alibaba/wan-3.0/video-edit", () => {
  const model = "alibaba/wan-3.0/video-edit";
  const video = "https://example.com/cat.mp4";
  // The recorded clip, tests/fixtures/cat1-kling-o3-3s.mp4, runs 3.0 s.
  const clip = { inputDurationSeconds: 3 };

  it("prices the recorded payload at the 0.25 USD list quote", () => {
    const result = estimate(
      model,
      {
        prompt: "Make the cat's fur bright orange.",
        video,
        resolution: "480p",
        duration: 2,
        generate_audio: false,
      },
      clip
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo((3 + 2) * 0.05, 9);
  });

  it("bills the input's length again as the default output", () => {
    expect(
      estimate(model, { prompt: PROMPT, video, resolution: "720p" }, clip).usd
    ).toBeCloseTo((3 + 3) * 0.1, 9);
  });

  it("fails closed without the input video's length", () => {
    const result = estimate(model, { prompt: PROMPT, video });

    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(
      "costHints.inputDurationSeconds"
    );
  });
});

describe("wavespeed alibaba/wan-3.0/reference-to-video", () => {
  const model = "alibaba/wan-3.0/reference-to-video";
  const video = "https://example.com/ref.mp4";

  it("prices the recorded payload at the 0.10 USD list quote", () => {
    const result = estimate(model, {
      prompt:
        "The cat from the reference image walks across a sunlit wooden floor.",
      reference_images: ["https://example.com/cat.jpg"],
      resolution: "480p",
      duration: 2,
      generate_audio: false,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.1, 9);
  });

  it("bills a reference video's length on top of the output", () => {
    const result = estimate(
      model,
      { prompt: PROMPT, reference_videos: [video], duration: 5 },
      { inputDurationSeconds: 4 }
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo((5 + 4) * 0.1, 9);
  });

  it("fails closed on reference videos without their length", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      reference_videos: [video],
      duration: 5,
    });

    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(
      "costHints.inputDurationSeconds"
    );
  });

  it("bills 1080p at twice the 720p rate, up to 30 s", () => {
    expect(
      estimate(model, { prompt: PROMPT, resolution: "1080p", duration: 30 }).usd
    ).toBeCloseTo(6, 9);
  });

  // Free quotes (POST /api/v3/model/price) on 2026-11-02 priced these at
  // 0.50 and 1.20 USD list.
  it("bills 5 s at the 720p default", () => {
    expect(
      estimate(model, {
        prompt: PROMPT,
        reference_images: ["https://example.com/cat.jpg"],
      }).usd
    ).toBeCloseTo(0.5, 9);
  });

  it("bills several reference videos by their total length", () => {
    expect(
      estimate(
        model,
        { prompt: PROMPT, reference_videos: [video, video], duration: 5 },
        { inputDurationSeconds: 7 }
      ).usd
    ).toBeCloseTo((5 + 7) * 0.1, 9);
  });
});

describe("wavespeed bytedance/seedance-2.5/video-edit", () => {
  const model = "bytedance/seedance-2.5/video-edit";
  const video = "https://example.com/cat.mp4";

  it("prices the recorded payload at the 0.88 USD list quote", () => {
    // The recorded clip, tests/fixtures/cat1-kling-o3-3s.mp4, runs 3.0 s and
    // bills at the 4 s floor, twice: source and output.
    const result = estimate(
      model,
      {
        prompt: "Make the cat's fur bright orange.",
        video,
        resolution: "480p",
        generate_audio: false,
      },
      { inputDurationSeconds: 3 }
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(8 * 0.11, 9);
  });

  it("bills a longer source twice at its rounded-up length", () => {
    expect(
      estimate(
        model,
        { prompt: PROMPT, video, resolution: "720p" },
        { inputDurationSeconds: 10 }
      ).usd
    ).toBeCloseTo(20 * 0.22, 9);
  });

  it("trims the source to 30 s", () => {
    expect(
      estimate(
        model,
        { prompt: PROMPT, video, resolution: "4k" },
        { inputDurationSeconds: 45 }
      ).usd
    ).toBeCloseTo(60 * 1.1, 9);
  });

  it("fails closed without the input video's length", () => {
    const result = estimate(model, { prompt: PROMPT, video });

    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(
      "costHints.inputDurationSeconds"
    );
  });
});

describe("wavespeed heygen/video-1.0/reference-to-video", () => {
  const model = "heygen/video-1.0/reference-to-video";
  const image = "https://example.com/cat.jpg";
  const video = "https://example.com/ref.mp4";

  it("prices the recorded payload at the 0.425 USD list quote", () => {
    const result = estimate(model, {
      prompt:
        "The cat from the reference image walks across a sunlit wooden floor.",
      reference_images: [image],
      duration: 5,
      resolution: "480p",
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.425, 9);
  });

  it("adds 0.05 USD for each reference image past the second", () => {
    expect(
      estimate(model, {
        prompt: PROMPT,
        reference_images: Array(5).fill(image),
        resolution: "768p",
        duration: 5,
      }).usd
    ).toBeCloseTo(0.6 + 3 * 0.05, 9);
  });

  it("bills a reference video's full length on top of the output", () => {
    const result = estimate(
      model,
      { prompt: PROMPT, reference_videos: [video], duration: 5 },
      { inputDurationSeconds: 4 }
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo((5 + 4) * 0.12, 9);
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

describe("wavespeed google/gemini-omni-1.1-flash/video-edit", () => {
  const model = "google/gemini-omni-1.1-flash/video-edit";
  const video = "https://example.com/cat.mp4";

  it("prices the recorded payload at the 0.18 USD list quote", () => {
    // The recorded clip, tests/fixtures/cat1-kling-o3-3s.mp4, runs 3.0 s:
    // 0.02 USD/s to read it, then 3 output seconds at 0.04.
    const result = estimate(
      model,
      {
        video,
        prompt: "Make the cat's fur bright orange.",
        resolution: "360p",
      },
      { inputDurationSeconds: 3 }
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.06 + 3 * 0.04, 9);
  });

  it("bills the output at the source's length, 720p by default", () => {
    expect(
      estimate(model, { video, prompt: PROMPT }, { inputDurationSeconds: 8 })
        .usd
    ).toBeCloseTo(0.16 + 8 * 0.12, 9);
  });

  it("bills at least 3 output seconds and at most a 10 s source", () => {
    expect(
      estimate(
        model,
        { video, prompt: PROMPT, resolution: "4k" },
        { inputDurationSeconds: 1.2 }
      ).usd
    ).toBeCloseTo(0.04 + 3 * 0.36, 9);
    expect(
      estimate(
        model,
        { video, prompt: PROMPT, resolution: "1080p" },
        { inputDurationSeconds: 25 }
      ).usd
    ).toBeCloseTo(0.2 + 10 * 0.18, 9);
  });

  it("fails closed without the input video's length", () => {
    const result = estimate(model, { video, prompt: PROMPT });

    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(
      "costHints.inputDurationSeconds"
    );
  });
});

describe("wavespeed minimax/h3/reference-to-video", () => {
  const model = "minimax/h3/reference-to-video";
  const image = "https://example.com/cat.jpg";
  const video = "https://example.com/ref.mp4";

  it("prices the recorded payload at the 0.40 USD list quote", () => {
    const result = estimate(model, {
      prompt:
        "The cat from the reference image walks across a sunlit wooden floor.",
      reference_images: [image],
      resolution: "768p",
      duration: 4,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.4, 9);
  });

  it("adds 0.05 USD for each reference image past the fifth", () => {
    expect(
      estimate(model, {
        prompt: PROMPT,
        reference_images: Array(7).fill(image),
        duration: 4,
      }).usd
    ).toBeCloseTo(0.4 + 2 * 0.05, 9);
  });

  it("bills reference videos' length, at least 2 s, on top of the output", () => {
    const result = estimate(
      model,
      { prompt: PROMPT, reference_videos: [video], resolution: "2k" },
      { inputDurationSeconds: 1.5 }
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo((5 + 2) * 0.14, 9);
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

describe("wavespeed wavespeed-ai/minimax-h3/video-edit", () => {
  const model = "wavespeed-ai/minimax-h3/video-edit";
  const video = "https://example.com/cat.mp4";
  const image = "https://example.com/ref.jpg";
  // The recorded clip, tests/fixtures/cat1-kling-o3-3s.mp4, runs 3.0 s.
  const clip = { inputDurationSeconds: 3 };

  it("prices the recorded payload at the 0.30 USD list quote", () => {
    const result = estimate(
      model,
      {
        prompt: "Make the cat's fur bright orange.",
        video,
        resolution: "480p",
        duration: 3,
        generate_audio: false,
      },
      clip
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo((3 + 3) * 0.05, 9);
  });

  it("adds 0.02 USD per reference and follows the source by default", () => {
    expect(
      estimate(
        model,
        { prompt: PROMPT, video, reference_images: [image, image] },
        clip
      ).usd
    ).toBeCloseTo(0.6 + 2 * 0.02, 9);
  });

  it("bills at most 15 s of source and of output", () => {
    expect(
      estimate(
        model,
        { prompt: PROMPT, video, resolution: "1080p" },
        { inputDurationSeconds: 40 }
      ).usd
    ).toBeCloseTo((15 + 15) * 0.2, 9);
  });

  it("fails closed without the input video's length", () => {
    const result = estimate(model, { prompt: PROMPT, video });

    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(
      "costHints.inputDurationSeconds"
    );
  });
});

describe("wavespeed bytedance/seedance-2.5/reference-to-video", () => {
  const model = "bytedance/seedance-2.5/reference-to-video";
  const video = "https://example.com/ref.mp4";

  it("prices the recorded payload at the 0.72 USD list quote", () => {
    const result = estimate(model, {
      prompt:
        "The cat from the reference image walks across a sunlit wooden floor.",
      reference_images: ["https://example.com/cat.jpg"],
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

describe("wavespeed alibaba/happyhorse-1.0/video-edit", () => {
  const model = "alibaba/happyhorse-1.0/video-edit";
  const video = "https://example.com/cat.mp4";
  // The recorded clip, tests/fixtures/cat1-kling-o3-3s.mp4, runs 3.0 s.
  const clip = { inputDurationSeconds: 3 };

  it("prices the recorded payload at the 0.84 USD list quote", () => {
    const result = estimate(
      model,
      {
        prompt: "Make the cat's fur bright orange.",
        video,
        resolution: "720p",
      },
      clip
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.84, 9);
  });

  it("bills 1080p at 0.48 USD/s and defaults to 720p", () => {
    expect(
      estimate(model, { prompt: PROMPT, video, resolution: "1080p" }, clip).usd
    ).toBeCloseTo(1.44, 9);
    expect(estimate(model, { prompt: PROMPT, video }, clip).usd).toBeCloseTo(
      0.84,
      9
    );
  });

  it("rounds the source up, from a 3 s floor to a 60 s cap", () => {
    for (const [seconds, billed] of [
      [1, 3],
      [3.2, 4],
      [4, 4],
      [90, 60],
    ] as const) {
      expect(
        estimate(
          model,
          { prompt: PROMPT, video },
          { inputDurationSeconds: seconds }
        ).usd,
        String(seconds)
      ).toBeCloseTo(billed * 0.28, 9);
    }
  });

  it("adds nothing for reference images", () => {
    const image = "https://example.com/ref.jpg";

    expect(
      estimate(model, { prompt: PROMPT, video, images: [image, image] }, clip)
        .usd
    ).toBeCloseTo(0.84, 9);
  });

  it("fails closed without the input video's length", () => {
    const result = estimate(model, { prompt: PROMPT, video });

    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(
      "costHints.inputDurationSeconds"
    );
  });
});

describe("wavespeed bytedance/seedance-2.0/video-edit", () => {
  const model = "bytedance/seedance-2.0/video-edit";
  const video = "https://example.com/cat.mp4";
  // The recorded clip, tests/fixtures/cat1-kling-o3-3s.mp4, runs 3.0 s.
  const clip = { inputDurationSeconds: 3 };

  it("prices the recorded payload at the 0.525 USD list quote", () => {
    const result = estimate(
      model,
      {
        prompt: "Make the cat's fur bright orange.",
        video,
        resolution: "480p",
        duration: 4,
        generate_audio: false,
      },
      clip
    );

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo((3 + 4) * 0.075, 9);
  });

  it("follows the source, at least 4 s of output, at the 720p default", () => {
    expect(estimate(model, { prompt: PROMPT, video }, clip).usd).toBeCloseTo(
      (3 + 4) * 0.15,
      9
    );
    expect(
      estimate(
        model,
        { prompt: PROMPT, video, resolution: "1080p" },
        { inputDurationSeconds: 4 }
      ).usd
    ).toBeCloseTo((4 + 4) * 0.375, 9);
    expect(
      estimate(model, { prompt: PROMPT, video }, { inputDurationSeconds: 10 })
        .usd
    ).toBeCloseTo((10 + 10) * 0.15, 9);
  });

  it("bills a set duration on top of the source", () => {
    expect(
      estimate(
        model,
        { prompt: PROMPT, video, resolution: "480p", duration: 15 },
        clip
      ).usd
    ).toBeCloseTo((3 + 15) * 0.075, 9);
    expect(
      estimate(
        model,
        { prompt: PROMPT, video, resolution: "4k", duration: 15 },
        { inputDurationSeconds: 4 }
      ).usd
    ).toBeCloseTo((4 + 15) * 0.75, 9);
  });

  it("reads the source between 2 and 15 s, rounded up", () => {
    for (const [seconds, read] of [
      [1, 2],
      [3.2, 4],
      [40, 15],
    ] as const) {
      expect(
        estimate(
          model,
          { prompt: PROMPT, video, duration: 4 },
          { inputDurationSeconds: seconds }
        ).usd,
        String(seconds)
      ).toBeCloseTo((read + 4) * 0.15, 9);
    }
  });

  it("adds nothing for reference images and audio", () => {
    const url = "https://example.com/ref.jpg";

    expect(
      estimate(
        model,
        {
          prompt: PROMPT,
          video,
          resolution: "480p",
          duration: 4,
          reference_images: [url, url],
          reference_audios: [url],
        },
        clip
      ).usd
    ).toBeCloseTo((3 + 4) * 0.075, 9);
  });

  it("fails closed without the input video's length", () => {
    const result = estimate(model, { prompt: PROMPT, video });

    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(
      "costHints.inputDurationSeconds"
    );
  });
});
