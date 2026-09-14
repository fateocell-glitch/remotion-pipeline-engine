"use strict";

const roundSeconds = (value) => Number(value.toFixed(2));
const toSeconds = (value) => { const number = Number(value); return Number.isFinite(number) ? number : 0; };
const isSentenceEnd = (caption) => /[。！？!?]/.test(String(caption?.zh ?? caption?.text ?? ""));

function normalizeCaptions(captions) {
  return (Array.isArray(captions) ? captions : []).map((caption) => ({...caption, start: toSeconds(caption?.start ?? caption?.offsets?.from), end: toSeconds(caption?.end ?? caption?.offsets?.to)})).filter((caption) => caption.end > caption.start).sort((left, right) => left.end - right.end);
}

function punctuationClass(caption) {
  const text = String(caption?.zh ?? caption?.text ?? "").trim();
  if (/[。！？!?]$/.test(text)) return "sentence";
  if (/[，,；;]$/.test(text)) return "comma";
  return "endpoint";
}

const continuationStart = /^(?:也|还|并|而|才|就|却|根本|他们|我们才|大家|这个|这些|这|那|其|搞清楚|真的|的|如果|因为|所以|最后|接着|再|在|到底|就是|能|会|要|不|没有|包括|从|对|把|给|跟|和|但|但是)/;
const incompleteTail = /(?:的|地|得|在|把|将|让|给|跟|和|对|从|向|于|是|有|要|会|能|想|被|这一年|这个|这些|这种)$/;
const terminalTail = /(?:了|吗|吧|呢|啊|呀|顾问|答案|指南|结论|问题|策略|基础|价值|方向)$/;
const dependentLead = /^(?:如果|虽然|因为|当|在|对于|随着)/;
const weakEndpoint = /(?:所以你看|讲白了|说真的|其实|然后|接着|最后|看到这些整理|搞清楚这点|AI就算在聪明)$/;
function isIndependentEndpoint(caption, next) {
  const text = String(caption?.zh ?? caption?.text ?? "").trim();
  const nextText = String(next?.zh ?? next?.text ?? "").trim();
  if (!text || incompleteTail.test(text) || dependentLead.test(text) || weakEndpoint.test(text)) return false;
  if (/(?:that|which|because|while|although|where|when|if|and|but|or|with|to)$/i.test(text)) return false;
  if (continuationStart.test(nextText) && !terminalTail.test(text)) return false;
  if (/^(?:that|which|because|while|although|where|when|if|and|but|or|with|to)\b/i.test(nextText)) return false;
  return true;
}

function boundaryCandidates(captions, start, minEnd, maxEnd) {
  return captions.map((caption, index) => {
    const next = captions[index + 1];
    const silence = next ? next.start - caption.end : 0;
    const kind = silence > 0.5 ? "silence" : punctuationClass(caption);
    return {end: caption.end, kind, silence, independent: isIndependentEndpoint(caption, next)};
  }).filter((candidate) => candidate.end >= minEnd && candidate.end <= maxEnd);
}
const nearestBoundary = (candidates, pivot) => candidates.slice().sort((left, right) => Math.abs(left.end - pivot) - Math.abs(right.end - pivot) || left.end - right.end)[0];

function chooseBoundary(captions, start, total, target, language = "zh") {
  const semanticMode = target >= 18;
  if (!semanticMode) return roundSeconds(Math.min(total, start + target));
  const minDuration = target >= 25 ? 25 : (language === "en" ? 20 : 22);
  const preferredDuration = Math.max(minDuration, target || 30);
  const maxDuration = target >= 25 ? 35 : (language === "en" ? 32 : 35);
  const minEnd = Math.min(total, start + minDuration);
  const hardEnd = Math.min(total, start + maxDuration);
  const candidates = boundaryCandidates(captions, start, minEnd, hardEnd);
  const natural = candidates.filter((candidate) => candidate.kind === "sentence" || candidate.kind === "silence");
  const sentenceOrSilence = nearestBoundary(natural, start + preferredDuration);
  if (sentenceOrSilence) return roundSeconds(sentenceOrSilence.end);
  const endpoint = nearestBoundary(candidates.filter((candidate) => candidate.kind === "endpoint" && candidate.independent), start + preferredDuration);
  if (endpoint) return roundSeconds(endpoint.end);
  const comma = nearestBoundary(candidates.filter((candidate) => candidate.kind === "comma" && candidate.independent), start + preferredDuration);
  if (comma) return roundSeconds(comma.end);
  const nextEndpoint = captions.find((caption) => caption.end > hardEnd);
  return roundSeconds(nextEndpoint ? nextEndpoint.end : hardEnd);
}

function generateInitialBeats(totalDurationInSeconds, targetBeatDuration = 30, captions = [], {language = "zh"} = {}) {
  if (!Number.isFinite(totalDurationInSeconds) || totalDurationInSeconds <= 0) throw new Error("totalDurationInSeconds must be a positive number.");
  if (!Number.isFinite(targetBeatDuration) || targetBeatDuration <= 0) throw new Error("targetBeatDuration must be a positive number.");

  const normalizedCaptions = normalizeCaptions(captions);
  const firstSpokenStart = normalizedCaptions.length ? Math.max(0, normalizedCaptions[0].start) : 0;
  const beats = [];
  let currentStart = firstSpokenStart;
  let index = 1;

  while (currentStart < totalDurationInSeconds) {
    const remaining = totalDurationInSeconds - currentStart;
    const finalThreshold = targetBeatDuration >= 25 ? 25 : (targetBeatDuration >= 18 ? (language === "en" ? 20 : 22) : targetBeatDuration);
    const maxDuration = targetBeatDuration >= 25 ? 35 : (language === "en" ? 32 : 35);
    const previousDuration = beats.length ? beats.at(-1).end - beats.at(-1).start : 0;
    const canAbsorbWithinNormalLimit = previousDuration + remaining <= maxDuration;
    const canAbsorbMicroTail = remaining <= 5 && previousDuration + remaining <= 38;
    if (targetBeatDuration >= 18 && beats.length && remaining < finalThreshold && (canAbsorbWithinNormalLimit || canAbsorbMicroTail)) {
      beats.at(-1).end = roundSeconds(totalDurationInSeconds);
      break;
    }
    const nextEnd = remaining <= finalThreshold ? totalDurationInSeconds : chooseBoundary(normalizedCaptions, currentStart, totalDurationInSeconds, targetBeatDuration, language);
    const safeEnd = nextEnd > currentStart ? nextEnd : Math.min(totalDurationInSeconds, currentStart + targetBeatDuration);
    const paddedIndex = String(index).padStart(3, "0");
    const chapterIndex = String(index).padStart(2, "0");
    beats.push({id: "beat-" + paddedIndex, start: roundSeconds(currentStart), end: roundSeconds(safeEnd), chapter: "CHAPTER " + chapterIndex, headline: "Key Point " + index, subtitle: "Topic Highlight " + index, zh: "文案要点 " + index, en: "Core point " + index, layout: "chapter-card", props: {}});
    currentStart = safeEnd;
    index += 1;
  }
  return beats;
}
if (require.main === module) {
  const [durationArg, targetArg] = process.argv.slice(2);
  const duration = Number(durationArg);
  const target = targetArg === undefined ? 20 : Number(targetArg);
  process.stdout.write(JSON.stringify({beats: generateInitialBeats(duration, target)}, null, 2) + "\n");
}

module.exports = {generateInitialBeats, chooseBoundary, boundaryCandidates};
