import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, RADIUS, type SemanticColor } from './tokens';

// 手机 mockup：iPhone 外框 + 彩色渐变描边发光 + 内容长图滚动。
// children 放任意内容（截图 <Img> 或自绘 UI），内容高度超出屏幕时用 scroll 参数滚动。
// 参考 refs/06-mockup与实录/n1_t015、n1_t328。
export const PhoneMockup: React.FC<{
  children: React.ReactNode;
  header?: React.ReactNode; // 固定在屏幕顶部、不随内容滚动（如微信群标题栏）
  width?: number; // 手机外框宽
  glow?: SemanticColor | 'purple';
  scrollFrom?: number; // 内容 translateY 起点（px，负值向上）
  scrollTo?: number;
  scrollStart?: number; // 开始滚动的帧
  scrollFrames?: number;
  enterAt?: number;
}> = ({
  children,
  header,
  width = 340,
  glow = 'purple',
  scrollFrom = 0,
  scrollTo = 0,
  scrollStart = 30,
  scrollFrames = 120,
  enterAt = 0,
}) => {
  const frame = useCurrentFrame();
  const enter = useEnter(enterAt, 'up');
  const height = width * 2.05;
  const glowColor = glow === 'purple' ? '#B26BFF' : COLOR[glow];
  const y = interpolate(frame, [scrollStart, scrollStart + scrollFrames], [scrollFrom, scrollTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <div
      style={{
        width,
        height,
        borderRadius: RADIUS.phone,
        padding: 10,
        background: '#0B0D11',
        border: '2.5px solid rgba(255,255,255,0.25)',
        boxShadow: `0 0 34px ${glowColor}66, 0 0 90px ${glowColor}33`,
        opacity: enter.opacity,
        transform: enter.transform,
        position: 'relative',
      }}
    >
      {/* 灵动岛 */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          width: width * 0.32,
          height: 22,
          borderRadius: 12,
          background: '#000',
          zIndex: 2,
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: RADIUS.phone - 12,
          overflow: 'hidden',
          background: '#F5F6F7',
          position: 'relative',
        }}
      >
        <div style={{ transform: `translateY(${y}px)` }}>{children}</div>
        {header ? (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>{header}</div>
        ) : null}
      </div>
    </div>
  );
};
