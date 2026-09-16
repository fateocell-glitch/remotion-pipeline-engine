"use strict";

const assert = require("node:assert/strict");
const {spawn} = require("node:child_process");
const {copyFile, mkdir, rm, writeFile} = require("node:fs/promises");
const {join, relative, resolve, isAbsolute} = require("node:path");
const {stage1TranscribeToReview, stage2ProduceFromConfirmed} = require("./run-local-onboarding.cjs");

const root = process.cwd();
const projectId = "qa-language-routing-" + Date.now();
const projectDir = join(root, "data", "projects", projectId);
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9344;
const profile = join(root, ".tmp-qa-language-routing");
const outputDir = join(root, "test-artifacts", "language-routing");
const screenshotFile = join(outputDir, "english-routing-studio.png");

const sleep = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
const run = (command, args) => new Promise((resolvePromise, reject) => {
  const child = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", command, ...args], {cwd: root, windowsHide: true});
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  child.on("error", reject);
  child.on("close", (code) => code === 0 ? resolvePromise(output) : reject(new Error(output || "ffmpeg fixture preparation failed")));
});
const workspacePath = (target) => {
  const targetPath = resolve(target);
  const relativePath = relative(root, targetPath);
  assert.ok(relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath), "Refusing to clean outside workspace: " + targetPath);
};
async function remove(target) {
  workspacePath(target);
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await rm(target, {recursive: true, force: true});
      return;
    } catch (error) {
      lastError = error;
      if (!["EBUSY", "EPERM", "EACCES"].includes(error?.code)) throw error;
      await sleep(150 * (attempt + 1));
    }
  }
  throw lastError;
}
async function stopBrowser(browser) {
  if (!browser || browser.killed) return;
  const exited = new Promise((resolvePromise) => browser.once("exit", resolvePromise));
  browser.kill();
  await Promise.race([exited, sleep(5_000)]);
}
async function waitFor(check, label, attempts = 120) {
  for (let index = 0; index < attempts; index += 1) {
    if (await check()) return;
    await sleep(100);
  }
  throw new Error("Timed out waiting for " + label);
}
async function openTarget() {
  const response = await fetch("http://127.0.0.1:" + port + "/json/new?" + encodeURIComponent("http://127.0.0.1:4318/"), {method: "PUT"});
  if (!response.ok) throw new Error("Chrome target creation failed: " + response.status);
  return response.json();
}
function connect(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let nextId = 1;
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!pending.has(message.id)) return;
    pending.get(message.id)(message);
    pending.delete(message.id);
  });
  const send = (method, params = {}) => new Promise((resolvePromise, reject) => {
    const id = nextId++;
    pending.set(id, resolvePromise);
    socket.send(JSON.stringify({id, method, params}));
    setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error("CDP timeout: " + method));
    }, 10_000);
  });
  return {socket, send};
}
async function evaluate(send, expression) {
  const response = await send("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true});
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Browser evaluation failed");
  return response.result?.result?.value;
}
async function createEnglishProject() {
  await mkdir(join(projectDir, "source"), {recursive: true});
  const rawVideo = join(projectDir, "source", "raw.mp4");
  const audioFile = join(projectDir, "source", "audio.wav");
  await copyFile(join(root, "public", "test.mp4"), rawVideo);
  await run(join(root, "node_modules", ".bin", "remotion.CMD"), ["ffmpeg", "-y", "-i", rawVideo, "-vn", "-ar", "16000", "-ac", "1", audioFile]);
  const review = await stage1TranscribeToReview({
    projectId,
    name: "QA English Source Routing",
    sourceLanguage: "en",
    targetLanguage: "same",
    audioAlreadyPrepared: true,
    getDuration: async () => 18,
    transcribe: async () => ({
      detectedLanguage: "en",
      captions: [
        {id: "subtitle-001", start: 0, end: 8, text: "Revenue growth is accelerating as enterprise demand expands."},
        {id: "subtitle-002", start: 8, end: 18, text: "Margin compression remains a critical operational risk."},
      ],
    }),
  });
  await writeFile(join(projectDir, "source", "captions.confirmed.json"), JSON.stringify(review.captions, null, 2));
  return stage2ProduceFromConfirmed({projectId});
}
async function main() {
  workspacePath(projectDir);
  workspacePath(profile);
  await remove(projectDir);
  await remove(profile);
  await mkdir(profile, {recursive: true});
  await mkdir(outputDir, {recursive: true});
  const project = await createEnglishProject();
  assert.equal(project.language, "en");
  const browser = spawn(chrome, [
    "--headless=new", "--remote-debugging-port=" + port, "--user-data-dir=" + profile,
    "--window-size=1440,1100", "--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "about:blank",
  ], {windowsHide: true});
  const consoleErrors = [];
  try {
    await waitFor(async () => { try { return (await fetch("http://127.0.0.1:" + port + "/json/version")).ok; } catch { return false; } }, "Chrome DevTools");
    const target = await openTarget();
    const {socket, send} = connect(target.webSocketDebuggerUrl);
    await waitFor(() => socket.readyState === WebSocket.OPEN, "Chrome WebSocket");
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push(message.params.args.map((item) => item.value || item.description || "").join(" "));
      if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text || "Uncaught browser exception");
    });
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate", {url: "http://127.0.0.1:4318/"});
    await waitFor(() => evaluate(send, 'Boolean(typeof APP !== "undefined" && typeof init === "function")'), "Studio boot");

    const languageDialog = JSON.parse(await evaluate(send, `(() => { createProject(); return JSON.stringify({source: document.querySelector("#new-project-source-language")?.value, target: document.querySelector("#new-project-target-language")?.value, sourceOptions: [...document.querySelector("#new-project-source-language").options].map((item) => item.value), targetOptions: [...document.querySelector("#new-project-target-language").options].map((item) => item.value)}); })()`));
    assert.deepEqual(languageDialog, {source: "auto", target: "same", sourceOptions: ["auto", "en", "zh"], targetOptions: ["same", "en", "zh"]});
    await evaluate(send, "hideNewProject()");

    await evaluate(send, "init(" + JSON.stringify(projectId) + ")");
    await waitFor(() => evaluate(send, "APP.projectId === " + JSON.stringify(projectId) + " && APP.project?.language === 'en'"), "English project load");
    const studioState = JSON.parse(await evaluate(send, `JSON.stringify({
      projectLanguage: APP.project.language,
      sourceLanguage: APP.project.sourceLanguage,
      targetLanguage: APP.project.targetLanguage,
      detectedSourceLanguage: APP.project.detectedSourceLanguage,
      captions: APP.project.captions.map((caption) => caption.zh),
      categories: APP.project.beats.flatMap((beat) => beat.layers.map((layer) => layer.category)),
      layerCopy: APP.project.beats.flatMap((beat) => beat.layers.map((layer) => [layer.headline, layer.effectText, ...((layer.payload?.items || []))]))
    })`));
    assert.deepEqual({projectLanguage: studioState.projectLanguage, sourceLanguage: studioState.sourceLanguage, targetLanguage: studioState.targetLanguage, detectedSourceLanguage: studioState.detectedSourceLanguage}, {projectLanguage: "en", sourceLanguage: "en", targetLanguage: "same", detectedSourceLanguage: "en"});
    assert.ok(studioState.captions.every((caption) => !/[\u3400-\u9fff]/.test(caption)), "English captions must remain native English.");
    assert.ok(studioState.categories.every((category) => /^(?:KEY METRIC|CORE DRIVER|RISK SIGNAL|CORE TAKEAWAY)$/.test(category)), "English layer categories must be semantic uppercase labels.");
    assert.equal(/[\u3400-\u9fff]/.test(JSON.stringify(studioState.layerCopy)), false, "English layer content must not include Chinese fallback copy.");
    const screenshot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
    await writeFile(screenshotFile, Buffer.from(screenshot.result.data, "base64"));
    assert.deepEqual(consoleErrors, [], "Studio browser console emitted errors.");
    console.log(JSON.stringify({projectId, languageDialog, studioState, browserConsoleErrors: consoleErrors, screenshot: screenshotFile}, null, 2));
    socket.close();
  } finally {
    await stopBrowser(browser);
    await remove(profile);
    await remove(projectDir);
  }
}
main().catch((error) => { console.error(JSON.stringify({stage: "qa-test-language-routing-failed", reason: error.stack || error.message || String(error)}, null, 2)); process.exitCode = 1; });