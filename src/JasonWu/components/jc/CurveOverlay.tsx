import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { COLOR, type SemanticColor } from './tokens';

// 曲线叠加：一条语义色长坡曲线直接叠在 B-roll / 底图上，随帧从左往右生长。
// 参考 refs/05-数据可视化/n3_t216（黄色科技红利长坡）。
export const CurveOverlay: React.FC<{
  width: number;
  height: number;
  color?: SemanticColor;
  strokeWidth?: number;
  exponent?: number; // 曲线陡峭度：2 缓坡，3 更陡收尾
  growFrames?: number;
  enterAt?: number;
}> = ({ width, height, color = 'yellow', strokeWidth = 6, exponent = 2.2, growFrames = 70, enterAt = 0 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [enterAt, enterAt + growFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const N = 48;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const x = i / N;
    const y = Math.pow(x, exponent);
    return `${(x * width).toFixed(1)},${(height * (0.96 - 0.9 * y)).toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={COLOR[color]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
    </svg>
  );
};
