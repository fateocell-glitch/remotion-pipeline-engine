"use strict";

function toSpawnSpec(command, args, platform = process.platform) {
  if (platform === "win32" && /\.(cmd|bat)$/i.test(command)) {
    return {command, args, options: {shell: true}};
  }
  return {command, args, options: {}};
}

module.exports = {toSpawnSpec};