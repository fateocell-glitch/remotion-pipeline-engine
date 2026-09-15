import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, SIZE } from './tokens';

export type DocBlock = {
  t: string;
  hl?: boolean; // 整段黄色荧光块
  heading?: boolean; // 小节标题（serif 深蓝，模拟网页/文档质感）
};

// 文档/新闻引用卡：白底大卡（可左出血）+ serif 深蓝标题 + 密集段落 + 整块黄高亮 + 黑底中文译条。
// 译条默认压在高亮段正下方（yPct 定位），复刻 refs/07-引用与人物卡/n3_t025。
export const QuoteDoc: React.FC<{
  title?: string;
  blocks: DocBlock[];
  zhNote?: string; // 黑底中文翻译条
  zhNoteYPct?: number; // 译条纵向位置（占卡高 %），不传则贴卡底
  zhNoteX?: number; // 译条横向偏移（px，负值向左出血）
  source?: string;
  width?: number;
  enterAt?: number;
  /** 高亮扫过帧（复合卡三拍纪律：载体先进、高亮后刷）。缺省=进场即高亮（旧行为） */
  highlightAt?: number;
  /** 译条弹出帧，通常与 highlightAt 同拍。缺省=随卡进场（旧行为） */
  noteAt?: number;
}> = ({ title, blocks, zhNote, zhNoteYPct, zhNoteX = -18, source, width = 1100, enterAt = 0, highlightAt, noteAt }) => {
  const enter = useEnter(enterAt, 'up');
  const frame = useCurrentFrame();
  // 高亮扫过进度：scaleX 0→1 约 0.4s；未传 highlightAt 则恒为 1
  const hlT =
    highlightAt === undefined
      ? 1
      : interpolate(frame, [highlightAt, highlightAt + 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
  const noteT =
    noteAt === undefined
      ? 1
      : interpolate(frame, [noteAt + 4, noteAt + 16], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
  return (
    <div style={{ position: 'relative', width, opacity: enter.opacity, transform: enter.transform }}>
      <div
        style={{
          background: '#FDFDFB',
          borderRadius: 14,
          padding: '38px 44px 44px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {title ? (
          <div
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              fontSize: 32,
              color: '#1F3E62',
              lineHeight: 1.25,
              marginBottom: 22,
            }}
          >
            {title}
          </div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {blocks.map((b, i) =>
            b.heading ? (
              <div
                key={i}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontWeight: 700,
                  fontSize: 26,
                  color: '#1F3E62',
                  marginTop: 10,
                }}
              >
                {b.t}
              </div>
            ) : b.hl ? (
              // 高亮段：黄底层 scaleX 扫过（origin 左），文字随扫过变深
              <div key={i} style={{ position: 'relative', padding: '10px 12px' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 4,
                    background: '#F9E27A',
                    transformOrigin: 'left center',
                    transform: `scaleX(${hlT})`,
                    opacity: hlT > 0 ? 1 : 0,
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    fontFamily: FONT.en,
                    fontWeight: 500,
                    fontSize: 20,
                    lineHeight: 1.55,
                    color: hlT > 0.05 ? '#16181D' : '#4A505A',
                  }}
                >
                  {b.t}
                </div>
              </div>
            ) : (
              <div
                key={i}
                style={{
                  fontFamily: FONT.en,
                  fontWeight: 500,
                  fontSize: 20,
                  lineHeight: 1.55,
                  color: '#4A505A',
                }}
              >
                {b.t}
              </div>
            ),
          )}
        </div>
        {source ? (
          <div style={{ marginTop: 24, fontFamily: FONT.en, fontWeight: 700, fontSize: 17, color: '#9AA0A8' }}>
            {source}
          </div>
        ) : null}
      </div>
      {zhNote && noteT > 0 ? (
        <div
          style={{
            opacity: noteT,
            transform: `translateY(${(1 - noteT) * 10}px) scale(${0.96 + noteT * 0.04})`,
            position: 'absolute',
            left: zhNoteX,
            top: zhNoteYPct !== undefined ? `${zhNoteYPct}%` : undefined,
            bottom: zhNoteYPct === undefined ? -24 : undefined,
            maxWidth: width * 0.82,
            background: 'rgba(10,12,15,0.94)',
            borderRadius: 10,
            padding: '14px 22px',
            fontFamily: FONT.zh,
            fontWeight: FONT.zhHeavy,
            fontSize: SIZE.chip,
            lineHeight: 1.55,
            color: COLOR.white,
            boxShadow: '0 10px 34px rgba(0,0,0,0.55)',
          }}
        >
          {zhNote}
        </div>
      ) : null}
    </div>
  );
};
