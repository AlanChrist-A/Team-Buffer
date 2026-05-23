import { useState, useEffect, useRef, useCallback } from "react";

const GOOGLE_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

const POSTURE_STATES = [
  { label: "Excellent", score: 96, color: "#00d4aa", glow: "rgba(0,212,170,0.25)", desc: "Perfect alignment detected", icon: "✓" },
  { label: "Good", score: 78, color: "#4ade80", glow: "rgba(74,222,128,0.2)", desc: "Slight forward lean — minor adjustment needed", icon: "↑" },
  { label: "Fair", score: 54, color: "#fbbf24", glow: "rgba(251,191,36,0.2)", desc: "Head tilting forward — straighten your neck", icon: "!" },
  { label: "Poor", score: 27, color: "#f87171", glow: "rgba(248,113,113,0.25)", desc: "Severe slouching — sit up immediately", icon: "⚠" },
];

const ALERT_LOG = [
  { id: 1, type: "danger", time: "2s ago", msg: "Severe slouching detected — please sit up straight" },
  { id: 2, type: "warning", time: "1m ago", msg: "Forward head posture — pull chin back slightly" },
  { id: 3, type: "warning", time: "4m ago", msg: "Shoulders rounded — roll them back" },
  { id: 4, type: "success", time: "7m ago", msg: "Maintained excellent posture for 5 minutes" },
  { id: 5, type: "info", time: "12m ago", msg: "Break reminder — stand and stretch" },
];

const HISTORY = [72, 85, 61, 90, 74, 55, 82, 96, 78, 54, 70, 88];

const styles = {
  root: {
    fontFamily: "'Syne', sans-serif",
    background: "#080d18",
    minHeight: "100vh",
    color: "#e2e8f0",
    padding: "0",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 28px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(8,13,24,0.95)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: "8px",
    background: "linear-gradient(135deg, #00d4aa 0%, #0ea5e9 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    color: "#080d18",
  },
  brandName: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.02em",
    color: "#f1f5f9",
  },
  brandSub: {
    fontSize: 11,
    color: "#64748b",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginTop: 1,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  pill: (active, color) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 12px",
    borderRadius: 20,
    background: active ? `${color}18` : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? color + "40" : "rgba(255,255,255,0.08)"}`,
    fontSize: 12,
    color: active ? color : "#94a3b8",
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: "0.02em",
  }),
  dot: (color, pulse) => ({
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: color,
    animation: pulse ? "pulse 1.5s ease-in-out infinite" : "none",
  }),
  sessionTimer: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    color: "#94a3b8",
    letterSpacing: "0.04em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gridTemplateRows: "auto auto",
    gap: "16px",
    padding: "20px 28px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  camCard: {
    background: "#0d1422",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    gridRow: "1 / 3",
  },
  camHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  camTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  recBadge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: "#f87171",
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: "0.06em",
  },
  // ← KEY FIX: replaced aspectRatio:"4/3" with a viewport-relative height
  // so the feed + instruction bar are both visible without scrolling
  camViewport: {
    position: "relative",
    background: "#050a14",
    height: "58vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  camGrid: {
    position: "absolute",
    inset: 0,
    opacity: 0.04,
    backgroundImage: `
      linear-gradient(rgba(0,212,170,1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,212,170,1) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
  },
  cornerTL: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 22,
    height: 22,
    borderTop: "2px solid #00d4aa",
    borderLeft: "2px solid #00d4aa",
    opacity: 0.7,
  },
  cornerTR: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderTop: "2px solid #00d4aa",
    borderRight: "2px solid #00d4aa",
    opacity: 0.7,
  },
  cornerBL: {
    position: "absolute",
    bottom: 14,
    left: 14,
    width: 22,
    height: 22,
    borderBottom: "2px solid #00d4aa",
    borderLeft: "2px solid #00d4aa",
    opacity: 0.7,
  },
  cornerBR: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 22,
    height: 22,
    borderBottom: "2px solid #00d4aa",
    borderRight: "2px solid #00d4aa",
    opacity: 0.7,
  },
  camOverlay: {
    position: "absolute",
    bottom: 14,
    left: 14,
    background: "rgba(0,0,0,0.65)",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#64748b",
    letterSpacing: "0.04em",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  scoreCard: {
    background: "#0d1422",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#475569",
    fontFamily: "'IBM Plex Mono', monospace",
    marginBottom: 16,
  },
  alertsCard: {
    background: "#0d1422",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    overflow: "hidden",
  },
  alertsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  alertItem: (type) => {
    const map = {
      danger:  { bg: "rgba(248,113,113,0.06)", dot: "#f87171" },
      warning: { bg: "rgba(251,191,36,0.06)",  dot: "#fbbf24" },
      success: { bg: "rgba(74,222,128,0.06)",  dot: "#4ade80" },
      info:    { bg: "rgba(96,165,250,0.06)",  dot: "#60a5fa" },
    };
    return {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: "10px 18px",
      background: map[type].bg,
      borderLeft: `3px solid ${map[type].dot}`,
      marginBottom: 1,
    };
  },
  alertDot: (type) => {
    const colors = { danger: "#f87171", warning: "#fbbf24", success: "#4ade80", info: "#60a5fa" };
    return { width: 7, height: 7, borderRadius: "50%", background: colors[type], marginTop: 5, flexShrink: 0 };
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    padding: "0 28px 20px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  statCard: {
    background: "#0d1422",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: "14px 16px",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#475569",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  statValue: (color) => ({
    fontSize: 26,
    fontWeight: 800,
    color: color || "#f1f5f9",
    letterSpacing: "-0.02em",
    lineHeight: 1,
  }),
  statUnit: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 3,
    fontFamily: "'IBM Plex Mono', monospace",
  },
};

function Arc({ score, color, glow }) {
  const r = 70;
  const cx = 90;
  const cy = 90;
  const startAngle = -210;
  const totalAngle = 240;
  const angle = startAngle + (totalAngle * score) / 100;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const px = (a) => cx + r * Math.cos(toRad(a));
  const py = (a) => cy + r * Math.sin(toRad(a));

  const trackPath = `M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 1 1 ${px(startAngle + totalAngle)} ${py(startAngle + totalAngle)}`;
  const fillPath = score > 0
    ? `M ${px(startAngle)} ${py(startAngle)} A ${r} ${r} 0 ${angle - startAngle > 180 ? 1 : 0} 1 ${px(angle)} ${py(angle)}`
    : "";

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
      {score > 0 && (
        <path d={fillPath} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" filter="url(#glow)" />
      )}
      <circle cx={px(angle)} cy={py(angle)} r={6} fill={color} filter="url(#glow)" />
      <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize="32" fontWeight="800" fontFamily="'Syne', sans-serif">{score}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="'IBM Plex Mono', monospace">/100</text>
    </svg>
  );
}

function Skeleton({ postureState }) {
  const isFair = postureState.score >= 45 && postureState.score <= 70;
  const isPoor = postureState.score < 45;

  const spineColor = isPoor ? "#f87171" : isFair ? "#fbbf24" : "#00d4aa";
  const headTilt = isPoor ? -12 : isFair ? -5 : 0;
  const shoulderDrop = isPoor ? 8 : isFair ? 3 : 0;
  const spineAngle = isPoor ? 6 : isFair ? 2 : 0;

  return (
    <svg width="160" height="340" viewBox="0 0 160 340" style={{ filter: `drop-shadow(0 0 8px ${spineColor}50)` }}>
      <line x1="80" y1="0" x2="80" y2="340" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4,4" />
      <g transform={`translate(80, 52) rotate(${headTilt})`}>
        <ellipse cx={0} cy={0} rx={22} ry={26} fill="none" stroke={spineColor} strokeWidth="2" opacity="0.9" />
        <circle cx={0} cy={0} r={3} fill={spineColor} opacity="0.5" />
        <circle cx={-8} cy={-4} r={3} fill={spineColor} opacity="0.6" />
        <circle cx={8} cy={-4} r={3} fill={spineColor} opacity="0.6" />
        <line x1={0} y1={0} x2={0} y2={6} stroke={spineColor} strokeWidth="1.5" opacity="0.5" />
      </g>
      <line x1={80} y1={78} x2={80 + spineAngle * 2} y2={95}
        stroke={spineColor} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <g transform={`translate(0, ${shoulderDrop})`}>
        <line x1={30} y1={108} x2={130} y2={108} stroke={spineColor} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <circle cx={30} cy={108} r={5} fill={spineColor} opacity="0.7" />
        <circle cx={130} cy={108} r={5} fill={spineColor} opacity="0.7" />
        <line x1={30} y1={108} x2={18} y2={170} stroke={spineColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <line x1={18} y1={170} x2={14} y2={220} stroke={spineColor} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <line x1={130} y1={108} x2={142} y2={170} stroke={spineColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <line x1={142} y1={170} x2={146} y2={220} stroke={spineColor} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </g>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = 80 + spineAngle * i * 0.8;
        const y = 115 + i * 25 + shoulderDrop;
        return (
          <g key={i}>
            <rect x={x - 8} y={y - 4} width={16} height={8} rx={3}
              fill="none" stroke={spineColor} strokeWidth="1.5" opacity={0.6 - i * 0.05} />
            {i > 0 && (
              <line
                x1={80 + spineAngle * (i - 1) * 0.8} y1={115 + (i - 1) * 25 + shoulderDrop}
                x2={x} y2={y}
                stroke={spineColor} strokeWidth="2" opacity="0.4"
              />
            )}
          </g>
        );
      })}
      <line x1={50} y1={262 + shoulderDrop} x2={110} y2={262 + shoulderDrop}
        stroke={spineColor} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <circle cx={50} cy={262 + shoulderDrop} r={5} fill={spineColor} opacity="0.6" />
      <circle cx={110} cy={262 + shoulderDrop} r={5} fill={spineColor} opacity="0.6" />
      <line x1={50} y1={262 + shoulderDrop} x2={44} y2={302} stroke={spineColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <line x1={110} y1={262 + shoulderDrop} x2={116} y2={302} stroke={spineColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      {isPoor && (
        <g>
          <path d={`M 80 78 L ${80 + spineAngle * 12} ${78 + 184}`} stroke="#f87171" strokeWidth="1" strokeDasharray="5,4" opacity="0.3" />
          <path d="M 80 78 L 80 262" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="5,4" />
          <text x={96} y={160} fill="#f87171" fontSize="10" fontFamily="'IBM Plex Mono', monospace" opacity="0.7">{spineAngle * 2}°</text>
        </g>
      )}
    </svg>
  );
}

function MiniChart({ data, currentIdx }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 48;
  const w = 280;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min + 1)) * h;
    return `${x},${y}`;
  }).join(" ");

  const areaPath =
    `M 0,${h} L ` +
    data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min + 1)) * h;
      return `${x},${y}`;
    }).join(" L ") +
    ` L ${w},${h} Z`;

  const cx = (currentIdx / (data.length - 1)) * w;
  const cy = h - ((data[currentIdx] - min) / (max - min + 1)) * h;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 4}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#lineGrad)" />
      <polyline points={pts} fill="none" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx={cx} cy={cy} r={4} fill="#00d4aa" />
      <circle cx={cx} cy={cy} r={8} fill="#00d4aa" opacity="0.2" />
    </svg>
  );
}

export default function PostureApp() {
  const [stateIdx, setStateIdx] = useState(0);
  const [sessionSec, setSessionSec] = useState(0);
  const [alertCount, setAlertCount] = useState(3);
  const [goodPct, setGoodPct] = useState(72);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alerts, setAlerts] = useState(ALERT_LOG);
  const [histIdx, setHistIdx] = useState(11);
  const [newAlert, setNewAlert] = useState(null);
  const stateRef = useRef(stateIdx);
  stateRef.current = stateIdx;

  useEffect(() => {
    if (!isMonitoring) return;
    const t = setInterval(() => setSessionSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [isMonitoring]);

  useEffect(() => {
    if (!isMonitoring) return;
    const t = setInterval(() => {
      const next = Math.floor(Math.random() * POSTURE_STATES.length);
      setStateIdx(next);
      setHistIdx(i => (i + 1) % HISTORY.length);
      if (POSTURE_STATES[next].score < 50) {
        setAlertCount(c => c + 1);
        setGoodPct(p => Math.max(30, p - 2));
        const newA = {
          id: Date.now(),
          type: "danger",
          time: "just now",
          msg: POSTURE_STATES[next].desc,
        };
        setNewAlert(newA.id);
        setAlerts(prev => [newA, ...prev.slice(0, 4)]);
        setTimeout(() => setNewAlert(null), 2000);
      } else if (POSTURE_STATES[next].score > 80) {
        setGoodPct(p => Math.min(100, p + 1));
      }
    }, 3000);
    return () => clearInterval(t);
  }, [isMonitoring]);

  const ps = POSTURE_STATES[stateIdx];
  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <style>{GOOGLE_FONTS}</style>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100%)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      <div style={styles.root}>
        {/* Topbar */}
        <div style={styles.topbar}>
          <div style={styles.brand}>
            <div style={styles.logoIcon}>PS</div>
            <div>
              <div style={styles.brandName}>PostureGuard</div>
              <div style={styles.brandSub}>Real-time Posture Monitor</div>
            </div>
          </div>
          <div style={styles.statusRow}>
            <div style={styles.pill(isMonitoring, "#00d4aa")}>
              <div style={styles.dot("#00d4aa", isMonitoring)} />
              {isMonitoring ? "MONITORING" : "PAUSED"}
            </div>
            <div style={styles.pill(true, "#60a5fa")}>
              <div style={styles.dot("#60a5fa", false)} />
              CAM ACTIVE
            </div>
            <div style={styles.sessionTimer}>{fmt(sessionSec)}</div>
            <button
              onClick={() => setIsMonitoring(m => !m)}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: `1px solid ${isMonitoring ? "rgba(248,113,113,0.3)" : "rgba(0,212,170,0.3)"}`,
                background: isMonitoring ? "rgba(248,113,113,0.08)" : "rgba(0,212,170,0.08)",
                color: isMonitoring ? "#f87171" : "#00d4aa",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.06em",
                cursor: "pointer",
              }}
            >
              {isMonitoring ? "PAUSE" : "RESUME"}
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div style={styles.grid}>
          {/* Camera feed */}
          <div style={styles.camCard}>
            <div style={styles.camHeader}>
              <span style={styles.camTitle}>Live Feed — Posture Overlay</span>
              <span style={styles.recBadge}>
                <div style={styles.dot("#f87171", isMonitoring)} />
                {isMonitoring ? "REC" : "PAUSED"}
              </span>
            </div>

            {/* ← viewport now height:58vh — tall but fits with instruction bar visible */}
            <div style={styles.camViewport}>
              <div style={styles.camGrid} />
              {isMonitoring && (
                <div style={{
                  position: "absolute",
                  left: 0, right: 0,
                  height: "2px",
                  background: `linear-gradient(90deg, transparent, ${ps.color}60, transparent)`,
                  animation: "scanline 2.5s linear infinite",
                  zIndex: 2,
                }} />
              )}
              <div style={styles.cornerTL} />
              <div style={styles.cornerTR} />
              <div style={styles.cornerBL} />
              <div style={styles.cornerBR} />
              <Skeleton postureState={ps} />
              <div style={{
                position: "absolute",
                top: 14,
                left: "50%",
                transform: "translateX(-50%)",
                background: `${ps.color}18`,
                border: `1px solid ${ps.color}40`,
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: ps.color,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.08em",
                backdropFilter: "blur(8px)",
                transition: "all 0.5s ease",
                whiteSpace: "nowrap",
              }}>
                {ps.icon} {ps.label.toUpperCase()} POSTURE
              </div>
              <div style={styles.camOverlay}>
                FPS 30 · 1280×720 · CV MODEL v2.4
              </div>
              <div style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                {["HEAD", "NECK", "SPINE", "HIP"].map(k => (
                  <div key={k} style={{
                    fontSize: 9,
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: ps.color,
                    opacity: 0.6,
                    letterSpacing: "0.1em",
                    background: "rgba(0,0,0,0.5)",
                    padding: "2px 6px",
                    borderRadius: 3,
                    borderLeft: `2px solid ${ps.color}`,
                  }}>{k}</div>
                ))}
              </div>
            </div>

            {/* Instruction bar — always visible right below the feed */}
            <div style={{
              padding: "12px 18px",
              background: `${ps.color}08`,
              borderTop: `1px solid ${ps.color}20`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.5s ease",
              animation: "fadeIn 0.3s ease",
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: `${ps.color}20`,
                border: `1px solid ${ps.color}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                flexShrink: 0,
              }}>{ps.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: ps.color }}>{ps.label} Posture Detected</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{ps.desc}</div>
              </div>
              <div style={{
                marginLeft: "auto",
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                color: "#475569",
              }}>CONFIDENCE 94%</div>
            </div>

            {/* ── Body Metrics Section ── */}
            <div style={{
              padding: "16px 18px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0,0,0,0.15)",
            }}>
              {/* Section header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "#475569",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>Body Metrics</span>
                <span style={{
                  fontSize: 10,
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: "#334155",
                  letterSpacing: "0.06em",
                }}>LIVE · UPDATING</span>
              </div>

              {/* 4-column metric grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
                marginBottom: 14,
              }}>
                {[
                  {
                    label: "Head Tilt",
                    value: ps.score > 70 ? "0°" : ps.score >= 45 ? "5°" : "12°",
                    raw: ps.score > 70 ? 100 : ps.score >= 45 ? 60 : 20,
                    unit: "",
                    status: ps.score > 70 ? "OK" : ps.score >= 45 ? "FAIR" : "BAD",
                    color: ps.score > 70 ? "#00d4aa" : ps.score >= 45 ? "#fbbf24" : "#f87171",
                  },
                  {
                    label: "Shoulders",
                    value: ps.score > 70 ? "Level" : ps.score >= 45 ? "Slight" : "Rounded",
                    raw: ps.score > 70 ? 100 : ps.score >= 45 ? 55 : 18,
                    unit: "",
                    status: ps.score > 70 ? "OK" : ps.score >= 45 ? "FAIR" : "BAD",
                    color: ps.score > 70 ? "#00d4aa" : ps.score >= 45 ? "#fbbf24" : "#f87171",
                  },
                  {
                    label: "Spine Angle",
                    value: ps.score > 70 ? "2°" : ps.score >= 45 ? "8°" : "18°",
                    raw: ps.score > 70 ? 96 : ps.score >= 45 ? 52 : 15,
                    unit: "",
                    status: ps.score > 70 ? "OK" : ps.score >= 45 ? "FAIR" : "BAD",
                    color: ps.score > 70 ? "#00d4aa" : ps.score >= 45 ? "#fbbf24" : "#f87171",
                  },
                  {
                    label: "Hip Align",
                    value: ps.score > 70 ? "Level" : ps.score >= 45 ? "Slight" : "Tilted",
                    raw: ps.score > 70 ? 94 : ps.score >= 45 ? 58 : 22,
                    unit: "",
                    status: ps.score > 70 ? "OK" : ps.score >= 45 ? "FAIR" : "BAD",
                    color: ps.score > 70 ? "#00d4aa" : ps.score >= 45 ? "#fbbf24" : "#f87171",
                  },
                ].map(m => (
                  <div key={m.label} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${m.color}22`,
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}>
                    <div style={{
                      fontSize: 9,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: "#475569",
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}>{m.label}</div>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: m.color,
                      letterSpacing: "-0.01em",
                      lineHeight: 1,
                      marginBottom: 8,
                      transition: "color 0.5s ease",
                    }}>{m.value}</div>
                    {/* Progress bar */}
                    <div style={{
                      height: 3,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${m.raw}%`,
                        background: m.color,
                        borderRadius: 2,
                        transition: "width 0.6s ease, background 0.5s ease",
                        opacity: 0.85,
                      }} />
                    </div>
                    <div style={{
                      fontSize: 8,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: m.color,
                      marginTop: 5,
                      letterSpacing: "0.08em",
                      opacity: 0.7,
                    }}>{m.status}</div>
                  </div>
                ))}
              </div>

              {/* Secondary row — neck extension + symmetry + balance + breath */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10,
              }}>
                {[
                  {
                    label: "Neck Extension",
                    value: ps.score > 70 ? 88 : ps.score >= 45 ? 54 : 24,
                    note: ps.score > 70 ? "Neutral position" : ps.score >= 45 ? "Slight forward" : "Forward head posture",
                    color: ps.score > 70 ? "#00d4aa" : ps.score >= 45 ? "#fbbf24" : "#f87171",
                  },
                  {
                    label: "Body Symmetry",
                    value: ps.score > 70 ? 93 : ps.score >= 45 ? 67 : 41,
                    note: ps.score > 70 ? "Well balanced" : ps.score >= 45 ? "Minor imbalance" : "Significant lean",
                    color: ps.score > 70 ? "#4ade80" : ps.score >= 45 ? "#fbbf24" : "#f87171",
                  },
                ].map(m => (
                  <div key={m.label} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 9,
                        fontFamily: "'IBM Plex Mono', monospace",
                        color: "#475569",
                        letterSpacing: "0.10em",
                        textTransform: "uppercase",
                        marginBottom: 3,
                      }}>{m.label}</div>
                      <div style={{
                        fontSize: 11,
                        color: "#64748b",
                        marginBottom: 6,
                      }}>{m.note}</div>
                      <div style={{
                        height: 4,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${m.value}%`,
                          background: `linear-gradient(90deg, ${m.color}88, ${m.color})`,
                          borderRadius: 2,
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                    <div style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: m.color,
                      letterSpacing: "-0.02em",
                      fontFamily: "'Syne', sans-serif",
                      lineHeight: 1,
                      transition: "color 0.5s ease",
                      minWidth: 42,
                      textAlign: "right",
                    }}>{m.value}<span style={{ fontSize: 11, fontWeight: 500, opacity: 0.6 }}>%</span></div>
                  </div>
                ))}
              </div>
            </div>
            {/* ── End Body Metrics ── */}

            {/* ── AI Suggestion Box ── */}
            <div style={{
              margin: "0 18px 18px",
              borderRadius: 12,
              border: `1px solid ${ps.color}30`,
              background: `linear-gradient(135deg, ${ps.color}08 0%, rgba(255,255,255,0.02) 100%)`,
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: `1px solid ${ps.color}18`,
                background: `${ps.color}08`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* AI sparkle icon */}
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: `linear-gradient(135deg, ${ps.color}40, ${ps.color}20)`,
                    border: `1px solid ${ps.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                  }}>✦</div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: ps.color,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>AI Suggestion</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#00d4aa",
                    animation: "pulse 2s ease-in-out infinite",
                  }} />
                  <span style={{
                    fontSize: 9,
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: "#475569",
                    letterSpacing: "0.08em",
                  }}>MODEL READY</span>
                </div>
              </div>

              {/* Primary suggestion */}
              <div style={{ padding: "12px 14px 10px" }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#e2e8f0",
                  lineHeight: 1.55,
                  marginBottom: 10,
                }}>
                  {ps.score > 70
                    ? "Your posture is well aligned. Keep your current sitting position and take a short break every 30 minutes to maintain muscle health."
                    : ps.score >= 45
                    ? "Your head is drifting slightly forward. Gently draw your chin back and lift the crown of your head upward to re-align your cervical spine."
                    : "Immediate correction needed — your spine is significantly curved. Sit back into your chair, plant feet flat, and roll your shoulders back and down."}
                </div>

                {/* Action chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {(ps.score > 70
                    ? ["Maintain position", "Set 30-min break", "Deep breathing"]
                    : ps.score >= 45
                    ? ["Chin tuck exercise", "Check monitor height", "Sit back in chair"]
                    : ["Sit upright now", "Lumbar support", "Stand & stretch"]
                  ).map(chip => (
                    <span key={chip} style={{
                      fontSize: 10,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: ps.color,
                      background: `${ps.color}12`,
                      border: `1px solid ${ps.color}30`,
                      borderRadius: 20,
                      padding: "3px 10px",
                      letterSpacing: "0.04em",
                      cursor: "default",
                    }}>{chip}</span>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 10 }} />

                {/* Secondary tips row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}>
                  {(ps.score > 70
                    ? [
                        { icon: "◎", title: "Eye Level", tip: "Monitor at eye height" },
                        { icon: "◈", title: "Wrist Angle", tip: "Keep wrists neutral" },
                      ]
                    : ps.score >= 45
                    ? [
                        { icon: "◎", title: "Screen Distance", tip: "Move screen closer" },
                        { icon: "◈", title: "Chair Height", tip: "Raise seat 2–3 cm" },
                      ]
                    : [
                        { icon: "◎", title: "Lumbar Support", tip: "Use a back cushion" },
                        { icon: "◈", title: "Break Now", tip: "Stand for 2 minutes" },
                      ]
                  ).map(t => (
                    <div key={t.title} style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <span style={{ fontSize: 14, color: ps.color, opacity: 0.7, lineHeight: 1.2 }}>{t.icon}</span>
                      <div>
                        <div style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#94a3b8",
                          letterSpacing: "0.04em",
                          marginBottom: 2,
                        }}>{t.title}</div>
                        <div style={{
                          fontSize: 10,
                          color: "#475569",
                          lineHeight: 1.4,
                        }}>{t.tip}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer note */}
                <div style={{
                  marginTop: 10,
                  fontSize: 9,
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: "#334155",
                  letterSpacing: "0.06em",
                  textAlign: "center",
                }}>
                  ✦ AI-GENERATED · REAL-TIME MODEL OUTPUT WILL REPLACE THIS IN PRODUCTION
                </div>
              </div>
            </div>
            {/* ── End AI Suggestion Box ── */}

          </div>

          {/* Score card — scrollable below fold, that's fine */}
          <div style={styles.scoreCard}>
            <div style={styles.scoreLabel}>Posture Score</div>
            <Arc score={ps.score} color={ps.color} glow={ps.glow} />
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: ps.color,
              marginTop: 8,
              letterSpacing: "0.02em",
              transition: "color 0.5s ease",
            }}>{ps.label}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
              {ps.desc}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              width: "100%",
              marginTop: 20,
              padding: "14px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.05)",
            }}>
              {[
                { label: "Excellent", range: "85–100", color: "#00d4aa" },
                { label: "Good",      range: "70–84",  color: "#4ade80" },
                { label: "Fair",      range: "45–69",  color: "#fbbf24" },
                { label: "Poor",      range: "0–44",   color: "#f87171" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace" }}>{s.range}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ width: "100%", marginTop: 16 }}>
              <div style={{
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                color: "#475569",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}>Score Trend (12 readings)</div>
              <MiniChart data={HISTORY} currentIdx={histIdx} />
            </div>
          </div>

          {/* Alerts card */}
          <div style={styles.alertsCard}>
            <div style={styles.alertsHeader}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>
                Alert Log
              </span>
              <span style={{
                background: "rgba(248,113,113,0.12)",
                border: "1px solid rgba(248,113,113,0.2)",
                color: "#f87171",
                borderRadius: 10,
                padding: "2px 8px",
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
              }}>{alertCount} alerts</span>
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {alerts.map(a => (
                <div key={a.id} style={{
                  ...styles.alertItem(a.type),
                  animation: a.id === newAlert ? "fadeIn 0.3s ease" : "none",
                }}>
                  <div style={styles.alertDot(a.type)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.4 }}>{a.msg}</div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 3, fontFamily: "'IBM Plex Mono', monospace" }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          {[
            { label: "Current Score", value: ps.score,        unit: "/100", color: ps.color  },
            { label: "Good Posture",  value: goodPct,         unit: "%",    color: "#4ade80" },
            { label: "Total Alerts",  value: alertCount,      unit: "",     color: "#fbbf24" },
            { label: "Session Time",  value: fmt(sessionSec), unit: "",     color: "#60a5fa" },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={styles.statValue(s.color)}>
                {s.value}<span style={styles.statUnit}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
