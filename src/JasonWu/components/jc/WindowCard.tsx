import React from 'react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, type SemanticColor } from './tokens';

// mac 窗口卡：红黄绿三点 + app 图标 + app 名 + 右上功能 chip（语义色描边胶囊），
// 内容区任意（打字文案 / 图片 / 实录 / 代码）。参考 refs/04-信息卡与步骤流程/n1_t074（2x2 四窗口）。
export const WindowCard: React.FC<{
  title: string; // 'DeepSeek' / 'Claude Code'
  icon?: React.ReactNode; // lucide 图标或 <Img>，色自定
  chip?: { text: string; color: SemanticColor | 'purple' }; // 右上功能标签：写作/生图/生视频/编程
  width: number;
  height?: number;
  children?: React.ReactNode;
  enterAt?: number;
}> = ({ title, icon, chip, width, height, children, enterAt = 0 }) => {
  const enter = useEnter(enterAt, 'up');
  const chipColor = chip ? (chip.color === 'purple' ? '#B26BFF' : COLOR[chip.color]) : undefined;
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(18,20,24,0.92)',
        border: '1.5px solid rgba(255,255,255,0.16)',
        borderRadius: 16,
        boxShadow: '0 22px 60px rgba(0,0,0,0.55)',
        overflow: 'hidden',
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 7 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
          ))}
        </div>
        {icon ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6 }}>{icon}</span>
        ) : null}
        <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 24, color: COLOR.white }}>{title}</span>
        {chip ? (
          <span
            style={{
              marginLeft: 'auto',
              border: `1.5px solid ${chipColor}`,
              borderRadius: 999,
              padding: '3px 14px',
              fontFamily: FONT.zh,
              fontWeight: 700,
              fontSize: 18,
              color: chipColor,
            }}
          >
            {chip.text}
          </span>
        ) : null}
      </div>
      {/* 内容区 */}
      <div style={{ flex: 1, padding: 18, overflow: 'hidden', position: 'relative' }}>{children}</div>
    </div>
  );
};
