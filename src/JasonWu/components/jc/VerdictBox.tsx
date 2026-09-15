import React from 'react';
import './fonts';
import { Breathe } from './Breathe';
import { useEnter, usePop } from './motion';
import { COLOR, FONT, type SemanticColor } from './tokens';

// 决算框（VerdictBox 红绿镜像，specs.md「决算框」行 / narrative 规则 5「VS 决算场」）。
// 约 400×170 侧区版：描边 2px 语义色、radius16、bg rgba(12,14,18,0.55) 半透、inset glow `0 0 26px 语义色14`。
// 框内 header（top-inset14/left-inset20）＝ icon24 + zh700/22 语义色 + 右上极淡 en12 tracked opacity.4；
// 框内 chip 横排 gap14 ×3 ＝ icon 圆角方 76×76 radius12/2px 语义色描边/cardBg + icon30 + label16 白。
// 位置：左红 top≈420 left72 / 右绿 right72 真镜像；省略中心 VS 圆徽（对峙靠红绿镜像 + 三级字号落差）。
// 支持「空框先立」（boxEnterAt 显影）＋「chip 分批入场」（每 chip 自带 revealAt，槽位先占、内容后填）。
// Breathe 相位错开：红 phase0 / 绿 phase30。

export type VerdictChip = {
  icon: React.ReactNode;
  label: string;
  /** 该 chip 入框帧（分批入场对齐口播「前三种/后三种」） */
  revealAt: number;
};

// 单 chip：76×76 圆角方 tile + 下方 label。槽位从 boxEnterAt 起就占位（保持框高稳定），
// icon+label 到 revealAt 才滑入显影，物理呈现「空框先立、chip 后填」。
const ChipTile: React.FC<{ icon: React.ReactNode; label: string; revealAt: number; accent: string }> = ({
  icon,
  label,
  revealAt,
  accent,
}) => {
  const enter = useEnter(revealAt, 'up');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 76 }}>
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 12,
          border: `2px solid ${accent}`,
          background: COLOR.cardBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
          opacity: enter.opacity,
          transform: enter.transform,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: FONT.zh,
          fontWeight: 700,
          fontSize: 16,
          lineHeight: 1.1,
          color: COLOR.white,
          whiteSpace: 'nowrap',
          opacity: enter.opacity,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const VerdictBox: React.FC<{
  color: SemanticColor; // 红=能被溶解 / 绿=融不掉
  side: 'left' | 'right'; // 左红 / 右绿 真镜像
  headerZh: string;
  headerEn: string;
  headerIcon: React.ReactNode;
  chips: VerdictChip[]; // 建议 3 个，各自 revealAt 控制分批入场
  boxEnterAt: number; // 空框先立：外框显影帧
  top?: number; // 默认 420
  offsetX?: number; // 左/右内缩，默认 72（人物越界时右框可回落 left1170，用 side='left'+offsetX 覆盖）
  phase?: number; // Breathe 相位（红 0 / 绿 30）
  width?: number; // 默认 400
  height?: number; // 默认 170
  qcId?: string; // QC 重叠断言用 data-qc-id
}> = ({
  color,
  side,
  headerZh,
  headerEn,
  headerIcon,
  chips,
  boxEnterAt,
  top = 420,
  offsetX = 72,
  phase = 0,
  width = 400,
  height = 170,
  qcId,
}) => {
  const accent = COLOR[color];
  const pop = usePop(boxEnterAt); // 空框显影：scale0.95→1 + fade
  return (
    <div
      style={{
        position: 'absolute',
        top,
        ...(side === 'left' ? { left: offsetX } : { right: offsetX }),
      }}
    >
      <Breathe phase={phase}>
        <div
          data-qc="box"
          data-qc-id={qcId ?? `verdict-${color}`}
          style={{
            position: 'relative',
            width,
            height,
            boxSizing: 'border-box',
            padding: '14px 20px',
            borderRadius: 16,
            border: `2px solid ${accent}`,
            background: 'rgba(12,14,18,0.55)',
            boxShadow: `inset 0 0 26px ${accent}14`,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            opacity: pop.opacity,
            transform: pop.transform,
          }}
        >
          {/* header：icon24 + zh700/22 语义色；右上极淡 en12 tracked opacity.4 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', color: accent }}>{headerIcon}</span>
            <span style={{ fontFamily: FONT.zh, fontWeight: 700, fontSize: 22, color: accent, whiteSpace: 'nowrap' }}>
              {headerZh}
            </span>
            <span
              style={{
                position: 'absolute',
                top: 14,
                right: 20,
                fontFamily: FONT.en,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: accent,
                opacity: 0.4,
              }}
            >
              {headerEn}
            </span>
          </div>
          {/* chip 横排 gap14 ×3 */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            {chips.map((c, i) => (
              <ChipTile key={i} icon={c.icon} label={c.label} revealAt={c.revealAt} accent={accent} />
            ))}
          </div>
        </div>
      </Breathe>
    </div>
  );
};
