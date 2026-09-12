import {activeCueAtFrame} from "./timeline";
import {jasonWuTestCues} from "./testScript";

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

assert(jasonWuTestCues.length === 4, "Expected four scripted sections");

const opening = activeCueAtFrame(jasonWuTestCues, 300, 30);
assert(opening.id === "test-opening", `Expected opening, got ${opening.id}`);

const duel = activeCueAtFrame(jasonWuTestCues, 1200, 30);
assert(duel.section.eyebrow === "COOK VS TERNUS", `Unexpected duel section: ${duel.section.eyebrow}`);

const ending = activeCueAtFrame(jasonWuTestCues, 3300, 30);
assert(ending.id === "test-ending", `Expected ending, got ${ending.id}`);
