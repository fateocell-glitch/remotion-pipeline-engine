import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, MOTION, RADIUS, type SemanticColor } from './tokens';

// 时间线卡（seg06 实测规格，specs.md §2「时间线卡容器」+「时间线卡节点行」）。
// 从规格建件（非读旧片内联）：黑半透容器 + 头行 THE DEAL·结局 + ≤4 节点逐拍 stagger 堆叠。
// 用途：案例段「后果时间线」——一串带日期的结局条目。默认红（判死语义），可按节点覆盖色。
// 与同区其他大卡错时不同框（勿并存），区位 x≈1250-1590 / y≈300-600。

export type TimelineNode = {
  date: string; // 日期标签，如 "'23"
  label: string; // 中文事件，如 "下调估值 20%"
  color?: SemanticColor; // 日期 + 图标语义色（默认 red）
  icon?: React.ReactNode; // 16px 状态图标（lucide，继承 currentColor 上色）
};

export const TimelineCard: React.FC<{
  title?: string; // 头行英文（默认 THE DEAL）
  subtitle?: string; // 头行中文补语（默认 结局）
  nodes: TimelineNode[]; // ≤4 节点，超出截断
  enterAt: number; // 容器显影帧
  stagger?: number; // 逐节点入场间隔帧（默认 10 ≈ 逐拍）
  width?: number;
}> = ({ title = 'THE DEAL', subtitle = '结局', nodes, enterAt, stagger = 10, width = 340 }) => {
  const frame = useCurrentFrame();
  const card = useEnter(enterAt, 'up'); // 容器显影（滑入+淡入）
  const rows = nodes.slice(0, 4); // 承 ≤4 节点

  return (
    <div
      data-qc="box"
      data-qc-id="timeline-card"
      style={{
        width,
        padding: '22px 26px',
        background: 'rgba(12,12,15,0.92)', // 黑半透（规格实测值）
        border: `1px solid ${COLOR.cardStroke}`,
        borderRadius: RADIUS.card, // 20
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        opacity: card.opacity,
        transform: card.transform,
      }}
    >
      {/* 头行：THE DEAL 白 tracked 24 + · 结局 灰 22 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
        <span
          style={{
            fontFamily: FONT.en,
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: '0.16em',
            color: COLOR.white,
          }}
        >
          {title}
        </span>
        <span style={{ fontFamily: FONT.zh, fontWeight: 700, fontSize: 22, color: COLOR.grey }}>· {subtitle}</span>
      </div>

      {/* 节点行：日期 20 语义色 + 状态图标 16 + 中文 22；逐拍 stagger 堆叠 */}
      {rows.map((n, i) => {
        const local = frame - (enterAt + 6 + i * stagger);
        const t = interpolate(local, [0, MOTION.popInFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const op = interpolate(local, [0, MOTION.popInFrames * 0.7], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const shift = (1 - t) * 24; // 向上堆叠落定
        const c = COLOR[n.color ?? 'red'];
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              height: 52,
              marginBottom: i < rows.length - 1 ? 20 : 0, // 行距 ~72
              opacity: op,
              transform: `translateY(${shift}px)`,
            }}
          >
            <span
              style={{
                fontFamily: FONT.en,
                fontWeight: 800,
                fontSize: 20,
                color: c,
                minWidth: 40,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {n.date}
            </span>
            {n.icon ? (
              <span style={{ color: c, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{n.icon}</span>
            ) : null}
            <span style={{ fontFamily: FONT.zh, fontWeight: 700, fontSize: 22, color: COLOR.white, whiteSpace: 'nowrap' }}>
              {n.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
