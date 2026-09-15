import React from 'react';
import { ArrowDown } from 'lucide-react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, SIZE, type SemanticColor } from './tokens';

// 悬浮徽章卡：语义色描边圆角竖卡 = 图标 + 中文标题 + ↓ 语义色结论 + 英文 kicker。
// 参考 refs/08/n4_t244（谁担责 ↓ 第一梯队 TIER ONE 皇冠卡）、n2_t093（MY SKILL badge）。
export const BadgeCard: React.FC<{
  icon?: React.ReactNode; // lucide 图标，色随 accent（如 <Crown/>）
  zhTitle: string; // '谁担责'
  zhResult: string; // '第一梯队'
  enKicker?: string; // 'TIER ONE'
  accent?: SemanticColor;
  enterAt?: number;
}> = ({ icon, zhTitle, zhResult, enKicker, accent = 'yellow', enterAt = 0 }) => {
  const enter = useEnter(enterAt, 'up');
  const c = COLOR[accent];
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '26px 34px',
        background: 'rgba(10,12,16,0.88)',
        border: `2px solid ${c}`,
        borderRadius: 18,
        boxShadow: `0 0 30px ${c}33, 0 14px 40px rgba(0,0,0,0.5), inset 0 0 26px ${c}14`,
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      {icon ? <span style={{ color: c, display: 'inline-flex' }}>{icon}</span> : null}
      <div style={{ fontFamily: FONT.zh, fontWeight: FONT.zhHeavy, fontSize: 30, color: COLOR.white }}>{zhTitle}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ArrowDown size={22} strokeWidth={2.8} color={c} />
        <span style={{ fontFamily: FONT.zh, fontWeight: FONT.zhHeavy, fontSize: 30, color: c }}>{zhResult}</span>
      </div>
      {enKicker ? (
        <div style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: SIZE.subSmall, letterSpacing: '0.3em', color: `${c}CC` }}>
          {enKicker.toUpperCase()}
        </div>
      ) : null}
    </div>
  );
};
