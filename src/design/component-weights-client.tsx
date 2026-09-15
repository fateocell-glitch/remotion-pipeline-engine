import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";

type ComponentAsset = {id:string; name:string; family:string; description:string};
type Registry = {families:{id:string; name:string}[]; components:ComponentAsset[]};
type Weights = Record<string, number>;

const api = async <T,>(url:string, init?:RequestInit):Promise<T> => {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) throw new Error(text || "请求失败");
  return JSON.parse(text) as T;
};

const clampWeight = (value:unknown) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : 50;

const App: React.FC = () => {
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [savedWeights, setSavedWeights] = useState<Weights>({});
  const [draftWeights, setDraftWeights] = useState<Weights>({});
  const [status, setStatus] = useState("正在载入组件推荐策略…");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api<Registry>("/api/admin/components"), api<Weights>("/api/admin/component-weights")])
      .then(([nextRegistry, nextWeights]) => {
        setRegistry(nextRegistry);
        setSavedWeights(nextWeights);
        setDraftWeights(nextWeights);
        setStatus("权重仅影响下一次智能匹配，不会修改已生成的 Beat。");
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "载入推荐策略失败"));
  }, []);

  const rows = useMemo(() => {
    if (!registry) return [];
    return registry.families.map((family) => ({
      family,
      components: registry.components.filter((component) => component.family === family.id),
    }));
  }, [registry]);
  const changedCount = Object.keys(draftWeights).filter((id) => draftWeights[id] !== savedWeights[id]).length;
  const promotedCount = Object.values(draftWeights).filter((weight) => weight >= 75).length;

  const updateWeight = (id:string, value:unknown) => setDraftWeights((current) => ({...current, [id]: clampWeight(value)}));
  const save = async () => {
    setSaving(true);
    setStatus("正在保存组件命中优先级…");
    try {
      const next = await api<Weights>("/api/admin/component-weights", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({weights: draftWeights}),
      });
      setSavedWeights(next);
      setDraftWeights(next);
      setStatus("已保存。下一次智能分拍会立即读取新的组件优先级。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存权重失败");
    } finally {
      setSaving(false);
    }
  };

  if (!registry) return <main className="loading">{status}</main>;
  return <main className="weight-shell">
    <header className="weight-top">
      <div>
        <p className="eyebrow">Super Admin · Matching Strategy</p>
        <h1>组件命中优先级</h1>
        <p>最终得分 = 语义相关度 × 0.4 + 基础优先级 × 0.6 − 疲劳惩罚。上一 Beat 同组件扣 80；全片累计出现超过一次再扣 40。</p>
      </div>
      <div className="weight-actions">
        <button className="button secondary" type="button" onClick={() => window.location.assign("/admin/components")}>返回组件资产库</button>
        <button className="button primary" type="button" disabled={!changedCount || saving} onClick={save}>{saving ? "保存中…" : "保存命中权重"}</button>
      </div>
    </header>
    <section className="weight-summary" aria-label="权重摘要">
      <div className="summary"><strong>{registry.components.length}</strong><span>已注册组件</span></div>
      <div className="summary"><strong>{promotedCount}</strong><span>高优先级组件（75+）</span></div>
      <div className="summary"><strong>{changedCount}</strong><span>待保存调整</span></div>
    </section>
    <section className="weight-table-wrap">
      <table>
        <thead><tr><th>组件分类</th><th>效果组件</th><th>基础优先级（0–100）</th><th>仲裁说明</th></tr></thead>
        <tbody>
          {rows.map(({family, components}) => <React.Fragment key={family.id}>
            <tr className="family-row"><td colSpan={4}>{family.name}</td></tr>
            {components.map((component) => {
              const weight = clampWeight(draftWeights[component.id]);
              return <tr key={component.id}>
                <td>{family.name}</td>
                <td><div className="component-copy"><strong>{component.name}</strong><span>{component.id}</span></div></td>
                <td><div className="weight-field"><input aria-label={component.name + " 基础优先级"} type="number" min={0} max={100} value={weight} onChange={(event) => updateWeight(component.id, event.currentTarget.value)}/><span className="weight-meter" aria-hidden="true"><i style={{width:weight + "%"}}></i></span></div></td>
                <td className="weight-note">{weight >= 75 ? "优先推荐" : weight <= 40 ? "谨慎使用" : "按语义正常参与"}</td>
              </tr>;
            })}
          </React.Fragment>)}
        </tbody>
      </table>
    </section>
    <p className="status" role="status">{status}</p>
  </main>;
};

const node = document.getElementById("component-weights-root");
if (node) createRoot(node).render(<App/>);
