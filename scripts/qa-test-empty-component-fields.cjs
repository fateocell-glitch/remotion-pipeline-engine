"use strict";

const {spawn} = require("node:child_process");
const {existsSync, mkdirSync, readFileSync, writeFileSync} = require("node:fs");
const {join} = require("node:path");

const root = process.cwd();
const registryPath = join(root, "src", "design", "components.registry.json");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromePort = Number(process.env.EMPTY_FIELD_CHROME_PORT || 9351);
const appUrl = process.env.EMPTY_FIELD_URL || "http://127.0.0.1:4318/admin/components";
const profile = join(root, ".tmp-empty-field-audit");
const componentId = process.env.EMPTY_FIELD_COMPONENT || "logo-wordmark";
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

async function selectComponent(send, id) {
  const ok = await evaluate(send, browserFn((componentId) => {
    const escaped = window.CSS && CSS.escape ? CSS.escape(componentId) : componentId.replace(/"/g, "\\\"");
    const button = document.querySelector(`button.asset[data-component-id="${escaped}"]`);
    if (!button) return false;
    button.scrollIntoView({block: "center"});
    button.click();
    return true;
  }, id));
  if (!ok) throw new Error(`Component button not found: ${id}`);
  await waitFor(() => evaluate(send, browserFn((idValue) => {
    const active = document.querySelector("button.asset.active");
    return Boolean(active && active.getAttribute("data-component-id") === idValue && document.querySelector(".inspector-section-base input"));
  }, id)), `selected ${id}`);
}

async function clickButton(send, text) {
  const ok = await evaluate(send, browserFn((textValue) => {
    const button = [...document.querySelectorAll("button")].find((item) => (item.textContent || "").includes(textValue));
    if (!button) return false;
    button.click();
    return true;
  }, text));
  if (!ok) throw new Error(`Button not found: ${text}`);
}

async function clearTextFields(send) {
  return JSON.parse(await evaluate(send, browserFn(() => {
    const setNative = (element, value) => {
      const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
      descriptor.set.call(element, value);
      element.dispatchEvent(new Event("input", {bubbles: true}));
      element.dispatchEvent(new Event("change", {bubbles: true}));
    };
    const baseInputs = [...document.querySelectorAll(".inspector-section-base input")];
    const contentSection = [...document.querySelectorAll(".inspector-section")].find((section) => {
      const title = section.querySelector("h2")?.textContent || "";
      return title.includes("默认内容模板") || title.includes("组件专属内容区");
    });
    const contentFields = contentSection ? [...contentSection.querySelectorAll("input, textarea")].filter((field) => field.type !== "color" && field.type !== "range" && field.type !== "number") : [];
    const fields = [...baseInputs.slice(0, 2), ...contentFields.slice(0, 3)];
    fields.forEach((field) => setNative(field, ""));
    return JSON.stringify({cleared: fields.length, rowCount: document.querySelectorAll(".payload-row").length, values: fields.map((field) => field.value)});
  })));
}

async function formSnapshot(send) {
  return JSON.parse(await evaluate(send, `(() => JSON.stringify({rowCount: document.querySelectorAll(".payload-row").length, values: [...document.querySelectorAll(".inspector-section-base input, .admin-inspector textarea, .admin-inspector input")].filter((field) => field.type !== "color" && field.type !== "range").map((field) => field.value)}))()`));
}

async function previewText(send) {
  return String(await evaluate(send, `(() => {
    const frame = document.querySelector(".player-frame");
    return [frame?.getAttribute("data-component-audit") || "", frame?.textContent || ""].join(" ").replace(/\s+/g, " ").trim();
  })()`));
}

async function main() {
  if (!existsSync(registryPath)) throw new Error("components.registry.json not found.");
  mkdirSync(profile, {recursive: true});
  const originalRegistryText = readFileSync(registryPath, "utf8");
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
    const response = await fetch(`http://127.0.0.1:${chromePort}/json/new?${encodeURIComponent(appUrl)}`, {method: "PUT"});
    if (!response.ok) throw new Error(`Chrome target creation failed: ${response.status}`);
    const target = await response.json();
    const connection = connect(target.webSocketDebuggerUrl);
    socket = connection.socket;
    const send = connection.send;
    await waitFor(() => socket.readyState === WebSocket.OPEN, "Chrome WebSocket", 80, 100);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate", {url: appUrl + (appUrl.includes("?") ? "&" : "?") + "emptyAudit=" + Date.now()});
    await waitFor(() => evaluate(send, 'document.querySelectorAll("button.asset").length > 0'), "component assets", 140, 250);
    await selectComponent(send, componentId);
    const cleared = await clearTextFields(send);
    if (cleared.cleared < 4) throw new Error(`Only cleared ${cleared.cleared} text fields.`);
    await clickButton(send, "保存预览");
    await sleep(500);
    const beforeSave = await previewText(send);
    await clickButton(send, "保存全局预设");
    await waitFor(() => evaluate(send, 'Boolean((document.querySelector(".admin-status")?.textContent || "").includes("已保存"))'), "saved status", 90, 200);
    await send("Page.reload", {ignoreCache: true});
    await waitFor(() => evaluate(send, 'document.querySelectorAll("button.asset").length > 0'), "assets after reload", 140, 250);
    await selectComponent(send, componentId);
    const snapshot = await formSnapshot(send);
    const values = snapshot.values;
    await clickButton(send, "保存预览");
    await sleep(500);
    const afterReload = await previewText(send);
    const forbidden = ["PROJECT SIGNAL", "核心设计信号", "DESIGN SYSTEM", "展示可编辑", "new3"];
    const restored = forbidden.filter((text) => afterReload.includes(text));
    const emptyCount = values.filter((value) => value === "").length;
    const listRowsPreserved = cleared.rowCount === 0 || snapshot.rowCount >= cleared.rowCount;
    if (emptyCount < 4 || restored.length || !listRowsPreserved) {
      throw new Error(`Empty field regression failed: emptyCount=${emptyCount}, rowCount=${snapshot.rowCount}/${cleared.rowCount}, restored=${restored.join(",")}, preview=${afterReload.slice(0, 240)}`);
    }
    console.log(JSON.stringify({componentId, cleared: cleared.cleared, rowCountBefore: cleared.rowCount, rowCountAfter: snapshot.rowCount, emptyCount, beforeSave: beforeSave.slice(0, 160), afterReload: afterReload.slice(0, 160)}, null, 2));
    console.log("EMPTY_COMPONENT_FIELDS_PASS");
  } finally {
    if (socket) socket.close();
    if (!browser.killed) browser.kill();
    if (server && !server.killed) server.kill();
    writeFileSync(registryPath, originalRegistryText, "utf8");
    await sleep(500);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});


