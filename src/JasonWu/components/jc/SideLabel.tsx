import React from 'react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, SAFE, SIZE, type SemanticColor } from './tokens';

// 章节侧标：│ ENGLISH KICKER · 中 文 短 语  （第一行，语义色）
//           灰色小字补充说明                 （第二行）
// 参考 refs/01-版式与侧标/ 与 refs/02-hero大字/n1_t063（DEFINITION · 严格来说）
//
// variant='title'（章节级大标变体）：
//   │ 中文大标                （第一行，44px = kicker×2，白，900）
//   │ ENGLISH KICKER          （第二行，22px 语义色 tracked caps）
// 两层字号比严格 2:1（SIZE.kicker * 2 : SIZE.kicker），不引入阶梯外字号。

export const SideLabel: React.FC<{
  color: SemanticColor;
  en: string; // 英文 kicker，自动转大写
  zh: string; // 中文短语（label：与英文同色同行；title：白色大标独占第一行）
  sub?: string; // 灰色补充行（label 在第二行；title 在 kicker 之下）
  icon?: React.ReactNode; // 竖线前的 lucide 图标（如 INBOUND 前的收件箱），色随语义色
  side?: 'left' | 'right'; // 人物在左的素材用 right（镜像基准片构图）
  enterAt?: number; // 入场帧
  variant?: 'label' | 'title'; // 默认 'label' 现状不变；'title' 为章节级大标
}> = ({ color, en, zh, sub, icon, side = 'left', enterAt = 0, variant = 'label' }) => {
  const accent = COLOR[color];
  const enter = useEnter(enterAt, 'left');

  const kickerRow = (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        whiteSpace: 'nowrap',
        textShadow: '0 1px 8px rgba(0,0,0,0.55)',
      }}
    >
      <span
        style={{
          fontFamily: FONT.en,
          fontWeight: 800,
          fontSize: SIZE.kicker,
          letterSpacing: '0.34em',
          color: accent,
        }}
      >
        {en.toUpperCase()}
      </span>
      {variant === 'label' ? (
        <>
          <span
            style={{
              fontFamily: FONT.en,
              fontWeight: FONT.enBold,
              fontSize: SIZE.kicker,
              color: accent,
              margin: '0 16px',
            }}
          >
            ·
          </span>
          <span
            style={{
              fontFamily: FONT.zh,
              fontWeight: FONT.zhHeavy,
              fontSize: SIZE.kicker,
              letterSpacing: '0.30em',
              color: accent,
            }}
          >
            {zh}
          </span>
        </>
      ) : null}
    </div>
  );

  const subRow = sub ? (
    <div
      style={{
        marginTop: 8,
        fontFamily: FONT.zh,
        fontWeight: 700,
        fontSize: SIZE.subSmall,
        color: '#E8EAED',
        textShadow: '0 1px 6px rgba(0,0,0,0.55)',
      }}
    >
      {sub}
    </div>
  ) : null;

  return (
    <div
      data-qc="text"
      data-qc-id={`SideLabel:${en}`}
      style={{
        position: 'absolute',
        ...(side === 'left' ? { left: SAFE.sideLabel.x } : { right: SAFE.sideLabel.x }),
        top: SAFE.sideLabel.y,
        opacity: enter.opacity,
        transform: enter.transform,
        display: 'flex',
        gap: 14,
      }}
    >
      {icon ? (
        <span
          style={{
            color: accent,
            display: 'inline-flex',
            alignItems: 'flex-start',
            marginTop: variant === 'title' ? 8 : 1,
          }}
        >
          {icon}
        </span>
      ) : null}
      <div
        style={{
          width: 4,
          borderRadius: 2,
          background: accent,
          alignSelf: 'stretch',
          marginBottom: variant === 'label' && sub ? 30 : 0,
          marginTop: 2, // label：竖线只陪第一行；title：竖线贯穿大标+kicker
        }}
      />
      {variant === 'title' ? (
        <div>
          <div
            style={{
              fontFamily: FONT.zh,
              fontWeight: FONT.zhHeavy,
              // 2026-07-27 勘误：旧值 SIZE.kicker*2 = 44，正落 typography §7.7 的 43-50 禁用空档带
              // （§7.7 是 07-25 逐帧实测定的五档字阶，自称优先于规则 8；§2 与 specs §3 里记录的
              // 「title 中文 44」是它之前的旧口径，未勘误 —— 0727-01 四个段独立撞上同一冲突）。
              // 改取 SIZE.navTitle(52) 落 T2 档 51-71 内；两层比 52:22 = 2.36:1，仍在 §2 说的「约 2:1」。
              // 存量片（0715/0721/0722/0724）已交付定稿不重渲，故直接改默认值而非并存两套
              // —— 与 motion.ts 的 useExit 15→9 帧同一处理方式。
              fontSize: SIZE.navTitle,
              lineHeight: 1.15,
              color: COLOR.white,
              whiteSpace: 'nowrap',
              textShadow: '0 2px 10px rgba(0,0,0,0.55)',
            }}
          >
            {zh}
          </div>
          <div style={{ marginTop: 10 }}>{kickerRow}</div>
          {subRow}
        </div>
      ) : (
        <div>
          {kickerRow}
          {subRow}
        </div>
      )}
    </div>
  );
};
