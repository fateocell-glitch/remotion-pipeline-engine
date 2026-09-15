import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, MOTION, SAFE, SIZE, type SemanticColor } from './tokens';

export type HeroSegment = {
  t: string;
  color?: SemanticColor; // 高亮词（一句最多一个）
  strike?: boolean; // 红色删除线（引用否定）
  dim?: boolean; // 灰化（被否定的词本体）
};

// kicker 双色分段：EN 用语义色、CN 白色同行（不传 color 默认白）。
export type KickerSegment = {
  t: string;
  color?: SemanticColor;
};

// useEnter 的位移量改写器：只把 transform 里的像素数按 shiftPx/MOTION.popInShift 等比缩放，
// **缓动曲线与 opacity 通道原样取自 motion.ts**（不复刻 interpolate/Easing，避免自建第二套动效）。
// shiftPx 取默认值时 k===1，浮点乘 1 恒等 ⇒ 输出串与改造前逐字符相同，存量片零影响。
const scaleShift = (
  e: { opacity: number; transform: string },
  shiftPx: number,
): { opacity: number; transform: string } => {
  if (shiftPx === MOTION.popInShift) return e;
  const k = shiftPx / MOTION.popInShift;
  return {
    opacity: e.opacity,
    transform: e.transform.replace(/-?[\d.]+(?=px)/g, (m) => `${parseFloat(m) * k}`),
  };
};

// 段落/章节 hero 大字：三明治结构 —— 英文 kicker（先行入场）+ 中文大字（主拍）
// + 可选中文小字补充行 / 英文回声行（后拍 +8 帧）。
// kicker 兼容 string（灰色现状）或 {t,color?}[] 分段双色。
// 参考 refs/02-hero大字/。锚定左侧信息区，位于侧标下方。
export const HeroText: React.FC<{
  kicker?: string | KickerSegment[];
  segments: HeroSegment[];
  size?: 'h1' | 'h2';
  top?: number; // 距顶 px，默认在侧标下方
  enterAt?: number;
  kickerEnterAt?: number; // kicker 先行入场帧，默认 enterAt - 10（不早于 0）
  echo?: string; // 底部英文回声行（大写、宽字距、灰色）
  zhSub?: string; // 中文小字补充行（主行下方）
  // 入场位移量（px）。默认 MOTION.popInShift = 40，**存量片渲染逐像素不变**。
  // 2026-07-31 新增（0731-01 S15 立案，错题 #36「补底座不打段补丁」）：新片口径要求
  // 文字件位移 ≤11px（≈1% 画高），而 useEnter 写死 40px。motion.ts 是不可改真源、
  // 且改默认值会动到已交付的存量五片，故在本组件加可选参数、由调用方按片传值。
  shiftPx?: number;
}> = ({
  kicker,
  segments,
  size = 'h2',
  top = 200,
  enterAt = 0,
  kickerEnterAt,
  echo,
  zhSub,
  shiftPx = MOTION.popInShift,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kickerAt = kickerEnterAt ?? Math.max(0, enterAt - 10);
  const kickerEnter = scaleShift(useEnter(kickerAt, 'up'), shiftPx);
  const mainEnter = scaleShift(useEnter(enterAt, 'up'), shiftPx);
  const tailEnter = scaleShift(useEnter(enterAt + 8, 'up'), shiftPx);
  // 删除线在文字出现后再划过（延迟 8 帧）
  const strikeT = spring({
    frame: frame - enterAt - 8,
    fps,
    config: { damping: 200 },
    durationInFrames: 12,
  });

  return (
    <div
      data-qc="text"
      data-qc-id={`Hero:${segments.map((s) => s.t).join('').slice(0, 8)}`}
      style={{
        position: 'absolute',
        left: SAFE.stackX,
        top,
        textShadow: '0 2px 12px rgba(0,0,0,0.6)',
      }}
    >
      {kicker ? (
        <div
          style={{
            fontFamily: `${FONT.en}, ${FONT.zh}`,
            fontWeight: 800,
            fontSize: SIZE.kicker,
            letterSpacing: '0.34em',
            color: COLOR.greyDim,
            marginBottom: 10,
            opacity: kickerEnter.opacity,
            transform: kickerEnter.transform,
          }}
        >
          {typeof kicker === 'string'
            ? kicker.toUpperCase()
            : kicker.map((k, i) => (
                <span
                  key={i}
                  style={{ color: k.color ? COLOR[k.color] : COLOR.white }}
                >
                  {k.t.toUpperCase()}
                </span>
              ))}
        </div>
      ) : null}
      <div
        style={{
          whiteSpace: 'nowrap',
          opacity: mainEnter.opacity,
          transform: mainEnter.transform,
        }}
      >
        {segments.map((s, i) => (
          <span
            key={i}
            style={{
              position: 'relative',
              fontFamily: FONT.zh,
              fontWeight: FONT.zhHeavy,
              fontSize: SIZE[size],
              color: s.color ? COLOR[s.color] : s.dim ? COLOR.greyDim : COLOR.white,
              display: 'inline-block',
            }}
          >
            {s.t}
            {s.strike ? (
              <span
                style={{
                  position: 'absolute',
                  left: '-2%',
                  top: '52%',
                  height: Math.max(6, SIZE[size] * 0.07),
                  width: `${strikeT * 104}%`,
                  background: COLOR.red,
                  borderRadius: 4,
                }}
              />
            ) : null}
          </span>
        ))}
      </div>
      {zhSub ? (
        <div
          style={{
            fontFamily: FONT.zh,
            fontWeight: FONT.zhMedium,
            fontSize: SIZE.chip,
            color: COLOR.grey,
            marginTop: 10,
            opacity: tailEnter.opacity,
            transform: tailEnter.transform,
          }}
        >
          {zhSub}
        </div>
      ) : null}
      {echo ? (
        <div
          style={{
            fontFamily: FONT.en,
            fontWeight: FONT.enBold,
            fontSize: SIZE.kicker,
            letterSpacing: '0.3em',
            color: COLOR.grey,
            marginTop: 12,
            opacity: tailEnter.opacity,
            transform: tailEnter.transform,
          }}
        >
          {echo.toUpperCase()}
        </div>
      ) : null}
    </div>
  );
};
