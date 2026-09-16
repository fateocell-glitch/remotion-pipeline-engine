import React from 'react';
import { Check, X } from 'lucide-react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, MOTION, type SemanticColor } from './tokens';
import { IcoFontPathIcon } from '../common/IcoFontPathIcon';
import { readTextSlot } from '../common/EditableTextSlots';

const LOGO_PALETTE = ['#4D9EFF', '#FFC53D', '#3DDC84', '#B26BFF'] as const;

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
        <ItemView key={i} item={it} index={i} width={width} enterAt={enterAt + i * staggerFrames} />
      ))}
    </div>
  );
};

const ItemView: React.FC<{ item: CompareItem; index: number; width: number; enterAt: number }> = ({ item, index, width, enterAt }) => {
  const enter = useEnter(enterAt, 'left');
  const strong = COLOR[item.strongColor ?? 'blue'];
  const logoColor = LOGO_PALETTE[index % LOGO_PALETTE.length];
  const logoGlow = LOGO_PALETTE[(index + 1) % LOGO_PALETTE.length];
  const defaultPayload = {
    name: `ITEM ${index + 1}`,
    weak: '待补充限制',
    strong: '待补充优势',
  };
  const name = readTextSlot(item as unknown as Record<string, unknown>, 'name', defaultPayload, defaultPayload.name);
  const weak = readTextSlot(item as unknown as Record<string, unknown>, 'weak', defaultPayload, defaultPayload.weak);
  const strongText = readTextSlot(item as unknown as Record<string, unknown>, 'strong', defaultPayload, defaultPayload.strong);
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
          background: `linear-gradient(165deg, rgba(20,24,29,0.94), rgba(8,10,13,0.96)) padding-box, linear-gradient(135deg, ${logoColor}, ${logoGlow}, rgba(255,255,255,0.86)) border-box`,
          border: '2px solid transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: logoColor,
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: `0 0 20px ${logoColor}55, 0 0 34px ${logoGlow}2F, inset 0 1px 0 rgba(255,255,255,0.28)`,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            color: logoColor,
            filter: `drop-shadow(0 0 9px ${logoColor}AA) drop-shadow(0 0 18px ${logoGlow}66)`,
          }}
        >
          {item.logo ?? <IcoFontPathIcon seed={`${name}|${weak}|${index}`} color={logoColor} size={38} fallbackIndex={index} />}
        </span>
      </div>
      <div>
        <div style={{ fontFamily: FONT.zh, fontWeight: FONT.zhHeavy, fontSize: 30, color: COLOR.white }}>{name}</div>
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
            {weak}
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
            {strongText}
          </span>
        </div>
      </div>
    </div>
  );
};
