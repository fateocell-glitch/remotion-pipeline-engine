import React, {useEffect, useRef, useState} from "react";
import {createRoot} from "react-dom/client";

type PreviewPayload = {
  mode: "library" | "custom";
  layout: string;
  headline: string;
  effectZh: string;
  effectProps: Record<string, unknown>;
  commonProps: Record<string, unknown>;
  previewTimeSeconds: number;
  previewFrame: number;
  faceZone?: {faceX:number; faceY:number; faceW:number; faceH:number; safeX?:number; safeY?:number; safeW?:number; safeH?:number; faceArea?:string} | null;
  showFaceGuide?: boolean;
};

const colors = ["#00F2FE", "#FFD166", "#36D399", "#8B5CF6"];
const asText = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value : fallback;
const asItems = (value: unknown, fallback: string[]) => Array.isArray(value) && value.some((item) => typeof item === "string" && !!item.trim()) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()).slice(0, 4) : fallback;
const numberLabel = (index: number) => (index + 1 < 10 ? "0" : "") + String(index + 1);
const defaultItems = ["核心观点", "关键判断", "下一步行动"];

class PreviewErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  state = {error: null as Error | null};
  static getDerivedStateFromError(error: Error) { return {error}; }
  render() { return this.state.error ? <div style={{color: "#FCA5A5", padding: 40, fontFamily: "sans-serif"}}>预览组件加载失败：{this.state.error.message}</div> : this.props.children; }
}

const ChipPreview: React.FC<{items: string[]}> = ({items}) => <div style={{width: 720, display: "flex", flexDirection: "column", gap: 8}}>{items.map((item, index) => <div key={item+index} style={{marginLeft: index * 34, height: 104, boxSizing: "border-box", padding: "16px 28px", border: "2px solid "+colors[index % colors.length], clipPath: "polygon(5% 0,100% 0,95% 100%,0 100%)", background: "rgba(5,13,24,.92)", boxShadow: "0 0 26px "+colors[index % colors.length]+"55"}}><div style={{color: colors[index % colors.length], fontSize: 18, fontWeight: 900, letterSpacing: 5}}>CHIP / {numberLabel(index)}</div><div style={{marginTop: 9, color: "#fff", fontSize: 35, fontWeight: 900}}>{item}</div></div>)}</div>;
const ChecklistPreview: React.FC<{headline: string; items: string[]; color: string}> = ({headline,items,color}) => <div style={{width: 760}}><div style={{color: "#FFD166", fontSize: 18, letterSpacing: 5}}>FINAL REVIEW</div><div style={{marginTop: 18, color: "#fff", fontSize: 58, fontWeight: 950}}>{headline}</div><div style={{display: "grid", gap: 14, marginTop: 28}}>{items.map((item,index)=><div key={item+index} style={{display:"flex",alignItems:"center",gap:16,padding:"16px 20px",border:"1px solid "+color,background:"rgba(5,13,24,.9)"}}><span style={{width:34,height:34,border:"2px solid "+color,color,display:"grid",placeItems:"center",fontSize:24}}>✓</span><span style={{color:"#fff",fontSize:31,fontWeight:900}}>{item}</span></div>)}</div></div>;
const SequencePreview: React.FC<{headline: string;items:string[]}> = ({headline,items}) => <div style={{width:760}}><div style={{color:"#FFD166",fontSize:18,letterSpacing:5}}>STRUCTURED FLOW</div><div style={{margin:"14px 0 24px",color:"#fff",fontSize:54,fontWeight:950}}>{headline}</div>{items.map((item,index)=><div key={item+index} style={{display:"flex",alignItems:"center",gap:22,marginBottom:14}}><b style={{color:colors[index%colors.length],fontSize:52}}>{numberLabel(index)}</b><div style={{flex:1,padding:"16px 20px",border:"1px solid "+colors[index%colors.length],background:"rgba(5,13,24,.9)",color:"#fff",fontSize:30,fontWeight:900}}>{item}</div></div>)}</div>;
const DataPreview: React.FC<{headline:string;props:Record<string,unknown>}> = ({headline,props}) => <div style={{width:820}}><div style={{color:"#00F2FE",fontSize:19,letterSpacing:5}}>DATA / SIGNAL</div><div style={{marginTop:15,color:"#fff",fontSize:56,fontWeight:950}}>{headline}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:28}}>{[[asText(props.leftLabel,"核心指标"),asText(props.leftValue,"72%"),"#FFD166"],[asText(props.rightLabel,"关键结论"),asText(props.rightValue,"效率提升"),"#00F2FE"]].map(([label,value,color])=><div key={label} style={{padding:24,border:"1px solid "+color,background:"rgba(5,13,24,.9)"}}><div style={{color,fontSize:18,fontWeight:900}}>{label}</div><div style={{marginTop:18,color:"#fff",fontSize:50,fontWeight:950}}>{value}</div></div>)}</div></div>;
const StatementPreview: React.FC<{headline:string;copy:string}> = ({headline,copy}) => <div style={{width:1080,textAlign:"center"}}><div style={{color:"#FFD166",fontSize:20,letterSpacing:6}}>KEY STATEMENT</div><div style={{marginTop:28,color:"#fff",fontSize:94,lineHeight:1.08,fontWeight:950,textShadow:"0 0 34px rgba(0,242,254,.45)"}}>{headline}</div><div style={{marginTop:24,color:"#9CB2C9",fontSize:32,fontWeight:800}}>{copy}</div></div>;

const asNumber = (value: unknown, fallback: number) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; };
const commonPreviewStyle = (props: Record<string, unknown>): React.CSSProperties => {
  const position = asText(props.position, "center");
  const offsetX = asNumber(props.offsetX, 0);
  const offsetY = asNumber(props.offsetY, 0);
  const scale = Math.max(.8, Math.min(1.2, asNumber(props.scale, 1)));
  const anchors: Record<string, React.CSSProperties> = {
    center: {left: "50%", top: "50%", transform: "translate(-50%,-50%)"},
    "bottom-left": {left: 150, bottom: 126, transform: "translate(0,0)"},
    "bottom-right": {right: 150, bottom: 126, transform: "translate(0,0)"},
    "top-right": {right: 150, top: 120, transform: "translate(0,0)"},
    "center-right": {right: 150, top: "50%", transform: "translate(0,-50%)"},
  };
  const anchor = anchors[position] || anchors.center;
  return {...anchor, position: "absolute", transform: String(anchor.transform || "") + " translate(" + offsetX + "px," + offsetY + "px) scale(" + scale + ")"};
};

const StandardLayoutPreview: React.FC<{payload: PreviewPayload}> = ({payload}) => {
  const isCustom = payload.mode === "custom";
  const props = isCustom ? payload.effectProps : {};
  const headline = isCustom ? payload.headline : payload.layout.replace(/-/g, " ").toUpperCase();
  const copy = isCustom ? payload.effectZh : "标准效果展示";
  const items = asItems(props.items ?? props.steps, isCustom ? [headline, copy, "视觉重点"] : defaultItems);
  const color = asText(props.boxColor, "blue");
  const palette: Record<string,string> = {purple:"#8B5CF6",blue:"#0A84FF",gold:"#FFD166",white:"#F8FAFC",green:"#36D399",red:"#FF6B6B"};
  let content: React.ReactNode;
  if (payload.layout === "diagonal-chips" || payload.layout === "floating-chips") content = <ChipPreview items={items} />;
  else if (["closing-checklist","reject-list","check-progress","clipboard-note"].indexOf(payload.layout) >= 0) content = <ChecklistPreview headline={headline} items={items} color={palette[color] ?? "#00F2FE"} />;
  else if (["ordered-sequence","org-chart","pivot-list","route-map","event-timeline"].indexOf(payload.layout) >= 0) content = <SequencePreview headline={headline} items={items} />;
  else if (["data-flow","value-verdict","capital-dashboard","progress-donut","bull-bear"].indexOf(payload.layout) >= 0) content = <DataPreview headline={headline} props={props} />;
  else content = <StatementPreview headline={headline} copy={copy} />;
  return <div style={commonPreviewStyle(isCustom ? payload.commonProps : {})}>{content}</div>;
};

const FaceGuide: React.FC<{payload: PreviewPayload}> = ({payload}) => {
  const zone = payload.faceZone;
  if (!payload.showFaceGuide || !zone) return null;
  const x = Math.max(0, Number(zone.safeX ?? zone.faceX)) * 1920, y = Math.max(0, Number(zone.safeY ?? zone.faceY)) * 1080;
  const w = Math.min(1, Number(zone.safeW ?? zone.faceW)) * 1920, h = Math.min(1, Number(zone.safeH ?? zone.faceH)) * 1080;
  const common = payload.commonProps || {};
  const scale = Math.max(.8, Math.min(1.2, asNumber(common.scale, 1)));
  const boxW = 760 * scale, boxH = 300 * scale, position = asText(common.position, "center");
  const componentX = position === "bottom-left" ? 120 : position === "bottom-right" || position === "center-right" || position === "top-right" ? 1920 - boxW - 120 : 960 - boxW / 2;
  const componentY = position === "top-right" ? 130 : position === "bottom-left" || position === "bottom-right" ? 1080 - boxH - 130 : 540 - boxH / 2;
  return <><div style={{position:"absolute",left:x,top:y,width:w,height:h,border:"4px dashed #F59E0B",background:"rgba(245,158,11,.08)",pointerEvents:"none",zIndex:8}}><span style={{position:"absolute",left:0,top:-34,padding:"5px 9px",background:"#92400E",color:"#FEF3C7",fontSize:18,fontWeight:900}}>FACE SAFE · {zone.faceArea || "center"}</span></div><div style={{position:"absolute",left:componentX,top:componentY,width:boxW,height:boxH,border:"3px dashed #38BDF8",background:"rgba(56,189,248,.04)",pointerEvents:"none",zIndex:7}}><span style={{position:"absolute",right:0,bottom:-34,padding:"5px 9px",background:"#075985",color:"#E0F2FE",fontSize:18,fontWeight:900}}>COMPONENT BOX</span></div></>;
};

const PreviewApp: React.FC<{payload: PreviewPayload | null}> = ({payload}) => {
  const [scale, setScale] = useState(.2);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;
    const measure = () => setScale(Math.max(.01, Math.min(node.clientWidth / 1920, node.clientHeight / 1080)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={canvasRef} style={{width:"100%",height:"100%",overflow:"hidden",background:"#090d16",display:"grid",placeItems:"center"}}><PreviewErrorBoundary><div style={{width:1920,height:1080,position:"relative",transform:"scale("+scale+")",transformOrigin:"center center",display:"grid",placeItems:"center",backgroundImage:"linear-gradient(rgba(55,79,112,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(55,79,112,.14) 1px, transparent 1px)",backgroundSize:"54px 54px"}}>{payload?<><StandardLayoutPreview payload={payload}/><FaceGuide payload={payload}/><div style={{position:"absolute",right:42,bottom:36,padding:"9px 13px",border:"1px solid rgba(0,242,254,.35)",background:"rgba(5,13,24,.86)",color:"#BFFAFF",fontSize:20,fontWeight:800,letterSpacing:1}}>定格预览 · {payload.previewTimeSeconds.toFixed(1)}s · {payload.previewFrame}f</div></>:<div style={{color:"#FCA5A5",fontSize:30}}>未收到当前效果预览数据</div>}</div></PreviewErrorBoundary></div>;
};

type PreviewHost = {render: (container: HTMLElement, payload: PreviewPayload) => void};
const roots = new WeakMap<HTMLElement, ReturnType<typeof createRoot>>();
const previewHost: PreviewHost = {render(container, payload) { let root = roots.get(container); if (!root) { root = createRoot(container); roots.set(container, root); } root.render(<PreviewApp payload={payload} />); }};
(window as unknown as {StudioLayoutPreview: PreviewHost}).StudioLayoutPreview = previewHost;
