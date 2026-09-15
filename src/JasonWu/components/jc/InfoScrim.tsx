import { AbsoluteFill } from 'remotion';

// 信息区 scrim：信息侧渐变暗化衬底，让白字/语义色 MG 在亮色实拍上可读。
// 亮场景素材（白板/白墙）装配时必须垫在 MG 层之下（错题集 #08 待记）。
//
// side：信息 MG 在哪一侧就压哪一侧（默认 'right' 兼容既有片）。
// 2026-07-22 补：0722-01 信息 MG 放左侧（用户裁定），左侧恰是白柜+亮墙+橙机器人最亮区，
// 而旧实现只压右侧 → 左区 MG 全程裸露在亮背景上、近乎不可读（0715-02 Scene14 曾就地打补丁，
// 底座缺口未补）。此处补 side 参数，信息在左的片传 side="left"。
export const InfoScrim: React.FC<{ strength?: number; side?: 'left' | 'right' }> = ({
  strength = 1,
  side = 'right',
}) => {
  const deg = side === 'right' ? 90 : 270;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${deg}deg, transparent 40%, rgba(4,6,9,${0.5 * strength}) 58%, rgba(4,6,9,${0.8 * strength}) 100%)`,
        pointerEvents: 'none',
      }}
    />
  );
};
