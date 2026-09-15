import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { Eye } from 'lucide-react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT } from './tokens';

// 传播量计数徽章：金色描边圆角框 + 眼睛 icon + 金色滚动数字 + 灰 tracked 单位。
// 基准片 seg03 实测（30.0s 帧 4K 特写）：金框 2px、数字 ≈38px、VIEWS 灰 tracked。
// why：数字重要性不够 BigNumber 重锤档时，降级为徽章计数挂证据行——数字滚动本身就是节拍。
export const ViewsBadge: React.FC<{
  from?: number; // 计数起点（默认终值的一半量级起滚）
  to: number; // 计数终点（如 20）
  unit?: string; // 数字后缀（如 'M+'）
  label?: string; // 右侧灰字（如 'VIEWS'）
  enterAt?: number;
  countFrames?: number; // 滚动时长（默认 20 帧 ≈0.67s）
}> = ({ from = 0, to, unit = 'M+', label = 'VIEWS', enterAt = 0, countFrames = 20 }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(enterAt, 'left');
  if (frame < enterAt) return null; // 未入场不渲染：占位箱会污染 QC（入场位移下探字幕净空）
  const n = Math.round(
    interpolate(frame, [enterAt, enterAt + countFrames], [from, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }),
  );
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 16,
        border: `2px solid rgba(255,197,61,0.55)`,
        background: 'rgba(10,12,15,0.72)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      <Eye size={28} color={COLOR.yellow} strokeWidth={2.4} />
      <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 36, color: COLOR.yellow, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {n}
        {unit}
      </span>
      <span style={{ fontFamily: FONT.en, fontWeight: 700, fontSize: 20, letterSpacing: '0.22em', color: COLOR.grey, lineHeight: 1 }}>
        {label}
      </span>
    </div>
  );
};
