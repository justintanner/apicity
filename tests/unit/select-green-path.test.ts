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

  it("requires a manual override to match the recording slug suffix", () => {
    const nearMatch = candidate(
      "tests/recordings/openai/custom-success-extra",
      "x"
    );
    const conventional = candidate(
      "tests/recordings/openai/chat-hello",
      "larger payload"
    );

    expect(selectGreenPath([nearMatch, conventional], "custom-success")).toBe(
      conventional
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

  it("filters near-conventional names before choosing by payload size", () => {
    const tinyNearMatch = candidate(
      "tests/recordings/openai/chat-hello-extra",
      "x"
    );
    const largerConventional = candidate(
      "tests/recordings/openai/chat-simple",
      "larger payload"
    );

    expect(selectGreenPath([tinyNearMatch, largerConventional])).toBe(
      largerConventional
    );
  });

  it("falls back to the smallest payload without an override or convention", () => {
    const larger = candidate("tests/recordings/openai/chat-beta", "larger");
    const smaller = candidate("tests/recordings/openai/chat-alpha", "tiny");

    expect(selectGreenPath([larger, smaller])).toBe(smaller);
  });

  it("breaks conventional candidate ties alphabetically by recording name", () => {
    const later = candidate("tests/recordings/openai/chat-simple", "same");
    const earlier = candidate("tests/recordings/openai/chat-basic", "same");
    const nonConventional = candidate(
      "tests/recordings/openai/chat-alpha",
      "x"
    );

    expect(selectGreenPath([later, earlier, nonConventional])).toBe(earlier);
  });

  it("breaks equal-size payload ties alphabetically by recording name", () => {
    const later = candidate("tests/recordings/openai/chat-zeta", "same");
    const earlier = candidate("tests/recordings/openai/chat-alpha", "same");

    expect(selectGreenPath([later, earlier])).toBe(earlier);
  });
});
