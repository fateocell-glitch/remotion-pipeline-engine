import React from 'react';
import { Img } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, MOTION, type SemanticColor } from './tokens';

export type DMCard = {
  text: string;
  chip?: { text: string; color?: SemanticColor }; // 压在卡左上角的分类标签
  avatarSrc?: string; // 小方头像；没有就用色块占位
  avatarColor?: string;
  width?: number;
};

// 私信卡堆叠：白色圆角卡带轻微旋转错位堆叠，左上角压彩色分类 chip。
// 参考 refs/06-mockup与实录/n1_t015（「后台炸了」私信墙）。
export const DMCardStack: React.FC<{
  cards: DMCard[];
  enterAt?: number;
  staggerFrames?: number;
}> = ({ cards, enterAt = 0, staggerFrames = MOTION.stagger }) => {
  const rots = [-3, 2.5, -1.5, 2];
  return (
    <div style={{ position: 'relative' }}>
      {cards.map((c, i) => (
        <DMCardView
          key={i}
          card={c}
          rotate={rots[i % rots.length]}
          offsetX={i * 46}
          offsetY={i * 92}
          enterAt={enterAt + i * staggerFrames}
        />
      ))}
    </div>
  );
};

const DMCardView: React.FC<{
  card: DMCard;
  rotate: number;
  offsetX: number;
  offsetY: number;
  enterAt: number;
}> = ({ card, rotate, offsetX, offsetY, enterAt }) => {
  const enter = useEnter(enterAt, 'up');
  return (
    <div
      style={{
        position: 'absolute',
        left: offsetX,
        top: offsetY,
        width: card.width ?? 440,
        opacity: enter.opacity,
        transform: `${enter.transform} rotate(${rotate}deg)`,
      }}
    >
      <div
        style={{
          position: 'relative',
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '18px 20px',
          boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        {card.chip ? (
          <div
            style={{
              position: 'absolute',
              top: -16,
              left: -12,
              background: COLOR[card.chip.color ?? 'blue'],
              borderRadius: 999,
              padding: '5px 16px',
              fontFamily: FONT.zh,
              fontWeight: FONT.zhHeavy,
              fontSize: 19,
              color: '#fff',
              boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {card.chip.text}
          </div>
        ) : null}
        {card.avatarSrc ? (
          <Img
            src={card.avatarSrc}
            style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: card.avatarColor ?? '#31363E',
              flexShrink: 0,
            }}
          />
        )}
        <div
          style={{
            fontFamily: FONT.zh,
            fontWeight: FONT.zhMedium,
            fontSize: 21,
            lineHeight: 1.55,
            color: '#16181D',
          }}
        >
          {card.text}
        </div>
      </div>
    </div>
  );
};
