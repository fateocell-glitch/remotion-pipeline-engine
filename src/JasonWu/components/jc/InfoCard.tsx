import React from 'react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, SIZE, SURFACE, type SemanticColor, type SurfaceVariant } from './tokens';

// 信息卡：语义色描边黑卡 = 图标 + 英文 kicker + 中文标题。
// 参考 refs/08/n4_t244（AUTONOMOUS DRIVING · 智驾·高风险场景 蓝卡）。
// surface='light' 用于白板/亮背景场景（亮底深字，语义色图标与 kicker 不变）。
export const InfoCard: React.FC<{
  icon?: React.ReactNode;
  en: string;
  zh: string;
  accent?: SemanticColor;
  surface?: SurfaceVariant; // 'dark'（默认，现状）| 'light'（白板场景亮面变体）
  enterAt?: number;
}> = ({ icon, en, zh, accent = 'blue', surface = 'dark', enterAt = 0 }) => {
  const enter = useEnter(enterAt, 'left');
  const c = COLOR[accent];
  const isLight = surface === 'light';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 24px',
        background: isLight ? SURFACE.light.bg : 'rgba(12,14,18,0.82)',
        border: `1.5px solid ${isLight ? SURFACE.light.stroke : `${c}88`}`,
        borderRadius: 14,
        boxShadow: isLight ? SURFACE.light.shadow : `0 10px 30px rgba(0,0,0,0.45), inset 0 0 26px ${c}14`,
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      {icon ? <span style={{ color: c, display: 'inline-flex', flexShrink: 0 }}>{icon}</span> : null}
      <div>
        <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: SIZE.kicker, letterSpacing: '0.26em', color: c }}>
          {en.toUpperCase()}
        </div>
        <div style={{ marginTop: 5, fontFamily: FONT.zh, fontWeight: 700, fontSize: 26, color: isLight ? SURFACE.light.fg : COLOR.white }}>{zh}</div>
      </div>
    </div>
  );
};
