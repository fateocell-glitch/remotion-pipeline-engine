import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { Img, useCurrentFrame } from 'remotion';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT } from './tokens';

// 人物背书徽章：暗底 pill + 真头像 + 姓名 caps + 蓝勾 + 中文副行。
// 基准片 seg03「MUSK AGREES · 马斯克 · 认同」实测：pill 高 ≈64px、头像 48、名 21 caps、副行 18 灰。
// why：人物背书用「头像+认证勾」的徽章形态，比纯文本 chip 权威感高一档——证据链三件套之一。
export const PersonBadge: React.FC<{
  avatarSrc: string;
  name: string; // 'MUSK AGREES'
  zhSub: string; // '马斯克 · 认同'
  accent?: 'blue' | 'green' | 'yellow' | 'red';
  enterAt?: number;
}> = ({ avatarSrc, name, zhSub, accent = 'blue', enterAt = 0 }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(enterAt, 'left');
  if (frame < enterAt) return null; // 未入场不渲染：占位箱会污染 QC
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 14px 8px 10px',
        borderRadius: 14,
        background: 'rgba(14,16,21,0.88)',
        border: `1px solid ${COLOR.cardStroke}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      <Img src={avatarSrc} style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover', display: 'block' }} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: FONT.en, fontWeight: 800, fontSize: 20, letterSpacing: '0.08em', color: COLOR.white, lineHeight: 1.1 }}>
            {name.toUpperCase()}
          </span>
          <BadgeCheck size={20} color={COLOR[accent]} strokeWidth={2.4} />
        </div>
        <div style={{ marginTop: 3, fontFamily: FONT.zh, fontWeight: 700, fontSize: 18, color: COLOR.grey, lineHeight: 1.1 }}>{zhSub}</div>
      </div>
    </div>
  );
};
