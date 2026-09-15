import React from 'react';
import { Img } from 'remotion';
import './fonts';
import { Chip } from './Chip';
import { useEnter } from './motion';
import { COLOR, FONT, SIZE, type SemanticColor } from './tokens';

// 推文/观点引用卡（左信息列）：真头像 + 姓名 + 身份 + 蓝色大引号 + 超大语义色结论 + 中英副标同行。
// 通常搭配右侧 ShotCard 真截图使用。参考 refs/07-引用与人物卡/n4_t024。
// seg03 分拍能力：名牌先行（identityAt）→ 引号+主语行（kickerAt）→ 动词重锤（mainAt）。
// why：引用段先答「谁在说」，重锤等语义锚——名牌≠lockup，是两个独立节拍（seg03 词级对比沉淀）。
export const TweetCard: React.FC<{
  name: string; // 'YISHAN WONG'
  zhIdentity: string; // '黄易山 · Reddit 前 CEO'
  avatarSrc?: string; // 真头像（推荐）
  avatarText?: string; // 没图时的占位首字母
  avatarColor?: string;
  badgeSrc?: string; // 头像右下角标（如 reddit 徽章）
  headlineTop: string; // 'APP-LAYER STARTUPS'
  headlineMain: string; // 'CRUSHED'
  headlineColor?: SemanticColor;
  zhSub?: string; // '被基础模型碾压'
  headlineSub?: string; // 'BY FOUNDATION MODELS'（与 zhSub 同行）
  chips?: { text: string; color?: SemanticColor }[];
  enterAt?: number;
  identityAt?: number; // 名牌拍（默认 enterAt）
  kickerAt?: number; // 引号+主语行拍（默认 enterAt）
  mainAt?: number; // 重锤拍（默认 enterAt）
}> = ({
  name,
  zhIdentity,
  avatarSrc,
  avatarText,
  avatarColor = '#E05A33',
  badgeSrc,
  headlineTop,
  headlineMain,
  headlineColor = 'red',
  zhSub,
  headlineSub,
  chips = [],
  enterAt = 0,
  identityAt,
  kickerAt,
  mainAt,
}) => {
  const idEnter = useEnter(identityAt ?? enterAt, 'left');
  const kickerEnter = useEnter(kickerAt ?? enterAt, 'left');
  const mainEnter = useEnter(mainAt ?? enterAt, 'left');
  return (
    <div style={{ textShadow: '0 2px 14px rgba(0,0,0,0.6)' }}>
      {/* 人物行（名牌拍）：头像 116px 对齐基准片实测 117px */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: idEnter.opacity, transform: idEnter.transform }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarSrc ? (
            <Img src={avatarSrc} style={{ width: 116, height: 116, borderRadius: 58, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div
              style={{
                width: 116,
                height: 116,
                borderRadius: 58,
                background: avatarColor,
                border: `3px solid ${COLOR.blue}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT.en,
                fontWeight: 800,
                fontSize: 44,
                color: '#fff',
              }}
            >
              {avatarText ?? name.slice(0, 1)}
            </div>
          )}
          {badgeSrc ? (
            <Img
              src={badgeSrc}
              style={{
                position: 'absolute',
                right: -6,
                bottom: -4,
                width: 44,
                height: 44,
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            />
          ) : null}
        </div>
        <div>
          <div style={{ fontFamily: FONT.enTitle, fontWeight: 400, fontSize: 36, color: COLOR.white, letterSpacing: '0.03em' }}>
            {name.toUpperCase()}
          </div>
          <div style={{ marginTop: 4, fontFamily: FONT.zh, fontWeight: 700, fontSize: SIZE.subSmall + 2, color: COLOR.grey }}>
            {zhIdentity}
          </div>
        </div>
      </div>
      {/* 引号 + 主语行（kicker 拍） */}
      <div style={{ opacity: kickerEnter.opacity, transform: kickerEnter.transform }}>
        <div
          style={{
            marginTop: 34,
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            fontSize: 88,
            color: COLOR.blue,
            lineHeight: 0.4,
          }}
        >
          “
        </div>
        <div style={{ marginTop: 26, fontFamily: FONT.enTitle, fontWeight: 400, fontSize: 42, color: COLOR.white, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
          {headlineTop.toUpperCase()}
        </div>
      </div>
      {/* 大字结论（重锤拍） */}
      <div style={{ opacity: mainEnter.opacity, transform: mainEnter.transform }}>
        <div
          style={{
            marginTop: 2,
            fontFamily: FONT.enTitle,
            fontWeight: 400,
            fontSize: SIZE.h1,
            letterSpacing: '0.01em',
            lineHeight: 1.05,
            whiteSpace: 'nowrap',
            color: COLOR[headlineColor],
            textShadow: '0 6px 24px rgba(0,0,0,0.65)',
          }}
        >
          {headlineMain.toUpperCase()}
        </div>
        {/* 中英副标同行 */}
        {zhSub || headlineSub ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 12 }}>
            {zhSub ? (
              <span style={{ fontFamily: FONT.zh, fontWeight: FONT.zhHeavy, fontSize: 30, color: COLOR.white, whiteSpace: 'nowrap' }}>{zhSub}</span>
            ) : null}
            {headlineSub ? (
              <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: SIZE.subSmall, letterSpacing: '0.24em', color: COLOR.grey, whiteSpace: 'nowrap' }}>
                {headlineSub.toUpperCase()}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      {chips.length ? (
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {chips.map((c, i) => (
            <Chip key={i} segments={[{ t: c.text }]} accent={c.color ?? 'blue'} enterAt={enterAt + 10 + i * 8} />
          ))}
        </div>
      ) : null}
    </div>
  );
};
