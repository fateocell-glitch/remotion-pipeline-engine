"use strict";

const {readFile, writeFile} = require("node:fs/promises");
const {existsSync} = require("node:fs");
const {join} = require("node:path");
const {mergeWhisperCaptions} = require("./project-onboarding.cjs");
const {captionsToWhisperTranscript, runFasterTranscription} = require("./faster-transcription.cjs");

const root = process.cwd();

function applyEnglishCaptions(project, translatedCaptions, rawTranslations = []) {
  return {
    ...project,
    captions: project.captions.map((caption, index) => ({
      ...caption,
      en: !caption.en?.trim() || rawTranslations.includes(caption.en.trim()) ? (translatedCaptions[index]?.en || caption.en || "") : caption.en,
    })),
  };
}


async function backfillEnglish(projectId) {
  const projectFile = join(root, "src", "JasonWu", "projects", `${projectId}.json`);
  const project = JSON.parse(await readFile(projectFile, "utf8"));
  const audioPath = join(root, "public", project.audioSrc);
  if (!existsSync(audioPath)) {
    throw new Error("Project audio is missing.");
  }
  const outputFile = join(root, "out", `${projectId}-faster-whisper-en.json`);
  const translatedRows = await runFasterTranscription({audioPath, outputPath: outputFile, language: "zh", task: "translate"});
  const translated = captionsToWhisperTranscript(translatedRows, "en");
  const translatedCaptions = mergeWhisperCaptions(project.captions, translated);
  const rawTranslations = (translated.transcription ?? []).map((item) => String(item.text ?? "").trim());
  const updated = applyEnglishCaptions(project, translatedCaptions, rawTranslations);
  await writeFile(projectFile, `${JSON.stringify(updated, null, 2)}\n`);
  return updated;
}

module.exports = {applyEnglishCaptions, backfillEnglish};

if (require.main === module) {
  backfillEnglish(process.argv[2]).then((project) => console.log(`Updated ${project.projectId}: ${project.captions.length} captions.`)).catch((error) => {console.error(error.stack || error.message); process.exitCode = 1;});
}
