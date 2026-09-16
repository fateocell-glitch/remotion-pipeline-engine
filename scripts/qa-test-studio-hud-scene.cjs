"use strict";

const assert = require("node:assert/strict");
const {spawn} = require("node:child_process");
const {mkdir, rm, writeFile} = require("node:fs/promises");
const {join, relative, resolve, isAbsolute} = require("node:path");
const {resolveFaceAwareLayer} = require("./services/face-aware-layout.cjs");

const root = process.cwd();
const projectId = "qa-hud-scene-" + Date.now();
const projectDir = join(root, "data", "projects", projectId);
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9342;
const profile = join(root, ".tmp-qa-studio-hud-scene");
const outputDir = join(root, "test-artifacts", "studio-hud-scene");
const screenshotFile = join(outputDir, "hud-scene-browser-check.png");

const sleep = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

function assertWorkspacePath(target) {
  const targetPath = resolve(target);
  const relativePath = relative(root, targetPath);
  assert.ok(relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath), "Refusing to clean a path outside the workspace: " + targetPath);
}

async function waitFor(check, label, attempts = 120) {
  for (let index = 0; index < attempts; index += 1) {
    const value = await check();
    if (value) return value;
    await sleep(100);
  }
  throw new Error("Timed out waiting for " + label + ".");
}

async function removeWithRetry(target) {
  assertWorkspacePath(target);
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
    const resolvePromise = pending.get(message.id);
    if (!resolvePromise) return;
    pending.delete(message.id);
    resolvePromise(message);
  });
  const send = (method, params = {}) => new Promise((resolvePromise, reject) => {
    const id = nextId++;
    pending.set(id, resolvePromise);
    socket.send(JSON.stringify({id, method, params}));
    setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error("CDP " + method + " timed out."));
    }, 10_000);
  });
  return {socket, send};
}

async function evaluate(send, expression) {
  const response = await send("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true});
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Browser evaluation failed.");
  return response.result?.result?.value;
}

async function createQaProject() {
  await mkdir(join(projectDir, "source"), {recursive: true});
  const project = {
    schemaVersion: 3,
    projectId,
    name: "QA HUD scene layout",
    compositionId: "ProjectEditor",
    fps: 30,
    width: 1920,
    height: 1080,
    targetBeatDuration: 25,
    language: "zh",
    state: "READY",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    captions: [],
    media: {rawVideo: "source/raw.mp4", audio: "source/audio.wav", captions: "source/captions.json"},
    globalSettings: {
      background: {dimOpacity: 0.4, blurRadius: 0, vignette: true},
      theme: {primaryAccent: "#00F2FE", cardStyle: "glass", autoContrastStroke: true},
      subtitles: {bottomOffset: 120, fontSizeZh: 46, fontSizeEn: 22, highlightColor: "#F59E0B"},
      motion: {preset: "tech-snappy"},
    },
    render: {status: "idle", progress: 0, outputPath: null, renderedAt: null, error: null},
    beats: [{
      id: "beat-001",
      start: 0,
      end: 25,
      layout: "hud-glow-stack",
      layoutSource: "manual",
      layoutLocked: false,
      textSource: "manual",
      effectCopySource: "manual",
      eyebrow: "QA",
      subtitle: "HUD scene layout check",
      zh: "Verify editor behavior without touching a user project.",
      effectText: "Verify editor behavior without touching a user project.",
      render: {revision: 1, status: "idle", previewPath: null, renderedAt: null, error: null, contentHash: null, renderedVideoPath: null},
      layers: [{
        layerId: "layer-1",
        layout: "hud-glow-stack",
        category: "QA",
        headline: "HUD scene layout check",
        effectText: "Verify editor behavior without touching a user project.",
        accent: "blue",
        payload: {
          items: ["Existing label"],
          itemSubtitles: ["Existing subtitle"],
          subLabels: ["Existing subtitle"],
          contentPayload: {type: "chips", items: [{title: "Existing label", subtitle: "Existing subtitle"}]},
        },
        commonProps: {
          enterOffset: 0,
          exitOffset: 0,
          duration: 11,
          position: "center",
          offsetX: 0,
          offsetY: 0,
          scale: 1,
          enterAnimation: "spring-up",
          exitAnimation: "none",
          sfx: "none",
          faceAvoidanceMode: "auto",
        },
        enterOffset: 0,
      }],
    }],
  };
  await writeFile(join(projectDir, "project.json"), JSON.stringify(project, null, 2) + "\n");
}

async function main() {
  assertWorkspacePath(projectDir);
  assertWorkspacePath(profile);
  await removeWithRetry(profile);
  await createQaProject();
  await mkdir(profile, {recursive: true});
  await mkdir(outputDir, {recursive: true});

  const browser = spawn(chrome, [
    "--headless=new",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + profile,
    "--window-size=1440,1100",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "about:blank",
  ], {windowsHide: true});
  const consoleErrors = [];

  try {
    await waitFor(async () => {
      try {
        const response = await fetch("http://127.0.0.1:" + port + "/json/version");
        return response.ok;
      } catch {
        return false;
      }
    }, "Chrome DevTools");

    const target = await openTarget();
    const {socket, send} = connect(target.webSocketDebuggerUrl);
    await waitFor(() => socket.readyState === WebSocket.OPEN, "Chrome WebSocket");
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
        consoleErrors.push(message.params.args.map((item) => item.value || item.description || "").join(" "));
      }
      if (message.method === "Runtime.exceptionThrown") {
        consoleErrors.push(message.params.exceptionDetails.text || "Uncaught browser exception");
      }
    });
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate", {url: "http://127.0.0.1:4318/"});
    await waitFor(() => evaluate(send, 'Boolean(typeof APP !== "undefined" && typeof init === "function")'), "Studio boot");

    await evaluate(send, "init(" + JSON.stringify(projectId) + ")");
    await waitFor(() => evaluate(send, "APP.projectId === " + JSON.stringify(projectId) + " && document.querySelector('[data-schema-chip-list=\"tags\"]')"), "HUD inspector");

    const initial = JSON.parse(await evaluate(send, `JSON.stringify({
      titleRows: document.querySelectorAll('[data-schema-chip-title="tags"]').length,
      subtitleRows: document.querySelectorAll('[data-schema-chip-subtitle="tags"]').length,
      addEnabled: !document.querySelector('[data-schema-chip-list="tags"] button').disabled
    })`));
    assert.deepEqual(initial, {titleRows: 1, subtitleRows: 1, addEnabled: true}, "HUD must expose an addable label and subtitle form.");

    const addProbe = JSON.parse(await evaluate(send, `(() => {
      const button = document.querySelector('[data-schema-chip-list="tags"] button');
      button.click();
      return JSON.stringify({
        rows: document.querySelectorAll('[data-schema-chip-title="tags"]').length,
        titles: [...document.querySelectorAll('[data-schema-chip-title="tags"]')].map((node) => node.value),
        subtitles: [...document.querySelectorAll('[data-schema-chip-subtitle="tags"]')].map((node) => node.value)
      });
    })()`));
    assert.equal(addProbe.rows, 2, "HUD add control did not create a new row: " + JSON.stringify({addProbe, consoleErrors}));
    const added = JSON.parse(await evaluate(send, `(() => {
      const titles = [...document.querySelectorAll('[data-schema-chip-title="tags"]')];
      const subtitles = [...document.querySelectorAll('[data-schema-chip-subtitle="tags"]')];
      const setValue = (node, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        setter.call(node, value);
        node.dispatchEvent(new Event("input", {bubbles: true}));
      };
      setValue(titles[1], "New label");
      setValue(subtitles[1], "New subtitle");
      return JSON.stringify({
        titleRows: titles.length,
        subtitleRows: subtitles.length,
        payload: APP.project.beats[0].layers[0].payload
      });
    })()`));
    assert.equal(added.titleRows, 2, "Adding a HUD item must add a title field.");
    assert.equal(added.subtitleRows, 2, "Adding a HUD item must add a subtitle field.");
    assert.deepEqual(added.payload.items, ["Existing label", "New label"], "HUD titles must update layer.payload.items.");
    assert.deepEqual(added.payload.itemSubtitles, ["Existing subtitle", "New subtitle"], "HUD subtitles must update layer.payload.itemSubtitles.");
    assert.deepEqual(added.payload.contentPayload.items, [
      {title: "Existing label", subtitle: "Existing subtitle"},
      {title: "New label", subtitle: "New subtitle"},
    ], "HUD chips must update the shared contentPayload contract.");

    const beforeSave = await evaluate(send, "APP.dirty === true");
    assert.equal(beforeSave, true, "HUD input edits must mark the layer dirty before saving.");
    const sceneBeforeSave = JSON.parse(await evaluate(send, `(() => {
      setLayerSceneMode("speaker");
      setLayerAlign("left");
      return JSON.stringify(APP.project.beats[0].layers[0].layoutProps);
    })()`));
    assert.deepEqual(sceneBeforeSave, {sceneMode: "speaker", align: "left"}, "Scene controls must update the selected Layer before persistence.");
    await evaluate(send, "saveBeat(true).then(() => true)");

    const persisted = JSON.parse(await evaluate(send, `fetch("/api/projects/${projectId}").then((response) => response.json()).then((project) => JSON.stringify(project.beats[0].layers[0]))`));
    assert.deepEqual(persisted.layoutProps, {sceneMode: "speaker", align: "left"}, "Scene layout must persist as the selected layer’s sole position authority.");
    assert.equal(persisted.commonProps.position, undefined, "The retired mount position must not be persisted.");

    await evaluate(send, "init(" + JSON.stringify(projectId) + ")");
    await waitFor(() => evaluate(send, `document.querySelector('[data-scene-mode="speaker"]')?.getAttribute("aria-pressed") === "true" && document.querySelector('[data-align-option="left"]')?.getAttribute("aria-pressed") === "true"`), "persisted scene selection");
    const reloaded = JSON.parse(await evaluate(send, `JSON.stringify({
      current: document.querySelector(".scene-mode-title span")?.textContent || "",
      help: document.querySelector(".scene-mode-panel .field-help")?.textContent || "",
      titles: [...document.querySelectorAll('[data-schema-chip-title="tags"]')].map((node) => node.value),
      subtitles: [...document.querySelectorAll('[data-schema-chip-subtitle="tags"]')].map((node) => node.value)
    })`));
    assert.match(reloaded.current, /人物口播/, "The reloaded inspector must show the persisted speaker scene mode.");
    assert.match(reloaded.current, /靠左/, "The reloaded inspector must show the persisted left scene alignment.");
    assert.match(reloaded.help, /唯一位置来源/, "The inspector must explain the single layout authority.");
    assert.deepEqual(reloaded.titles, ["Existing label", "New label"], "Reload must restore HUD labels.");
    assert.deepEqual(reloaded.subtitles, ["Existing subtitle", "New subtitle"], "Reload must restore HUD subtitles.");

    const resolved = resolveFaceAwareLayer({
      layout: "hud-glow-stack",
      commonProps: persisted.commonProps,
      layoutProps: persisted.layoutProps,
      tokens: {boundsWidth: 1180, boundsHeight: 520, mountMode: "right"},
      faceZone: {faceX: .62, faceY: .12, faceW: .20, faceH: .45, safeX: .57, safeY: .07, safeW: .30, safeH: .56, faceArea: "right"},
      family: "metrics",
      candidates: [],
      displayIntent: "side-overlay",
      beatIndex: 0,
    });
    assert.equal(resolved.commonProps.position, undefined, "The resolver must not revive the retired mount position.");
    assert.equal(resolved.tokens.mountMode, "left", "Left scene alignment must override a conflicting right mount position.");
    assert.equal(resolved.commonProps.scale, .78, "Speaker safe-island mode must apply the shared 78% safe scale.");

    const screenshot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
    await writeFile(screenshotFile, Buffer.from(screenshot.result.data, "base64"));
    assert.deepEqual(consoleErrors, [], "Studio must not emit browser console errors during HUD and scene-layout editing.");
    console.log(JSON.stringify({
      projectId,
      hud: {items: reloaded.titles, subtitles: reloaded.subtitles},
      scene: {mode: persisted.layoutProps.sceneMode, align: persisted.layoutProps.align},
      precedence: {resolvedMount: resolved.tokens.mountMode, scale: resolved.commonProps.scale},
      browserConsoleErrors: consoleErrors,
      screenshot: screenshotFile,
    }, null, 2));
    socket.close();
  } finally {
    await stopBrowser(browser);
    await removeWithRetry(profile);
    await removeWithRetry(projectDir);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({stage: "qa-test-studio-hud-scene-failed", reason: error.stack || error.message || String(error)}, null, 2));
  process.exitCode = 1;
});
