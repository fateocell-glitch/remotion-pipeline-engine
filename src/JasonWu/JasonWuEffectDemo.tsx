import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const COLORS = {
  blue: "#0A84FF",
  gold: "#FFD166",
  green: "#36D399",
  white: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  panel: "rgba(3,8,15,0.76)",
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const inOut = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, start + 18, end - 18, end], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

const enter = (frame: number, start: number, x = -28) => ({
  opacity: interpolate(frame, [start, start + 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  }),
  transform: `translateX(${interpolate(frame, [start, start + 24], [x, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  })}px)`,
});

const SectionTag: React.FC<{label: string; time: string}> = ({label, time}) => (
  <div style={{position: "absolute", left: 70, top: 64}}>
    <div style={{color: COLORS.blue, fontSize: 24, fontWeight: 950, letterSpacing: 8}}>{label}</div>
    <div style={{color: COLORS.white, fontSize: 24, fontWeight: 900, marginTop: 10}}>{time}</div>
  </div>
);


const EffectLabel: React.FC<{text: string; left?: number; right?: number; top: number; color?: string; delay: number}> = ({
  text,
  left,
  right,
  top,
  color = COLORS.blue,
  delay,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left,
        right,
        top,
        padding: "8px 13px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.66)",
        border: `1px solid ${color}`,
        color,
        fontSize: 18,
        fontWeight: 950,
        letterSpacing: 1,
        boxShadow: `0 0 18px ${color}55`,
        zIndex: 20,
        ...enter(frame, delay, left === undefined ? 18 : -18),
      }}
    >
      {text}
    </div>
  );
};
const DemoSubtitle: React.FC<{text: string}> = ({text}) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      bottom: 64,
      width: "80%",
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.52)",
      padding: "12px 22px",
      color: COLORS.white,
      fontSize: 42,
      lineHeight: "52px",
      fontWeight: 950,
      textAlign: "center",
      textShadow: "0 3px 10px rgba(0,0,0,0.9)",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    }}
  >
    {text.split(/(苹果|AI|工程师|1600亿|4.6万亿|25%|85%)/g).map((part, index) => {
      const color = part === "AI" || part === "苹果" ? COLORS.blue : part === "工程师" ? COLORS.green : COLORS.gold;
      return /苹果|AI|工程师|1600亿|4.6万亿|25%|85%/.test(part) ? (
        <span key={`${part}-${index}`} style={{color}}>
          {part}
        </span>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      );
    })}
  </div>
);

const RollingNumber: React.FC<{from: number; to: number; prefix?: string; suffix?: string; start: number; end: number}> = ({
  from,
  to,
  prefix = "",
  suffix = "",
  start,
  end,
}) => {
  const frame = useCurrentFrame();
  const current = Math.round(
    interpolate(frame, [start, end], [from, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    }),
  );
  return (
    <>
      {prefix}
      {current.toLocaleString("en-US")}
      {suffix}
    </>
  );
};

const PersonDisc: React.FC<{name: string; role: string; size: number; active?: boolean}> = ({name, role, size, active}) => (
  <div style={{width: size, height: size, borderRadius: "50%", background: active ? "#94a3b8" : "rgba(255,255,255,0.16)", border: `3px solid ${active ? COLORS.blue : "rgba(255,255,255,0.18)"}`, boxShadow: active ? "0 0 42px rgba(10,132,255,0.55)" : "none", position: "relative", overflow: "hidden"}}>
    <div style={{position: "absolute", left: "50%", top: "27%", width: size * 0.22, height: size * 0.22, borderRadius: "50%", background: "#202936", transform: "translateX(-50%)"}} />
    <div style={{position: "absolute", left: "20%", right: "20%", bottom: "-3%", height: "34%", borderRadius: "50% 50% 0 0", background: "#202936"}} />
    <div style={{position: "absolute", left: 0, right: 0, bottom: 22, color: COLORS.white, textAlign: "center", fontSize: 18, fontWeight: 950}}>{name}</div>
    <div style={{position: "absolute", left: 0, right: 0, bottom: 5, color: active ? COLORS.blue : COLORS.dim, textAlign: "center", fontSize: 11, fontWeight: 900, letterSpacing: 2}}>{role}</div>
  </div>
);

const StatCard: React.FC<{label: string; from: number; to: number; prefix?: string; suffix?: string; color: string; delay: number}> = ({
  label,
  from,
  to,
  prefix,
  suffix,
  color,
  delay,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{width: 420, padding: "22px 26px", borderRadius: 12, background: COLORS.panel, border: `1px solid ${color}`, boxShadow: `0 0 34px ${color}55`, ...enter(frame, delay, 0)}}>
      <div style={{color, fontSize: 18, fontWeight: 950, letterSpacing: 3}}>{label}</div>
      <div style={{color: COLORS.white, fontSize: 70, lineHeight: "82px", fontWeight: 950}}>
        <RollingNumber from={from} to={to} prefix={prefix} suffix={suffix} start={delay + 12} end={delay + 96} />
      </div>
    </div>
  );
};

const LineChart: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const points = "60,360 190,330 320,282 480,245 640,176 820,95";
  return (
    <svg viewBox="0 0 900 420" style={{width: 900, height: 420, filter: "drop-shadow(0 0 18px rgba(10,132,255,0.8))"}}>
      {[120, 200, 280, 360].map((y) => (
        <line key={y} x1="60" x2="840" y1={y} y2={y} stroke="rgba(255,255,255,0.13)" strokeWidth="2" />
      ))}
      <polyline points={points} fill="none" stroke={COLORS.blue} strokeWidth="7" strokeLinecap="round" strokeDasharray="980" strokeDashoffset={980 - progress * 980} />
      <circle cx={820} cy={95} r={8 + Math.sin(frame / 8) * 3} fill={COLORS.gold} />
    </svg>
  );
};

const Donut: React.FC<{label: string; value: number; color: string; delay: number}> = ({label, value, color, delay}) => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [delay, delay + 54], [0, value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const dash = Math.PI * 2 * 78;
  return (
    <div style={{position: "relative", width: 250, height: 250}}>
      <svg viewBox="0 0 220 220" style={{width: 250, height: 250, transform: "rotate(-90deg)"}}>
        <circle cx="110" cy="110" r="78" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="20" />
        <circle cx="110" cy="110" r="78" fill="none" stroke={color} strokeWidth="20" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={dash * (1 - pct / 100)} />
      </svg>
      <div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
        <div style={{color: COLORS.white, fontSize: 54, fontWeight: 950}}>
          <RollingNumber from={0} to={value} suffix="%" start={delay} end={delay + 54} />
        </div>
        <div style={{color, fontSize: 14, fontWeight: 950, letterSpacing: 2.5}}>{label}</div>
      </div>
    </div>
  );
};

const Chip: React.FC<{title: string; sub: string; color: string; delay: number}> = ({title, sub, color, delay}) => {
  const frame = useCurrentFrame();
  const shimmer = interpolate(frame, [delay + 35, delay + 130], [-120, 520], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{position: "relative", width: 560, padding: "15px 20px", borderRadius: 10, overflow: "hidden", background: COLORS.panel, border: `1px solid ${color}`, boxShadow: `0 0 ${18 + Math.sin(frame / 16) * 8}px ${color}55`, ...enter(frame, delay)}}>
      <div style={{position: "absolute", left: shimmer, top: -20, width: 70, height: 120, rotate: "18deg", background: `linear-gradient(90deg, transparent, ${color}66, transparent)`}} />
      <div style={{color: COLORS.white, fontSize: 26, fontWeight: 950}}>{title}</div>
      <div style={{color, fontSize: 13, fontWeight: 950, letterSpacing: 3, marginTop: 6}}>{sub}</div>
    </div>
  );
};

const RadarAndMap: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [delay + 24, delay + 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  return (
    <>
      <EffectLabel text="雷达图 RadarChart" left={180} top={220} color={COLORS.blue} delay={delay + 8} />
      <EffectLabel text="世界地图节点 WorldMapNode" right={465} top={205} color={COLORS.green} delay={delay + 18} />
      <EffectLabel text="动态连线 Glow Arc" right={175} top={205} color={COLORS.gold} delay={delay + 28} />
      <svg viewBox="0 0 560 410" style={{position: "absolute", left: 110, top: 260, width: 560, height: 410, filter: "drop-shadow(0 0 18px rgba(10,132,255,0.85))"}}>
        {[0.32, 0.64, 1].map((scale) => (
          <polygon key={scale} points={`280,${205 - 155 * scale} ${280 + 140 * scale},${205 + 110 * scale} ${280 - 140 * scale},${205 + 110 * scale}`} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        ))}
        <polygon points={`280,${76 - 42 * draw} ${424 + 32 * draw},318 ${130 - 30 * draw},318`} fill="rgba(10,132,255,0.28)" stroke={COLORS.blue} strokeWidth="5" />
        <text x="226" y="38" fill={COLORS.gold} fontSize="24" fontWeight="950">R&D 10%</text>
        <text x="350" y="370" fill={COLORS.white} fontSize="24" fontWeight="950">2.2B Devices</text>
        <text x="36" y="370" fill={COLORS.white} fontSize="24" fontWeight="950">&lt;15ms</text>
      </svg>
      <svg viewBox="0 0 850 430" style={{position: "absolute", right: 110, top: 240, width: 850, height: 430, background: "rgba(3,8,15,0.55)", border: "1px solid rgba(10,132,255,0.3)", borderRadius: 18}}>
        <path d="M170 160 C330 50 520 82 690 210" stroke={COLORS.blue} strokeWidth="5" fill="none" strokeDasharray="650" strokeDashoffset={650 - draw * 650} />
        <path d="M170 160 C340 285 520 315 680 330" stroke={COLORS.gold} strokeWidth="5" fill="none" strokeDasharray="640" strokeDashoffset={640 - draw * 640} />
        {[
          [170, 160, "Cupertino", COLORS.gold],
          [690, 210, "India", COLORS.blue],
          [680, 330, "SEA", COLORS.blue],
          [500, 115, "NPU", COLORS.green],
        ].map(([x, y, label, color]) => (
          <g key={label as string}>
            <circle cx={x as number} cy={y as number} r="13" fill={color as string} />
            <text x={(x as number) + 20} y={(y as number) + 8} fill="white" fontSize="24" fontWeight="950">{label}</text>
          </g>
        ))}
      </svg>
    </>
  );
};

const LaptopHud: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [delay + 20, delay + 72], [72, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const text = "PORTS: MagSafe / HDMI / SDXC  ·  TOLERANCE: 0.01mm";
  const typed = Math.floor(interpolate(frame, [delay + 80, delay + 165], [0, text.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  return (
    <>
      <EffectLabel text="3D 笔记本 DeviceMockup" left={230} top={230} color={COLORS.blue} delay={delay + 8} />
      <EffectLabel text="HUD 参数卡 SpecBadge" right={325} top={202} color={COLORS.gold} delay={delay + 32} />
      <EffectLabel text="Typewriter 打字机" left={250} top={615} color={COLORS.green} delay={delay + 78} />
      <div style={{position: "absolute", left: 170, top: 280, width: 720, height: 430, perspective: 900, ...enter(frame, delay, -30)}}>
        <div style={{position: "absolute", left: 135, top: 60, width: 475, height: 300, borderRadius: 16, background: "linear-gradient(145deg, #bcc7d3, #263343)", transform: `rotateX(${open}deg)`, transformOrigin: "bottom", border: "2px solid rgba(255,255,255,0.35)", boxShadow: "0 0 44px rgba(10,132,255,0.42)"}}>
          <div style={{position: "absolute", inset: 22, borderRadius: 10, background: "radial-gradient(circle at 46% 42%, rgba(10,132,255,0.34), transparent 36%), #07111f"}} />
        </div>
        <div style={{position: "absolute", left: 70, top: 352, width: 640, height: 48, borderRadius: "0 0 24px 24px", background: "linear-gradient(180deg, #d7dde3, #606b77)", transform: "skewX(-16deg)", boxShadow: "0 18px 34px rgba(0,0,0,0.5)"}} />
        {[0, 1, 2].map((port) => (
          <div key={port} style={{position: "absolute", left: 168 + port * 72, top: 373, width: 44, height: 8, borderRadius: 4, background: COLORS.blue, boxShadow: "0 0 18px rgba(10,132,255,0.9)"}} />
        ))}
      </div>
      <div style={{position: "absolute", right: 180, top: 250, display: "flex", flexDirection: "column", gap: 14}}>
        <Chip title="M-Series Efficiency +300%" sub="PERFORMANCE PER WATT" color={COLORS.gold} delay={delay + 36} />
        <Chip title="Battery 22h+" sub="MACBOOK PRO ENDURANCE" color={COLORS.blue} delay={delay + 56} />
        <Chip title="Circuit Highlight" sub="NPU · THERMAL · PACKAGING" color={COLORS.green} delay={delay + 76} />
      </div>
      <div style={{position: "absolute", left: 170, top: 665, width: 890, padding: "16px 20px", borderRadius: 10, background: COLORS.panel, border: `1px solid ${COLORS.green}`, color: COLORS.green, fontSize: 25, fontWeight: 950, boxShadow: "0 0 26px rgba(54,211,153,0.35)"}}>
        {text.slice(0, typed)}
        <span style={{opacity: Math.sin(frame / 6) > 0 ? 1 : 0.2}}>▌</span>
      </div>
    </>
  );
};

const Finale: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const slam = spring({frame: frame - delay - 20, fps, config: {damping: 10, stiffness: 220}});
  const sweep = interpolate(frame, [delay + 42, delay + 105], [-120, 920], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  return (
    <>
      <EffectLabel text="头像交叠 AvatarCrossfade" left={175} top={180} color={COLORS.blue} delay={delay + 8} />
      <EffectLabel text="大字冲击 KineticTypography" left={645} top={170} color={COLORS.gold} delay={delay + 20} />
      <EffectLabel text="点赞评论数字 SocialCounter" right={210} top={450} color={COLORS.green} delay={delay + 72} />
      <EffectLabel text="评论气泡 FloatingCommentCard" right={180} top={710} color={COLORS.blue} delay={delay + 88} />
      <div style={{position: "absolute", left: 150, top: 220, ...enter(frame, delay, -50), filter: "opacity(45%)"}}>
        <PersonDisc name="COOK" role="LEGACY" size={290} />
      </div>
      <div style={{position: "absolute", right: 220, top: 185, ...enter(frame, delay + 16, 50)}}>
        <PersonDisc name="TERNUS" role="NEW ERA" size={340} active />
      </div>
      <div style={{position: "absolute", left: 370, right: 370, top: 220, color: COLORS.white, textAlign: "center", transform: `scale(${interpolate(slam, [0, 1], [0.58, 1.08], {output: "perceptual-scale"})}) rotate(${interpolate(slam, [0, 1], [-2, 0.5])}deg)`}}>
        <div style={{position: "relative", overflow: "hidden", fontSize: 96, lineHeight: "104px", fontWeight: 950, textShadow: "0 0 48px rgba(10,132,255,0.9)"}}>
          ONE MORE THING?
          <div style={{position: "absolute", top: 0, bottom: 0, left: sweep, width: 105, rotate: "18deg", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.68), transparent)"}} />
        </div>
        <div style={{color: COLORS.gold, fontSize: 36, fontWeight: 950, marginTop: 18}}>评论区互动高潮</div>
      </div>
      <div style={{position: "absolute", left: 575, top: 462}}>
        <StatCard label="NET CASH FLOW" from={0} to={1600} prefix="$" suffix="B" color={COLORS.gold} delay={delay + 44} />
      </div>
      <div style={{position: "absolute", right: 120, top: 500, display: "flex", gap: 14, ...enter(frame, delay + 70, 34)}}>
        <StatCard label="LIKES" from={0} to={24800} color={COLORS.blue} delay={delay + 78} />
        <StatCard label="COMMENTS" from={0} to={1860} color={COLORS.gold} delay={delay + 92} />
      </div>
      {["看好工程师回归", "折叠屏会来吗？", "AI 才是决胜局"].map((comment, index) => (
        <div key={comment} style={{position: "absolute", right: 155 + index * 64 + Math.sin(frame / 16 + index) * 8, bottom: 250 + index * 84, padding: "16px 22px", borderRadius: 12, background: "rgba(3,8,15,0.88)", border: `1px solid ${index === 1 ? COLORS.gold : COLORS.blue}`, color: COLORS.white, fontSize: 28, fontWeight: 950, boxShadow: `0 0 26px ${index === 1 ? COLORS.gold : COLORS.blue}55`, ...enter(frame, delay + 58 + index * 18, 58)}}>
          {comment} · <span style={{color: index === 1 ? COLORS.gold : COLORS.blue}}><RollingNumber from={0} to={88 + index * 43} start={delay + 78 + index * 18} end={delay + 128 + index * 18} /></span>
        </div>
      ))}
    </>
  );
};

const SplitScene: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const services = interpolate(frame, [delay + 78, delay + 162], [8, 25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  return (
    <>
      <EffectLabel text="分屏 SplitScreen" left={105} top={180} color={COLORS.blue} delay={delay + 8} />
      <EffectLabel text="环形图 DonutChart" left={185} top={475} color={COLORS.gold} delay={delay + 24} />
      <EffectLabel text="服务占比增长 ProgressBars" left={140} top={650} color={COLORS.green} delay={delay + 72} />
      <EffectLabel text="发光 Chip 卡 GlowChipCard" right={260} top={198} color={COLORS.blue} delay={delay + 34} />
      <div style={{position: "absolute", left: 96, top: 220, width: 790, height: 480, borderRight: "1px solid rgba(255,255,255,0.18)", ...enter(frame, delay, -40)}}>
        <div style={{color: COLORS.blue, fontSize: 30, fontWeight: 950, letterSpacing: 4}}>OPERATING MACHINE</div>
        <div style={{display: "flex", gap: 45, marginTop: 40}}>
          <Donut label="SHIPMENT" value={20} color={COLORS.blue} delay={delay + 24} />
          <Donut label="PROFIT" value={85} color={COLORS.gold} delay={delay + 48} />
        </div>
        <div style={{marginTop: 36, width: 610}}>
          <div style={{color: COLORS.dim, fontSize: 20, fontWeight: 950}}>Services 8% → 25%</div>
          <div style={{height: 28, marginTop: 12, borderRadius: 99, background: "rgba(255,255,255,0.13)", overflow: "hidden"}}>
            <div style={{width: `${services * 3}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.gold})`, boxShadow: "0 0 22px rgba(255,209,102,0.75)"}} />
          </div>
        </div>
      </div>
      <div style={{position: "absolute", right: 100, top: 245, display: "flex", flexDirection: "column", gap: 16}}>
        <Chip title="库存周转 30 天 → 2-5 天" sub="ZERO INVENTORY" color={COLORS.blue} delay={delay + 34} />
        <Chip title="20% 出货量 · 85% 利润" sub="PROFIT CAPTURE" color={COLORS.gold} delay={delay + 58} />
        <Chip title="创新被财务模型压住" sub="CONSERVATIVE LOOP" color={COLORS.green} delay={delay + 82} />
      </div>
    </>
  );
};

const CapitalScene: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const slider = interpolate(frame, [delay + 30, delay + 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  return (
    <>
      <EffectLabel text="人物交接 AvatarFlip" left={115} top={175} color={COLORS.blue} delay={delay + 8} />
      <EffectLabel text="折线图 LineChart" right={380} top={125} color={COLORS.green} delay={delay + 22} />
      <EffectLabel text="巨型数字增长 AnimatedCounter" left={705} top={455} color={COLORS.gold} delay={delay + 44} />
      <EffectLabel text="时间轴 TimelineSlider" left={720} top={820} color={COLORS.blue} delay={delay + 64} />
      <div style={{position: "absolute", right: 120, top: 165, opacity: 0.75}}>
        <LineChart delay={delay + 24} />
      </div>
      <div style={{position: "absolute", left: 95, top: 210, display: "flex", alignItems: "center", gap: 28, ...enter(frame, delay + 10, -34)}}>
        <PersonDisc name="COOK" role="2011-2026" size={155} />
        <div style={{color: COLORS.dim, fontSize: 58, fontWeight: 950}}>→</div>
        <PersonDisc name="TERNUS" role="CEO VII" size={220} active />
      </div>
      <div style={{position: "absolute", left: 550, top: 520, display: "flex", gap: 24}}>
        <StatCard label="MARKET CAP" from={350} to={4600} prefix="$" suffix="B" color={COLORS.blue} delay={delay + 48} />
        <StatCard label="REVENUE" from={108} to={416} prefix="$" suffix="B" color={COLORS.gold} delay={delay + 70} />
      </div>
      <div style={{position: "absolute", left: 270, right: 270, bottom: 190, height: 58}}>
        <div style={{position: "absolute", left: 0, right: 0, top: 28, height: 4, background: "rgba(255,255,255,0.22)"}} />
        <div style={{position: "absolute", left: 0, top: 28, width: `${slider * 100}%`, height: 4, background: COLORS.blue, boxShadow: "0 0 18px rgba(10,132,255,0.9)"}} />
        <div style={{position: "absolute", left: `${slider * 100}%`, top: 17, width: 26, height: 26, borderRadius: "50%", background: COLORS.gold, transform: "translateX(-50%)", boxShadow: "0 0 22px rgba(255,209,102,0.85)"}} />
        {["2011", "2016", "2021", "2026"].map((year, index) => (
          <div key={year} style={{position: "absolute", left: `${(index / 3) * 100}%`, top: 38, color: index === 3 ? COLORS.blue : COLORS.dim, fontSize: 18, fontWeight: 950, transform: "translateX(-50%)"}}>{year}</div>
        ))}
      </div>
    </>
  );
};

export const JasonWuEffectDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const scenes = [
    {start: 0, end: 450, label: "DEMO 01 · CAPITAL HANDOFF", time: "00:00-00:15"},
    {start: 450, end: 900, label: "DEMO 02 · SPLIT + DONUT", time: "00:15-00:30"},
    {start: 900, end: 1350, label: "DEMO 03 · 3D HUD + TYPEWRITER", time: "00:30-00:45"},
    {start: 1350, end: 1800, label: "DEMO 04 · RADAR + MAP", time: "00:45-01:00"},
    {start: 1800, end: 2700, label: "DEMO 05 · KINETIC + COMMENTS", time: "01:00-01:30"},
  ];
  const current = scenes.find((scene) => frame >= scene.start && frame < scene.end) ?? scenes[0];

  return (
    <AbsoluteFill style={{background: "#02050a", fontFamily: "Inter, Arial, sans-serif", overflow: "hidden"}}>
      <OffthreadVideo src={staticFile("test.mp4")} muted style={{width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.36) blur(1px)"}} />
      <AbsoluteFill style={{background: "radial-gradient(circle at 52% 35%, rgba(10,132,255,0.16), transparent 34%), linear-gradient(90deg, rgba(0,0,0,0.86), rgba(0,0,0,0.2) 52%, rgba(0,0,0,0.86))"}} />
      <SectionTag label={current.label} time={current.time} />
      <div style={{position: "absolute", right: 80, top: 74, color: COLORS.dim, fontSize: 18, fontWeight: 900, letterSpacing: 3}}>JASONWU EFFECT DEMO</div>
      <div style={{opacity: inOut(frame, 0, 450)}}><CapitalScene delay={0} /></div>
      <div style={{opacity: inOut(frame, 450, 900)}}><SplitScene delay={450} /></div>
      <div style={{opacity: inOut(frame, 900, 1350)}}><LaptopHud delay={900} /></div>
      <div style={{opacity: inOut(frame, 1350, 1800)}}><RadarAndMap delay={1350} /></div>
      <div style={{opacity: inOut(frame, 1800, 2700)}}><Finale delay={1800} /></div>
      <DemoSubtitle text={current.label.includes("CAPITAL") ? "苹果交接、4.6万亿市值、时间轴与巨型数字增长" : current.label.includes("SPLIT") ? "20% 出货量撬动 85% 利润，25% 服务占比继续增长" : current.label.includes("TYPEWRITER") ? "工程师回归，用 HUD 参数和打字机强调硬件细节" : current.label.includes("RADAR") ? "AI、研发和供应链三大战场，用雷达图与地图连线拆解" : "1600亿现金流、大字冲击、评论气泡和点赞评论数字"} />
    </AbsoluteFill>
  );
};
