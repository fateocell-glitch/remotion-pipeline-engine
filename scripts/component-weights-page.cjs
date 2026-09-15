"use strict";

const buildComponentWeightsPage = () => String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>组件命中优先级</title>
  <style>
    :root{color-scheme:dark}
    *{box-sizing:border-box}
    body{margin:0;background:#18191a;color:#e4e6eb;font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Microsoft YaHei",Arial,sans-serif}
    button,input{font:inherit}
    .loading{display:grid;min-height:100vh;place-items:center;color:#b0b3b8}
    .weight-shell{min-height:100vh;padding:28px;background:#18191a}
    .weight-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;max-width:1280px;margin:0 auto 20px}
    .eyebrow{margin:0 0 6px;color:#5eb5ff;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    h1{margin:0;font-size:24px;line-height:1.25}
    .weight-top p:last-child{max-width:700px;margin:8px 0 0;color:#b0b3b8;line-height:1.55}
    .weight-actions{display:flex;gap:8px;align-items:center}
    .button{border:0;border-radius:6px;padding:10px 13px;font-weight:800;cursor:pointer;white-space:nowrap}
    .button.primary{background:#1877f2;color:#fff}
    .button.primary:hover:not(:disabled){background:#4599ff}
    .button.secondary{background:#3a3b3c;color:#e4e6eb}
    .button.secondary:hover{background:#4a4d52}
    .button:disabled{cursor:not-allowed;background:#3a3b3c;color:#8a8d91}
    .weight-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;max-width:1280px;margin:0 auto 16px}
    .summary{padding:13px 14px;border:1px solid #3a3b3c;border-radius:8px;background:#242526}
    .summary strong{display:block;color:#e4e6eb;font-size:18px}
    .summary span{display:block;margin-top:4px;color:#b0b3b8;font-size:12px}
    .weight-table-wrap{max-width:1280px;margin:0 auto;border:1px solid #3a3b3c;border-radius:8px;background:#242526;overflow:auto}
    table{width:100%;border-collapse:collapse;min-width:760px}
    th,td{padding:13px 16px;border-bottom:1px solid #3a3b3c;text-align:left;vertical-align:middle}
    th{position:sticky;top:0;background:#2a2b2d;color:#b0b3b8;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
    tbody tr:last-child td{border-bottom:0}
    tbody tr:hover{background:#2a2b2d}
    .family-row td{padding:9px 16px;background:#1f2021;color:#8ab4f8;font-size:12px;font-weight:800;letter-spacing:.04em}
    .component-copy{display:grid;gap:3px}
    .component-copy strong{color:#e4e6eb}
    .component-copy span{color:#8a8d91;font:12px ui-monospace,SFMono-Regular,Consolas,monospace}
    .weight-field{display:flex;align-items:center;gap:10px;min-width:220px}
    .weight-field input{width:74px;border:1px solid #4a4d52;border-radius:6px;background:#18191a;color:#e4e6eb;padding:8px 9px;text-align:center}
    .weight-field input:focus{outline:2px solid #1877f2;outline-offset:1px}
    .weight-meter{width:112px;height:7px;border-radius:999px;background:#3a3b3c;overflow:hidden}
    .weight-meter i{display:block;height:100%;border-radius:inherit;background:#1877f2}
    .weight-note{color:#b0b3b8;font-size:12px;line-height:1.45}
    .status{max-width:1280px;margin:14px auto 0;color:#8ab4f8;line-height:1.5}
    @media(max-width:720px){.weight-shell{padding:18px 14px}.weight-top{display:grid}.weight-actions{width:100%}.weight-actions .button{flex:1}.weight-summary{grid-template-columns:1fr}.weight-table-wrap{border-radius:6px}}
  </style>
</head>
<body>
  <div id="component-weights-root"></div>
  <script src="/component-weights.js?v=20260914-priority-v1"></script>
</body>
</html>`;

module.exports = {buildComponentWeightsPage};
