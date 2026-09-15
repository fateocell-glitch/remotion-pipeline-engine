import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, GRID, MOTION, SIZE } from './tokens';

export type ScoreRow = {
  enKicker: string; // 'HOUSE'
  zhLabel: string; // '众议院'
  left: number; // 218（绿方）
  right: number; // 214（红方）
  note?: string; // 'VP VANCE 万斯投出打破平局的一票'
};

const ScoreRowView: React.FC<{ row: ScoreRow; start: number }> = ({ row, start }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start, 'up');
  const t = interpolate(frame, [start, start + 36], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const l = Math.round(row.left * t);
  const r = Math.round(row.right * t);
  return (
    <div style={{ opacity: enter.opacity, transform: enter.transform }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <span
          style={{
            fontFamily: FONT.en,
            fontWeight: 800,
            fontSize: SIZE.kicker,
            letterSpacing: '0.3em',
            color: COLOR.grey,
          }}
        >
          {row.enKicker.toUpperCase()}
        </span>
        <span style={{ fontFamily: FONT.zh, fontWeight: 700, fontSize: SIZE.subSmall, color: COLOR.grey }}>
          {row.zhLabel}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
          fontFamily: FONT.en,
          fontWeight: 800,
          fontSize: SIZE.h1,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 2px 14px rgba(0,0,0,0.6)',
        }}
      >
        <span style={{ color: COLOR.green }}>{l}</span>
        <span style={{ color: COLOR.grey, fontSize: SIZE.h2 }}>:</span>
        <span style={{ color: COLOR.red }}>{r}</span>
      </div>
      {row.note ? (
        <div
          style={{
            marginTop: 8,
            fontFamily: FONT.zh,
            fontWeight: 700,
            fontSize: SIZE.subSmall,
            color: COLOR.greyDim,
          }}
        >
          {row.note}
        </div>
      ) : null}
    </div>
  );
};

// 票数/比分计分卡：绿:红大数字对峙，数字滚动到位。
// 参考 refs/05-数据可视化/n3_t123（218:214 / 51:50）。
export const ScoreBoard: React.FC<{ rows: ScoreRow[]; enterAt?: number }> = ({ rows, enterAt = 0 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: GRID * 4 }}>
      {rows.map((row, i) => (
        <ScoreRowView key={i} row={row} start={enterAt + i * (MOTION.stagger * 2)} />
      ))}
    </div>
  );
};
