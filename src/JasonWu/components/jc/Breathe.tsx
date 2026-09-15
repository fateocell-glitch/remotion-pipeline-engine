import React from 'react';
import { useCurrentFrame } from 'remotion';

// idle 微动效包装器：进场后持续呼吸（scale ±0.6%）+ 浮动（±3px），消除「进场即死」。
// 同屏多个主角元素传不同 phase 错开相位，避免整齐划一的假感。
// amp 控制幅度倍率；小元素（chip 等）不要包，只包每章主角（stamp/大字/图形件/证据卡）。
export const Breathe: React.FC<{
  children: React.ReactNode;
  phase?: number;
  amp?: number;
}> = ({ children, phase = 0, amp = 1 }) => {
  const frame = useCurrentFrame();
  const s = 1 + 0.006 * amp * Math.sin((frame + phase) / 22);
  const y = 3 * amp * Math.sin((frame + phase) / 28);
  return (
    <div style={{ transform: `translateY(${y}px) scale(${s})`, transformOrigin: 'center' }}>
      {children}
    </div>
  );
};
