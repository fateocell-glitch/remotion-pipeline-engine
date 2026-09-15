import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { COLOR, FONT, GRID, MOTION, SIZE, type SemanticColor } from './tokens';

export type LoopDiagramProps = {
  size?: number;
  labels?: string[];
  color?: SemanticColor;
  enterAt?: number;
};

const LoopNode: React.FC<{
  label: string;
  index: number;
  size: number;
  enterAt: number;
}> = ({ label, index, size, enterAt }) => {
  const frame = useCurrentFrame();
  const angle = -Math.PI / 2 + index * (Math.PI / 2);
  const radius = size * 0.39;
  const nodeWidth = size * 0.3;
  const nodeHeight = size * 0.12;
  const progress = interpolate(
    frame,
    [enterAt + index * (MOTION.stagger / 2), enterAt + index * (MOTION.stagger / 2) + MOTION.popInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: size / 2 + Math.cos(angle) * radius - nodeWidth / 2,
        top: size / 2 + Math.sin(angle) * radius - nodeHeight / 2,
        width: nodeWidth,
        height: nodeHeight,
        borderRadius: GRID,
        background: COLOR.cardBg,
        border: `1px solid ${COLOR.cardStroke}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT.en,
        fontWeight: FONT.enBold,
        fontSize: SIZE.subSmall,
        color: COLOR.white,
        opacity: progress,
        transform: `scale(${0.72 + progress * 0.28})`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.42)',
      }}
    >
      {label}
    </div>
  );
};

export const LoopDiagram: React.FC<LoopDiagramProps> = ({
  size = 320,
  labels = ['GOAL', 'WORK', 'CHECK', 'STOP'],
  color = 'blue',
  enterAt = 0,
}) => {
  const frame = useCurrentFrame();
  const accent = COLOR[color];
  const ringSize = size * 0.68;
  const ringOffset = (size - ringSize) / 2;
  // 环体与中心胶囊也必须吃 enterAt（错题：此前只有节点门控，环从 Sequence 第 0 帧就渲染=提前白给）
  const bodyOpacity = interpolate(frame, [enterAt, enterAt + MOTION.popInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <div style={{ position: 'relative', width: size, height: size, opacity: bodyOpacity }}>
      <svg
        width={ringSize}
        height={ringSize}
        viewBox={`0 0 ${ringSize} ${ringSize}`}
        style={{
          position: 'absolute',
          left: ringOffset,
          top: ringOffset,
          overflow: 'visible',
          transform: `rotate(${frame * 0.25}deg)`,
          filter: `drop-shadow(0 0 18px ${accent}66)`,
        }}
      >
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={ringSize * 0.43}
          fill="none"
          stroke={accent}
          strokeWidth={GRID / 2}
          strokeDasharray={`${GRID * 2} ${GRID}`}
          strokeLinecap="round"
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          border: `2px solid ${accent}`,
          borderRadius: GRID * 3,
          padding: `${GRID}px ${GRID * 2}px`,
          background: COLOR.cardBg,
          fontFamily: FONT.en,
          fontWeight: FONT.enBold,
          fontSize: SIZE.subSmall,
          letterSpacing: '0.16em',
          color: accent,
          boxShadow: `0 0 24px ${accent}44`,
        }}
      >
        LOOP
      </div>

      {labels.slice(0, 4).map((label, index) => (
        <LoopNode key={`${label}-${index}`} label={label} index={index} size={size} enterAt={enterAt} />
      ))}
    </div>
  );
};
