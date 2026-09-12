"use strict";

const {readFileSync} = require("node:fs");
const {resolve} = require("node:path");

const assertFiniteSeconds = (value, name) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number.`);
  }
};

function buildProjectRenderPlan(project) {
  if (!project || !Number.isFinite(project.fps) || project.fps <= 0 || !Array.isArray(project.beats)) {
    throw new Error("Project must provide a positive fps and a beats array.");
  }

  let expectedStartFrame = 0;
  return project.beats.map((beat, index) => {
    if (!beat || typeof beat.id !== "string") {
      throw new Error(`Beat ${index + 1} must have an id.`);
    }
    assertFiniteSeconds(beat.start, `Beat ${beat.id} start`);
    assertFiniteSeconds(beat.end, `Beat ${beat.id} end`);
    if (beat.end <= beat.start) {
      throw new Error(`Beat ${beat.id} must end after it starts.`);
    }

    const startFrame = Math.floor(beat.start * project.fps);
    const endFrame = Math.ceil(beat.end * project.fps) - 1;
    if (startFrame !== expectedStartFrame) {
      throw new Error(`Beat plan must be contiguous at ${beat.id}.`);
    }
    if (endFrame < startFrame) {
      throw new Error(`Beat ${beat.id} has no renderable frames.`);
    }
    expectedStartFrame = endFrame + 1;
    return {id: beat.id, frames: `${startFrame}-${endFrame}`};
  });
}

module.exports = {buildProjectRenderPlan};

if (require.main === module) {
  const projectFile = process.argv[2];
  if (!projectFile) {
    throw new Error("Usage: node scripts/project-render-plan.cjs <project.json>");
  }
  const project = JSON.parse(readFileSync(resolve(projectFile), "utf8"));
  process.stdout.write(`${JSON.stringify(buildProjectRenderPlan(project))}\n`);
}
