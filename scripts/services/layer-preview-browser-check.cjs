const {spawn} = require("node:child_process");
const {mkdir, writeFile} = require("node:fs/promises");
const {join} = require("node:path");

const root = process.cwd();
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9331;
const profile = join(root, ".tmp-layer-preview-check");
const output = join(profile, "layer-preview.png");

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitFor(check, label, attempts = 80) {
  for (let index = 0; index < attempts; index += 1) {
    const value = await check();
    if (value) return value;
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function openTarget() {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("http://127.0.0.1:4318/")}`, {method: "PUT"});
  if (!response.ok) throw new Error(`Chrome target creation failed: ${response.status}`);
  return response.json();
}

function connect(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let nextId = 1;
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    const resolve = pending.get(message.id);
    if (!resolve) return;
    pending.delete(message.id);
    resolve(message);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, resolve);
    socket.send(JSON.stringify({id, method, params}));
    setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error(`CDP ${method} timed out.`));
    }, 10_000);
  });
  return {socket, send};
}

async function evaluate(send, expression) {
  const response = await send("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true});
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Browser evaluation failed.");
  return response.result?.result?.value;
}

async function main() {
  await mkdir(profile, {recursive: true});
  const browser = spawn(chrome, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
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
        const response = await fetch(`http://127.0.0.1:${port}/json/version`);
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
    await waitFor(() => evaluate(send, 'Boolean(typeof APP !== "undefined" && APP.project && APP.project.beats.some((beat) => Array.isArray(beat.layers) && beat.layers.length > 1))'), "project with two layers");

    const targetBeat = JSON.parse(await evaluate(send, `(() => {
      const index = APP.project.beats.findIndex((beat) => Array.isArray(beat.layers) && beat.layers.some((layer) => layer.layout === "briefing-poster"));
      if (index < 0) return JSON.stringify({missing: true});
      APP.selected = index;
      APP.previewApplied = null;
      const beat = APP.project.beats[index];
      const layerIndex = beat.layers.findIndex((layer) => layer.layout === "briefing-poster");
      if (layerIndex < 0) return JSON.stringify({missing: true});
      APP.selectedLayer = layerIndex;
      renderStudio();
      APP.previewApplied = {beatId: beat.id, layerId: beat.layers[layerIndex].layerId, payload: previewPayload(beat, beat.layers[layerIndex], "custom")};
      renderLayoutPreview(beat);
      return JSON.stringify({id: beat.id, layerIndex, layout: beat.layers[layerIndex].layout});
    })()`));
    if (targetBeat.missing) throw new Error("No beat with briefing-poster was found for the overlap check.");

    const snapshot = async () => JSON.parse(await evaluate(send, `(() => {
      const host = document.getElementById("layout-preview-player");
      const rect = host.getBoundingClientRect();
      return JSON.stringify({
        previewKey: host.dataset.previewKey || "",
        previewMode: host.dataset.previewMode || "",
        text: host.innerText.trim(),
        childCount: host.childElementCount,
        htmlLength: host.innerHTML.length,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        visible: Boolean(host.offsetWidth && host.offsetHeight),
      });
    })()`));

    const layerPreview = await waitFor(async () => {
      const state = await snapshot();
      return state.previewKey.endsWith("-" + targetBeat.layerIndex + "-" + targetBeat.layout) && state.htmlLength > 100 ? state : null;
    }, "briefing-poster layer preview");
    await sleep(500);
    const settledLayerPreview = await snapshot();

    await evaluate(send, "APP.selectedLayer = " + targetBeat.layerIndex + "; APP.previewApplied = null; renderInspector(); renderLayoutPreview(APP.project.beats[APP.selected]);");
    const recoveredLayerPreview = await waitFor(async () => {
      const state = await snapshot();
      return state.previewKey.endsWith("-" + targetBeat.layerIndex + "-" + targetBeat.layout) && state.htmlLength > 100 ? state : null;
    }, "briefing-poster after standard-preview round trip");
    await sleep(300);
    const settledRecoveredLayerPreview = await snapshot();

    const overlapMetrics = JSON.parse(await evaluate(send, `(() => {
      const host = document.getElementById("layout-preview-player");
      const headers = [...host.querySelectorAll(".static-header-anchor")];
      const header = headers[0];
      const candidates = [...host.querySelectorAll("div")].map((node) => ({node, rect: node.getBoundingClientRect(), text: node.textContent || "", background: getComputedStyle(node).backgroundColor}))
        .filter((item) => item.text.includes("简报摘要") && item.background === "rgb(244, 238, 219)" && !item.node.closest(".static-header-anchor") && item.rect.width > 120 && item.rect.height > 80)
        .sort((a, b) => (a.rect.width * a.rect.height) - (b.rect.width * b.rect.height));
      const paper = candidates[0]?.node || null;
      const headerRect = header?.getBoundingClientRect();
      const paperRect = paper?.getBoundingClientRect();
      const overlap = headerRect && paperRect ? Math.max(0, Math.min(headerRect.right, paperRect.right) - Math.max(headerRect.left, paperRect.left)) * Math.max(0, Math.min(headerRect.bottom, paperRect.bottom) - Math.max(headerRect.top, paperRect.top)) : 0;
      return JSON.stringify({
        headerCount: headers.length,
        headerText: header?.textContent?.trim() || "",
        paperText: paper?.textContent?.trim() || "",
        headerBottom: headerRect ? Math.round(headerRect.bottom) : null,
        paperTop: paperRect ? Math.round(paperRect.top) : null,
        gap: headerRect && paperRect ? Math.round(paperRect.top - headerRect.bottom) : null,
        overlap,
      });
    })()`));

    const screenshot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
    await writeFile(output, Buffer.from(screenshot.result.data, "base64"));

    const result = {
      beatId: targetBeat.id,
      layerIndex: targetBeat.layerIndex,
      layout: targetBeat.layout,
      layerPreview: settledLayerPreview,
      recoveredLayerPreview: settledRecoveredLayerPreview,
      overlapMetrics,
      consoleErrors,
      screenshot: output,
    };
    console.log(JSON.stringify(result, null, 2));
    if (!layerPreview.text || !settledLayerPreview.text) {
      throw new Error("Layer preview rendered an empty visible canvas.");
    }
    if (!settledRecoveredLayerPreview.text.includes("简报摘要")) {
      throw new Error("Briefing poster did not recover after a standard-preview round trip.");
    }
    if (consoleErrors.length) {
      throw new Error("Studio emitted browser errors: " + JSON.stringify(consoleErrors));
    }
    if (!settledRecoveredLayerPreview.previewKey.endsWith("-" + targetBeat.layerIndex + "-" + targetBeat.layout)) {
      throw new Error("Layer preview key did not remain bound to the selected Layer.");
    }    socket.close();
  } finally {
    if (!browser.killed) browser.kill();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({stage: "layer-preview-browser-check-failed", reason: error.message || String(error)}, null, 2));
  process.exitCode = 1;
});




