import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { MOTION } from './tokens';

// 统一入场动效：滑入 + 淡入，ease-out 减速曲线（不是 spring 急停）。
// 时长 MOTION.popInFrames（0.3s），位移 MOTION.popInShift（40px），
// 透明度比位移先到位（前 70% 时间内完成），产生「先看见、再落定」的滑入感。
// 同组元素同时入场 = 传相同 enterAt；先后错峰 = 间隔 MOTION.stagger 帧。
export const useEnter = (
  enterAt = 0,
  dir: 'left' | 'up' = 'left',
): { opacity: number; transform: string } => {
  const frame = useCurrentFrame();
  const local = frame - enterAt;
  const move = interpolate(local, [0, MOTION.popInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(local, [0, MOTION.popInFrames * 0.7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const shift = (1 - move) * MOTION.popInShift;
  return {
    opacity,
    transform: dir === 'left' ? `translateX(${-shift}px)` : `translateY(${shift}px)`,
  };
};

// 大卡显影入场（三档动效词汇之一，specs.md §5）：opacity 0→1 + scale 0.95→1，无位移。
// 用于证据卡/截图/演示窗等大面积载体；chip/标签用 useEnter 滑入；结论用 Stamp 砸落。
export const usePop = (
  enterAt = 0,
  durFrames = 13, // ≈0.43s @30fps（规格 0.4-0.5s）
): { opacity: number; transform: string } => {
  const frame = useCurrentFrame();
  const local = frame - enterAt;
  const t = interpolate(local, [0, durFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return {
    opacity: t,
    transform: `scale(${0.95 + t * 0.05})`,
  };
};

// 统一退场动效（2026-07-16 新增：章节边界禁止一帧硬切消失）。
// exitAt 起 15 帧内淡出 + 轻微下移 + scale 0.98；与 useEnter 组合时两组样式相乘/叠加。
// exitAt 传 Infinity 或不触发时返回恒等样式。
// 退场（2026-07-25 按基准片八维实测改写，真源 motion §6.6）：
//   实测退场 0.25-0.30s（@30fps = 8-9 帧）、**比进场快**、纯 opacity、零位移零缩放、曲线线性。
//   旧默认 15 帧 + translateY(14px) + scale(0.98) 已废止——帧数超规、位移 14px > 1% 画高(11px)、
//   且 ease-in 让退场比进场还慢。存量片已交付定稿不重渲，故直接改默认值而非并存两套。
export const useExit = (
  exitAt: number,
  durFrames = 9,
): { opacity: number; transform: string } => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [exitAt, exitAt + durFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {
    opacity: 1 - t,
    transform: 'none',
  };
};
