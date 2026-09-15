import React from 'react';
import './fonts';
import { useEnter } from './motion';
import { FONT } from './tokens';

export type WallCard = {
  name: string; // '王总'
  text: string; // '能做个口播智能体吗'
  avatarColor?: string;
};

const AVATAR_COLORS = ['#3B82F6', '#F59E0B', '#22C55E', '#EF4444', '#8B5CF6', '#F97316'];

// 需求卡片墙：白色小卡逐张快速铺满（4 列 xN 行），模拟需求爆炸。
// 每张卡：彩色圆角首字头像 + 灰小字姓名 + 黑粗需求。参考 refs/06-mockup与实录/n1_t181（4x6=24 张）。
export const CardWall: React.FC<{
  items: WallCard[];
  cols?: number;
  cardWidth?: number;
  gap?: number;
  enterAt?: number;
  staggerFrames?: number; // 逐张间隔，铺墙用小步频
}> = ({ items, cols = 4, cardWidth = 424, gap = 18, enterAt = 0, staggerFrames = 4 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)`,
        gap,
      }}
    >
      {items.map((c, i) => (
        <WallCardView key={i} card={c} index={i} enterAt={enterAt + i * staggerFrames} />
      ))}
    </div>
  );
};

const WallCardView: React.FC<{ card: WallCard; index: number; enterAt: number }> = ({ card, index, enterAt }) => {
  const enter = useEnter(enterAt, 'up');
  const color = card.avatarColor ?? AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = /[a-zA-Z]/.test(card.name[0]) ? card.name[0].toUpperCase() : card.name[0];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: '#FBFBFA',
        borderRadius: 12,
        padding: '16px 18px',
        boxShadow: '0 10px 28px rgba(0,0,0,0.4)',
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.zh,
          fontWeight: FONT.zhHeavy,
          fontSize: 24,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT.zh, fontWeight: 500, fontSize: 17, color: '#8B9098' }}>{card.name}</div>
        <div
          style={{
            marginTop: 2,
            fontFamily: FONT.zh,
            fontWeight: 700,
            fontSize: 22,
            color: '#16181D',
            whiteSpace: 'nowrap',
          }}
        >
          {card.text}
        </div>
      </div>
    </div>
  );
};
