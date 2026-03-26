import {
  kimicoding as createKimicoding,
  textBlock,
  imageBase64,
} from "@nakedapi/kimicoding";

const kimicoding = createKimicoding({
  apiKey: process.env.KIMI_CODING_API_KEY || "your-api-key-here",
  timeout: 60000,
});

// Create a tiny 1x1 red PNG programmatically (no external file needed)
function makeRedPixelPng() {
  // Minimal valid PNG: 1x1 red pixel
  const buf = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64"
  );
  return buf.toString("base64");
}

const redPixel = makeRedPixelPng();

// Simple text chat using promises
kimicoding
  .chat({
    model: "k2p5",
    messages: [{ role: "user", content: "What is the capital of France?" }],
    maxTokens: 256,
  })
  .then(function (response) {
    console.log("=== Text Chat ===");
    console.log("Response:", response.content);
    console.log("Tokens used:", response.usage.totalTokens);
    console.log();

    // Analyze an image using vision (base64)
    return kimicoding.chat({
      model: "k2p5",
      messages: [
        {
          role: "user",
          content: [
            imageBase64(redPixel, "image/png"),
            textBlock("What do you see in this image? Describe it."),
          ],
        },
      ],
      maxTokens: 512,
    });
  })
  .then(function (response) {
    console.log("=== Image Analysis ===");
    console.log("Response:", response.content);
    console.log("Tokens used:", response.usage.totalTokens);
    console.log();

    // Multi-turn conversation with an image
    return kimicoding.chat({
      model: "k2p5",
      systemPrompt: "You are a helpful image analyst.",
      messages: [
        {
          role: "user",
          content: [
            imageBase64(redPixel, "image/png"),
            textBlock("What color is this image?"),
          ],
        },
        {
          role: "assistant",
          content: "The image appears to be a single red pixel.",
        },
        {
          role: "user",
          content: "What CSS hex code would match that color?",
        },
      ],
      maxTokens: 256,
    });
  })
  .then(function (response) {
    console.log("=== Multi-turn with Image ===");
    console.log("Response:", response.content);
    console.log("Tokens used:", response.usage.totalTokens);
  })
  .catch(function (err) {
    console.error("Error:", err.message);
    process.exit(1);
  });
