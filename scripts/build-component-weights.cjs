"use strict";

const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: ["src/design/component-weights-client.tsx"],
  outfile: "public/component-weights.js",
  bundle: true,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  target: ["es2018"],
  logLevel: "info",
});
