import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { type SemanticColor } from './tokens';

// 每个语义色一组「果冻块」渐变（上亮下暗）+ 整体同色发光，复刻基准片的立体方块质感。
const CELL_GRADIENT: Record<SemanticColor, [string, string]> = {
  green: ['#55E698', '#1FA85D'],
  red: ['#FF6B6B', '#D92B35'],
  blue: ['#6FB4FF', '#2F7FE0'],
  yellow: ['#FFD666', '#E8A81E'],
};
const GLOW: Record<SemanticColor, string> = {
  green: 'rgba(61,220,132,0.4)',
  red: 'rgba(255,77,77,0.4)',
  blue: 'rgba(77,158,255,0.4)',
  yellow: 'rgba(255,197,61,0.4)',
};

// 方块矩阵图标：语义色果冻方块阵列逐格弹出 + 中央大图标块（深底白描边，盖住中间区域）。
// 红=会被溶解阵营 / 绿=免疫阵营。参考 refs/08/n4_t121、n4_t168、n4_t244。
export const MatrixIcon: React.FC<{
  color?: SemanticColor;
  rows?: number;
  cols?: number;
  cell?: number;
  gap?: number;
  icon?: React.ReactNode; // 中央图标（lucide，白色，size≈cell*1.3）
  enterAt?: number;
}> = ({ color = 'green', rows = 5, cols = 5, cell = 46, gap = 9, icon, enterAt = 0 }) => {
  const frame = useCurrentFrame();
  const [g0, g1] = CELL_GRADIENT[color];
  const W = cols * cell + (cols - 1) * gap;
  const H = rows * cell + (rows - 1) * gap;
  return (
    <div style={{ position: 'relative', width: W, height: H, filter: `drop-shadow(0 0 28px ${GLOW[color]})` }}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const t = interpolate(frame, [enterAt + i * 1.4, enterAt + i * 1.4 + 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (i % cols) * (cell + gap),
              top: Math.floor(i / cols) * (cell + gap),
              width: cell,
              height: cell,
              borderRadius: cell * 0.26,
              background: `linear-gradient(160deg, ${g0} 0%, ${g1} 100%)`,
              boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.25)',
              opacity: t * (0.78 + ((i * 37) % 22) / 100),
              transform: `scale(${0.5 + 0.5 * t})`,
            }}
          />
        );
      })}
      {icon ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: cell * 2.6,
            height: cell * 2.6,
            borderRadius: cell * 0.6,
            background: 'linear-gradient(165deg, rgba(20,24,29,0.92), rgba(8,10,13,0.92))',
            border: '2.5px solid rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 14px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          {icon}
        </div>
      ) : null}
    </div>
  );
};
