"use strict";
const esbuild = require("esbuild");
esbuild.buildSync({entryPoints:["src/design/admin-components-client.tsx"],outfile:"public/admin-components.js",bundle:true,platform:"browser",format:"iife",jsx:"automatic",target:["es2018"],loader:{".woff":"file",".woff2":"file"},assetNames:"assets/[name]-[hash]",logLevel:"info"});
