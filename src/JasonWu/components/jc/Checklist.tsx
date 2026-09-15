import React from 'react';
import './fonts';
import { Chip, type ChipSegment } from './Chip';
import { GRID, MOTION, SAFE, type SemanticColor } from './tokens';

export type ChecklistItem = {
  segments: ChipSegment[];
  icon?: React.ReactNode;
  enterAt?: number; // 该条出现帧；未到帧前不渲染，刚出现有入场动效
  dimmed?: boolean;
};

// 逐条清单：Chip 纵向堆叠，随口播逐条弹入；已讲过的条目可 dimmed 常驻。
// 参考 refs/03-chip与checklist/（THE TRAP 三条红卡、三种人清单）。
export const Checklist: React.FC<{
  items: ChecklistItem[];
  accent?: SemanticColor;
  outlined?: boolean;
  top?: number;
  staggerFrames?: number; // 未指定 enterAt 时的逐条间隔
}> = ({ items, accent = 'blue', outlined = false, top = 200, staggerFrames = MOTION.stagger }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.stackX,
        top,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: GRID * 2,
      }}
    >
      {items.map((item, i) => (
        <Chip
          key={i}
          segments={item.segments}
          icon={item.icon}
          accent={accent}
          outlined={outlined}
          dimmed={item.dimmed}
          enterAt={item.enterAt ?? i * staggerFrames}
        />
      ))}
    </div>
  );
};
