"use strict";

const {spawn, spawnSync} = require("node:child_process");
const {existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync} = require("node:fs");
const {mkdir, writeFile} = require("node:fs/promises");
const {join} = require("node:path");

const root = process.cwd();
const registryPath = join(root, "src", "design", "components.registry.json");
const backupPath = join(root, "test-artifacts", "components-audit", `components.registry.before-audit.${Date.now()}.json`);
const artifactsDir = join(root, "test-artifacts", "components-audit");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromePort = Number(process.env.COMPONENT_AUDIT_CHROME_PORT || 9348);
const appUrl = process.env.COMPONENT_AUDIT_URL || "http://127.0.0.1:4318/admin/components";
const profile = join(root, ".tmp-components-audit");

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitFor(check, label, attempts = 120, delay = 200) {
  let lastError = null;
  for (let index = 0; index < attempts; index += 1) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(delay);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ""}`);
}

async function isServerReady() {
  try {
    const response = await fetch("http://127.0.0.1:4318/api/admin/components");
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isServerReady()) return null;
  const server = spawn(process.execPath, ["scripts\\project-editor-web.cjs"], {cwd: root, windowsHide: true, stdio: "ignore"});
  await waitFor(isServerReady, "Project Editor Web on 4318", 160, 250);
  return server;
}

async function openTarget() {
  const response = await fetch(`http://127.0.0.1:${chromePort}/json/new?${encodeURIComponent(appUrl)}`, {method: "PUT"});
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
    }, 15_000);
  });
  return {socket, send};
}

async function evaluate(send, expression) {
  const response = await send("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true});
  if (response.exceptionDetails) {
    const detail = response.exceptionDetails.exception?.description || response.exceptionDetails.text || "Browser evaluation failed.";
    throw new Error(detail);
  }
  return response.result?.result?.value;
}

function browserFn(fn, ...args) {
  return `(${fn.toString()})(...${JSON.stringify(args)})`;
}

async function clickText(send, selector, text) {
  return evaluate(send, browserFn((selectorValue, textValue) => {
    const nodes = [...document.querySelectorAll(selectorValue)];
    const node = nodes.find((item) => (item.textContent || "").includes(textValue));
    if (!node) return false;
    node.scrollIntoView({block: "center", inline: "center"});
    node.click();
    return true;
  }, selector, text));
}

async function selectComponent(send, id) {
  const ok = await evaluate(send, browserFn((componentId) => {
    const escaped = window.CSS && CSS.escape ? CSS.escape(componentId) : componentId.replace(/"/g, "\\\"");
    const button = document.querySelector(`button.asset[data-component-id="${escaped}"]`) || [...document.querySelectorAll("button.asset")].find((item) => (item.textContent || "").includes(componentId));
    if (!button) return false;
    button.scrollIntoView({block: "center"});
    button.click();
    return true;
  }, id));
  if (!ok) throw new Error(`Component button not found: ${id}`);
  await waitFor(() => evaluate(send, browserFn((componentId) => {
    const active = document.querySelector("button.asset.active");
    return Boolean(active && (active.getAttribute("data-component-id") === componentId || (active.textContent || "").includes(componentId)) && document.querySelector(".inspector-section-base input"));
  }, id)), `selected ${id}`);
}

async function injectMarkers(send, index) {
  return JSON.parse(await evaluate(send, browserFn((componentIndex) => {
    const category = `MARK_CAT_${componentIndex}`;
    const headline = `MARK_HEAD_${componentIndex}`;
    const itemA = `MARK_ITEM_A_${componentIndex}`;
    const itemB = `MARK_ITEM_B_${componentIndex}`;
    const setNative = (element, value) => {
      const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
      descriptor.set.call(element, value);
      element.dispatchEvent(new Event("input", {bubbles: true}));
      element.dispatchEvent(new Event("change", {bubbles: true}));
    };
    const baseInputs = [...document.querySelectorAll(".inspector-section-base input")];
    if (baseInputs[0]) setNative(baseInputs[0], category);
    if (baseInputs[1]) setNative(baseInputs[1], headline);
    const sections = [...document.querySelectorAll(".inspector-section")].filter((section) => !section.classList.contains("inspector-section-base"));
    const contentSection = sections.find((section) => { const title = section.querySelector("h2")?.textContent || ""; return title.includes("默认内容模板") || title.includes("组件专属内容区"); });
    const fields = contentSection ? [...contentSection.querySelectorAll("textarea,input")].filter((field) => {
      if (field.type === "color" || field.type === "range") return false;
      if (field.closest("button")) return false;
      return !field.disabled && !field.readOnly;
    }) : [];
    let injectedContent = false;
    const firstText = fields.find((field) => field.tagName === "TEXTAREA" || field.type === "text" || !field.type);
    const secondText = fields.filter((field) => field.tagName === "TEXTAREA" || field.type === "text" || !field.type)[1];
    if (firstText) {
      setNative(firstText, itemA);
      injectedContent = true;
    } else if (fields[0] && fields[0].type === "number") {
      setNative(fields[0], "99");
      injectedContent = true;
    }
    if (secondText) setNative(secondText, itemB);
    return JSON.stringify({category, headline, itemA, itemB, injectedContent, fieldCount: fields.length});
  }, index)));
}

async function refreshPreview(send) {
  const ok = await clickText(send, "button", "保存预览");
  if (!ok) throw new Error("Preview button not found.");
  await sleep(650);
}

async function savePreset(send) {
  const ok = await clickText(send, "button", "保存全局预设");
  if (!ok) throw new Error("Save preset button not found.");
  await waitFor(() => evaluate(send, 'Boolean((document.querySelector(".admin-status")?.textContent || "").includes("已保存"))'), "saved status", 90, 200);
}

async function previewText(send) {
  return evaluate(send, `(() => {
    const frame = document.querySelector(".player-frame");
    if (!frame) return "";
    return [frame.getAttribute("data-component-audit") || "", frame.textContent || ""].join(" ").replace(/\s+/g, " ").trim();
  })()`);
}
async function currentFormValues(send) {
  return JSON.parse(await evaluate(send, `(() => {
    const values = [...document.querySelectorAll(".admin-inspector input, .admin-inspector textarea")].map((field) => field.value || "");
    return JSON.stringify(values);
  })()`));
}

async function screenshotFrame(send, id) {
  const rect = JSON.parse(await evaluate(send, `(() => {
    const frame = document.querySelector(".player-frame");
    const box = frame.getBoundingClientRect();
    return JSON.stringify({x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.max(1, box.width), height: Math.max(1, box.height), scale: window.devicePixelRatio || 1});
  })()`));
  const screenshot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false, clip: {x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1}});
  const path = join(artifactsDir, `${id}.png`);
  await writeFile(path, Buffer.from(screenshot.result.data, "base64"));
  return path;
}

async function restoreRegistry(text) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      writeFileSync(registryPath, text, "utf8");
      return;
    } catch (error) {
      if (attempt === 7) throw error;
      await sleep(300);
    }
  }
}
async function main() {
  mkdirSync(artifactsDir, {recursive: true});
  if (!existsSync(registryPath)) throw new Error("components.registry.json not found.");
  copyFileSync(registryPath, backupPath);
  const originalRegistryText = readFileSync(registryPath, "utf8");
  const registry = JSON.parse(originalRegistryText);
  const allComponents = registry.components || [];
  const startIndex = Math.max(0, Number(process.env.COMPONENT_AUDIT_START || 0) || 0);
  const endIndex = Math.min(allComponents.length, Number(process.env.COMPONENT_AUDIT_END || allComponents.length) || allComponents.length);
  const components = allComponents.slice(startIndex, endIndex);
  const server = await ensureServer();
  const browser = spawn(chrome, [
    "--headless=new",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profile}`,
    "--window-size=1920,1200",
    "about:blank",
  ], {windowsHide: true});
  const consoleErrors = [];
  const results = [];
  let socket;

  try {
    await waitFor(async () => {
      try {
        const response = await fetch(`http://127.0.0.1:${chromePort}/json/version`);
        return response.ok;
      } catch {
        return false;
      }
    }, "Chrome DevTools", 120, 200);
    const target = await openTarget();
    const connection = connect(target.webSocketDebuggerUrl);
    socket = connection.socket;
    const send = connection.send;
    await waitFor(() => socket.readyState === WebSocket.OPEN, "Chrome WebSocket", 80, 100);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(message.params.type)) {
        consoleErrors.push(message.params.args.map((item) => item.value || item.description || "").join(" "));
      }
      if (message.method === "Runtime.exceptionThrown") {
        consoleErrors.push(message.params.exceptionDetails.text || message.params.exceptionDetails.exception?.description || "Uncaught browser exception");
      }
    });
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Network.clearBrowserCache");
    await send("Page.navigate", {url: appUrl + (appUrl.includes("?") ? "&" : "?") + "audit=" + Date.now()});
    await waitFor(() => evaluate(send, `document.querySelectorAll("button.asset").length >= ${components.length}`), "component assets", 140, 250);

    for (let index = 0; index < components.length; index += 1) {
      const component = components[index];
      await selectComponent(send, component.id);
      const globalIndex = startIndex + index + 1;
      const markers = await injectMarkers(send, globalIndex);
      await refreshPreview(send);
      const beforeSaveText = String(await previewText(send) || "");
      if (process.env.COMPONENT_AUDIT_DEBUG && index === 0) {
        const debugState = await evaluate(send, `(() => JSON.stringify({
          frameExists: Boolean(document.querySelector(".player-frame")),
          frameAudit: document.querySelector(".player-frame")?.getAttribute("data-component-audit") || "",
          frameText: document.querySelector(".player-frame")?.textContent || "",
          inputs: [...document.querySelectorAll(".admin-inspector input, .admin-inspector textarea")].map((field) => field.value || ""),
          html: document.querySelector(".player-frame")?.outerHTML.slice(0, 500) || ""
        }))()`);
        console.log("DEBUG_COMPONENT_AUDIT", debugState, beforeSaveText.slice(0, 500));
      }
      const sandboxCategory = beforeSaveText.includes(markers.category);
      const sandboxHeadline = beforeSaveText.includes(markers.headline);
      const sandboxContent = markers.injectedContent && markers.fieldCount ? beforeSaveText.includes(markers.itemA) || beforeSaveText.includes("99") : false;
      await savePreset(send);
      const shot = await screenshotFrame(send, component.id);
      await send("Page.reload", {ignoreCache: true});
      await waitFor(() => evaluate(send, `document.querySelectorAll("button.asset").length >= ${components.length}`), "assets after reload", 140, 250);
      await selectComponent(send, component.id);
      const values = await currentFormValues(send);
      await refreshPreview(send);
      const afterReloadText = String(await previewText(send) || "");
      const persistedInputs = values.some((value) => String(value || "").includes(markers.category)) && values.some((value) => String(value || "").includes(markers.headline)) && (!markers.injectedContent || values.some((value) => String(value || "").includes(markers.itemA) || String(value || "") === "99"));
      const persistedSandbox = afterReloadText.includes(markers.category) && afterReloadText.includes(markers.headline) && (!markers.injectedContent || afterReloadText.includes(markers.itemA) || afterReloadText.includes("99"));
      const result = {id: component.id, name: component.name, sandboxCategory, sandboxHeadline, sandboxContent, persistedInputs, persistedSandbox, screenshot: shot, previewText: afterReloadText.slice(0, 300)};
      await restoreRegistry(originalRegistryText);
      results.push(result);
      const status = sandboxCategory && sandboxHeadline && sandboxContent && persistedInputs && persistedSandbox ? "PASS" : "FAIL";
      console.log(`${String(globalIndex).padStart(2, "0")}/${allComponents.length} ${status} ${component.id} category=${sandboxCategory} headline=${sandboxHeadline} content=${sandboxContent} persist=${persistedInputs && persistedSandbox}`);
    }

    const categoryPass = results.filter((item) => item.sandboxCategory).length;
    const headlinePass = results.filter((item) => item.sandboxHeadline).length;
    const contentPass = results.filter((item) => item.sandboxContent).length;
    const persistPass = results.filter((item) => item.persistedInputs && item.persistedSandbox).length;
    const failed = results.filter((item) => !(item.sandboxCategory && item.sandboxHeadline && item.sandboxContent && item.persistedInputs && item.persistedSandbox));
    const report = {total: components.length, range: [startIndex + 1, endIndex], categoryPass, headlinePass, contentPass, persistPass, bindingSuccessRate: `${Math.round(((categoryPass + headlinePass + contentPass) / (components.length * 3)) * 100)}%`, persistenceSuccessRate: `${Math.round((persistPass / components.length) * 100)}%`, failed: failed.map(({id, name, sandboxCategory, sandboxHeadline, sandboxContent, persistedInputs, persistedSandbox, previewText}) => ({id, name, sandboxCategory, sandboxHeadline, sandboxContent, persistedInputs, persistedSandbox, previewText})), consoleErrors: consoleErrors.slice(-20), artifactsDir};
    console.log(JSON.stringify(report, null, 2));
    console.log("COMPONENT_AUDIT_RESULT_JSON " + JSON.stringify(report));
    if (failed.length) {
      process.exitCode = 1;
    }
  } finally {
    if (socket) socket.close();
    if (!browser.killed) browser.kill();
    if (server && !server.killed) server.kill();
    await sleep(500);
    await restoreRegistry(originalRegistryText);
  }
}

async function runCoordinator() {
  mkdirSync(artifactsDir, {recursive: true});
  const originalRegistryText = readFileSync(registryPath, "utf8");
  const registry = JSON.parse(originalRegistryText);
  const total = registry.components.length;
  const batchSize = Number(process.env.COMPONENT_AUDIT_BATCH_SIZE || 12) || 12;
  const reports = [];
  for (let start = 0; start < total; start += batchSize) {
    const end = Math.min(total, start + batchSize);
    const child = spawnSync(process.execPath, [__filename], {
      cwd: root,
      env: {...process.env, COMPONENT_AUDIT_CHILD: "1", COMPONENT_AUDIT_START: String(start), COMPONENT_AUDIT_END: String(end)},
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 20,
    });
    if (child.stdout) process.stdout.write(child.stdout);
    if (child.stderr) process.stderr.write(child.stderr);
    writeFileSync(registryPath, originalRegistryText, "utf8");
    const markerLine = (child.stdout || "").split(/\r?\n/).find((line) => line.startsWith("COMPONENT_AUDIT_RESULT_JSON "));
    if (!markerLine || child.status !== 0) {
      throw new Error(`Component audit batch ${start + 1}-${end} failed with exit ${child.status}.`);
    }
    reports.push(JSON.parse(markerLine.slice("COMPONENT_AUDIT_RESULT_JSON ".length)));
  }
  const totalChecked = reports.reduce((sum, report) => sum + report.total, 0);
  const categoryPass = reports.reduce((sum, report) => sum + report.categoryPass, 0);
  const headlinePass = reports.reduce((sum, report) => sum + report.headlinePass, 0);
  const contentPass = reports.reduce((sum, report) => sum + report.contentPass, 0);
  const persistPass = reports.reduce((sum, report) => sum + report.persistPass, 0);
  const failed = reports.flatMap((report) => report.failed || []);
  const report = {total: totalChecked, categoryPass, headlinePass, contentPass, persistPass, bindingSuccessRate: `${Math.round(((categoryPass + headlinePass + contentPass) / (totalChecked * 3)) * 100)}%`, persistenceSuccessRate: `${Math.round((persistPass / totalChecked) * 100)}%`, failed, artifactsDir};
  console.log(JSON.stringify(report, null, 2));
  if (failed.length) process.exitCode = 1;
}
(process.env.COMPONENT_AUDIT_CHILD === "1" ? main() : runCoordinator()).catch((error) => {
  console.error(JSON.stringify({stage: "components-audit-failed", reason: error.message || String(error), stack: error.stack}, null, 2));
  process.exitCode = 1;
});
















