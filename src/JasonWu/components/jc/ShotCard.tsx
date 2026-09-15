import React from 'react';
import { Easing, Img, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { usePop } from './motion';
import { COLOR, FONT, MOTION, SIZE, type SemanticColor } from './tokens';

// 实录截图包装卡：基准片最高频的「真素材包装」——圆角 + 大阴影 + 可选白描边/发光，
// 可叠黄色荧光高亮矩形、黑底中文译条。素材本身是截图（Img）或任意 children。
// 参考 refs/07 n4_t024（推文截图）、n3_t079（Gerstner 画中画）。
// seg03 新增：highlights/zhBars 分拍数组（高亮=口播的光标，跟句扫入）+ punch（卡框不动、
// 卡内内容变焦——基准片 punch-in 实测是内容 zoom 不是整卡放大，译条/高亮随内容同变换）。
export const ShotCard: React.FC<{
  src?: string; // staticFile(...) 截图
  children?: React.ReactNode;
  width: number;
  radius?: number;
  stroke?: string; // 白描边，画中画常用 'rgba(255,255,255,0.9)'
  strokeWidth?: number;
  glow?: SemanticColor | 'purple' | 'none';
  rotate?: number; // 轻微倾斜（deg）
  highlight?: { xPct: number; yPct: number; wPct: number; hPct: number }; // 黄荧光矩形（按卡宽高百分比）
  zhBar?: { text: string; yPct?: number }; // 黑底中文译条，默认压在底部（卡外贴边，旧接口）
  highlights?: { xPct: number; yPct: number; wPct: number; hPct: number; at?: number }[]; // 分拍高亮，at 帧起左→右扫入
  zhBars?: { text: string; xPct?: number; yPct?: number; at?: number }[]; // 卡内译条（随 punch 同变换），贴所译句下沿
  punch?: { at: number; scale?: number; originX?: string; originY?: string; durFrames?: number }; // 卡内内容变焦
  enterAt?: number;
}> = ({
  src,
  children,
  width,
  radius = 18,
  stroke,
  strokeWidth = 0,
  glow = 'none',
  rotate = 0,
  highlight,
  zhBar,
  highlights,
  zhBars,
  punch,
  enterAt = 0,
}) => {
  const frame = useCurrentFrame();
  // 大卡载体用显影（usePop：透明度+scale，无位移）——useEnter 'up' 的 40px 下探会把卡压进字幕净空（QC 实测）
  const enter = usePop(enterAt);
  const glowColor = glow === 'none' ? undefined : glow === 'purple' ? '#B26BFF' : COLOR[glow];
  const punchT = punch
    ? interpolate(frame, [punch.at, punch.at + (punch.durFrames ?? 15)], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      })
    : 0;
  const punchScale = 1 + punchT * ((punch?.scale ?? 1.6) - 1);
  return (
    <div
      style={{
        position: 'relative',
        width,
        opacity: enter.opacity,
        transform: `${enter.transform} rotate(${rotate}deg)`,
      }}
    >
      <div
        style={{
          borderRadius: radius,
          overflow: 'hidden',
          border: strokeWidth ? `${strokeWidth}px solid ${stroke ?? 'rgba(255,255,255,0.9)'}` : undefined,
          boxShadow: glowColor
            ? `0 0 30px ${glowColor}66, 0 0 80px ${glowColor}33, 0 24px 70px rgba(0,0,0,0.6)`
            : '0 24px 70px rgba(0,0,0,0.6)',
          lineHeight: 0,
          background: '#fff',
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: punch ? `scale(${punchScale})` : undefined,
            transformOrigin: punch ? `${punch.originX ?? '0%'} ${punch.originY ?? '0%'}` : undefined,
          }}
        >
          {src ? <Img src={src} style={{ width: '100%', display: 'block' }} /> : children}
          {(highlights ?? []).map((h, i) => {
            const sweep = interpolate(frame, [h.at ?? 0, (h.at ?? 0) + 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });
            if (sweep <= 0) return null;
            return (
              <div
                key={`hl${i}`}
                style={{
                  position: 'absolute',
                  left: `${h.xPct}%`,
                  top: `${h.yPct}%`,
                  width: `${h.wPct}%`,
                  height: `${h.hPct}%`,
                  background: '#F9E27A',
                  opacity: 0.55 * sweep,
                  transform: `scaleX(${sweep})`,
                  transformOrigin: 'left center',
                  mixBlendMode: 'multiply',
                  borderRadius: 4,
                }}
              />
            );
          })}
          {(zhBars ?? []).map((b, i) => {
            const t = interpolate(frame, [b.at ?? 0, (b.at ?? 0) + MOTION.popInFrames], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });
            if (t <= 0) return null;
            return (
              <div
                key={`bar${i}`}
                style={{
                  position: 'absolute',
                  left: `${b.xPct ?? 2}%`,
                  top: `${b.yPct ?? 80}%`,
                  maxWidth: '86%',
                  background: 'rgba(10,12,15,0.92)',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontFamily: FONT.zh,
                  fontWeight: FONT.zhHeavy,
                  fontSize: SIZE.subSmall + 2,
                  lineHeight: 1.5,
                  color: COLOR.white,
                  boxShadow: '0 8px 26px rgba(0,0,0,0.5)',
                  opacity: t,
                  transform: `translateY(${(1 - t) * 10}px)`,
                }}
              >
                {b.text}
              </div>
            );
          })}
          {highlight ? (
            <div
              style={{
                position: 'absolute',
                left: `${highlight.xPct}%`,
                top: `${highlight.yPct}%`,
                width: `${highlight.wPct}%`,
                height: `${highlight.hPct}%`,
                background: '#F9E27A',
                opacity: 0.55,
                mixBlendMode: 'multiply',
                borderRadius: 4,
              }}
            />
          ) : null}
        </div>
      </div>
      {zhBar ? (
        <div
          style={{
            position: 'absolute',
            left: 24,
            top: zhBar.yPct !== undefined ? `${zhBar.yPct}%` : undefined,
            bottom: zhBar.yPct === undefined ? 26 : undefined,
            maxWidth: width - 80,
            background: 'rgba(10,12,15,0.92)',
            borderRadius: 8,
            padding: '10px 16px',
            fontFamily: FONT.zh,
            fontWeight: FONT.zhHeavy,
            fontSize: SIZE.subSmall + 2,
            lineHeight: 1.5,
            color: COLOR.white,
            boxShadow: '0 8px 26px rgba(0,0,0,0.5)',
          }}
        >
          {zhBar.text}
        </div>
      ) : null}
    </div>
  );
};
