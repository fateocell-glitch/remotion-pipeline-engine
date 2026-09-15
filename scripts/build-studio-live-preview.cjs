"use strict";
const esbuild = require("esbuild");
esbuild.buildSync({entryPoints:["src/JasonWu/StudioLivePreview.tsx"],outfile:"public/studio-live-preview.js",bundle:true,platform:"browser",format:"iife",jsx:"automatic",target:["es2018"],loader:{".woff":"file",".woff2":"file"},assetNames:"assets/[name]-[hash]",logLevel:"info"});