import {activeCueAtFrame, jasonWuCues} from "./timeline";

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const introCue = activeCueAtFrame(jasonWuCues, 90, 30);
assert(introCue.id === "intro-ceo", `Expected intro cue, got ${introCue.id}`);

const eventCue = activeCueAtFrame(jasonWuCues, 600, 30);
assert(
  eventCue.section.eyebrow === "APPLE EVENT · SURPRISE AND SHINE",
  `Unexpected event cue: ${eventCue.section.eyebrow}`,
);

const finalCue = activeCueAtFrame(jasonWuCues, 2000, 30);
assert(finalCue.id === "value-verdict", `Expected final cue, got ${finalCue.id}`);
