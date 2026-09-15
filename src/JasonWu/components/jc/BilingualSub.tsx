import React from 'react';
import { useVideoConfig } from 'remotion';
import './fonts';
import { COLOR, FONT, SAFE, SIZE } from './tokens';

// 字号唯一真源是 tokens（2026-07-16 裁决：subZh/subEn 已按基准片基准提级，禁止组件内乘系数绕过阶梯）。
const SUB_ZH_SIZE = SIZE.subZh;
const SUB_EN_SIZE = SIZE.subEn;

// 字幕底板（2026-07-26 字体改版）：细体字重下底板要略深、圆角略大、投影更柔，
// 否则黑砖感会压过字。两行共用同一组值，只有圆角按行高分档。
const SUB_PLATE = 'rgba(4,6,8,0.84)';
const SUB_PLATE_SHADOW = '0 4px 15px rgba(0,0,0,0.22)';

// 底部双语字幕：中文行、英文行各自独立黑色底衬箱（贴合文字宽度），水平居中。
// 底衬箱已保证对比度，textShadow 仅弱化保留做边缘柔化。
// zhSize/bottom 是 Studio 调参面板 override（2026-07-28）：默认恒等 token，出片走默认。
// 字号唯一真源仍是 tokens——面板调出的定稿值必须回写 tokens，不得留在 defaultProps 里长期偏离。
export const BilingualSub: React.FC<{ zh: string; en?: string; zhSize?: number; bottom?: number }> = ({
  zh,
  en,
  zhSize = SUB_ZH_SIZE,
  bottom = SAFE.subtitleBottom,
}) => {
  const { height } = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', // 两行箱子各自按内容宽度居中
          rowGap: 9, // 两行箱子分离，间距 8-10px（specs.md 字幕行）
        }}
      >
        <div
          data-qc="subtitle"
          data-qc-id="sub-zh"
          style={{
            display: 'inline-block',
            background: SUB_PLATE, // 略深于旧 0.72：细体要靠底板补对比，不靠加粗
            borderRadius: 12,
            padding: '12px 27px 15px', // 底比顶多 3px：细体视觉重心偏上，等距会显得贴底
            fontFamily: FONT.subZh,
            fontWeight: FONT.subZhWeight,
            fontSize: zhSize,
            lineHeight: 1.08,
            color: COLOR.white,
            textShadow: '0 1px 2px rgba(0,0,0,0.30)', // 弱化：底衬箱已保证对比度
            boxShadow: SUB_PLATE_SHADOW,
            letterSpacing: '0.008em',
            textAlign: 'center',
          }}
        >
          {zh}
        </div>
        {en ? (
          <div
            style={{
              display: 'inline-block',
              background: SUB_PLATE,
              borderRadius: 10,
              padding: '6px 20px 9px', // 英文行底衬箱更窄
              fontFamily: FONT.subEn, // 比例西文字体；用中文字体渲英文是旧版「不好看」的主因
              fontWeight: FONT.subEnWeight, // 有底衬箱后不靠加粗补对比（specs.md）
              fontSize: SUB_EN_SIZE,
              lineHeight: 1.08,
              color: COLOR.white, // 纯白：#E8EAED 在成片里发灰（字幕 sev3）
              textShadow: '0 1px 2px rgba(0,0,0,0.30)', // 弱化：底衬箱已保证对比度
              boxShadow: SUB_PLATE_SHADOW,
              letterSpacing: '0.004em',
              textAlign: 'center',
            }}
          >
            {en}
          </div>
        ) : null}
      </div>
    </div>
  );
};
