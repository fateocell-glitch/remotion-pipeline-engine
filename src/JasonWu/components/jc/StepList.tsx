import React from 'react';
import './fonts';
import { useEnter } from './motion';
import { COLOR, FONT, MOTION, RADIUS, type SemanticColor } from './tokens';

export type Step = {
  icon?: React.ReactNode; // lucide 图标，色随 accent
  text: string;
};

// 步骤列表：黑条 + 语义色圆圈编号①②③ + 图标 + 中文，逐条点亮。
// 参考 refs/04-信息卡与步骤流程/n1_t150（ChatGPT image tool 三步）。
export const StepList: React.FC<{
  steps: Step[];
  accent?: SemanticColor;
  enterAt?: number;
  staggerFrames?: number;
}> = ({ steps, accent = 'blue', enterAt = 0, staggerFrames = MOTION.stagger }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      {steps.map((s, i) => (
        <StepView key={i} step={s} n={i + 1} accent={accent} enterAt={enterAt + i * staggerFrames} />
      ))}
    </div>
  );
};

const StepView: React.FC<{ step: Step; n: number; accent: SemanticColor; enterAt: number }> = ({
  step,
  n,
  accent,
  enterAt,
}) => {
  const enter = useEnter(enterAt, 'left');
  const c = COLOR[accent];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 16,
        padding: '13px 22px',
        background: COLOR.cardBg,
        border: `1.5px solid ${COLOR.cardStroke}`,
        borderRadius: RADIUS.chip,
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        opacity: enter.opacity,
        transform: enter.transform,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          border: `2px solid ${c}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.en,
          fontWeight: 800,
          fontSize: 19,
          color: c,
          flexShrink: 0,
        }}
      >
        {n}
      </span>
      {step.icon ? (
        <span style={{ color: c, display: 'inline-flex', alignItems: 'center' }}>{step.icon}</span>
      ) : null}
      <span style={{ fontFamily: FONT.zh, fontWeight: 700, fontSize: 28, color: COLOR.white, whiteSpace: 'nowrap' }}>
        {step.text}
      </span>
    </div>
  );
};
