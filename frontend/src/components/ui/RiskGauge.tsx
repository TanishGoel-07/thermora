import { useEffect, useState, useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface RiskGaugeProps {
  score: number;
  label?: string;
  category?: string;
  size?: number;
  strokeWidth?: number;
  showTicks?: boolean;
  className?: string;
  subtitle?: string;
}

export function RiskGauge({
  score = 0,
  label = "HTSI INDEX",
  category,
  size = 190,
  strokeWidth = 14,
  showTicks = true,
  className,
  subtitle = "/ 100 SCORE",
}: RiskGaugeProps) {
  const gradientId = useId();
  const [displayScore, setDisplayScore] = useState(0);

  // Clamp score
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  // Smooth count-up animation on score change
  useEffect(() => {
    let startTime: number | null = null;
    const startVal = displayScore;
    const endVal = clampedScore;
    const duration = 1100;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * ease);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [clampedScore]);

  // SVG Geometry
  const center = size / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Determine colors based on score
  const getGradientColors = (val: number) => {
    if (val >= 80) {
      return {
        start: "#EF4444",
        end: "#DC2626",
        glow: "rgba(220, 38, 38, 0.5)",
        text: "text-red-400",
        label: category || "CRITICAL DANGER",
      };
    }
    if (val >= 65) {
      return {
        start: "#F97316",
        end: "#EF4444",
        glow: "rgba(249, 115, 22, 0.45)",
        text: "text-orange-400",
        label: category || "VERY HIGH RISK",
      };
    }
    if (val >= 45) {
      return {
        start: "#F59E0B",
        end: "#F97316",
        glow: "rgba(245, 158, 11, 0.4)",
        text: "text-amber-400",
        label: category || "ELEVATED STRESS",
      };
    }
    return {
      start: "#10B981",
      end: "#34D399",
      glow: "rgba(16, 185, 129, 0.35)",
      text: "text-emerald-400",
      label: category || "SAFE / NOMINAL",
    };
  };

  const theme = getGradientColors(clampedScore);
  const isHighRisk = clampedScore >= 65;

  // Generate tick marks
  const tickCount = 28;
  const ticks = Array.from({ length: tickCount }).map((_, i) => {
    const angle = (i / tickCount) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const tickInner = radius - 8;
    const tickOuter = radius - 4;
    const x1 = center + tickInner * Math.cos(rad);
    const y1 = center + tickInner * Math.sin(rad);
    const x2 = center + tickOuter * Math.cos(rad);
    const y2 = center + tickOuter * Math.sin(rad);
    const active = (i / tickCount) * 100 <= clampedScore;

    return { x1, y1, x2, y2, active };
  });

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center select-none",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 origin-center"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.start} />
            <stop offset="100%" stopColor={theme.end} />
          </linearGradient>
          <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={theme.start} floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Ambient Outer Track Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius + strokeWidth / 2 + 3}
          stroke="rgba(43, 58, 82, 0.25)"
          strokeWidth={1}
          fill="none"
        />

        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#121A26"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Radial Ticks */}
        {showTicks &&
          ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.active ? theme.start : "rgba(62, 80, 108, 0.4)"}
              strokeWidth={t.active ? 1.5 : 1}
              opacity={t.active ? 0.9 : 0.4}
            />
          ))}

        {/* Main Animated Gradient Arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="none"
          style={{
            filter: `url(#glow-${gradientId})`,
          }}
        />
      </svg>

      {/* Central Metrics Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="mono-label text-slate-400/90 tracking-widest text-[9px]">
          {label}
        </span>
        <div className="font-display font-black text-4xl sm:text-5xl text-white tracking-tighter data-num my-0.5 leading-none">
          {displayScore}
        </div>
        <span className="mono-label text-[10px] font-semibold text-slate-400 mt-1">
          {subtitle}
        </span>
        {isHighRisk && (
          <span
            className="mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase animate-pulse border"
            style={{
              borderColor: `${theme.start}66`,
              backgroundColor: `${theme.start}22`,
              color: theme.start,
            }}
          >
            HIGH THERMAL LOAD
          </span>
        )}
      </div>
    </div>
  );
}
