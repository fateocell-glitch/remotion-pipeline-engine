import {activeCueAtFrame} from "./timeline";
import {zhuzigeFullCues} from "./zhuzigeFullScript";

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

assert(zhuzigeFullCues.length >= 30, "Expected dense visual beats across the full video");
assert(new Set(zhuzigeFullCues.map((cue) => cue.layout)).size >= 16, "Expected varied effect layouts without repeated modules");
assert(
  activeCueAtFrame(zhuzigeFullCues, 0, 30).id === "zhuzige-succession",
  "Unexpected opening section",
);
assert(
  activeCueAtFrame(zhuzigeFullCues, 600, 30).id === "zhuzige-profile",
  "Expected a distinct visual beat at 20 seconds",
);
assert(
  activeCueAtFrame(zhuzigeFullCues, 2400, 30).id === "zhuzige-platform-shift",
  "Expected a distinct visual beat at 80 seconds",
);
assert(
  activeCueAtFrame(zhuzigeFullCues, 7800, 30).id === "zhuzige-future",
  "Unexpected future section",
);

const finalCue = zhuzigeFullCues[zhuzigeFullCues.length - 1];
assert(finalCue?.end === 442.62, "Timeline must end at the source audio duration");


