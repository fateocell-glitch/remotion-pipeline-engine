import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { COLOR, FONT, MOTION, RADIUS, SIZE, type SemanticColor } from './tokens';

export type TimelineEvent = {
  xPct: number; // 0-100，事件在横线上的位置
  title: string; // '2021'
  sub?: string; // '找拜登政府'
  chip?: { text: string; color: SemanticColor }; // 结果 chip：REJECTED 没推成（红）
};

// 事件时间轴：横线从左向右生长，事件点依次亮起，结果 chip 挂在点下方。
// 参考 refs/05-数据可视化/n3_t090、n3_t016。
export const TimelineEvents: React.FC<{
  events: TimelineEvent[];
  width?: number;
  enterAt?: number;
}> = ({ events, width = 760, enterAt = 0 }) => {
  const frame = useCurrentFrame();
  const lineT = interpolate(frame, [enterAt, enterAt + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ position: 'relative', width, height: 150 }}>
      {/* 底线 + 生长亮线 */}
      <div style={{ position: 'absolute', top: 40, left: 0, width, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
      <div style={{ position: 'absolute', top: 40, left: 0, width: width * lineT, height: 3, borderRadius: 2, background: COLOR.blue }} />
      {events.map((ev, i) => {
        const start = enterAt + 10 + i * (MOTION.stagger + 6);
        const t = interpolate(frame, [start, start + MOTION.popInFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const x = (ev.xPct / 100) * width;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: 0, opacity: t, transform: `translateY(${(1 - t) * 14}px)` }}>
            {/* 事件点 */}
            <div
              style={{
                position: 'absolute',
                top: 34,
                left: -7,
                width: 15,
                height: 15,
                borderRadius: 8,
                background: COLOR.blue,
                boxShadow: '0 0 12px rgba(77,158,255,0.8)',
              }}
            />
            {/* 年份 + 说明（点上方） */}
            <div style={{ position: 'absolute', top: -8, left: -6, whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: SIZE.chip, color: COLOR.white }}>{ev.title}</span>
              {ev.sub ? (
                <span style={{ marginLeft: 10, fontFamily: FONT.zh, fontWeight: 700, fontSize: SIZE.subSmall, color: COLOR.grey }}>
                  {ev.sub}
                </span>
              ) : null}
            </div>
            {/* 结果 chip（点下方） */}
            {ev.chip ? (
              <div
                style={{
                  position: 'absolute',
                  top: 66,
                  left: -6,
                  whiteSpace: 'nowrap',
                  padding: '6px 12px',
                  borderRadius: RADIUS.chip,
                  border: `1.5px solid ${COLOR[ev.chip.color]}`,
                  background: COLOR.cardBg,
                  fontFamily: FONT.zh,
                  fontWeight: 700,
                  fontSize: SIZE.subSmall,
                  color: COLOR[ev.chip.color],
                }}
              >
                {ev.chip.text}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
