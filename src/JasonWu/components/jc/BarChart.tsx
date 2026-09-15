import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { COLOR, FONT, GRID, MOTION, SIZE, type SemanticColor } from './tokens';

export type BarItem = {
  label: string; // 'WhatsApp'
  value: number; // 用于算长度
  display: string; // '$19B'
  highlight?: boolean; // 重点条换语义色，其余灰
};

// 横向条形图：条随时间从左长出（错峰），重点条用语义色，其余灰。
// 参考 refs/05-数据可视化/n4_t076（Meta 并购 TOP3）、n3_t159。
export const BarChart: React.FC<{
  items: BarItem[];
  accent?: SemanticColor;
  width?: number; // 最长条的像素长度
  enterAt?: number;
}> = ({ items, accent = 'yellow', width = 420, enterAt = 0 }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: GRID * 2 }}>
      {items.map((item, i) => {
        const start = enterAt + i * MOTION.stagger;
        const t = interpolate(frame, [start, start + 24], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const barW = (item.value / max) * width * t;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: t === 0 ? 0 : 1 }}>
            <div
              style={{
                width: 120,
                textAlign: 'right',
                fontFamily: FONT.en,
                fontWeight: 700,
                fontSize: SIZE.subSmall,
                color: COLOR.grey,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                width: barW,
                height: 16,
                borderRadius: 8,
                background: item.highlight ? COLOR[accent] : 'rgba(255,255,255,0.22)',
              }}
            />
            <div
              style={{
                fontFamily: FONT.en,
                fontWeight: 800,
                fontSize: SIZE.subSmall,
                color: item.highlight ? COLOR[accent] : COLOR.grey,
                opacity: t,
              }}
            >
              {item.display}
            </div>
          </div>
        );
      })}
    </div>
  );
};
