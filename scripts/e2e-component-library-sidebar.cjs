"use strict";

const {spawn} = require("node:child_process");
const {existsSync, mkdirSync, readFileSync, writeFileSync} = require("node:fs");
const {join} = require("node:path");

const root = process.cwd();
const registryPath = join(root, "src", "design", "components.registry.json");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromePort = Number(process.env.SIDEBAR_E2E_CHROME_PORT || 9364);
const appPort = Number(process.env.SIDEBAR_E2E_APP_PORT || 4319);
const appUrl = process.env.SIDEBAR_E2E_URL || `http://127.0.0.1:${appPort}/admin/components`;
const profile = join(root, ".tmp-component-sidebar-e2e");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const logPass = (message) => console.log(`[PASS] ${message}`);

async function waitFor(check, label, attempts = 120, delay = 200) {
  let last;
  for (let index = 0; index < attempts; index += 1) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      last = error;
    }
    await sleep(delay);
  }
  throw new Error(`Timed out waiting for ${label}${last ? `: ${last.message}` : ""}`);
}

async function isServerReady() {
  try {
    const response = await fetch(`http://127.0.0.1:${appPort}/api/admin/components`);
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isServerReady()) return null;
  const server = spawn(process.execPath, ["scripts\\project-editor-web.cjs"], {cwd: root, windowsHide: true, stdio: "ignore", env: {...process.env, PROJECT_EDITOR_PORT: String(appPort)}});
  await waitFor(isServerReady, `Project Editor Web on ${appPort}`, 160, 250);
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
    const detail = response.exceptionDetails.exception?.description || response.exceptionDetails.text || "Browser evaluation failed";
    throw new Error(detail);
  }
  return response.result?.result?.value;
}

function browserFn(fn, ...args) {
  return `(${fn.toString()})(...${JSON.stringify(args)})`;
}

async function pageState(send) {
  return JSON.parse(await evaluate(send, browserFn(() => {
    const groups = [...document.querySelectorAll(".family-group")].map((group) => {
      const header = group.querySelector(".family-header");
      const name = header?.querySelector("span:nth-of-type(1)")?.textContent?.trim() || "";
      const familyId = group.getAttribute("data-family-id") || "";
      const expanded = header?.getAttribute("aria-expanded") === "true";
      const items = [...group.querySelectorAll(".asset")].map((asset) => ({
        id: asset.getAttribute("data-component-id"),
        text: asset.textContent || "",
        upDisabled: Boolean(asset.querySelector('button[aria-label^="上移"]')?.disabled),
        downDisabled: Boolean(asset.querySelector('button[aria-label^="下移"]')?.disabled),
      }));
      return {name, familyId, expanded, count: items.length, ids: items.map((item) => item.id), items};
    });
    const saveButton = document.querySelector(".tree-save");
    return JSON.stringify({
      groups,
      saveText: saveButton?.textContent?.trim() || "",
      saveClass: saveButton?.className || "",
      saveDisabled: Boolean(saveButton?.disabled),
      pendingText: document.querySelector(".tree-pending")?.textContent?.trim() || "",
      status: document.querySelector(".admin-status")?.textContent?.trim() || "",
      pendingOrders: document.querySelector(".tree-scroll")?.getAttribute("data-pending-orders") || "",
      toast: document.querySelector(".admin-toast")?.textContent?.trim() || "",
    });
  })));
}

async function expandFirstUsableGroups(send) {
  return JSON.parse(await evaluate(send, browserFn(() => {
    const groupNodes = [...document.querySelectorAll(".family-group")];
    const summaries = groupNodes.map((group, index) => {
      const header = group.querySelector(".family-header");
      const count = Number(header?.querySelector(".family-count")?.textContent || 0);
      const name = header?.querySelector("span:nth-of-type(1)")?.textContent?.trim() || `group-${index}`;
      return {index, count, name};
    });
    const selected = summaries.filter((item) => item.count >= 3).slice(0, 2);
    if (selected.length < 2) return JSON.stringify({ok: false, summaries});
    for (const item of selected) {
      const header = groupNodes[item.index].querySelector(".family-header");
      if (header?.getAttribute("aria-expanded") !== "true") header.click();
    }
    return JSON.stringify({ok: true, groups: selected});
  })));
}

async function clickOrder(send, componentId, direction) {
  const ok = await evaluate(send, browserFn((id, dir) => {
    const asset = [...document.querySelectorAll(".asset")].find((node) => node.getAttribute("data-component-id") === id);
    if (!asset) return {ok: false, reason: "asset not found"};
    const button = [...asset.querySelectorAll("button")].find((node) => (node.getAttribute("aria-label") || "").startsWith(dir === "down" ? "下移" : "上移"));
    if (!button) return {ok: false, reason: "button not found"};
    if (button.disabled) return {ok: false, reason: "button disabled"};
    button.click();
    return {ok: true};
  }, componentId, direction));
  if (!ok.ok) throw new Error(`Could not ${direction} ${componentId}: ${ok.reason}`);
}

async function moveViaSelect(send, componentId, targetFamilyId) {
  const result = await evaluate(send, browserFn((id, familyId) => {
    const asset = [...document.querySelectorAll(".asset")].find((node) => node.getAttribute("data-component-id") === id);
    if (!asset) return {ok: false, reason: "asset not found"};
    const select = asset.querySelector(".asset-family-select");
    if (!select) return {ok: false, reason: "select not found"};
    const option = [...select.options].find((item) => item.value === familyId);
    if (!option) return {ok: false, reason: `target option ${familyId} not found`, options: [...select.options].map((item) => item.value + ":" + item.textContent.trim())};
    select.value = option.value;
    select.dispatchEvent(new Event("change", {bubbles: true}));
    return {ok: true};
  }, componentId, targetFamilyId));
  if (!result.ok) throw new Error(`Could not move ${componentId}: ${result.reason} ${JSON.stringify(result.options || [])}`);
}

async function clickSave(send) {
  const ok = await evaluate(send, browserFn(() => {
    const button = document.querySelector(".tree-save");
    if (!button) return false;
    button.scrollIntoView({block: "center"});
    button.click();
    return true;
  }));
  if (!ok) throw new Error("Save list button not found");
}

function groupContaining(state, id) {
  return state.groups.find((group) => group.ids.includes(id));
}

function registryFamilyOrder(registry, family) {
  return registry.components.filter((component) => component.family === family).map((component) => component.id);
}

async function main() {
  if (!existsSync(registryPath)) throw new Error("components.registry.json not found.");
  mkdirSync(profile, {recursive: true});
  const original = readFileSync(registryPath, "utf8");
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
    await send("Network.enable");
    await send("Network.clearBrowserCache");
    await send("Page.navigate", {url: appUrl + (appUrl.includes("?") ? "&" : "?") + "sidebarE2E=" + Date.now()});
    await waitFor(() => evaluate(send, 'document.querySelectorAll(".family-group").length >= 2'), "component groups", 140, 250);

    const chosen = await expandFirstUsableGroups(send);
    if (!chosen.ok) throw new Error("Need at least two groups with 3+ components: " + JSON.stringify(chosen.summaries));
    await sleep(250);
    let state = await pageState(send);
    const groupA = state.groups[chosen.groups[0].index];
    const groupB = state.groups[chosen.groups[1].index];
    const a1 = groupA.ids[0];
    const a2 = groupA.ids[1];
    if (!a1 || !a2 || !groupB.ids[1]) throw new Error("Selected groups do not have enough visible components.");

    await clickOrder(send, a1, "down");
    await waitFor(async () => {
      const next = await pageState(send);
      const group = next.groups.find((item) => item.familyId === groupA.familyId);
      return group && group.ids[0] === a2 && group.ids[1] === a1 && next.saveText.includes("确认保存列表修改");
    }, "same-group order swap", 80, 100);
    logPass("Drag within group");

    state = await pageState(send);
    const movedId = state.groups.find((item) => item.familyId === groupA.familyId).ids[1];
    const beforeMoveA = state.groups.find((item) => item.familyId === groupA.familyId).count;
    const beforeMoveB = state.groups.find((item) => item.familyId === groupB.familyId).count;
    await moveViaSelect(send, movedId, groupB.familyId);
    await waitFor(async () => {
      const next = await pageState(send);
      const nextA = next.groups.find((item) => item.familyId === groupA.familyId);
      const nextB = next.groups.find((item) => item.familyId === groupB.familyId);
      return nextA && nextB && nextA.count === beforeMoveA - 1 && nextB.count === beforeMoveB + 1 && nextB.ids.includes(movedId);
    }, "cross-group transfer", 80, 100);
    logPass("Cross-group transfer");

    state = await pageState(send);
    const movedGroupBeforeSecondarySort = state.groups.find((item) => item.familyId === groupB.familyId);
    const movedIndexBefore = movedGroupBeforeSecondarySort.ids.indexOf(movedId);
    if (movedIndexBefore < 0 || movedIndexBefore >= movedGroupBeforeSecondarySort.ids.length - 1) {
      throw new Error(`Moved component ${movedId} is not movable down in ${groupB.name}: ${JSON.stringify(movedGroupBeforeSecondarySort.ids)}`);
    }
    const expectedAfterSecondarySort = [...movedGroupBeforeSecondarySort.ids];
    [expectedAfterSecondarySort[movedIndexBefore], expectedAfterSecondarySort[movedIndexBefore + 1]] = [expectedAfterSecondarySort[movedIndexBefore + 1], expectedAfterSecondarySort[movedIndexBefore]];
    await clickOrder(send, movedId, "down");
    try {
      await waitFor(async () => {
        const next = await pageState(send);
        const nextB = next.groups.find((item) => item.familyId === groupB.familyId);
        return nextB && nextB.ids.join("|") === expectedAfterSecondarySort.join("|");
      }, "secondary sort in new group", 80, 100);
    } catch (error) {
      const afterClick = await pageState(send);
      const afterB = afterClick.groups.find((item) => item.familyId === groupB.familyId);
      throw new Error(error.message + " :: before=" + JSON.stringify(movedGroupBeforeSecondarySort.ids) + " expected=" + JSON.stringify(expectedAfterSecondarySort) + " after=" + JSON.stringify(afterB?.ids) + " pendingOrders=" + afterClick.pendingOrders + " save=" + afterClick.saveText + " status=" + afterClick.status);
    }
    logPass("Secondary sort in new group");

    await clickSave(send);
    await waitFor(async () => {
      const next = await pageState(send);
      return next.saveText.includes("保存中");
    }, "save button saving state", 20, 10);
    try {
      await waitFor(async () => {
        const next = await pageState(send);
        return next.saveText.includes("已保存") && next.saveClass.includes("saved") && next.pendingText.includes("保存成功");
      }, "save button success state", 100, 50);
    } catch (error) {
      const debugState = await pageState(send);
      throw new Error(error.message + " :: " + JSON.stringify(debugState));
    }
    logPass("Save feedback state");

    const expectedSavedState = await pageState(send);
    const expectedGroupBOrder = expectedSavedState.groups.find((item) => item.familyId === groupB.familyId).ids;
    const registryAfterSave = JSON.parse(readFileSync(registryPath, "utf8"));
    const movedComponent = registryAfterSave.components.find((component) => component.id === movedId);
    if (!movedComponent) throw new Error(`Moved component missing from registry: ${movedId}`);
    if (movedComponent.family !== groupB.familyId) {
      throw new Error(`Registry family mismatch for ${movedId}: ${movedComponent.family} vs ${groupB.name}`);
    }
    const registryOrder = registryFamilyOrder(registryAfterSave, movedComponent.family);
    if (registryOrder.join("|") !== expectedGroupBOrder.join("|")) {
      throw new Error(`Registry order mismatch. expected=${expectedGroupBOrder.join(",")} actual=${registryOrder.join(",")}`);
    }

    await send("Page.reload", {ignoreCache: true});
    await waitFor(() => evaluate(send, 'document.querySelectorAll(".family-group").length >= 2'), "groups after reload", 140, 250);
    await evaluate(send, browserFn((familyIds) => {
      for (const familyId of familyIds) {
        const group = [...document.querySelectorAll(".family-group")].find((node) => node.getAttribute("data-family-id") === familyId);
        const header = group?.querySelector(".family-header");
        if (header && header.getAttribute("aria-expanded") !== "true") header.click();
      }
      return true;
    }, [groupA.familyId, groupB.familyId]));
    await sleep(250);
    const reloaded = await pageState(send);
    const reloadedB = reloaded.groups.find((item) => item.familyId === groupB.familyId);
    if (!reloadedB || reloadedB.ids.join("|") !== expectedGroupBOrder.join("|")) {
      throw new Error(`Reloaded order mismatch. expected=${expectedGroupBOrder.join(",")} actual=${reloadedB?.ids.join(",")}`);
    }
    logPass("Reload verification");

    console.log(JSON.stringify({groupA: groupA.name, groupAFamilyId: groupA.familyId, groupB: groupB.name, groupBFamilyId: groupB.familyId, movedId, finalGroupBOrder: expectedGroupBOrder}, null, 2));
  } finally {
    if (socket) socket.close();
    if (!browser.killed) browser.kill();
    if (server && !server.killed) server.kill();
    writeFileSync(registryPath, original, "utf8");
    await sleep(500);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
