import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, GRADIENT, GRID, RADIUS, SIZE } from './tokens';

// 错缝砖块横墙（基准片同款「法律硬性建墙」）：金色果冻砖逐块弹入砌起，
// 中央嵌一枚双层标签 chip（英文 kicker + 中文粗黑）。
// 砖 150x56，错缝 = 奇数排整体左移半砖并裁切，墙两侧保持平边。
// 参考 refs/pair 47；质感规范：果冻渐变 + inset 高光 + 同色 glow。

const BRICK_W = 150;
const BRICK_H = 56;
const GAP = GRID; // 砖缝 8px

const GLOW_YELLOW = 'rgba(255,197,61,0.4)';

export const BrickWall: React.FC<{
  label: string; // 中文标签（如「法律 · 硬性建墙」）
  enLabel?: string; // 英文 kicker（如「LEGAL WALL」）
  rows?: number; // 砖排数，默认 2
  width?: number; // 墙总宽，默认 620，实际取整砖列数
  enterAt: number;
}> = ({ label, enLabel, rows = 2, width = 620, enterAt }) => {
  const frame = useCurrentFrame();
  const cols = Math.max(2, Math.round((width + GAP) / (BRICK_W + GAP)));
  const W = cols * BRICK_W + (cols - 1) * GAP;
  const H = rows * BRICK_H + (rows - 1) * GAP;
  const totalBricks = rows * cols;
  const [g0, g1] = GRADIENT.yellow;
  const chipEnter = useEnter(enterAt + totalBricks * 3 + 6, 'up');

  return (
    <div style={{ position: 'relative', width: W, height: H, filter: `drop-shadow(0 0 28px ${GLOW_YELLOW})` }}>
      {/* 砖体：自底向上、每排从左到右逐块弹入，每块间隔 3 帧 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: GRID * 0.75 }}>
        {Array.from({ length: rows }).map((_, row) => {
          // row=0 为最底排；奇数排左移半砖形成错缝，多补一块保证右边不缺口
          const offset = row % 2 === 1;
          const rowCols = offset ? cols + 1 : cols;
          return (
            <div
              key={row}
              style={{
                position: 'absolute',
                bottom: row * (BRICK_H + GAP),
                left: offset ? -(BRICK_W + GAP) / 2 : 0,
                display: 'flex',
                gap: GAP,
              }}
            >
              {Array.from({ length: rowCols }).map((_, col) => {
                const idx = row * cols + col;
                const p = interpolate(frame, [enterAt + idx * 3, enterAt + idx * 3 + 10], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.out(Easing.cubic),
                });
                return (
                  <div
                    key={col}
                    style={{
                      width: BRICK_W,
                      height: BRICK_H,
                      borderRadius: GRID * 0.75,
                      background: `linear-gradient(160deg, ${g0} 0%, ${g1} 100%)`,
                      boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.25)',
                      opacity: p,
                      transform: `translateY(${(1 - p) * 24}px)`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      {/* 中央标签 chip：砖砌完后从下浮入 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) ${chipEnter.transform}`,
          opacity: chipEnter.opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: `${GRID}px ${GRID * 3}px`,
          background: COLOR.cardBg,
          border: `1.5px solid ${COLOR.yellow}`,
          borderRadius: RADIUS.chip,
          boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
          whiteSpace: 'nowrap',
        }}
      >
        {enLabel ? (
          <span
            style={{
              fontFamily: FONT.en,
              fontWeight: FONT.enBold,
              fontSize: SIZE.kicker,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: COLOR.yellow,
            }}
          >
            {enLabel}
          </span>
        ) : null}
        <span style={{ fontFamily: FONT.zh, fontWeight: FONT.zhHeavy, fontSize: SIZE.chip, color: COLOR.white }}>
          {label}
        </span>
      </div>
    </div>
  );
};
