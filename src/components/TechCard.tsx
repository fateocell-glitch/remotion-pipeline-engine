import type {CSSProperties} from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type TechCardProps = {
  title: string;
  value: number;
  unit?: string;
  chips?: string[];
  accent?: "#FFE600" | "#FF1744" | "#7F00FF" | "#FFFFFF";
};

const COLORS = {
  yellow: "#FFE600",
  red: "#FF1744",
  purple: "#7F00FF",
  white: "#FFFFFF",
  panel: "rgba(4, 6, 16, 0.62)",
};

const cutCorner =
  "polygon(22px 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%, 0 22px)";

const cornerStyle = (
  edgeA: keyof CSSProperties,
  edgeB: keyof CSSProperties,
  color: string,
): CSSProperties => ({
  position: "absolute",
  [edgeA]: -1,
  [edgeB]: -1,
  width: 54,
  height: 54,
  borderColor: color,
  opacity: 0.95,
});

export const TechCard: React.FC<TechCardProps> = ({
  title,
  value,
  unit = "",
  chips = ["SIGNAL", "SYNC", "LIVE"],
  accent = COLORS.yellow,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 18,
      mass: 0.9,
      stiffness: 92,
    },
    durationInFrames: 42,
  });

  const numberProgress = spring({
    frame: frame - 8,
    fps,
    config: {
      damping: 28,
      mass: 0.8,
      stiffness: 72,
    },
    durationInFrames: 96,
  });

  const renderedValue = Math.round(
    interpolate(numberProgress, [0, 1], [0, value], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  const pulse = interpolate(Math.sin(frame / 9), [-1, 1], [0.38, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sweep = interpolate(frame, [0, 150], [-26, 104], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: "relative",
        width: 690,
        minHeight: 292,
        padding: 1.5,
        clipPath: cutCorner,
        background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.26) 42%, ${COLORS.purple})`,
        opacity: interpolate(entrance, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: interpolate(entrance, [0, 1], [0.96, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          output: "perceptual-scale",
        }),
        translate: `${interpolate(entrance, [0, 1], [0, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}px ${interpolate(entrance, [0, 1], [28, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}px`,
        filter: `drop-shadow(0 0 ${18 + pulse * 16}px rgba(127, 0, 255, 0.38))`,
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 289,
          padding: "30px 36px 34px",
          clipPath: cutCorner,
          overflow: "hidden",
          background:
            "linear-gradient(145deg, rgba(9, 12, 28, 0.74), rgba(2, 4, 12, 0.48))",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow:
            "inset 0 0 34px rgba(255, 255, 255, 0.07), inset 0 0 80px rgba(127, 0, 255, 0.12)",
          color: COLORS.white,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: `${sweep}%`,
            left: -120,
            width: 940,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.white}, transparent)`,
            opacity: 0.2,
            rotate: "-11deg",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.055) 0, rgba(255,255,255,0.055) 1px, transparent 1px, transparent 11px)",
            opacity: 0.2,
          }}
        />
        <div
          style={{
            ...cornerStyle("top", "left", accent),
            borderTop: "2px solid",
            borderLeft: "2px solid",
          }}
        />
        <div
          style={{
            ...cornerStyle("right", "bottom", COLORS.purple),
            borderRight: "2px solid",
            borderBottom: "2px solid",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 0,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: accent,
                opacity: pulse,
                boxShadow: `0 0 ${10 + pulse * 18}px ${accent}`,
              }}
            />
            <div
              style={{
                fontSize: 24,
                lineHeight: "28px",
                fontWeight: 800,
                color: COLORS.white,
                letterSpacing: 0,
                textTransform: "uppercase",
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {chips.map((chip, index) => (
              <span
                key={chip}
                style={{
                  padding: "7px 12px",
                  border: `1px solid ${
                    index === 0 ? accent : "rgba(255,255,255,0.32)"
                  }`,
                  backgroundColor:
                    index === 0
                      ? "rgba(255, 230, 0, 0.14)"
                      : "rgba(255,255,255,0.075)",
                  color: index === 0 ? accent : COLORS.white,
                  fontSize: 15,
                  lineHeight: "18px",
                  fontWeight: 700,
                  letterSpacing: 0,
                  clipPath:
                    "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            gap: 14,
            marginTop: 42,
          }}
        >
          <div
            style={{
              fontVariantNumeric: "tabular-nums",
              fontSize: 106,
              lineHeight: "100px",
              fontWeight: 900,
              color: COLORS.white,
              textShadow: `0 0 18px rgba(255,255,255,0.28), 0 0 32px ${accent}`,
            }}
          >
            {renderedValue.toLocaleString("en-US")}
          </div>
          <div
            style={{
              paddingBottom: 13,
              fontSize: 28,
              lineHeight: "32px",
              fontWeight: 800,
              color: accent,
            }}
          >
            {unit}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            marginTop: 34,
          }}
        >
          {[COLORS.yellow, COLORS.red, COLORS.purple].map((color, index) => (
            <div
              key={color}
              style={{
                height: 5,
                backgroundColor: color,
                opacity: interpolate(frame, [index * 8, index * 8 + 18], [0.22, 0.9], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
