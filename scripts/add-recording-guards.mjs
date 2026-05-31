import fs from "fs";
import path from "path";

const testsDir = "tests/integration";

// Expensive test patterns: tests that hit LLM inference, image/video/audio generation
const expensivePatterns = [
  // LLM chat/completions
  /chat\.test\.ts$/,
  /messages\.test\.ts$/,
  /completions\.test\.ts$/,
  /responses\.test\.ts$/,
  /claude\.test\.ts$/,
  // Image generation
  /image\.test\.ts$/,
  /images\.test\.ts$/,
  /image-.*\.test\.ts$/,
  /gpt-image.*\.test\.ts$/,
  /qwen-image.*\.test\.ts$/,
  /grok-imagine.*\.test\.ts$/,
  /seedream.*\.test\.ts$/,
  /nano-banana.*\.test\.ts$/,
  /hunyuan.*\.test\.ts$/,
  /qwen-image.*\.test\.ts$/,
  /wan-image.*\.test\.ts$/,
  // Video generation
  /video.*\.test\.ts$/,
  /i2v.*\.test\.ts$/,
  /t2v.*\.test\.ts$/,
  /r2v.*\.test\.ts$/,
  /seedance.*\.test\.ts$/,
  /kling-video.*\.test\.ts$/,
  /sora.*\.test\.ts$/,
  /veo.*\.test\.ts$/,
  /wan-.*video.*\.test\.ts$/,
  /happyhorse.*\.test\.ts$/,
  /videoedit.*\.test\.ts$/,
  /video-edit.*\.test\.ts$/,
  /video-gen.*\.test\.ts$/,
  /video-extension.*\.test\.ts$/,
  /video-edits.*\.test\.ts$/,
  /video-extensions.*\.test\.ts$/,
  // Audio/music generation
  /suno.*\.test\.ts$/,
  /sound-generation.*\.test\.ts$/,
  /speech\.test\.ts$/,
  /speech-to-text.*\.test\.ts$/,
  /tts\.test\.ts$/,
  /stt\.test\.ts$/,
  /audio.*\.test\.ts$/,
  // Batch/fine-tuning
  /batches.*\.test\.ts$/,
  /batch.*\.test\.ts$/,
  /fine-tuning.*\.test\.ts$/,
  /sft.*\.test\.ts$/,
  /dpo.*\.test\.ts$/,
  /rft.*\.test\.ts$/,
  /rlor.*\.test\.ts$/,
  /evaluators.*\.test\.ts$/,
  /evaluation.*\.test\.ts$/,
  /deployedmodels.*\.test\.ts$/,
  // Workflow generation
  /workflows.*\.test\.ts$/,
  /kontext.*\.test\.ts$/,
  // Stream tests (expensive because they hit LLM)
  /stream\.test\.ts$/,
  /stream-.*\.test\.ts$/,
  // Custom voices
  /custom-voices.*\.test\.ts$/,
  // Realtime
  /realtime.*\.test\.ts$/,
  // Veo/extend
  /extend.*\.test\.ts$/,
  // Edit
  /edit.*\.test\.ts$/,
  // Other expensive
  /vision.*\.test\.ts$/,
  /transcribe.*\.test\.ts$/,
  /translate.*\.test\.ts$/,
  /moderations.*\.test\.ts$/,
  /embeddings.*\.test\.ts$/,
];

// Exclude tests that already have recordingExists guards
const files = fs.readdirSync(testsDir).filter((f) => {
  if (!f.endsWith(".test.ts")) return false;
  const content = fs.readFileSync(path.join(testsDir, f), "utf8");
  if (content.includes("recordingExists")) return false;
  return expensivePatterns.some((p) => p.test(f));
});

console.log(
  `Found ${files.length} expensive tests without recordingExists guards:`
);
files.forEach((f) => console.log(`  ${f}`));

for (const file of files) {
  const filePath = path.join(testsDir, file);
  let content = fs.readFileSync(filePath, "utf8");

  // Check if file already imports getPollyMode and recordingExists
  const hasHarnessImport = content.includes("../harness");
  const hasGetPollyMode = content.includes("getPollyMode");
  const hasRecordingExists = content.includes("recordingExists");

  if (!hasHarnessImport) {
    console.log(`  SKIP ${file}: no harness import`);
    continue;
  }

  if (hasRecordingExists) {
    console.log(`  SKIP ${file}: already has recordingExists`);
    continue;
  }

  // Add imports
  if (!hasGetPollyMode) {
    // Update harness import to include getPollyMode and recordingExists
    content = content.replace(
      /from\s+"\.\.\/harness";/,
      `from "../harness";\nimport { getPollyMode, recordingExists } from "../harness";`
    );
    // Fix double import if both patterns matched
    content = content.replace(
      /from\s+"\.\.\/harness";\nimport \{ getPollyMode, recordingExists \} from "\.\.\/harness";/,
      `from "../harness";`
    );
  }

  // Add guard pattern to each it() that makes an API call
  // This is a simple heuristic: add guard after the first await or provider call
  // Actually, we need to be more careful. Let's add the guard at the start of the test function.

  // Find the recording name from setupPolly calls
  const setupPollyMatch = content.match(/setupPolly\("([^"]+)"\)/);
  const recordingName = setupPollyMatch ? setupPollyMatch[1] : null;

  if (!recordingName) {
    console.log(`  SKIP ${file}: no setupPolly call found`);
    continue;
  }

  // Add recordingExists guard before setupPolly call
  content = content.replace(
    /ctx = setupPolly\(/,
    `if (getPollyMode() === "replay" && !recordingExists("${recordingName}")) {\n      return;\n    }\n\n    ctx = setupPolly(`
  );

  // Also handle the case where setupPolly is called directly without ctx =
  content = content.replace(/setupPolly\(/g, (match, offset, string) => {
    // Check if this match is already guarded
    const before = string.slice(Math.max(0, offset - 100), offset);
    if (before.includes("recordingExists")) return match;
    return match;
  });

  fs.writeFileSync(filePath, content);
  console.log(`  UPDATED ${file}`);
}

console.log("\nDone.");
