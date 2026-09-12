const {spawn} = require("node:child_process");
const {mkdir, writeFile} = require("node:fs/promises");
const {join} = require("node:path");

const root = process.cwd();
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9328;
const profile = join(root, ".tmp-face-guide-check");
const output = join(profile, "studio-face-guide.png");

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
    }, 10000);
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
    "--disable-gpu",
    "about:blank",
  ], {windowsHide: true});

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
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate", {url: "http://127.0.0.1:4318/"});
    await waitFor(async () => evaluate(send, 'Boolean(typeof APP !== "undefined" && APP.project && document.getElementById("layout-preview-player")?.dataset.previewMode)'), "Studio preview render");

    await evaluate(send, `(() => {
      const beat = APP.project.beats[0];
      beat.faceZone = {faceX: .62, faceY: .12, faceW: .20, faceH: .45, safeX: .57, safeY: .07, safeW: .30, safeH: .56, faceArea: "right"};
      APP.selected = 0;
      APP.selectedLayer = 0;
      APP.showFaceGuide = false;
      APP.previewApplied = null;
      renderStudio();
      toggleFaceGuide();
      return true;
    })()`);

    const result = await waitFor(async () => {
      const value = await evaluate(send, `JSON.stringify({
        hasFaceSafe: document.body.innerText.includes("FACE SAFE"),
        hasComponentBox: document.body.innerText.includes("COMPONENT BOX"),
        hasGuideToggle: Boolean(document.getElementById("face-guide-toggle")),
        hasRestoreControl: document.body.innerText.includes("恢复自动避让")
      })`);
      const parsed = JSON.parse(value);
      return parsed.hasFaceSafe && parsed.hasComponentBox ? parsed : null;
    }, "Face Guide DOM overlay");

    const screenshot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
    await writeFile(output, Buffer.from(screenshot.result.data, "base64"));
    console.log(JSON.stringify({...result, screenshot: output}, null, 2));
    socket.close();
  } finally {
    browser.kill();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
