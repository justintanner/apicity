import { describe, expect, it } from "vitest";
import { selectGreenPath } from "../../scripts/lib/select-green-path.mjs";

interface GreenPathCandidate {
  recordingName: string;
  payload: unknown;
  payloadString: string;
}

function candidate(
  recordingName: string,
  payloadString: string
): GreenPathCandidate {
  return {
    recordingName,
    payload: { recordingName },
    payloadString,
  };
}

describe("selectGreenPath", () => {
  it("returns null for empty input", () => {
    expect(selectGreenPath([])).toBeNull();
  });

  it("returns the only candidate unchanged", () => {
    const only = candidate("tests/recordings/openai/chat-large", "large");

    expect(selectGreenPath([only])).toBe(only);
  });

  it("prefers a manual override slug suffix", () => {
    const smaller = candidate("tests/recordings/openai/chat-hello", "x");
    const override = candidate(
      "tests/recordings/openai/custom-success",
      "larger payload"
    );

    expect(selectGreenPath([smaller, override], "custom-success")).toBe(
      override
    );
  });

  it("prefers conventional green-path suffixes before payload size", () => {
    const tinyNonConventional = candidate(
      "tests/recordings/openai/chat-edge",
      "x"
    );
    const hello = candidate("tests/recordings/openai/chat-hello", "larger");
    const basic = candidate("tests/recordings/openai/chat-basic", "small");
    const simple = candidate("tests/recordings/openai/chat-simple", "medium");

    expect(selectGreenPath([tinyNonConventional, hello, basic, simple])).toBe(
      basic
    );
  });

  it("falls back to the smallest payload without an override or convention", () => {
    const larger = candidate("tests/recordings/openai/chat-beta", "larger");
    const smaller = candidate("tests/recordings/openai/chat-alpha", "tiny");

    expect(selectGreenPath([larger, smaller])).toBe(smaller);
  });

  it("breaks equal-size payload ties alphabetically by recording name", () => {
    const later = candidate("tests/recordings/openai/chat-zeta", "same");
    const earlier = candidate("tests/recordings/openai/chat-alpha", "same");

    expect(selectGreenPath([later, earlier])).toBe(earlier);
  });
});
