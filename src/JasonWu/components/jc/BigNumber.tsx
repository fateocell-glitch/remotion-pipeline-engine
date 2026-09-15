import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, SIZE, type SemanticColor } from './tokens';

// 大数字卡（可计数器滚动）：$125M / $1,000 / ¥230亿 这类。
// 结构：大数字（Inter 800，可换色）→ 英文 kicker → 中文小字。
// 参考 refs/05-数据可视化/n4_t076、n3_t021。
export const BigNumber: React.FC<{
  value: number; // 目标值
  countFrom?: number; // 从哪开始滚（默认 0；不想滚动就传 value）
  prefix?: string; // '$' '¥'
  suffix?: string; // 'M' '亿' 'B'
  decimals?: number;
  color?: SemanticColor | 'white';
  enKicker?: string; // 'ARR · IN 8 MONTHS'
  zhSub?: string; // '年化营收 · 上线 8 个月'
  size?: 'h1' | 'mega';
  enterAt?: number;
  countFrames?: number; // 滚动时长
  grouping?: boolean; // 千分位
}> = ({
  value,
  countFrom = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  color = 'white',
  enKicker,
  zhSub,
  size = 'h1',
  enterAt = 0,
  countFrames = 45,
  grouping = true,
}) => {
  const frame = useCurrentFrame();
  const enter = useEnter(enterAt, 'up');
  const v = interpolate(frame, [enterAt, enterAt + countFrames], [countFrom, value], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const text = grouping
    ? v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : v.toFixed(decimals);
  const c = color === 'white' ? COLOR.white : COLOR[color];

  return (
    <div style={{ opacity: enter.opacity, transform: enter.transform, textShadow: '0 2px 14px rgba(0,0,0,0.6)' }}>
      <div
        style={{
          fontFamily: FONT.en,
          fontWeight: 800,
          fontSize: SIZE[size],
          color: c,
          lineHeight: 1.05,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {prefix}
        {text}
        {suffix}
      </div>
      {enKicker ? (
        <div
          style={{
            marginTop: 8,
            fontFamily: FONT.en,
            fontWeight: 800,
            fontSize: SIZE.kicker,
            letterSpacing: '0.3em',
            color: COLOR.grey,
          }}
        >
          {enKicker.toUpperCase()}
        </div>
      ) : null}
      {zhSub ? (
        <div
          style={{
            marginTop: 6,
            fontFamily: FONT.zh,
            fontWeight: 700,
            fontSize: 24, // 双语层级：白色粗体中文 > 灰色英文——中文是观众读的行（报告排印 sev2/zoom zhu-125m）
            color: COLOR.white,
          }}
        >
          {zhSub}
        </div>
      ) : null}
    </div>
  );
};
