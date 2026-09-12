const assert = require("node:assert/strict");
const test = require("node:test");
const {toSpawnSpec} = require("./local-command.cjs");

test("uses the Windows shell for cmd files", () => {
  assert.deepEqual(toSpawnSpec("D:\\project\\node_modules\\.bin\\remotion.CMD", ["ffmpeg", "-i", "input.mp4"], "win32"), {command: "D:\\project\\node_modules\\.bin\\remotion.CMD", args: ["ffmpeg", "-i", "input.mp4"], options: {shell: true}});
});

test("leaves ordinary executables unchanged", () => {
  assert.deepEqual(toSpawnSpec("D:\\project\\tools\\whisper.exe", ["-m", "model.bin"], "win32"), {command: "D:\\project\\tools\\whisper.exe", args: ["-m", "model.bin"], options: {}});
});