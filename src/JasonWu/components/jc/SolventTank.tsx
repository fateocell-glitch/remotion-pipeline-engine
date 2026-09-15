import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { COLOR, FONT } from './tokens';

// ============================================================================
// SolventTank —— rd-noref 新造图形语言（S09 全片核心比喻「万能溶解液」专用）。
// 语法缺口：infographic R1 无「溶剂/材质」映射件，本件按 R1.6（机制类比喻翻译成
// 空间关系与运动、判词零复读）+ texture（线框玻璃、果冻材质块、≤4px 描边）新造。
//
// 图形语义：线框玻璃烧杯 = 溶剂槽；低饱和蓝液 = agent（万能溶解液，agent 语义蓝，
// 低饱和不抢色）；6 枚材质块 = 后面 6 型。用【运动】演「溶 vs 不溶」，不是静态摆卡：
//   · 能溶（左 3，红）：转红 → 起泡消融 → 升腾出液面消失（= 会被溶解阵营，判死，S10-12 铺垫）
//   · 不溶（右 3，绿）：转绿 → 沉底保留 → 加厚绿描边定住（= 免死阵营，S14-17 铺垫）
// 底部双列图例（能被溶解 · DISSOLVED / 不能被溶解 · RESISTANT）= 全片红绿两营的种子，
// DISSOLVED kicker 与 S10/S11 侧标 kicker 同词，视觉呼应可承接。
//
// beat 门控：enterAt 玻璃入 → pourAt 注液 + 6 灰块沉入 → dissolveAt 红 3 消融 → resistAt 绿 3 沉底。
// 作为一体 rig 一次进场，戏在部件上演（R1.6：进场一次、动画只动部件）。
// ============================================================================

const CUBE = 62;
const CGAP = 14;
const GLASS_L = 48;
const GLASS_W = 464; // 玻璃内宽
const GLASS_TOP = 96;
const GLASS_BOTTOM = 548;
const ROW_Y = 292; // 材质初始行 y
const N = 6;
const ROW_W = N * CUBE + (N - 1) * CGAP; // 442
const START_X = GLASS_L + (GLASS_W - ROW_W) / 2; // 居中

const GRAD = {
  grey: 'linear-gradient(160deg,#8A929E 0%,#565E6A 100%)',
  red: 'linear-gradient(160deg,#FF6B6B 0%,#D92B35 100%)',
  green: 'linear-gradient(160deg,#55E698 0%,#1FA85D 100%)',
} as const;

// 单枚材质块（果冻块渐变 + inset 高光，texture §9 基线；红=能溶，绿=不溶，未分类=灰）
const Cube: React.FC<{
  i: number;
  pourAt: number;
  dissolveAt: number;
  resistAt: number;
}> = ({ i, pourAt, dissolveAt, resistAt }) => {
  const frame = useCurrentFrame();
  const soluble = i < 3; // 左 3 能溶（红）/ 右 3 不溶（绿）
  const baseX = START_X + i * (CUBE + CGAP);

  // 入槽：从液面上方沉入到初始行（错峰）
  const drop = interpolate(frame, [pourAt + i * 3, pourAt + i * 3 + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  if (drop <= 0) return null;
  const dropY = (1 - drop) * -150;

  // 变色（灰 → 语义色），在各自阵营激活前一拍完成
  const act = soluble ? dissolveAt : resistAt;
  const tint = interpolate(frame, [act - 6, act + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bg = tint <= 0 ? GRAD.grey : soluble ? GRAD.red : GRAD.green;

  let extraY = 0;
  let scale = 0.55 + 0.45 * drop; // 沉入时轻微放大定形
  let opacity = 1;
  let outline = 'transparent';
  let outlineW = 0;

  if (soluble) {
    // 能溶：消融 —— 起泡 + 缩没 + 升腾出液面（红 dissolveAt）
    const dt = interpolate(frame, [dissolveAt + i * 5, dissolveAt + i * 5 + 26], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
    extraY = -dt * 120; // 升腾
    scale = (0.55 + 0.45 * drop) * (1 - dt * 0.85);
    opacity = 1 - dt;
  } else {
    // 不溶：沉底 —— 下沉到槽底 + 加厚绿描边定住（绿 resistAt，持续保留）
    const rt = interpolate(frame, [resistAt + (i - 3) * 5, resistAt + (i - 3) * 5 + 20], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    const settle = Math.sin(rt * Math.PI) * 6; // 落底轻弹
    extraY = rt * (GLASS_BOTTOM - CUBE - 22 - ROW_Y) - settle;
    outline = COLOR.green;
    outlineW = rt * 3;
  }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: baseX,
          top: ROW_Y + dropY + extraY,
          width: CUBE,
          height: CUBE,
          borderRadius: CUBE * 0.26,
          background: bg,
          border: outlineW > 0 ? `${outlineW}px solid ${outline}` : undefined,
          boxSizing: 'border-box',
          boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.28)${
            !soluble && outlineW > 1 ? `, 0 0 22px ${COLOR.green}55` : ''
          }`,
          transform: `scale(${scale})`,
          opacity,
        }}
      />
      {/* 消融气泡：红块升腾时冒泡 */}
      {soluble
        ? [0, 1, 2].map((b) => {
            const bt = interpolate(frame, [dissolveAt + i * 5 + b * 5, dissolveAt + i * 5 + b * 5 + 24], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            if (bt <= 0 || bt >= 1) return null;
            const bs = 7 + b * 3;
            return (
              <div
                key={b}
                style={{
                  position: 'absolute',
                  left: baseX + CUBE * 0.5 + (b - 1) * 14,
                  top: ROW_Y + dropY - bt * 150,
                  width: bs,
                  height: bs,
                  borderRadius: bs,
                  border: `1.5px solid ${COLOR.red}`,
                  background: 'rgba(255,77,77,0.18)',
                  opacity: (1 - bt) * 0.9,
                }}
              />
            );
          })
        : null}
    </>
  );
};

// 底部图例标签（能被溶解 / 不能被溶解），阵营激活当拍进场；两营各占一行（row 0/1）
const CampTag: React.FC<{ zh: string; en: string; color: 'red' | 'green'; at: number; row: number }> = ({
  zh,
  en,
  color,
  at,
  row,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  if (t <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: GLASS_L + 6,
        top: GLASS_BOTTOM + 16 + row * 46 + (1 - t) * 10,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        borderRadius: 10,
        border: `2px solid ${COLOR[color]}`,
        background: color === 'red' ? 'rgba(255,77,77,0.16)' : 'rgba(61,220,132,0.16)',
        opacity: t,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: 4, background: GRAD[color], flexShrink: 0 }} />
      <span style={{ fontFamily: FONT.zh, fontWeight: 900, fontSize: 24, color: COLOR[color], whiteSpace: 'nowrap' }}>{zh}</span>
      <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 20, letterSpacing: '0.16em', color: COLOR[color], opacity: 0.85 }}>{en}</span>
    </div>
  );
};

export const SolventTank: React.FC<{
  enterAt: number; // 玻璃烧杯入场
  pourAt: number; // 注液 + 6 灰块沉入
  dissolveAt: number; // 红 3 消融
  resistAt: number; // 绿 3 沉底保留
}> = ({ enterAt, pourAt, dissolveAt, resistAt }) => {
  const frame = useCurrentFrame();

  // 玻璃入场（显影 + 轻放大，texture §8 线框风）
  const glassT = interpolate(frame, [enterAt, enterAt + 13], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // 液面：注液从槽底升到高位（agent 溶剂低饱和蓝）
  const level = interpolate(frame, [pourAt, pourAt + 30], [GLASS_BOTTOM - 8, 168], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // 液面微动
  const wave = Math.sin(frame / 9) * 3;
  // 注液瞬间的溶剂流线
  const stream = interpolate(frame, [pourAt - 2, pourAt + 12], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'relative',
        width: 560,
        height: 664,
        opacity: glassT,
        transform: `scale(${0.94 + glassT * 0.06})`,
        transformOrigin: 'center 60%',
      }}
    >
      {/* 液体（低饱和蓝 = agent 溶剂），裁进玻璃形 */}
      <div
        style={{
          position: 'absolute',
          left: GLASS_L + 3,
          right: 560 - (GLASS_L + GLASS_W) + 3,
          top: level + wave,
          bottom: 664 - GLASS_BOTTOM + 6,
          borderRadius: '6px 6px 34px 34px',
          background: 'linear-gradient(180deg, rgba(77,158,255,0.30) 0%, rgba(47,127,224,0.16) 100%)',
          boxShadow: `inset 0 2px 0 ${COLOR.blue}66`,
        }}
      />
      {/* 注液流线 */}
      {stream > 0.02 ? (
        <div
          style={{
            position: 'absolute',
            left: 560 / 2 - 3,
            top: GLASS_TOP - 70,
            width: 6,
            height: 90,
            borderRadius: 3,
            background: `linear-gradient(180deg, transparent, ${COLOR.blue}cc)`,
            opacity: stream,
          }}
        />
      ) : null}

      {/* 玻璃烧杯：开口在上（无上边），线框描边 3px 透背景（texture §8） */}
      <div
        style={{
          position: 'absolute',
          left: GLASS_L,
          top: GLASS_TOP,
          width: GLASS_W,
          height: GLASS_BOTTOM - GLASS_TOP,
          borderLeft: '3px solid rgba(255,255,255,0.55)',
          borderRight: '3px solid rgba(255,255,255,0.55)',
          borderBottom: '3px solid rgba(255,255,255,0.55)',
          borderRadius: '4px 4px 40px 40px',
          background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}
      />
      {/* 杯口沿线 + 小壶嘴（lab 质感） */}
      <div style={{ position: 'absolute', left: GLASS_L - 8, top: GLASS_TOP - 2, width: GLASS_W + 16, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.62)' }} />
      {/* 侧壁刻度线（线框质感） */}
      {[0.28, 0.46, 0.64, 0.82].map((p) => (
        <div
          key={p}
          style={{
            position: 'absolute',
            left: GLASS_L + 4,
            top: GLASS_TOP + (GLASS_BOTTOM - GLASS_TOP) * p,
            width: 22,
            height: 2,
            background: 'rgba(255,255,255,0.32)',
          }}
        />
      ))}

      {/* 6 枚材质块 */}
      {Array.from({ length: N }, (_, i) => (
        <Cube key={i} i={i} pourAt={pourAt} dissolveAt={dissolveAt} resistAt={resistAt} />
      ))}

      {/* 底部双列图例（红能溶 | 绿不溶）= 全片两营种子 */}
      <CampTag zh="能被溶解" en="DISSOLVED" color="red" at={dissolveAt + 6} row={0} />
      <CampTag zh="不能被溶解" en="RESISTANT" color="green" at={resistAt + 6} row={1} />
    </div>
  );
};
