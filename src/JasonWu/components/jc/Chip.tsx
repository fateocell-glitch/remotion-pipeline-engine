import React from 'react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, MOTION, RADIUS, SIZE, SURFACE, type SemanticColor, type SurfaceVariant } from './tokens';

export type ChipSegment = { t: string; color?: SemanticColor };

// 胶囊短语：黑卡 + 可选图标 + 文字（可一处换色词）。
// accent 决定图标色与（可选的）描边情绪；参考 refs/03-chip与checklist/。
// surface='light' 用于白板/亮背景场景（亮底深字，语义色不变）。
export const Chip: React.FC<{
  segments: ChipSegment[];
  icon?: React.ReactNode; // lucide 图标（推荐，色用 COLOR[accent]）或字符串
  accent?: SemanticColor;
  outlined?: boolean; // 情绪化描边（THE TRAP 红卡风格）
  dimmed?: boolean; // 未激活态
  surface?: SurfaceVariant; // 'dark'（默认，现状）| 'light'（白板场景亮面变体）
  enterAt?: number;
}> = ({ segments, icon, accent = 'blue', outlined = false, dimmed = false, surface = 'dark', enterAt = 0 }) => {
  const enter = useEnter(enterAt, 'left');
  const isLight = surface === 'light';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 18px',
        background: isLight ? SURFACE.light.bg : COLOR.cardBg,
        border: `1.5px solid ${outlined ? COLOR[accent] : isLight ? SURFACE.light.stroke : COLOR.cardStroke}`,
        borderRadius: RADIUS.chip,
        opacity: (dimmed ? MOTION.dimOpacity : 1) * enter.opacity,
        transform: enter.transform,
        boxShadow: isLight ? SURFACE.light.shadow : '0 4px 18px rgba(0,0,0,0.35)',
      }}
    >
      {icon ? (
        <span style={{ fontSize: SIZE.chip - 4, color: COLOR[accent], lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>
          {icon}
        </span>
      ) : null}
      <span style={{ whiteSpace: 'nowrap' }}>
        {segments.map((s, i) => (
          <span
            key={i}
            style={{
              fontFamily: FONT.zh,
              fontWeight: 700,
              fontSize: SIZE.chip,
              color: s.color ? COLOR[s.color] : isLight ? SURFACE.light.fg : COLOR.white,
            }}
          >
            {s.t}
          </span>
        ))}
      </span>
    </div>
  );
};
