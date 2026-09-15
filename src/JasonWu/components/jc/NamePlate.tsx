import React from 'react';
import { Img } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, SIZE } from './tokens';

// 片尾频道名牌（横向 pill）—— design-system specs.md「片尾名牌 NamePlate」行规格。
// ≈285×88 radius16、fill rgba(14,16,21,.9)、描边 1px cardStroke（非语义色）；
// 左圆头像 52 + 2px 金环 #C9A227（无头像素材 → 字标圆形占位，勿留空框污染 QC）；
// 右两行 ＝ 中文名 30 白 bold / EN·slug 17 金 small-caps tracked .14em。
// 用法（seg19-mini CTA 布局）：名牌先落定当锚点，约 3 拍后再逐个弹动作徽章。
const GOLD = '#C9A227'; // 金环/slug 专用（非语义品牌金，同 ViewsBadge 金系，spec 指定固定值）

export const NamePlate: React.FC<{
  name: string; // 中文名，如「作者」
  slug: string; // EN·slug，如「JINCHENG」
  avatarText: string; // 字标圆占位文字（无头像素材时），如「锦」
  /** 头像图（staticFile(...) 结果）。给了就用图，文件缺失/加载失败自动回落 avatarText 字标，
   *  保证「素材还没到位也不崩渲」（同 S01 Codex 截图 onError 自愈手法）。 */
  avatarSrc?: string;
  /** 头像构图微调：覆盖默认裁窗定位（人脸居中用）。默认 135% 放大、左 -13% / 上 -3%。 */
  avatarImgStyle?: React.CSSProperties;
  enterAt?: number;
}> = ({ name, slug, avatarText, avatarSrc, avatarImgStyle, enterAt = 0 }) => {
  const enter = useEnter(enterAt, 'up');
  const [imgFailed, setImgFailed] = React.useState(false);
  const showImg = Boolean(avatarSrc) && !imgFailed;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 16,
        minWidth: 285,
        height: 88,
        padding: '0 22px',
        borderRadius: 16,
        background: 'rgba(14,16,21,0.9)',
        border: `1px solid ${COLOR.cardStroke}`,
        boxShadow: '0 14px 40px rgba(0,0,0,0.5)',
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      {/* 左：金环头像圆 —— 有图用图（圆形裁切、人脸居中），无图/加载失败回落字标占位 */}
      <div
        style={{
          position: 'relative',
          width: 52,
          height: 52,
          flexShrink: 0,
          borderRadius: 26,
          overflow: 'hidden',
          border: `2px solid ${GOLD}`,
          background: 'linear-gradient(160deg, #2A2E38, #14161A)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.zh,
          fontWeight: FONT.zhHeavy,
          fontSize: 26,
          color: GOLD,
        }}
      >
        {showImg ? (
          <Img
            src={avatarSrc as string}
            onError={() => setImgFailed(true)}
            style={{
              position: 'absolute',
              width: '135%',
              height: '135%',
              left: '-13%',
              top: '-3%',
              objectFit: 'cover',
              // 低分辨率源图的轻度补偿（别过度）
              filter: 'contrast(1.06) saturate(1.05)',
              ...avatarImgStyle,
            }}
          />
        ) : (
          avatarText
        )}
      </div>
      {/* 右：中文名 + EN·slug 两行 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* 2026-07-27 勘误：旧值 30 落 typography §7.7 的 26-31 禁用空档带（与 SIZE.chip=30 同因，
            tokens.ts 已自标 chip 废弃但本组件未跟改）。取 SIZE.t3(32) 落 T3 档 32-42 内。
            存量片已交付定稿不重渲，直接改默认值——同 SideLabel 44→52、useExit 15→9 的处理方式。 */}
        <span style={{ fontFamily: FONT.zh, fontWeight: 700, fontSize: SIZE.t3, color: COLOR.white, lineHeight: 1 }}>{name}</span>
        <span
          style={{
            fontFamily: FONT.en,
            fontWeight: 700,
            fontSize: 17,
            color: GOLD,
            fontVariant: 'small-caps',
            letterSpacing: '0.14em',
            lineHeight: 1,
          }}
        >
          {slug}
        </span>
      </div>
    </div>
  );
};
