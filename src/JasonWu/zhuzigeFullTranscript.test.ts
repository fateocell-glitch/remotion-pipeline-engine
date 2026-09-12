import {zhuzigeFullTranscript} from "./zhuzigeFullTranscript";

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const finalCue = zhuzigeFullTranscript[zhuzigeFullTranscript.length - 1];

assert(zhuzigeFullTranscript.length === 202, "Expected every VTT caption to be displayed");
assert(finalCue !== undefined, "Expected a final caption");
assert(finalCue!.end >= 442.62, "Captions must cover the full source audio");
assert(
  zhuzigeFullTranscript.every((cue) => Boolean(cue.zh) && Boolean(cue.en)),
  "Every caption must have Chinese and English lines",
);



