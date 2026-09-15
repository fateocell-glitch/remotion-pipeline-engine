import React from 'react';
import { useCurrentFrame } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, GRID, type SemanticColor } from './tokens';

export type FlywheelProps = {
  size?: number;
  color?: SemanticColor;
  icon?: React.ReactNode;
  enterAt?: number;
};

export const Flywheel: React.FC<FlywheelProps> = ({
  size = 340,
  color = 'green',
  icon,
  enterAt = 0,
}) => {
  const frame = useCurrentFrame();
  const enter = useEnter(enterAt, 'up');
  const accent = COLOR[color];
  const radius = size * 0.39;
  const circumference = Math.PI * 2 * radius;
  const segment = circumference * (39 / 360);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        opacity: enter.opacity,
        transform: enter.transform,
        filter: `drop-shadow(0 0 26px ${color === 'green' ? 'rgba(61,220,132,0.4)' : `${accent}66`})`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: `rotate(${frame * 1.0}deg)` }} // 30°/s（specs.md：<30°/s 肉眼不可辨，旧值 0.35 只有 10.5°/s）
      >
        {Array.from({ length: 8 }, (_, index) => (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth={4} // 线框风：环描边 3-4px，禁大面积实心（specs.md 图形规格；旧值 16px 像贴图）
            strokeOpacity={0.85}
            strokeLinecap="round"
            strokeDasharray={`${segment} ${circumference - segment}`}
            transform={`rotate(${index * 45 - 90} ${size / 2} ${size / 2})`}
          />
        ))}
        {/* 辐条 + 外缘节点：飞轮质感（参考 n4 t=260） */}
        {Array.from({ length: 8 }, (_, index) => {
          const a = ((index * 45 - 90) * Math.PI) / 180;
          const cx = size / 2, cy = size / 2;
          const r0 = size * 0.19, r1 = radius - GRID;
          return (
            <g key={`s${index}`}>
              <line
                x1={cx + r0 * Math.cos(a)}
                y1={cy + r0 * Math.sin(a)}
                x2={cx + r1 * Math.cos(a)}
                y2={cy + r1 * Math.sin(a)}
                stroke={accent}
                strokeWidth={1.5}
                opacity={0.75}
              />
              {/* 轮缘节点；index 0 放大做不对称标记，否则 8 段全同构旋转不可辨（动效 sev3） */}
              <circle
                cx={cx + radius * Math.cos(a + 0.28)}
                cy={cy + radius * Math.sin(a + 0.28)}
                r={index === 0 ? 8 : 4}
                fill={index === 0 ? COLOR.white : accent}
              />
            </g>
          );
        })}
      </svg>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size * 0.34,
          height: size * 0.34,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: COLOR.cardBg,
          border: `2px solid ${COLOR.white}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLOR.white,
          boxShadow: '0 14px 40px rgba(0,0,0,0.55)',
        }}
      >
        {icon}
      </div>
    </div>
  );
};
