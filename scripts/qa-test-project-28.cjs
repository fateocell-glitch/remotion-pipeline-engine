"use strict";

const {spawn} = require("node:child_process");
const {mkdir, writeFile} = require("node:fs/promises");
const {join} = require("node:path");

const baseUrl = "http://127.0.0.1:4318";
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9342;
const artifactDir = join(process.cwd(), "test-artifacts", "project-28-multilang");
const profileDir = join(process.cwd(), ".tmp-project-28-qa");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fuzzCorpus = [
  {id: "A", category: "[FEATURE] 🚀 01 · AI-Engine", headline: "Remotion & React 视频流自动渲染 (v2.0 Beta)", effectText: "“实测提升 300%”：即时出片 · 无缝衔接！", numericValues: [0, 99]},
  {id: "B", category: "CRITICAL-INFRASTRUCTURE", headline: "Supercalifragilisticexpialidocious text-overflow check", effectText: "Testing JSON escapings: <script>alert(\"xss\")</script> & {foo: 'bar'} $100% #hash", numericValues: [0, 99]},
  {id: "C", category: "RÉSUMÉ · ÜBERBLICK", headline: "Über 99.99% der Nutzer bevorzugen diese Lösung", effectText: "Mehrsprachiger Stresstest für 100% · 0.01 · -5", numericValues: [100, 0.01, -5]},
];

async function waitFor(check, label, attempts = 100) {
  for (let index = 0; index < attempts; index += 1) {
    const value = await check();
    if (value) return value;
    await sleep(120);
  }
  throw new Error("Timed out waiting for " + label + ".");
}

function connect(url, onEvent) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let nextId = 1;
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return onEvent(message);
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
      reject(new Error("CDP " + method + " timed out."));
    }, 10000);
  });
  return {socket, send};
}

async function evaluate(send, expression) {
  const response = await send("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true});
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Browser evaluation failed.");
  return response.result?.result?.value;
}

async function createTarget() {
  const response = await fetch("http://127.0.0.1:" + port + "/json/new?" + encodeURIComponent(baseUrl + "/"), {method: "PUT"});
  if (!response.ok) throw new Error("Chrome target creation failed: " + response.status);
  return response.json();
}

async function selectProject28(send) {
  const expression = "(async()=>{const select=document.getElementById('project-select');const option=[...select.options].find((item)=>item.textContent.trim()==='28');if(!option)throw new Error('Project 28 is not available.');select.value=option.value;await select.onchange();return JSON.stringify({projectId:APP.projectId,name:APP.project.name,beatCount:APP.project.beats.length});})()";
  return JSON.parse(await evaluate(send, expression));
}

async function capturePreview(send, output) {
  const expression = "(()=>{const rect=document.getElementById('layout-preview-card').getBoundingClientRect();return JSON.stringify({x:rect.x,y:rect.y,width:rect.width,height:rect.height,scale:1});})()";
  const clip = JSON.parse(await evaluate(send, expression));
  const image = await send("Page.captureScreenshot", {format: "png", clip, captureBeyondViewport: false});
  await writeFile(output, Buffer.from(image.result.data, "base64"));
}

async function selectLayer(send, index) {
  await evaluate(send, "(()=>{const tabs=document.querySelectorAll('.layer-tab');if(tabs[" + index + "])tabs[" + index + "].click();})()");
  await waitFor(async () => {
    const key = await evaluate(send, "document.getElementById('layout-preview-player').dataset.previewKey||''");
    return key.indexOf("-" + index + "-") >= 0 ? key : null;
  }, "Layer " + String(index + 1));
}

async function injectLayerInputs(send, layerIndex, corpus) {
  const suffix = layerIndex === 0 ? "" : " · Layer 02";
  const payload = {
    category: corpus.category + suffix,
    headline: corpus.headline + suffix,
    copy: corpus.effectText + (layerIndex === 0 ? "" : "\nLayer 02 独立文案"),
    numericValues: corpus.numericValues,
  };
  const expression = "(async()=>{const payload=" + JSON.stringify(payload) + ";const set=(id,value)=>{const node=document.getElementById(id);if(!node)return false;node.value=value;node.dispatchEvent(new Event(\"input\",{bubbles:true}));node.dispatchEvent(new Event(\"change\",{bubbles:true}));return true};const numeric=[...document.querySelectorAll(\"#beat-editor input[data-prop][type=number]\")];numeric.forEach((node,index)=>{node.value=String(payload.numericValues[index%payload.numericValues.length]);node.dispatchEvent(new Event(\"input\",{bubbles:true}));node.dispatchEvent(new Event(\"change\",{bubbles:true}))});set(\"chapter\",payload.category);set(\"headline\",payload.headline);set(\"zh\",payload.copy);await new Promise((resolve)=>setTimeout(resolve,600));return JSON.stringify({category:payload.category,headline:payload.headline,copy:payload.copy,numericCount:numeric.length});})()";
  return JSON.parse(await evaluate(send, expression));
}

async function renderBeatAndWait(projectId, beatId) {
  const response = await fetch(baseUrl + "/api/projects/" + encodeURIComponent(projectId) + "/render/" + encodeURIComponent(beatId), {method: "POST"});
  const text = await response.text();
  if (response.status !== 202) throw new Error(beatId + " render start failed: " + response.status + " " + text);
  const started = JSON.parse(text);
  const samples = [];
  const deadline = Date.now() + 420000;
  let lastFrame = -1;
  while (Date.now() < deadline) {
    await sleep(1000);
    const statusResponse = await fetch(baseUrl + "/api/jobs/" + encodeURIComponent(started.jobId));
    if (!statusResponse.ok) throw new Error(beatId + " render status fetch failed: " + statusResponse.status);
    const status = await statusResponse.json();
    samples.push({state: status.state, frame: Number(status.currentFrame || 0), total: Number(status.totalFrames || 0), percentage: Number(status.percentage || status.progress || 0)});
    if (Number(status.currentFrame || 0) > lastFrame) lastFrame = Number(status.currentFrame || 0);
    if (status.state === "done") {
      if (lastFrame <= 0) throw new Error(beatId + " render completed without frame progress.");
      const asset = await fetch(baseUrl + "/project-asset/" + encodeURIComponent(projectId) + "/" + encodeURIComponent(beatId));
      if (!asset.ok) throw new Error(beatId + " render asset missing after completion: " + asset.status);
      return {jobId: started.jobId, samples, assetBytes: Number(asset.headers.get("content-length") || 0)};
    }
    if (status.state === "failed") throw new Error(beatId + " render failed: " + (status.error || status.message || "unknown render failure"));
  }
  throw new Error(beatId + " render timed out while still receiving status.");
}

async function inspectPreviewOverflow(send) {
  const expression = "(()=>{const nodes=[...document.querySelectorAll(\"#layout-preview-player .sync-live-preview,#layout-preview-player .sync-live-preview *\")];const overflow=nodes.filter((node)=>node.clientWidth>0&&node.scrollWidth>node.clientWidth+1).map((node)=>({tag:node.tagName,className:String(node.className||\"\"),text:String(node.textContent||\"\").trim().slice(0,120),scrollWidth:node.scrollWidth,clientWidth:node.clientWidth}));return JSON.stringify({ok:overflow.length===0,overflow});})()";
  return JSON.parse(await evaluate(send, expression));
}

async function main() {
  await mkdir(artifactDir, {recursive: true});
  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const screenshots = [];
  const result = {project: null, beats: [], layersVisited: 0, preflight: [], consoleErrors, consoleWarnings, pageErrors, screenshots, artifactDir};
  const browser = spawn(chrome, [
    "--headless=new",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + profileDir,
    "--window-size=1920,1200",
    "about:blank",
  ], {windowsHide: true});

  try {
    await waitFor(async () => {
      try { return (await fetch("http://127.0.0.1:" + port + "/json/version")).ok; } catch { return false; }
    }, "Chrome DevTools");
    const target = await createTarget();
    const {socket, send} = connect(target.webSocketDebuggerUrl, (message) => {
      if (message.method === "Runtime.exceptionThrown") { const details=message.params.exceptionDetails||{}; pageErrors.push({text:details.text||"Uncaught page exception",description:details.exception?.description||details.exception?.value||"",stack:(details.stackTrace?.callFrames||[]).map((frame)=>frame.functionName+"@"+frame.url+":"+frame.lineNumber+":"+frame.columnNumber).join("\n")}); }
      if (message.method === "Runtime.consoleAPICalled") {
        const text = message.params.args.map((item) => item.value || item.description || "").join(" ");
        if (message.params.type === "error") consoleErrors.push(text);
        if (message.params.type === "warning") consoleWarnings.push(text);
      }
    });
    await waitFor(() => socket.readyState === WebSocket.OPEN, "Chrome WebSocket");
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Log.enable");
    await send("Page.navigate", {url: baseUrl + "/"});
    await waitFor(() => evaluate(send, "Boolean(typeof APP !== 'undefined'&&document.getElementById('project-select'))"), "Studio boot");
    result.project = await selectProject28(send);
    if (result.project.beatCount !== 6) throw new Error("Project 28 expected 6 beats, found " + result.project.beatCount + ".");

    for (let beatIndex = 0; beatIndex < result.project.beatCount; beatIndex += 1) {
      await evaluate(send, "document.querySelectorAll('#beat-list .beat-card')[" + beatIndex + "].click()");
      const beatId = await waitFor(async () => {
        const value = await evaluate(send, "document.querySelector('.editor-head h1')?.textContent||''");
        return /^beat-/.test(value) ? value : null;
      }, "Beat " + String(beatIndex + 1));
      const layerCount = Number(await evaluate(send, "document.querySelectorAll('.layer-tab').length||1"));
      const corpus = fuzzCorpus[beatIndex % fuzzCorpus.length];
      const beatResult = {beatId, layerCount, corpus: corpus.id, injectedCase: corpus, layers: []};
      for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
        await selectLayer(send, layerIndex);
        const input = await injectLayerInputs(send, layerIndex, corpus);
        const overflow = await inspectPreviewOverflow(send);
        const visual = JSON.parse(await evaluate(send, "JSON.stringify({layout:APP.project.beats[" + beatIndex + "].layers[" + layerIndex + "].layout,kind:document.querySelector('[data-preview-kind]')?.dataset.previewKind||'none',paperCards:document.querySelectorAll('[data-paper-card]').length,previewLayout:document.getElementById('layout-preview-player')?.dataset.previewLayout||'',progressBar:Boolean(document.querySelector('[data-preview-progress-bar]')),progressLabel:document.querySelector('[data-preview-progress-label]')?.textContent||''})"));
        if (visual.previewLayout !== visual.layout) throw new Error(beatId + " preview runtime selected the wrong layout: " + JSON.stringify(visual));
        if (visual.layout === "flying-paper-stack" && visual.kind && visual.kind !== "none" && (visual.kind !== "flying-paper-stack" || visual.paperCards !== 3)) throw new Error(beatId + " flying-paper-stack fallback mapping failed: " + JSON.stringify(visual));
        if (visual.layout === "check-progress" && visual.kind && visual.kind !== "none" && (visual.kind !== "check-progress" || !visual.progressBar || !/^\d+%$/.test(visual.progressLabel))) throw new Error(beatId + " check-progress fallback mapping failed: " + JSON.stringify(visual));
        const screenshot = join(artifactDir, "beat-" + beatId + "-layer-" + String(layerIndex + 1) + ".png");
        await capturePreview(send, screenshot);
        screenshots.push(screenshot);
        beatResult.layers.push({...input, overflow, visual, screenshot});
        if (!overflow.ok) throw new Error(beatId + " Layer " + String(layerIndex + 1) + " preview overflow: " + JSON.stringify(overflow.overflow));
        result.layersVisited += 1;
      }
      if (layerCount > 1) {
        const check = JSON.parse(await evaluate(send, "JSON.stringify({one:APP.project.beats[" + beatIndex + "].layers[0].headline,two:APP.project.beats[" + beatIndex + "].layers[1].headline})"));
        if (!check.one || !check.two || check.one === check.two) throw new Error(beatId + " Layer copy isolation failed: " + JSON.stringify(check));
      }
      if (beatId === "beat-003" && layerCount > 1) {
        await selectLayer(send, 1);
        await selectLayer(send, 0);
        const roundTrip = JSON.parse(await evaluate(send, "JSON.stringify({previewLayout:document.getElementById('layout-preview-player')?.dataset.previewLayout||'',kind:document.querySelector('[data-preview-kind]')?.dataset.previewKind||'none',progressBar:Boolean(document.querySelector('[data-preview-progress-bar]')),progressLabel:document.querySelector('[data-preview-progress-label]')?.textContent||''})"));
        if (roundTrip.previewLayout !== "check-progress" || (roundTrip.kind !== "none" && (roundTrip.kind !== "check-progress" || !roundTrip.progressBar || !/^\d+%$/.test(roundTrip.progressLabel)))) throw new Error("beat-003 Layer 1 -> Layer 2 -> Layer 1 preview regression: " + JSON.stringify(roundTrip));
      }
      const response = await fetch(baseUrl + "/api/projects/" + encodeURIComponent(result.project.projectId) + "/beats/" + encodeURIComponent(beatId) + "/preflight", {method: "POST"});
      const preflight = await response.json();
      result.preflight.push({beatId, status: response.status, valid: preflight.valid, diagnostics: preflight.diagnostics || []});
      if (response.status !== 200 || !preflight.valid) throw new Error(beatId + " preflight failed: " + JSON.stringify(preflight));
      if (!process.env.QA_SKIP_RENDER) {
        const renderResult = await renderBeatAndWait(result.project.projectId, beatId);
        beatResult.render = renderResult;
      }
      result.beats.push(beatResult);
    }

    console.log(JSON.stringify({
      project: result.project,
      beatsVisited: result.beats.length,
      layersVisited: result.layersVisited,
      beatCases: result.beats.map((beat) => ({beatId: beat.beatId, corpus: beat.corpus, injectedCase: beat.injectedCase, overflow: beat.layers.map((layer) => layer.overflow)})),
      preflight: result.preflight,
      renderedBeats: result.beats.map((beat) => ({beatId: beat.beatId, jobId: beat.render?.jobId, frameSamples: beat.render?.samples?.length, assetBytes: beat.render?.assetBytes})),
      consoleErrorCount: consoleErrors.length,
      consoleWarningCount: consoleWarnings.length,
      pageErrorCount: pageErrors.length,
      artifactDir,
    }, null, 2));
    if (consoleErrors.length || pageErrors.length) {
      console.error(JSON.stringify({consoleErrors, consoleWarnings, pageErrors}, null, 2));
      process.exitCode = 1;
    }
    socket.close();
  } finally {
    if (!browser.killed) browser.kill();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({stage: "project-28-qa-failed", reason: error.message || String(error)}, null, 2));
  process.exitCode = 1;
});
