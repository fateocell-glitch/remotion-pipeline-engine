const assert = require("node:assert/strict");
const test = require("node:test");

const {faceZoneFromDetections, isFaceZoneCacheValid, ffmpegSpawnSpec} = require("./face-detector.cjs");

test("face detector normalizes the largest detected face with a safe margin", () => {
  const zone = faceZoneFromDetections([{x:80,y:30,w:140,h:220,score:0.8},{x:680,y:80,w:260,h:440,score:0.94}], 1000, 600, {sourceFingerprint:"video-a", beatStart:10, beatEnd:40});
  assert.equal(zone.faceArea, "right");
  assert.ok(zone.faceX > .6);
  assert.ok(zone.safeX < zone.faceX);
  assert.ok(zone.faceAreaRatio > .18);
  assert.equal(zone.facePresenceRatio, 1);
  assert.equal(zone.sourceFingerprint, "video-a");
});

test("face detector cache only reuses a matching video fingerprint and beat range", () => {
  const zone = {detectorVersion:"yunet-v1",sourceFingerprint:"video-a",beatStart:10,beatEnd:40};
  assert.equal(isFaceZoneCacheValid(zone,{sourceFingerprint:"video-a",beatStart:10,beatEnd:40}), true);
  assert.equal(isFaceZoneCacheValid(zone,{sourceFingerprint:"video-b",beatStart:10,beatEnd:40}), false);
});


test("face extraction uses the project Windows command wrapper for remotion.CMD", () => {
  const spec = ffmpegSpawnSpec("C:/workspace/node_modules/.bin/remotion.CMD", ["ffmpeg"], "win32");
  assert.equal(spec.options.shell, true);
});
