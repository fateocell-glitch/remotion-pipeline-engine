import React from 'react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, MOTION, SURFACE, type SemanticColor, type SurfaceVariant } from './tokens';

export type FlowNode = {
  icon?: React.ReactNode; // lucide 图标，色随 accent
  lines: string[]; // 节点内中文（1-2 行，居中）
  accent?: SemanticColor;
};

// 逻辑链：语义色描边方卡节点 + 灰色箭头串联，逐节点出现。
// 参考 refs/04-信息卡与步骤流程/n1_t172（打包→痛点→复制=变现）。
// surface='light' 用于白板/亮背景场景（亮底深字，语义色图标不变）。
export const FlowChain: React.FC<{
  nodes: FlowNode[];
  nodeWidth?: number;
  surface?: SurfaceVariant; // 'dark'（默认，现状）| 'light'（白板场景亮面变体）
  enterAt?: number;
  staggerFrames?: number;
}> = ({ nodes, nodeWidth = 190, surface = 'dark', enterAt = 0, staggerFrames = MOTION.stagger }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      {nodes.map((nd, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <Arrow enterAt={enterAt + i * staggerFrames} /> : null}
          <NodeView node={nd} width={nodeWidth} surface={surface} enterAt={enterAt + i * staggerFrames} />
        </React.Fragment>
      ))}
    </div>
  );
};

const Arrow: React.FC<{ enterAt: number }> = ({ enterAt }) => {
  const enter = useEnter(enterAt, 'left');
  return (
    <span
      style={{
        fontFamily: FONT.en,
        fontWeight: 700,
        fontSize: 34,
        color: COLOR.greyDim,
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      →
    </span>
  );
};

const NodeView: React.FC<{ node: FlowNode; width: number; surface: SurfaceVariant; enterAt: number }> = ({
  node,
  width,
  surface,
  enterAt,
}) => {
  const enter = useEnter(enterAt, 'up');
  const c = COLOR[node.accent ?? 'blue'];
  const isLight = surface === 'light';
  return (
    <div
      style={{
        width,
        minHeight: width * 0.86,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '18px 14px',
        background: isLight ? SURFACE.light.bg : 'rgba(12,14,18,0.85)',
        border: `1.5px solid ${isLight ? SURFACE.light.stroke : `${c}66`}`,
        borderRadius: 14,
        boxShadow: isLight ? SURFACE.light.shadow : '0 10px 30px rgba(0,0,0,0.45)',
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      {node.icon ? <span style={{ color: c, display: 'inline-flex' }}>{node.icon}</span> : null}
      <div style={{ textAlign: 'center' }}>
        {node.lines.map((l, i) => (
          <div key={i} style={{ fontFamily: FONT.zh, fontWeight: 700, fontSize: 24, lineHeight: 1.5, color: isLight ? SURFACE.light.fg : COLOR.white }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
