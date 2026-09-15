import React from 'react';
import { Img } from 'remotion';
import './fonts';
import { Chip } from './Chip';
import { useEnter } from './motion';
import { COLOR, FONT, SIZE, type SemanticColor } from './tokens';

// 人物卡：圆头像（真照片+彩色圆环）+ 名字 + 身份小字 + 可选机构 chip + 可选 kicker 补充行。
// 参考 refs/07-引用与人物卡/n3_t079（DONALD TRUMP / BRAD GERSTNER）。
export const PersonCard: React.FC<{
  name: string;
  zhRole: string; // '想这么干的人 · 之一' / '硅谷投资人 · INVEST AMERICA 发起人'
  avatarSrc?: string; // 真头像（推荐）
  avatarText?: string;
  avatarColor?: string;
  ringColor?: string; // 头像圆环色，参考帧为蓝
  orgChip?: { text: string; color?: SemanticColor }; // ALTIMETER CAPITAL
  kickerNote?: string; // 'PUSHING SINCE 2021'
  enterAt?: number;
}> = ({ name, zhRole, avatarSrc, avatarText, avatarColor = '#3E6FB0', ringColor = COLOR.blue, orgChip, kickerNote, enterAt = 0 }) => {
  const enter = useEnter(enterAt, 'left');
  return (
    <div style={{ opacity: enter.opacity, transform: enter.transform, textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {avatarSrc ? (
          <Img
            src={avatarSrc}
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              objectFit: 'cover',
              border: `3px solid ${ringColor}`,
              flexShrink: 0,
            }}
          />
        ) : (
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            background: avatarColor,
            border: `3px solid ${ringColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT.en,
            fontWeight: 800,
            fontSize: 32,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {avatarText ?? name.slice(0, 1)}
        </div>
        )}
        <div>
          <div style={{ fontFamily: FONT.enTitle, fontWeight: 400, fontSize: SIZE.card - 4, color: COLOR.white, letterSpacing: '0.02em' }}>
            {name.toUpperCase()}
          </div>
          <div style={{ marginTop: 4, fontFamily: FONT.zh, fontWeight: 700, fontSize: SIZE.subSmall, color: COLOR.grey }}>
            {zhRole}
          </div>
        </div>
      </div>
      {(orgChip || kickerNote) ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, marginLeft: (avatarSrc ? 110 : 84) + 18 }}>
          {orgChip ? <Chip segments={[{ t: orgChip.text }]} accent={orgChip.color ?? 'blue'} outlined enterAt={enterAt + 8} /> : null}
          {kickerNote ? (
            <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: SIZE.subSmall, letterSpacing: '0.22em', color: COLOR.greyDim }}>
              {kickerNote.toUpperCase()}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
