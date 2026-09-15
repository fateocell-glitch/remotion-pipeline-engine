import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { COLOR, GRADIENT, GRID, MOTION, type SemanticColor } from './tokens';

// 单元方阵：N 组 R×C 语义色果冻小方块并排，逐格「点亮」，表「批量出清 / 规模」。
// 点亮顺序 = 确定性伪随机（互质步长打乱，同 MatrixIcon 的 (i*37)%N 手法），渲染稳定可复现。
// waffle 用法：单组 rows=10 cols=20（200 格）+ fillRatio=0.73，点亮格语义色、未点亮格灰暗常驻，
// 配 BigNumber「73%」构成数据场（对比报告 pair 72 / 73% 套壳段修法）。

const GLOW: Record<SemanticColor, string> = {
  green: 'rgba(61,220,132,0.4)',
  red: 'rgba(255,77,77,0.4)',
  blue: 'rgba(77,158,255,0.4)',
  yellow: 'rgba(255,197,61,0.4)',
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
// 找一个与 total 互质的步长，把 0..total-1 打乱成确定性「伪随机」点亮序
const pickStride = (total: number): number => {
  for (const s of [37, 29, 23, 17, 13, 11, 7, 3]) {
    if (gcd(total, s) === 1) return s;
  }
  return 1;
};

// 三段变形（2026-07-16 seg02 词级方案：基准片 waffle = 灰占位 → 随数字滚动逐格变红 → 18 格变绿反转，
// 一个图形载体跟口播演三拍，不拆成孤立元素）。stages 缺省时保持旧行为。
export type MatrixStages = {
  placeholderAt: number; // 灰阵占位入场帧（全部格子灰色可见，制造「200 家」期待）
  fillAt: number; // 语义色逐格点亮起始帧（与 BigNumber 滚动同拍）
  fillFrames?: number; // 点亮总时长，默认 45（与 countFrames 同步）
  greenAt?: number; // 反转拍：greenCount 格变绿
  greenCount?: number;
};

const MatrixGroup: React.FC<{
  rows: number;
  cols: number;
  color: SemanticColor;
  cell: number;
  gap: number;
  fillRatio?: number;
  enterAt: number;
  stages?: MatrixStages;
}> = ({ rows, cols, color, cell, gap, fillRatio, enterAt, stages }) => {
  const frame = useCurrentFrame();
  const [g0, g1] = GRADIENT[color];
  const [gg0, gg1] = GRADIENT.green;
  const total = rows * cols;
  const stride = pickStride(total);
  const litCount =
    fillRatio == null ? total : Math.round(Math.max(0, Math.min(1, fillRatio)) * total);
  const greenCount = stages?.greenCount ?? 0;
  // 点亮节奏：旧模式 ~110 帧内点完；stages 模式按 fillFrames 均摊（跟数字滚动同步收尾）
  const fillFrames = stages?.fillFrames ?? 45;
  const stagger = stages
    ? Math.max(0.15, fillFrames / Math.max(1, litCount))
    : Math.min(1.4, 110 / Math.max(1, litCount));
  const baseAt = stages ? stages.placeholderAt : enterAt;
  const fillAt = stages ? stages.fillAt : enterAt;
  const W = cols * cell + (cols - 1) * gap;
  const H = rows * cell + (rows - 1) * gap;

  return (
    <div style={{ position: 'relative', width: W, height: H, filter: `drop-shadow(0 0 28px ${GLOW[color]})` }}>
      {Array.from({ length: total }, (_, i) => {
        const rank = (i * stride) % total; // 该格在点亮序中的次序
        const isRed = rank < litCount;
        const isGreen = stages != null && !isRed && rank < litCount + greenCount;
        const left = (i % cols) * (cell + gap);
        const top = Math.floor(i / cols) * (cell + gap);
        // 灰底：占位拍全员淡入（stages 模式更亮 0.55，占位本身是叙事；旧模式维持 0.35 弱常驻）
        const base = interpolate(frame, [baseAt, baseAt + MOTION.popInFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.quad),
        });
        const greyOpacity = base * (stages ? 1 : MOTION.dimOpacity);
        const greyBg = stages ? 'rgba(190,196,206,0.32)' : COLOR.cardStroke; // 占位是叙事：灰格必须清晰可见（基准片 z12 灰阵）
        // 彩色点亮进度
        let t = 0;
        let grad: [string, string] | null = null;
        if (isRed) {
          t = interpolate(frame, [fillAt + rank * stagger, fillAt + rank * stagger + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          grad = [g0, g1];
        } else if (isGreen && stages?.greenAt != null) {
          const gRank = rank - litCount;
          t = interpolate(frame, [stages.greenAt + gRank * 1.2, stages.greenAt + gRank * 1.2 + 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          grad = [gg0, gg1];
        }
        return (
          <div key={i} style={{ position: 'absolute', left, top, width: cell, height: cell }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: cell * 0.26,
                background: greyBg,
                opacity: greyOpacity * (1 - t),
              }}
            />
            {grad && t > 0 ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: cell * 0.26,
                  background: `linear-gradient(160deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
                  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.25)',
                  opacity: t * (0.78 + ((i * 37) % 22) / 100),
                  transform: `scale(${0.5 + 0.5 * t})`,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export const UnitMatrix: React.FC<{
  groups?: number; // 并排组数，默认 3
  rows?: number; // 每组行数，默认 5
  cols?: number; // 每组列数，默认 8
  color?: SemanticColor; // 默认 red（批量出清 / 危机）
  cell?: number; // 单格边长，默认 30
  gap?: number; // 格间距，默认 6
  fillRatio?: number; // 0-1 点亮比例；缺省全亮。waffle 模式配 groups=1 rows=10 cols=20
  enterAt: number;
  stages?: MatrixStages; // 三段变形（灰占位→点亮→变绿），传入后 enterAt 仅作兜底
}> = ({ groups = 3, rows = 5, cols = 8, color = 'red', cell = 30, gap = 6, fillRatio, enterAt, stages }) => {
  return (
    <div style={{ display: 'flex', gap: GRID * 3, alignItems: 'flex-start' }}>
      {Array.from({ length: groups }, (_, g) => (
        <MatrixGroup
          key={g}
          rows={rows}
          cols={cols}
          color={color}
          cell={cell}
          gap={gap}
          fillRatio={fillRatio}
          enterAt={enterAt + g * MOTION.stagger}
          stages={stages}
        />
      ))}
    </div>
  );
};
