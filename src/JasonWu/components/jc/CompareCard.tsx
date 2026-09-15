import React from 'react';
import { Check, X } from 'lucide-react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, MOTION, type SemanticColor } from './tokens';

export type CompareItem = {
  logo?: React.ReactNode; // lucide 图标或 <Img>（白底方块内）
  name: string; // 'DeepSeek' / '字节 · Seedance 2.0'
  weak: string; // '没有图片识别'
  strong: string; // '写作能力一流'
  strongColor?: SemanticColor;
};

// 模型/产品对比卡：黑横卡 = 白底 logo 方块 + 名称 + 灰×弱点 chip + 语义色✓强项 chip。
// 参考 refs/04-信息卡与步骤流程/n1_t094（DeepSeek/Grok/Seedance 各有所长）。
export const CompareCard: React.FC<{
  items: CompareItem[];
  width?: number;
  enterAt?: number;
  staggerFrames?: number;
}> = ({ items, width = 700, enterAt = 0, staggerFrames = MOTION.stagger }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {items.map((it, i) => (
        <ItemView key={i} item={it} width={width} enterAt={enterAt + i * staggerFrames} />
      ))}
    </div>
  );
};

const ItemView: React.FC<{ item: CompareItem; width: number; enterAt: number }> = ({ item, width, enterAt }) => {
  const enter = useEnter(enterAt, 'left');
  const strong = COLOR[item.strongColor ?? 'blue'];
  return (
    <div
      style={{
        width,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '18px 22px',
        background: 'rgba(14,16,20,0.88)',
        border: `1.5px solid ${COLOR.cardStroke}`,
        borderRadius: 16,
        boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: 15,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#16181D',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {item.logo}
      </div>
      <div>
        <div style={{ fontFamily: FONT.zh, fontWeight: FONT.zhHeavy, fontSize: 30, color: COLOR.white }}>{item.name}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              border: '1.5px solid rgba(255,255,255,0.22)',
              borderRadius: 999,
              padding: '4px 14px',
              fontFamily: FONT.zh,
              fontWeight: 700,
              fontSize: 20,
              color: COLOR.grey,
            }}
          >
            <X size={17} strokeWidth={3} />
            {item.weak}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              border: `1.5px solid ${strong}`,
              borderRadius: 999,
              padding: '4px 14px',
              fontFamily: FONT.zh,
              fontWeight: 700,
              fontSize: 20,
              color: COLOR.white,
            }}
          >
            <Check size={17} strokeWidth={3} color={strong} />
            {item.strong}
          </span>
        </div>
      </div>
    </div>
  );
};
