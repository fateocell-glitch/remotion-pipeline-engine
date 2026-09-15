import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import './fonts';
import { COLOR, FONT, GRADIENT, RADIUS, type SemanticColor } from './tokens';

// 倾斜印章：同色系深色半透底板 + 2px 语义色描边 + 粗黑中文判词（可带图标 / 英文副行）。
// 盖章入场（scale 1.3→1 + 落定轻震），glow 收敛（小模糊低 alpha），小而精。
// 参考 refs/08-印章徽章与比喻图形/n4_t244（无可替代）、n4_t094（被吸收）。

// 从 GRADIENT 深色端推导同色系印泥色底板（近实底）：
// 0.88 而非 0.4——半透底压在白板/亮面上整章泛灰（体检 s11/s19 实锤，报告叙事 sev5「亮环境发灰」）。
const plateBg = (color: SemanticColor): string => {
  const hex = GRADIENT[color][1].replace('#', '');
  const r = Math.round(parseInt(hex.slice(0, 2), 16) * 0.35);
  const g = Math.round(parseInt(hex.slice(2, 4), 16) * 0.35);
  const b = Math.round(parseInt(hex.slice(4, 6), 16) * 0.35);
  return `rgba(${r},${g},${b},0.88)`;
};

export const Stamp: React.FC<{
  text: string;
  color?: SemanticColor;
  rotate?: number;
  fontSize?: number;
  enterAt?: number;
  /** lucide 图标节点，置于中文判词左侧 */
  icon?: React.ReactNode;
  /** 英文副行：大写、0.25em 字距、约主行 30% 字号、accent 70% 透明度 */
  enSub?: string;
}> = ({
  text,
  color = 'green',
  rotate = -7,
  fontSize = 48,
  enterAt = 0,
  icon,
  enSub,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [enterAt, enterAt + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // 落定轻震：盖章到位后 12 帧内的衰减正弦微旋
  const settle = frame - (enterAt + 10);
  const shake =
    settle > 0 && settle < 12
      ? Math.sin(settle * 1.3) * Math.exp(-settle * 0.35) * 1.2
      : 0;
  const accent = COLOR[color];
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: enSub ? Math.round(fontSize * 0.14) : 0,
        border: `2px solid ${accent}`,
        borderRadius: RADIUS.chip,
        padding: '12px 28px',
        background: plateBg(color),
        fontFamily: FONT.zh,
        fontWeight: FONT.zhHeavy,
        fontSize,
        color: accent,
        opacity: Math.min(1, t * 2.5) * 0.95,
        transform: `rotate(${rotate + shake}deg) scale(${1.3 - 0.3 * t})`,
        textShadow: `0 0 12px ${accent}44`,
        boxShadow: `0 0 14px ${accent}22, inset 0 0 12px ${accent}14`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: Math.round(fontSize * 0.3),
          letterSpacing: '0.18em',
        }}
      >
        {icon ? (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {icon}
          </span>
        ) : null}
        <span>{text}</span>
      </div>
      {enSub ? (
        <div
          style={{
            fontFamily: FONT.en,
            fontWeight: FONT.enBold,
            fontSize: Math.round(fontSize * 0.3),
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: `${accent}B3`,
          }}
        >
          {enSub}
        </div>
      ) : null}
    </div>
  );
};
