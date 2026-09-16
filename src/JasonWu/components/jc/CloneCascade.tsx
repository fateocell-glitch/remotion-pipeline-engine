import React from 'react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, GRID, MOTION, RADIUS, SIZE, type SemanticColor } from './tokens';

// 复制级联：源图标卡（你的爆款）→ N 个仿品卡依次右移淡入 → 尾部警示 chip。
// 表「爆款被蒸馏 / 今天爆了明天全是仿品」（对比报告 pair 67 修法）。
// 仿品卡逐个变淡，级联出「越复制越廉价」的衰减感；icon 由调用方传 lucide ReactNode。

const CARD = GRID * 15; // 120px 图标卡
const SOURCE_PALETTE = ['#4D9EFF', '#FFC53D', '#3DDC84', '#B26BFF'] as const;
const STAR_PALETTE = ['#4D9EFF', '#FF4D4D', '#FFC53D', '#B26BFF', '#3DDC84', '#FDE047'] as const;
const CLONE_LABELS = ['A', 'B', 'C', 'D'] as const;

const SourceCard: React.FC<{ icon: React.ReactNode; label: string; enterAt: number; palette: readonly string[] }> = ({
  icon,
  label,
  enterAt,
  palette,
}) => {
  const enter = useEnter(enterAt, 'left');
  const [blue, gold, green, purple] = palette;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: GRID,
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      <div
        style={{
          width: CARD,
          height: CARD,
          borderRadius: RADIUS.card,
          background: `linear-gradient(165deg, rgba(20,24,29,0.92), rgba(8,10,13,0.92)) padding-box, linear-gradient(135deg, ${blue}, ${gold}, ${green}, ${purple}) border-box`,
          border: '2.5px solid transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: blue,
          boxShadow: `0 14px 40px rgba(0,0,0,0.55), 0 0 26px ${blue}55, 0 0 34px ${gold}33, 0 0 38px ${green}22, inset 0 1px 0 rgba(255,255,255,0.18)`,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            color: blue,
            filter: `drop-shadow(0 0 10px ${blue}AA) drop-shadow(0 0 18px ${gold}66) drop-shadow(0 0 24px ${purple}44)`, 
          }}
        >
          {icon}
        </span>
      </div>
      <span
        style={{
          fontFamily: FONT.zh,
          fontWeight: FONT.zhHeavy,
          fontSize: SIZE.chip,
          color: COLOR.white,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
};

const CloneCard: React.FC<{ icon: React.ReactNode; index: number; fade: number; enterAt: number; starColor: string }> = ({
  icon,
  index,
  fade,
  enterAt,
  starColor,
}) => {
  const enter = useEnter(enterAt, 'left');
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: GRID,
        opacity: enter.opacity * fade,
        transform: enter.transform,
      }}
    >
      <div
        style={{
          width: CARD,
          height: CARD,
          borderRadius: RADIUS.card,
          background: COLOR.cardBg,
          border: `2px dashed ${COLOR.cardStroke}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: starColor,
          boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 18px ${starColor}55`,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            color: starColor,
            filter: `drop-shadow(0 0 8px ${starColor}AA) drop-shadow(0 0 16px ${starColor}66)`, 
          }}
        >
          {icon}
        </span>
      </div>
      <span
        style={{
          fontFamily: FONT.zh,
          fontWeight: FONT.zhMedium,
          fontSize: SIZE.subSmall,
          color: COLOR.greyDim,
          whiteSpace: 'nowrap',
        }}
      >
        {CLONE_LABELS[index] ?? String.fromCharCode(65 + index)}
      </span>
    </div>
  );
};

export const CloneCascade: React.FC<{
  icon: React.ReactNode; // lucide 图标（源与仿品共用，仿品自动灰化）
  label: string; // 源卡标签（如「你的爆款」）
  cloneCount?: number; // 仿品数，默认 3
  warnText?: string; // 尾部警示文案
  accent?: SemanticColor; // 警示 chip 语义色，默认 red
  enterAt: number;
}> = ({ icon, label, cloneCount = 3, warnText = '第二天 · 全是仿品', accent = 'red', enterAt }) => {
  const warnAt = enterAt + MOTION.stagger * (cloneCount + 1);
  const warnEnter = useEnter(warnAt, 'left');
  // 箭头与首个仿品同拍出现
  const arrowEnter = useEnter(enterAt + MOTION.stagger, 'left');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: GRID * 2 }}>
      <SourceCard icon={icon} label={label} enterAt={enterAt} palette={SOURCE_PALETTE} />
      <span
        style={{
          fontFamily: FONT.en,
          fontWeight: FONT.enBold,
          fontSize: SIZE.chip,
          color: COLOR.grey,
          opacity: arrowEnter.opacity,
          marginBottom: GRID * 4, // 对齐卡片中心（仿品有下方小字）
        }}
      >
        {'→'}
      </span>
      {Array.from({ length: cloneCount }, (_, i) => (
        <CloneCard
          key={i}
          icon={icon}
          index={i}
          fade={Math.max(0.4, 0.85 - i * 0.15)}
          enterAt={enterAt + MOTION.stagger * (i + 1)}
          starColor={STAR_PALETTE[(i + 1) % STAR_PALETTE.length]}
        />
      ))}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: `${GRID}px ${GRID * 2}px`,
          background: COLOR.cardBg,
          border: `1.5px solid ${COLOR[accent]}`,
          borderRadius: RADIUS.chip,
          boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
          opacity: warnEnter.opacity,
          transform: warnEnter.transform,
          marginBottom: GRID * 4,
        }}
      >
        <span
          style={{
            fontFamily: FONT.zh,
            fontWeight: 700,
            fontSize: SIZE.chip,
            color: COLOR[accent],
            whiteSpace: 'nowrap',
          }}
        >
          {warnText}
        </span>
      </div>
    </div>
  );
};
